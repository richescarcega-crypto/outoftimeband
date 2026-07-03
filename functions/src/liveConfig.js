'use strict';

/**
 * Live enablement gates for proposal reminder backend (Phase 2b preflight).
 *
 * Default: dry-run — no Admin SDK, no Firestore, no push worker HTTP.
 *
 * Required env vars for ANY live execution path:
 *   OOT_PROPOSAL_REMINDER_LIVE=1
 *   OOT_PUSH_WORKER_SECRET=<set in deploy secrets, never committed>
 *   OOT_PROPOSAL_REMINDER_ALLOW_SEND=1
 *
 * Additional gates before side effects:
 *   OOT_PROPOSAL_REMINDER_ALLOW_FIRESTORE=1  — Admin SDK reads/writes (claim transaction)
 *   OOT_PROPOSAL_REMINDER_ALLOW_NETWORK=1    — HTTP POST to push worker (injected fetch only in tests)
 *
 * Do not set these until Cloudflare worker server-auth is deployed (see Phase 2b preflight doc).
 */

const DEFAULT_PUSH_WORKER_URL = 'https://oot-push.rich-escarcega.workers.dev';

function evaluateLiveEnablement(env) {
  env = env || {};
  const liveFlag = env.OOT_PROPOSAL_REMINDER_LIVE === '1';
  const allowSend = env.OOT_PROPOSAL_REMINDER_ALLOW_SEND === '1';
  const allowFirestore = env.OOT_PROPOSAL_REMINDER_ALLOW_FIRESTORE === '1';
  const allowNetwork = env.OOT_PROPOSAL_REMINDER_ALLOW_NETWORK === '1';
  const pushSecret = String(env.OOT_PUSH_WORKER_SECRET || '').trim();
  const pushUrl = String(env.OOT_PUSH_WORKER_URL || DEFAULT_PUSH_WORKER_URL).trim();
  const errors = [];

  if (!liveFlag) {
    return {
      mode: 'dry-run',
      liveFlag: false,
      allowSend: false,
      allowFirestore: false,
      allowNetwork: false,
      canUseAdmin: false,
      canSendPush: false,
      pushUrl: pushUrl,
      hasPushSecret: false,
      errors: [],
    };
  }

  if (!pushSecret) {
    errors.push('OOT_PUSH_WORKER_SECRET is required for live mode');
  }
  if (!allowSend) {
    errors.push('OOT_PROPOSAL_REMINDER_ALLOW_SEND=1 is required for live mode');
  }

  const canUseAdmin = liveFlag && !!pushSecret && allowSend && allowFirestore;
  const canSendPush = liveFlag && !!pushSecret && allowSend && allowNetwork;

  if (liveFlag && allowSend && pushSecret && !allowFirestore) {
    errors.push('OOT_PROPOSAL_REMINDER_ALLOW_FIRESTORE=1 required before Firestore claim/send');
  }
  if (liveFlag && allowSend && pushSecret && allowFirestore && !allowNetwork) {
    errors.push('OOT_PROPOSAL_REMINDER_ALLOW_NETWORK=1 required before push worker HTTP');
  }

  const mode = errors.length ? 'live-blocked' : 'live-ready';

  return {
    mode: mode,
    liveFlag: true,
    allowSend: allowSend,
    allowFirestore: allowFirestore,
    allowNetwork: allowNetwork,
    canUseAdmin: canUseAdmin,
    canSendPush: canSendPush,
    pushUrl: pushUrl,
    hasPushSecret: !!pushSecret,
    errors: errors.slice(),
  };
}

module.exports = {
  DEFAULT_PUSH_WORKER_URL,
  evaluateLiveEnablement,
};
