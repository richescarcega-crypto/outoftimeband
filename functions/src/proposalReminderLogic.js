'use strict';

const {
  PROPOSAL_REMINDER_FIRST_MS,
  PROPOSAL_REMINDER_REPEAT_MS,
  PROPOSAL_REMINDER_RESERVATION_LEASE_MS,
} = require('./reminderPolicy');

/**
 * Pure proposal reminder planning logic ported from index.html (~27286–27328).
 * No Firebase, no push worker, no secrets. Safe for local unit tests.
 *
 * Active backend reservations (optional reminderState[member].reservation) block
 * duplicate candidate selection until the lease expires.
 */

function hasActiveReminderReservation(memberState, nowMs) {
  const r = memberState && memberState.reservation;
  if (!r || r.status !== 'reserved') return false;
  const expiresAt = Number(r.expiresAt || 0);
  if (!expiresAt) return false;
  return Number(nowMs) < expiresAt;
}

function formatTodayLocal(date) {
  const d = date instanceof Date ? date : new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return y + '-' + m + '-' + day;
}

function getExpectedResponderIds(proposal, rosterMemberIds) {
  const p = proposal || {};
  if (Array.isArray(p.expectedResponderIds) && p.expectedResponderIds.length) {
    return p.expectedResponderIds.map(function (id) { return String(id); });
  }
  const roster = Array.isArray(rosterMemberIds) ? rosterMemberIds : [];
  return roster.map(function (id) { return String(id); });
}

function getNonResponderIds(proposal, rosterMemberIds) {
  const responses = (proposal && proposal.responses) || {};
  return getExpectedResponderIds(proposal, rosterMemberIds).filter(function (id) {
    return !responses[String(id)];
  });
}

function isProposalDateStale(proposal, todayStr) {
  if (!proposal || !proposal.date) return false;
  try {
    const today = todayStr || formatTodayLocal(new Date());
    return String(proposal.date) < today;
  } catch (e) {
    return false;
  }
}

function isProposalOpen(proposal) {
  if (!proposal) return false;
  return !proposal.status || proposal.status === 'open';
}

/**
 * Returns due info or null. Mirrors _proposalReminderDueInfo.
 */
function getReminderDueInfo(proposal, targetMemberId, nowMs, rosterMemberIds, todayStr) {
  const now = Number(nowMs);
  if (!isProposalOpen(proposal)) return null;
  if (isProposalDateStale(proposal, todayStr)) return null;
  const nonResponders = getNonResponderIds(proposal, rosterMemberIds);
  if (nonResponders.indexOf(String(targetMemberId)) < 0) return null;
  const proposedAt = Number(proposal.proposedAt || proposal.createdAt || 0);
  if (!proposedAt) return null;
  const stateRoot = proposal.reminderState || {};
  const state = stateRoot[String(targetMemberId)] || {};
  if (hasActiveReminderReservation(state, now)) return null;
  const count = Number(state.count || 0);
  const lastSentAt = Number(state.lastSentAt || 0);
  const dueAt = count > 0
    ? (lastSentAt + PROPOSAL_REMINDER_REPEAT_MS)
    : (proposedAt + PROPOSAL_REMINDER_FIRST_MS);
  if (now < dueAt) return null;
  return {
    reminderNumber: count + 1,
    dueAt: dueAt,
    lastSentAt: lastSentAt,
    priorCount: count,
  };
}

function getNextReminderNumber(proposal, targetMemberId, nowMs, rosterMemberIds, todayStr) {
  const due = getReminderDueInfo(proposal, targetMemberId, nowMs, rosterMemberIds, todayStr);
  return due ? due.reminderNumber : null;
}

module.exports = {
  formatTodayLocal,
  getExpectedResponderIds,
  getNonResponderIds,
  isProposalDateStale,
  isProposalOpen,
  hasActiveReminderReservation,
  getReminderDueInfo,
  getNextReminderNumber,
  PROPOSAL_REMINDER_FIRST_MS,
  PROPOSAL_REMINDER_REPEAT_MS,
  PROPOSAL_REMINDER_RESERVATION_LEASE_MS,
};
