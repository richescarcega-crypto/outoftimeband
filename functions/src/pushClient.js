'use strict';

const { buildProposalReminderMessage } = require('./reminderMessage');
const { buildProposalReminderIdempotency } = require('./reminderIdempotency');

/**
 * Push worker payload builder + guarded sender (Phase 2b/2c).
 *
 * Does not call global fetch unless a fetchImpl is injected.
 * The scheduled Cloud Function supplies runtime fetch via
 * runScheduledProposalReminderSweep → sendProposalReminderPush.
 * LIVE env gates still control whether push is attempted.
 */

function buildProposalReminderPushPayload(proposal, targetMemberId, reminderNumber, options) {
  options = options || {};
  const copy = buildProposalReminderMessage(proposal, reminderNumber);
  const idem = buildProposalReminderIdempotency(
    proposal && proposal.id,
    targetMemberId,
    reminderNumber
  );
  const payload = {
    title: copy.title,
    message: copy.message,
    url: options.url || 'https://richescarcega-crypto.github.io/outoftimeband/',
    targetExternalIds: [String(targetMemberId)],
    notificationId: idem.notificationId,
    idempotency_key: idem.idempotencyUuid,
    idempotencyKey: idem.idempotencyUuid,
    data: {
      ootCategory: 'rehearsal-proposal',
      ootNotificationId: idem.notificationId,
      ootIdempotencyKey: idem.idempotencyUuid,
      ootProposalId: String(proposal && proposal.id || ''),
      ootReminderNumber: String(reminderNumber),
      ootSentAt: new Date().toISOString(),
    },
  };
  return payload;
}

async function sendProposalReminderPush(options) {
  options = options || {};
  const config = options.config || {};
  const fetchImpl = options.fetchImpl;

  if (!config.canSendPush) {
    return {
      ok: false,
      sent: false,
      reason: 'push-blocked-preflight',
      errors: config.errors && config.errors.length
        ? config.errors.slice()
        : ['canSendPush is false'],
    };
  }

  if (typeof fetchImpl !== 'function') {
    return {
      ok: false,
      sent: false,
      reason: 'fetch-not-injected',
      message: 'Push suppressed: no fetchImpl (preflight default — no real worker call)',
    };
  }

  const payload = options.payload || buildProposalReminderPushPayload(
    options.proposal,
    options.targetMemberId,
    options.reminderNumber,
    options
  );

  const secret = String(options.pushSecret || '').trim();
  if (!secret) {
    return {
      ok: false,
      sent: false,
      reason: 'missing-push-secret',
      errors: ['OOT_PUSH_WORKER_SECRET is required to send push'],
    };
  }

  const url = String(config.pushUrl || '').trim();
  if (!url) {
    return {
      ok: false,
      sent: false,
      reason: 'missing-push-url',
      errors: ['OOT_PUSH_WORKER_URL is required to send push'],
    };
  }

  try {
    const resp = await fetchImpl(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + secret,
      },
      body: JSON.stringify(payload),
    });
    const body = typeof resp.text === 'function' ? await resp.text() : '';
    const ok = resp.status >= 200 && resp.status < 300;
    return {
      ok: ok,
      sent: ok,
      reason: ok ? 'sent' : 'push-failed',
      httpStatus: resp.status,
      response: String(body || '').slice(0, 500),
      payload: payload,
    };
  } catch (err) {
    return {
      ok: false,
      sent: false,
      reason: 'push-error',
      error: err && err.message ? String(err.message) : 'fetch threw',
      payload: payload,
    };
  }
}

module.exports = {
  buildProposalReminderPushPayload,
  sendProposalReminderPush,
};
