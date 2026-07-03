'use strict';

const { evaluateLiveEnablement } = require('./liveConfig');
const { formatTodayLocal } = require('./proposalReminderLogic');
const { collectDryRunCandidates, summarizeDryRunCandidates } = require('./proposalReminderSweepDryRun');
const { sendProposalReminderPush } = require('./pushClient');
const { buildProposalReminderNotifLogEntry, writeNotifLogEntry } = require('./notifLog');

/**
 * Phase 2b live sweep orchestrator — disabled by default via liveConfig gates.
 *
 * - dry-run: no Admin SDK, no Firestore, no HTTP
 * - live-blocked: LIVE=1 but missing required env → clear preflight errors
 * - live-ready: all base gates pass; Firestore/push only if ALLOW_FIRESTORE / ALLOW_NETWORK set
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
  const candidates = collectDryRunCandidates(proposals, rosterMemberIds, nowMs, todayStr);
  const summary = summarizeDryRunCandidates(candidates);

  if (!config.canSendPush) {
    return {
      mode: 'live-ready',
      live: true,
      executed: false,
      preflight: preflight,
      errors: config.errors.slice(),
      message: 'Firestore path available but push/network disabled — no notifications sent',
      candidates: summary,
      candidateDetails: candidates,
    };
  }

  const pushSecret = String(env.OOT_PUSH_WORKER_SECRET || '').trim();
  const fetchImpl = options.fetchImpl;
  const results = [];

  for (let i = 0; i < candidates.length; i++) {
    const c = candidates[i];
    const proposal = proposals.find(function (p) { return String(p.id) === String(c.propId); });
    const pushResult = await sendProposalReminderPush({
      config: config,
      proposal: proposal,
      targetMemberId: c.memberId,
      reminderNumber: c.reminderNumber,
      pushSecret: pushSecret,
      fetchImpl: fetchImpl,
    });
    results.push({
      propId: c.propId,
      memberId: c.memberId,
      reminderNumber: c.reminderNumber,
      push: pushResult,
    });
    if (options.writeNotifLog !== false && db) {
      await writeNotifLogEntry(db, buildProposalReminderNotifLogEntry(pushResult, {
        targetMemberId: c.memberId,
        note: 'backend live sweep (preflight-capable path)',
      }));
    }
  }

  return {
    mode: 'live-executed',
    live: true,
    executed: true,
    preflight: preflight,
    candidates: summary,
    results: results,
    message: fetchImpl
      ? 'Live sweep executed with injected fetch (test harness only)'
      : 'Push suppressed — fetchImpl not provided',
  };
}

module.exports = {
  runProposalReminderOrchestrator,
  getAdminFirestore,
  loadOpenProposals,
  loadRosterMemberIds,
};
