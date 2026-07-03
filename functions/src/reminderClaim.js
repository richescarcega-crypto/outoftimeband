'use strict';

const { formatTodayLocal, getReminderDueInfo } = require('./proposalReminderLogic');

/**
 * Pure planning for reminderState transaction update — mirrors _claimAndSendProposalReminder.
 * Does not touch Firestore; used for tests and live claim path planning.
 */

const SENTINEL_SENDER = 'backend-scheduler';
const POLICY_TAG = '24h-then-10h-r114';

function planReminderStateClaim(proposal, targetMemberId, nowMs, rosterMemberIds, todayStr, opts) {
  opts = opts || {};
  const now = Number(nowMs);
  const fresh = Object.assign({}, proposal, { id: proposal && proposal.id });
  if (!fresh.id) return { send: false, reason: 'missing-id' };
  if (fresh.status && fresh.status !== 'open') return { send: false, reason: 'closed' };

  const due = getReminderDueInfo(fresh, targetMemberId, now, rosterMemberIds, todayStr);
  if (!due && !opts.force) return { send: false, reason: 'not-due' };

  const stateRoot = Object.assign({}, fresh.reminderState || {});
  const prior = stateRoot[String(targetMemberId)] || {};
  const reminderNumber = due ? due.reminderNumber : (Number(prior.count || 0) + 1);
  const targetName = opts.targetName || String(targetMemberId);
  const priorHistory = Array.isArray(prior.history) ? prior.history.slice() : [];

  priorHistory.push({
    reminderNumber: reminderNumber,
    sentAt: now,
    sentAtIso: new Date(now).toISOString(),
    sentBy: SENTINEL_SENDER,
    sentTo: targetName,
    memberId: String(targetMemberId),
    mode: opts.force ? 'manual' : 'backend-auto',
    dueWindowHours: reminderNumber === 1 ? 24 : 10,
    responseWindowHours: 10,
    policy: POLICY_TAG,
  });
  if (priorHistory.length > 20) {
    priorHistory.splice(0, priorHistory.length - 20);
  }

  stateRoot[String(targetMemberId)] = {
    count: reminderNumber,
    lastSentAt: now,
    lastSentAtIso: new Date(now).toISOString(),
    lastSentBy: SENTINEL_SENDER,
    lastSentTo: targetName,
    lastMode: opts.force ? 'manual' : 'backend-auto',
    policy: POLICY_TAG,
    history: priorHistory,
  };

  return {
    send: true,
    reason: 'claim-planned',
    reminderNumber: reminderNumber,
    reminderState: stateRoot,
  };
}

module.exports = {
  SENTINEL_SENDER,
  POLICY_TAG,
  planReminderStateClaim,
};
