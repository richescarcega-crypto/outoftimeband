'use strict';

/**
 * Out of Time Firebase Functions — Phase 2a scaffold ONLY.
 *
 * - Scheduled export is DRY-RUN by default (OOT_PROPOSAL_REMINDER_LIVE !== '1').
 * - No Firestore reads/writes, no push worker calls, no secrets required.
 * - Do not deploy until Phase 2b approval (Firebase/GCP access + push-worker auth).
 */

const { onSchedule } = require('firebase-functions/v2/scheduler');
const { PROPOSAL_REMINDER_SCHEDULE_EVERY_MINUTES } = require('./src/reminderPolicy');
const { summarizeDryRunCandidates } = require('./src/proposalReminderSweepDryRun');

const LIVE_SENDS_ENABLED = process.env.OOT_PROPOSAL_REMINDER_LIVE === '1';

exports.proposalReminderSweepScheduled = onSchedule(
  {
    schedule: 'every ' + PROPOSAL_REMINDER_SCHEDULE_EVERY_MINUTES + ' minutes',
    timeoutSeconds: 60,
  },
  async function proposalReminderSweepScheduledHandler() {
    if (!LIVE_SENDS_ENABLED) {
      console.log(
        '[proposal-reminder] Phase 2a DRY-RUN scaffold: live sends disabled. ' +
        'Set OOT_PROPOSAL_REMINDER_LIVE=1 only after Phase 2b (Admin SDK + push auth) is approved. ' +
        'No Firestore access, no notifications sent.'
      );
      return {
        mode: 'dry-run',
        live: false,
        candidates: summarizeDryRunCandidates([]),
      };
    }

    console.warn(
      '[proposal-reminder] OOT_PROPOSAL_REMINDER_LIVE=1 but Phase 2b send path is not implemented in this scaffold.'
    );
    return {
      mode: 'live-blocked',
      live: true,
      message: 'Phase 2b not implemented — no sends performed',
    };
  }
);
