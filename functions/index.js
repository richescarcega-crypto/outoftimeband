'use strict';

/**
 * Out of Time Firebase Functions — proposal reminder backend.
 *
 * Default: dry-run — no Admin SDK, no Firestore, no push worker HTTP
 * (OOT_PROPOSAL_REMINDER_LIVE unset / !=1).
 *
 * Live enablement requires ALL of:
 *   OOT_PROPOSAL_REMINDER_LIVE=1
 *   OOT_PUSH_WORKER_SECRET (deploy secret — never commit)
 *   OOT_PROPOSAL_REMINDER_ALLOW_SEND=1
 *   OOT_PROPOSAL_REMINDER_ALLOW_FIRESTORE=1
 *   OOT_PROPOSAL_REMINDER_ALLOW_NETWORK=1
 *
 * The scheduled handler injects runtime fetch into the orchestrator so push can
 * reach the worker when LIVE gates are deliberately enabled. Fetch wiring alone
 * does not enable production sends.
 *
 * Push worker must accept Authorization: Bearer <secret> (Cloudflare contract —
 * verify separately before enabling LIVE). Do not enable LIVE until that is confirmed.
 */

const { onSchedule } = require('firebase-functions/v2/scheduler');
const { PROPOSAL_REMINDER_SCHEDULE_EVERY_MINUTES } = require('./src/reminderPolicy');
const { runScheduledProposalReminderSweep } = require('./src/proposalReminderLiveSweep');

exports.proposalReminderSweepScheduled = onSchedule(
  {
    schedule: 'every ' + PROPOSAL_REMINDER_SCHEDULE_EVERY_MINUTES + ' minutes',
    timeoutSeconds: 120,
  },
  async function proposalReminderSweepScheduledHandler() {
    const result = await runScheduledProposalReminderSweep({ env: process.env });
    console.log('[proposal-reminder]', JSON.stringify({
      mode: result.mode,
      live: result.live,
      executed: result.executed,
      message: result.message,
      errors: result.errors,
      candidates: result.candidates,
    }));
    return result;
  }
);
