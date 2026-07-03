'use strict';

/**
 * Proposal reminder push message copy — mirrors _sendProposalReminderAfterClaim (index.html).
 * Pure helper; no network.
 */

function formatPrettyDate(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(String(dateStr) + 'T00:00:00');
    if (isNaN(d.getTime())) return String(dateStr);
    return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  } catch (e) {
    return String(dateStr);
  }
}

function buildProposalReminderMessage(proposal, reminderNumber) {
  const p = proposal || {};
  let dateLine = formatPrettyDate(p.date);
  if (p.startTime) dateLine += ' at ' + p.startTime;
  if (p.location) dateLine += ' · ' + p.location;
  const title = 'Rehearsal proposal waiting for your response';
  let message = dateLine || 'Tap to respond to the rehearsal proposal';
  if (reminderNumber && Number(reminderNumber) > 1) {
    message += ' · Reminder #' + reminderNumber;
  }
  return { title: title, message: message };
}

module.exports = {
  formatPrettyDate,
  buildProposalReminderMessage,
};
