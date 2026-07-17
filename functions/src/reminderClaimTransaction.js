'use strict';

const {
  planReminderStateReserve,
  planReminderStateFinalize,
  planReminderStateRelease,
} = require('./reminderClaim');
const { isProposalDateStale, getNonResponderIds } = require('./proposalReminderLogic');

/**
 * Firestore transactions for reminder reserve → finalize / release.
 */

async function runReminderStateTransaction(db, propId, options, planner) {
  options = options || {};
  if (!db || typeof db.collection !== 'function') {
    return { ok: false, send: false, reason: 'no-db' };
  }

  const nowMs = Number(options.nowMs || Date.now());
  const runTransaction = options.runTransaction || db.runTransaction.bind(db);
  const ref = db.collection('proposals').doc(String(propId));

  try {
    return await runTransaction(async function (tx) {
      const snap = await tx.get(ref);
      if (!snap.exists) {
        return { ok: false, send: false, reason: 'missing' };
      }

      const fresh = Object.assign({}, snap.data(), { id: snap.id });
      const plan = planner(fresh, nowMs, options);
      if (!plan) {
        return { ok: false, send: false, reason: 'aborted' };
      }

      const shouldWrite = !!(plan.reminderState && (plan.send === true || plan.ok === true));
      if (!shouldWrite) {
        return Object.assign({ ok: false, send: false }, plan);
      }

      tx.update(ref, { reminderState: plan.reminderState });
      return Object.assign({ ok: true }, plan);
    });
  } catch (err) {
    return {
      ok: false,
      send: false,
      reason: 'transaction-error',
      error: err && err.message ? String(err.message) : 'unknown',
    };
  }
}

async function executeProposalReminderReserve(db, propId, targetMemberId, options) {
  options = options || {};
  const rosterMemberIds = options.rosterMemberIds || [];
  const todayStr = options.todayStr;

  return runReminderStateTransaction(db, propId, options, function (fresh, nowMs, opts) {
    if (fresh.status && fresh.status !== 'open') {
      return { send: false, reason: 'closed' };
    }
    if (isProposalDateStale(fresh, todayStr)) {
      return { send: false, reason: 'stale' };
    }
    const nonResponders = getNonResponderIds(fresh, rosterMemberIds);
    if (nonResponders.indexOf(String(targetMemberId)) < 0) {
      return { send: false, reason: 'already-responded' };
    }

    const plan = planReminderStateReserve(fresh, targetMemberId, nowMs, rosterMemberIds, todayStr, {
      force: !!opts.force,
      targetName: opts.targetName,
      leaseMs: opts.leaseMs,
    });
    if (!plan.send) return plan;
    return {
      send: true,
      reason: 'reserved',
      reminderNumber: plan.reminderNumber,
      reminderState: plan.reminderState,
      reservation: plan.reservation,
    };
  });
}

async function executeProposalReminderFinalize(db, propId, targetMemberId, options) {
  options = options || {};
  return runReminderStateTransaction(db, propId, options, function (fresh, nowMs, opts) {
    const plan = planReminderStateFinalize(fresh, targetMemberId, nowMs, {
      reminderNumber: opts.reminderNumber,
      targetName: opts.targetName,
      force: !!opts.force,
    });
    if (!plan.ok) return { send: false, ok: false, reason: plan.reason };
    return {
      send: false,
      ok: true,
      reason: 'finalized',
      reminderNumber: plan.reminderNumber,
      reminderState: plan.reminderState,
    };
  });
}

async function executeProposalReminderRelease(db, propId, targetMemberId, options) {
  options = options || {};
  return runReminderStateTransaction(db, propId, options, function (fresh, nowMs, opts) {
    const plan = planReminderStateRelease(fresh, targetMemberId, nowMs, {
      reminderNumber: opts.reminderNumber,
      outcome: opts.outcome,
      reason: opts.reason,
    });
    if (!plan.ok) return { send: false, ok: false, reason: plan.reason };
    return {
      send: false,
      ok: true,
      reason: 'released',
      reminderNumber: plan.reminderNumber,
      reminderState: plan.reminderState,
    };
  });
}

/** Backward-compatible name: reserve only. */
async function executeProposalReminderClaim(db, propId, targetMemberId, options) {
  return executeProposalReminderReserve(db, propId, targetMemberId, options);
}

module.exports = {
  executeProposalReminderReserve,
  executeProposalReminderFinalize,
  executeProposalReminderRelease,
  executeProposalReminderClaim,
};
