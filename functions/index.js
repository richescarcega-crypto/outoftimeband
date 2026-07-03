'use strict';

/**
 * Out of Time Firebase Functions — Phase 2b live preflight (disabled by default).
 *
 * Default: dry-run — no Admin SDK, no Firestore, no push worker HTTP.
 *
 * Live enablement requires ALL of:
 *   OOT_PROPOSAL_REMINDER_LIVE=1
 *   OOT_PUSH_WORKER_SECRET (deploy secret — never commit)
 *   OOT_PROPOSAL_REMINDER_ALLOW_SEND=1
 *   OOT_PROPOSAL_REMINDER_ALLOW_FIRESTORE=1
 *   OOT_PROPOSAL_REMINDER_ALLOW_NETWORK=1
 *
 * Push worker must accept Authorization: Bearer <secret> (Cloudflare change — not in repo).
 * Do not deploy until Phase 2b preflight doc approval.
 */

const { onSchedule } = require('firebase-functions/v2/scheduler');
const { PROPOSAL_REMINDER_SCHEDULE_EVERY_MINUTES } = require('./src/reminderPolicy');
const { runProposalReminderOrchestrator } = require('./src/proposalReminderLiveSweep');

exports.proposalReminderSweepScheduled = onSchedule(
  {
    schedule: 'every ' + PROPOSAL_REMINDER_SCHEDULE_EVERY_MINUTES + ' minutes',
    timeoutSeconds: 120,
  },
  async function proposalReminderSweepScheduledHandler() {
    const result = await runProposalReminderOrchestrator({ env: process.env });
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
