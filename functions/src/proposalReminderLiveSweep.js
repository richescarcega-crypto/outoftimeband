'use strict';

const { evaluateLiveEnablement } = require('./liveConfig');
const { formatTodayLocal } = require('./proposalReminderLogic');
const { collectDryRunCandidates, summarizeDryRunCandidates } = require('./proposalReminderSweepDryRun');
const {
  executeProposalReminderReserve,
  executeProposalReminderFinalize,
  executeProposalReminderRelease,
} = require('./reminderClaimTransaction');
const { sendProposalReminderPush } = require('./pushClient');
const { buildProposalReminderNotifLogEntry, writeNotifLogEntry } = require('./notifLog');

/**
 * Phase 2c live sweep orchestrator — claim-before-send, disabled by default via liveConfig gates.
 *
 * - dry-run: no Admin SDK, no Firestore, no HTTP
 * - live-blocked: LIVE=1 but missing required env → clear preflight errors
 * - live-ready: gates pass but Firestore and/or network disabled → no side effects
 * - live-claim-executed: Firestore claim loop ran; push blocked by network gates
 * - live-executed: claim → push → notiflog (requires fetchImpl from schedule or test harness)
 *
 * Scheduled entry: runScheduledProposalReminderSweep wires runtime fetch (Node 18+ / Functions).
 * LIVE env gates remain off by default — wiring fetch does not enable production sends.
 *
 * Never initializes firebase-admin unless config.canUseAdmin is true.
 */

/** Resolve a fetch implementation for the scheduled path (or an explicit override). */
function resolveRuntimeFetchImpl(explicitFetch) {
  if (typeof explicitFetch === 'function') return explicitFetch;
  if (typeof globalThis !== 'undefined' && typeof globalThis.fetch === 'function') {
    return globalThis.fetch.bind(globalThis);
  }
  if (typeof fetch === 'function') return fetch;
  return undefined;
}

/**
 * Options the Cloud Scheduler handler should pass into the orchestrator.
 * Always includes a runtime fetchImpl when available; does not enable LIVE gates.
 */
function buildScheduledSweepOptions(env) {
  return {
    env: env || process.env,
    fetchImpl: resolveRuntimeFetchImpl(),
  };
}

/**
 * Scheduled-function entry wrapper: injects runtime fetch, then runs the orchestrator.
 * Tests may override fetchImpl (including undefined) via options.fetchImpl.
 */
async function runScheduledProposalReminderSweep(options) {
  options = options || {};
  const base = buildScheduledSweepOptions(options.env);
  const opts = Object.assign({}, options, {
    env: options.env || base.env,
    fetchImpl: Object.prototype.hasOwnProperty.call(options, 'fetchImpl')
      ? options.fetchImpl
      : base.fetchImpl,
  });
  return runProposalReminderOrchestrator(opts);
}

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
    const proposal = proposals.find(function (p) { return String(p.id) === String(c.propId); });

    const reserveResult = await executeProposalReminderReserve(db, c.propId, c.memberId, {
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
      reserve: reserveResult,
    };

    if (!reserveResult.send) {
      results.push(entry);
      continue;
    }

    entry.reminderNumber = reserveResult.reminderNumber;
    if (proposal && reserveResult.reminderState) {
      proposal.reminderState = reserveResult.reminderState;
    }

    async function releaseReservation(outcome, reason) {
      const releaseResult = await executeProposalReminderRelease(db, c.propId, c.memberId, {
        nowMs: nowMs,
        reminderNumber: reserveResult.reminderNumber,
        outcome: outcome,
        reason: reason,
        runTransaction: options.runTransaction,
      });
      entry.release = releaseResult;
      if (proposal && releaseResult.reminderState) {
        proposal.reminderState = releaseResult.reminderState;
      }
      return releaseResult;
    }

    if (isRecipientOptedOut(prefsByMemberName, targetName, 'rehearsal-proposal')) {
      await releaseReservation('opted-out', 'recipient-opted-out');
      const optOutResult = { sent: false, reason: 'recipient-opted-out' };
      entry.prefs = { pushAllowed: false, reason: 'recipient-opted-out' };
      entry.push = optOutResult;
      if (writeNotifLog && db) {
        entry.notiflog = await writeNotifLogEntry(db, buildProposalReminderNotifLogEntry(optOutResult, {
          targetMemberId: c.memberId,
          targetName: targetName,
          note: 'backend reserve released; recipient opted out (no durable send)',
        }));
      }
      results.push(entry);
      continue;
    }

    if (!config.canSendPush) {
      await releaseReservation('push-blocked-preflight', 'push-blocked-preflight');
      const blockedResult = { sent: false, reason: 'push-blocked-preflight' };
      entry.push = blockedResult;
      if (writeNotifLog && db) {
        entry.notiflog = await writeNotifLogEntry(db, buildProposalReminderNotifLogEntry(blockedResult, {
          targetMemberId: c.memberId,
          targetName: targetName,
          note: 'backend reserve released; push blocked by gates (no durable send)',
        }));
      }
      results.push(entry);
      continue;
    }

    const pushResult = await sendProposalReminderPush({
      config: config,
      proposal: proposal,
      targetMemberId: c.memberId,
      reminderNumber: reserveResult.reminderNumber,
      pushSecret: pushSecret,
      fetchImpl: fetchImpl,
    });
    entry.push = pushResult;

    if (pushResult && pushResult.sent) {
      const finalizeResult = await executeProposalReminderFinalize(db, c.propId, c.memberId, {
        nowMs: nowMs,
        reminderNumber: reserveResult.reminderNumber,
        targetName: targetName,
        runTransaction: options.runTransaction,
      });
      entry.finalize = finalizeResult;
      if (proposal && finalizeResult.reminderState) {
        proposal.reminderState = finalizeResult.reminderState;
      }
      if (writeNotifLog && db) {
        entry.notiflog = await writeNotifLogEntry(db, buildProposalReminderNotifLogEntry(pushResult, {
          targetMemberId: c.memberId,
          targetName: targetName,
          note: 'backend live sweep (reserve then finalize on 2xx)',
        }));
      }
    } else {
      const failReason = (pushResult && pushResult.reason) || 'push-failed';
      await releaseReservation(failReason, failReason);
      if (writeNotifLog && db) {
        entry.notiflog = await writeNotifLogEntry(db, buildProposalReminderNotifLogEntry(pushResult || { sent: false, reason: failReason }, {
          targetMemberId: c.memberId,
          targetName: targetName,
          note: 'backend reserve released after non-delivery (no durable send)',
        }));
      }
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
        ? 'Live sweep executed with injected fetch'
        : 'Push suppressed — fetchImpl not provided')
      : 'Firestore claim executed; push/network disabled by gates',
  };
}

module.exports = {
  runProposalReminderOrchestrator,
  runScheduledProposalReminderSweep,
  buildScheduledSweepOptions,
  resolveRuntimeFetchImpl,
  processReminderCandidates,
  getAdminFirestore,
  loadOpenProposals,
  loadRosterMemberIds,
  loadMemberNameById,
  loadNotifPrefsByMemberName,
  isRecipientOptedOut,
};
