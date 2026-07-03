'use strict';

const { evaluateLiveEnablement } = require('./liveConfig');
const { formatTodayLocal } = require('./proposalReminderLogic');
const { collectDryRunCandidates, summarizeDryRunCandidates } = require('./proposalReminderSweepDryRun');
const { executeProposalReminderClaim } = require('./reminderClaimTransaction');
const { sendProposalReminderPush } = require('./pushClient');
const { buildProposalReminderNotifLogEntry, writeNotifLogEntry } = require('./notifLog');

/**
 * Phase 2c live sweep orchestrator — claim-before-send, disabled by default via liveConfig gates.
 *
 * - dry-run: no Admin SDK, no Firestore, no HTTP
 * - live-blocked: LIVE=1 but missing required env → clear preflight errors
 * - live-ready: gates pass but Firestore and/or network disabled → no side effects
 * - live-claim-executed: Firestore claim loop ran; push blocked by network gates
 * - live-executed: claim → push → notiflog (fetchImpl required in tests)
 *
 * Never initializes firebase-admin unless config.canUseAdmin is true.
 */

function getAdminFirestore(options) {
  if (!options || !options.config || !options.config.canUseAdmin) return null;
  if (options.firestore) return options.firestore;
  try {
    const admin = require('firebase-admin');
    if (!admin.apps.length) {
      admin.initializeApp();
    }
    return admin.firestore();
  } catch (err) {
    return null;
  }
}

async function loadOpenProposals(db) {
  if (!db) return [];
  const snap = await db.collection('proposals').where('status', '==', 'open').get();
  const out = [];
  snap.forEach(function (doc) {
    out.push(Object.assign({}, doc.data(), { id: doc.id }));
  });
  return out;
}

async function loadRosterMemberIds(db) {
  if (!db) return [];
  const snap = await db.collection('members').get();
  const ids = [];
  snap.forEach(function (doc) {
    const data = doc.data() || {};
    if (data.id != null) ids.push(String(data.id));
  });
  return ids;
}

async function loadMemberNameById(db) {
  if (!db) return {};
  const snap = await db.collection('members').get();
  const map = {};
  snap.forEach(function (doc) {
    const data = doc.data() || {};
    if (data.id != null) {
      map[String(data.id)] = data.name ? String(data.name) : String(data.id);
    }
  });
  return map;
}

async function loadNotifPrefsByMemberName(db) {
  if (!db) return {};
  const snap = await db.collection('notifprefs').get();
  const map = {};
  snap.forEach(function (doc) {
    map[doc.id] = doc.data() || {};
  });
  return map;
}

function isRecipientOptedOut(prefsByMemberName, targetName, category) {
  const prefs = prefsByMemberName[targetName];
  return !!(prefs && prefs[category] === false);
}

async function processReminderCandidates(options) {
  const config = options.config;
  const db = options.db;
  const env = options.env || {};
  const nowMs = options.nowMs;
  const todayStr = options.todayStr;
  const rosterMemberIds = options.rosterMemberIds;
  const proposals = options.proposals;
  const candidates = options.candidates;
  const memberNames = options.memberNamesById || {};
  const prefsByMemberName = options.notifPrefsByMemberName || {};
  const pushSecret = String(env.OOT_PUSH_WORKER_SECRET || '').trim();
  const fetchImpl = options.fetchImpl;
  const writeNotifLog = options.writeNotifLog !== false;
  const results = [];

  for (let i = 0; i < candidates.length; i++) {
    const c = candidates[i];
    const targetName = memberNames[c.memberId] || String(c.memberId);
    const claimResult = await executeProposalReminderClaim(db, c.propId, c.memberId, {
      nowMs: nowMs,
      rosterMemberIds: rosterMemberIds,
      todayStr: todayStr,
      targetName: targetName,
      runTransaction: options.runTransaction,
    });

    const entry = {
      propId: c.propId,
      memberId: c.memberId,
      candidateReminderNumber: c.reminderNumber,
      claim: claimResult,
    };

    if (!claimResult.send) {
      results.push(entry);
      continue;
    }

    entry.reminderNumber = claimResult.reminderNumber;

    if (isRecipientOptedOut(prefsByMemberName, targetName, 'rehearsal-proposal')) {
      const optOutResult = { sent: false, reason: 'recipient-opted-out' };
      entry.prefs = { pushAllowed: false, reason: 'recipient-opted-out' };
      entry.push = optOutResult;
      if (writeNotifLog && db) {
        entry.notiflog = await writeNotifLogEntry(db, buildProposalReminderNotifLogEntry(optOutResult, {
          targetMemberId: c.memberId,
          targetName: targetName,
          note: 'backend claim succeeded; recipient opted out',
        }));
      }
      results.push(entry);
      continue;
    }

    if (!config.canSendPush) {
      const blockedResult = { sent: false, reason: 'push-blocked-preflight' };
      entry.push = blockedResult;
      if (writeNotifLog && db) {
        entry.notiflog = await writeNotifLogEntry(db, buildProposalReminderNotifLogEntry(blockedResult, {
          targetMemberId: c.memberId,
          targetName: targetName,
          note: 'backend claim succeeded; push blocked by gates',
        }));
      }
      results.push(entry);
      continue;
    }

    const proposal = proposals.find(function (p) { return String(p.id) === String(c.propId); });
    const pushResult = await sendProposalReminderPush({
      config: config,
      proposal: proposal,
      targetMemberId: c.memberId,
      reminderNumber: claimResult.reminderNumber,
      pushSecret: pushSecret,
      fetchImpl: fetchImpl,
    });
    entry.push = pushResult;
    if (writeNotifLog && db) {
      entry.notiflog = await writeNotifLogEntry(db, buildProposalReminderNotifLogEntry(pushResult, {
        targetMemberId: c.memberId,
        targetName: targetName,
        note: 'backend live sweep (claim-before-send)',
      }));
    }
    results.push(entry);
  }

  return results;
}

async function runProposalReminderOrchestrator(options) {
  options = options || {};
  const env = options.env || process.env;
  const config = evaluateLiveEnablement(env);

  if (config.mode === 'dry-run') {
    return {
      mode: 'dry-run',
      live: false,
      message: 'Live sends disabled (OOT_PROPOSAL_REMINDER_LIVE!=1). No Firestore, no push.',
      candidates: summarizeDryRunCandidates([]),
    };
  }

  if (config.mode === 'live-blocked') {
    return {
      mode: 'live-blocked',
      live: true,
      executed: false,
      errors: config.errors.slice(),
      message: 'Live preflight blocked — fix env gates before deploy',
    };
  }

  const nowMs = Number(options.nowMs || Date.now());
  const todayStr = options.todayStr || formatTodayLocal(new Date(nowMs));
  const preflight = {
    canUseAdmin: config.canUseAdmin,
    canSendPush: config.canSendPush,
    allowFirestore: config.allowFirestore,
    allowNetwork: config.allowNetwork,
    warnings: (config.warnings || []).slice(),
  };

  if (!config.canUseAdmin) {
    return {
      mode: 'live-ready',
      live: true,
      executed: false,
      preflight: preflight,
      errors: config.errors.slice(),
      message: 'Live-ready but Firestore disabled — set OOT_PROPOSAL_REMINDER_ALLOW_FIRESTORE=1 after approval',
      candidates: summarizeDryRunCandidates([]),
    };
  }

  const db = getAdminFirestore({ config: config, firestore: options.firestore });
  if (!db) {
    return {
      mode: 'live-ready',
      live: true,
      executed: false,
      preflight: preflight,
      errors: ['Admin SDK Firestore unavailable'],
      message: 'Firestore init failed — no data changed',
    };
  }

  const rosterMemberIds = options.rosterMemberIds || await loadRosterMemberIds(db);
  const proposals = options.proposals || await loadOpenProposals(db);
  const candidates = options.candidates || collectDryRunCandidates(proposals, rosterMemberIds, nowMs, todayStr);
  const summary = summarizeDryRunCandidates(candidates);

  if (!candidates.length) {
    return {
      mode: 'live-ready',
      live: true,
      executed: false,
      preflight: preflight,
      candidates: summary,
      candidateDetails: candidates,
      results: [],
      message: 'No due reminder candidates',
    };
  }

  const memberNames = options.memberNamesById || await loadMemberNameById(db);
  const prefsByMemberName = options.notifPrefsByMemberName || await loadNotifPrefsByMemberName(db);
  const results = await processReminderCandidates({
    config: config,
    db: db,
    env: env,
    nowMs: nowMs,
    todayStr: todayStr,
    rosterMemberIds: rosterMemberIds,
    proposals: proposals,
    candidates: candidates,
    memberNamesById: memberNames,
    notifPrefsByMemberName: prefsByMemberName,
    fetchImpl: options.fetchImpl,
    writeNotifLog: options.writeNotifLog,
    runTransaction: options.runTransaction,
  });

  const mode = config.canSendPush ? 'live-executed' : 'live-claim-executed';

  return {
    mode: mode,
    live: true,
    executed: true,
    preflight: preflight,
    warnings: (config.warnings || []).slice(),
    candidates: summary,
    candidateDetails: candidates,
    results: results,
    message: config.canSendPush
      ? (options.fetchImpl
        ? 'Live sweep executed with injected fetch (test harness only)'
        : 'Push suppressed — fetchImpl not provided')
      : 'Firestore claim executed; push/network disabled by gates',
  };
}

module.exports = {
  runProposalReminderOrchestrator,
  processReminderCandidates,
  getAdminFirestore,
  loadOpenProposals,
  loadRosterMemberIds,
  loadMemberNameById,
  loadNotifPrefsByMemberName,
  isRecipientOptedOut,
};
