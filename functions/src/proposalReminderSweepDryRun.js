'use strict';

const {
  getNonResponderIds,
  isProposalOpen,
  isProposalDateStale,
  getReminderDueInfo,
} = require('./proposalReminderLogic');

/**
 * Pure dry-run sweep: lists reminder candidates that WOULD be claimed in Phase 2b.
 * Does not read/write Firestore or call the push worker.
 */

function collectDryRunCandidates(proposals, rosterMemberIds, nowMs, todayStr) {
  const now = Number(nowMs);
  const list = Array.isArray(proposals) ? proposals : [];
  const candidates = [];

  list.forEach(function (p) {
    if (!p || !isProposalOpen(p)) return;
    if (isProposalDateStale(p, todayStr)) return;
    const propId = String(p.id || '');
    if (!propId) return;
    getNonResponderIds(p, rosterMemberIds).forEach(function (memberId) {
      const due = getReminderDueInfo(p, memberId, now, rosterMemberIds, todayStr);
      if (!due) return;
      candidates.push({
        propId: propId,
        memberId: String(memberId),
        reminderNumber: due.reminderNumber,
        dueAt: due.dueAt,
        lastSentAt: due.lastSentAt,
        priorCount: due.priorCount,
        mode: 'dry-run',
      });
    });
  });

  return candidates;
}

function summarizeDryRunCandidates(candidates) {
  const list = Array.isArray(candidates) ? candidates : [];
  return {
    candidateCount: list.length,
    byProposal: list.reduce(function (acc, c) {
      acc[c.propId] = (acc[c.propId] || 0) + 1;
      return acc;
    }, {}),
  };
}

module.exports = {
  collectDryRunCandidates,
  summarizeDryRunCandidates,
};
