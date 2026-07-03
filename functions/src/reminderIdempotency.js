'use strict';

const crypto = require('crypto');

/**
 * Deterministic proposal reminder idempotency keys (Phase 3 prep, pure helpers).
 * Mirrors index.html r912 intent: stable notificationId + UUID idempotency for OneSignal.
 */

function sanitizeToken(value) {
  return String(value == null ? '' : value)
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64) || 'x';
}

function buildProposalReminderNotificationId(propId, memberId, reminderNumber) {
  return [
    'oot-proposal-reminder',
    sanitizeToken(propId),
    sanitizeToken(memberId),
    'r' + String(Number(reminderNumber) || 1),
  ].join('-');
}

/**
 * Deterministic UUID-shaped key derived from notificationId (not cryptographically random).
 * Suitable for OneSignal idempotency_key when worker forwards it (Phase 3 + worker change).
 */
function buildDeterministicIdempotencyUuid(notificationId) {
  const hash = crypto.createHash('sha256').update(String(notificationId || '')).digest('hex');
  const part = function (start, len) { return hash.slice(start, start + len); };
  return [
    part(0, 8),
    part(8, 4),
    '4' + part(13, 3),
    ((parseInt(part(16, 1), 16) & 0x3) | 0x8).toString(16) + part(17, 3),
    part(20, 12),
  ].join('-');
}

function buildProposalReminderIdempotency(propId, memberId, reminderNumber) {
  const notificationId = buildProposalReminderNotificationId(propId, memberId, reminderNumber);
  return {
    notificationId: notificationId,
    idempotencyUuid: buildDeterministicIdempotencyUuid(notificationId),
  };
}

module.exports = {
  sanitizeToken,
  buildProposalReminderNotificationId,
  buildDeterministicIdempotencyUuid,
  buildProposalReminderIdempotency,
};
