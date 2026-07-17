'use strict';

const {
  getReminderDueInfo,
  isProposalDateStale,
  getNonResponderIds,
  hasActiveReminderReservation,
  PROPOSAL_REMINDER_RESERVATION_LEASE_MS,
} = require('./proposalReminderLogic');

/**
 * Pure reminderState planners for backend reserve → send → finalize/release.
 *
 * Durable success fields (count, lastSentAt, history success entries) advance
 * only on finalize after HTTP 2xx. Reservations prevent concurrent duplicate
 * sends without burning the 10h repeat window on failure.
 */

const SENTINEL_SENDER = 'backend-scheduler';
const POLICY_TAG = '24h-then-10h-r114';

function cloneMemberState(prior) {
  const out = Object.assign({}, prior || {});
  if (Array.isArray(prior && prior.history)) {
    out.history = prior.history.slice();
  }
  if (prior && prior.reservation) {
    out.reservation = Object.assign({}, prior.reservation);
  }
  if (prior && prior.lastAttempt) {
    out.lastAttempt = Object.assign({}, prior.lastAttempt);
  }
  return out;
}

function cloneStateRoot(reminderState) {
  const root = Object.assign({}, reminderState || {});
  Object.keys(root).forEach(function (key) {
    root[key] = cloneMemberState(root[key]);
  });
  return root;
}

/**
 * Reserve a due reminder slot (does not advance durable count / lastSentAt).
 */
function planReminderStateReserve(proposal, targetMemberId, nowMs, rosterMemberIds, todayStr, opts) {
  opts = opts || {};
  const now = Number(nowMs);
  const mid = String(targetMemberId);
  const fresh = Object.assign({}, proposal, { id: proposal && proposal.id });
  if (!fresh.id) return { send: false, reason: 'missing-id' };
  if (fresh.status && fresh.status !== 'open') return { send: false, reason: 'closed' };
  if (isProposalDateStale(fresh, todayStr)) return { send: false, reason: 'stale' };
  const nonResponders = getNonResponderIds(fresh, rosterMemberIds);
  if (nonResponders.indexOf(mid) < 0) {
    return { send: false, reason: 'already-responded' };
  }

  const stateRoot = cloneStateRoot(fresh.reminderState);
  const prior = cloneMemberState(stateRoot[mid] || {});

  if (hasActiveReminderReservation(prior, now)) {
    return {
      send: false,
      reason: 'reserved',
      reservation: Object.assign({}, prior.reservation),
    };
  }

  const due = getReminderDueInfo(fresh, mid, now, rosterMemberIds, todayStr);
  if (!due && !opts.force) return { send: false, reason: 'not-due' };

  const reminderNumber = due
    ? due.reminderNumber
    : (Number(prior.count || 0) + 1);
  const leaseMs = Number(opts.leaseMs || PROPOSAL_REMINDER_RESERVATION_LEASE_MS);
  const expiresAt = now + leaseMs;

  prior.reservation = {
    reminderNumber: reminderNumber,
    reservedAt: now,
    reservedAtIso: new Date(now).toISOString(),
    expiresAt: expiresAt,
    expiresAtIso: new Date(expiresAt).toISOString(),
    reservedBy: SENTINEL_SENDER,
    mode: opts.force ? 'manual' : 'backend-auto',
    status: 'reserved',
  };
  if (prior.count == null) prior.count = Number(prior.count || 0);
  if (!Array.isArray(prior.history)) prior.history = [];
  prior.policy = prior.policy || POLICY_TAG;

  stateRoot[mid] = prior;

  return {
    send: true,
    reason: 'reserve-planned',
    reminderNumber: reminderNumber,
    reminderState: stateRoot,
    reservation: Object.assign({}, prior.reservation),
  };
}

/**
 * Finalize after confirmed HTTP 2xx — advances durable success ledger.
 */
function planReminderStateFinalize(proposal, targetMemberId, nowMs, opts) {
  opts = opts || {};
  const now = Number(nowMs);
  const mid = String(targetMemberId);
  const fresh = Object.assign({}, proposal, { id: proposal && proposal.id });
  if (!fresh.id) return { ok: false, reason: 'missing-id' };

  const stateRoot = cloneStateRoot(fresh.reminderState);
  const prior = cloneMemberState(stateRoot[mid] || {});
  const reservation = prior.reservation;
  const expectedNumber = Number(opts.reminderNumber || 0);

  if (!reservation || reservation.status !== 'reserved') {
    return { ok: false, reason: 'no-reservation' };
  }
  if (expectedNumber && Number(reservation.reminderNumber) !== expectedNumber) {
    return { ok: false, reason: 'reservation-mismatch' };
  }

  const reminderNumber = Number(reservation.reminderNumber);
  const targetName = opts.targetName || prior.lastSentTo || mid;
  const mode = reservation.mode || (opts.force ? 'manual' : 'backend-auto');
  const priorHistory = Array.isArray(prior.history) ? prior.history.slice() : [];

  priorHistory.push({
    reminderNumber: reminderNumber,
    sentAt: now,
    sentAtIso: new Date(now).toISOString(),
    sentBy: SENTINEL_SENDER,
    sentTo: targetName,
    memberId: mid,
    mode: mode,
    outcome: 'sent',
    dueWindowHours: reminderNumber === 1 ? 24 : 10,
    responseWindowHours: 10,
    policy: POLICY_TAG,
  });
  if (priorHistory.length > 20) {
    priorHistory.splice(0, priorHistory.length - 20);
  }

  delete prior.reservation;
  delete prior.lastAttempt;

  prior.count = reminderNumber;
  prior.lastSentAt = now;
  prior.lastSentAtIso = new Date(now).toISOString();
  prior.lastSentBy = SENTINEL_SENDER;
  prior.lastSentTo = targetName;
  prior.lastMode = mode;
  prior.policy = POLICY_TAG;
  prior.history = priorHistory;

  stateRoot[mid] = prior;

  return {
    ok: true,
    reason: 'finalize-planned',
    reminderNumber: reminderNumber,
    reminderState: stateRoot,
  };
}

/**
 * Release reservation after non-delivery (push fail, missing fetch, blocked, opt-out).
 * Does not advance durable count / lastSentAt.
 */
function planReminderStateRelease(proposal, targetMemberId, nowMs, opts) {
  opts = opts || {};
  const now = Number(nowMs);
  const mid = String(targetMemberId);
  const fresh = Object.assign({}, proposal, { id: proposal && proposal.id });
  if (!fresh.id) return { ok: false, reason: 'missing-id' };

  const stateRoot = cloneStateRoot(fresh.reminderState);
  const prior = cloneMemberState(stateRoot[mid] || {});
  const reservation = prior.reservation;
  const reminderNumber = reservation
    ? Number(reservation.reminderNumber)
    : Number(opts.reminderNumber || 0);

  if (!reservation) {
    return { ok: false, reason: 'no-reservation' };
  }

  prior.lastAttempt = {
    reminderNumber: reminderNumber,
    attemptedAt: now,
    attemptedAtIso: new Date(now).toISOString(),
    outcome: opts.outcome || 'released',
    reason: opts.reason || 'released',
    reservedBy: reservation.reservedBy || SENTINEL_SENDER,
  };
  delete prior.reservation;

  stateRoot[mid] = prior;

  return {
    ok: true,
    reason: 'release-planned',
    reminderNumber: reminderNumber,
    reminderState: stateRoot,
  };
}

/**
 * Alias: reserve planner (name retained for older call sites / docs).
 */
function planReminderStateClaim(proposal, targetMemberId, nowMs, rosterMemberIds, todayStr, opts) {
  return planReminderStateReserve(proposal, targetMemberId, nowMs, rosterMemberIds, todayStr, opts);
}

module.exports = {
  SENTINEL_SENDER,
  POLICY_TAG,
  PROPOSAL_REMINDER_RESERVATION_LEASE_MS,
  planReminderStateReserve,
  planReminderStateFinalize,
  planReminderStateRelease,
  planReminderStateClaim,
  cloneMemberState,
  cloneStateRoot,
};
