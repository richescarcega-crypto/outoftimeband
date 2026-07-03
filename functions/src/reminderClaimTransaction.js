'use strict';

const { planReminderStateClaim } = require('./reminderClaim');
const { isProposalDateStale, getNonResponderIds } = require('./proposalReminderLogic');

/**
 * Firestore transaction claim for proposal reminders (Phase 2c).
 * Mirrors index.html _claimAndSendProposalReminder transaction body.
 */

async function executeProposalReminderClaim(db, propId, targetMemberId, options) {
  options = options || {};
  if (!db || typeof db.collection !== 'function') {
    return { send: false, reason: 'no-db' };
  }

  const nowMs = Number(options.nowMs || Date.now());
  const rosterMemberIds = options.rosterMemberIds || [];
  const todayStr = options.todayStr;
  const targetName = options.targetName;
  const force = !!options.force;
  const runTransaction = options.runTransaction || db.runTransaction.bind(db);
  const ref = db.collection('proposals').doc(String(propId));

  try {
    return await runTransaction(async function (tx) {
      const snap = await tx.get(ref);
      if (!snap.exists) {
        return { send: false, reason: 'missing' };
      }

      const fresh = Object.assign({}, snap.data(), { id: snap.id });
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

      const plan = planReminderStateClaim(fresh, targetMemberId, nowMs, rosterMemberIds, todayStr, {
        force: force,
        targetName: targetName,
      });
      if (!plan.send) {
        return { send: false, reason: plan.reason || 'not-due' };
      }

      tx.update(ref, { reminderState: plan.reminderState });
      return {
        send: true,
        reason: 'claimed',
        reminderNumber: plan.reminderNumber,
        reminderState: plan.reminderState,
      };
    });
  } catch (err) {
    return {
      send: false,
      reason: 'transaction-error',
      error: err && err.message ? String(err.message) : 'unknown',
    };
  }
}

module.exports = {
  executeProposalReminderClaim,
};
