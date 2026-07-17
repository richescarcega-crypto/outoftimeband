'use strict';

/**
 * Proposal reminder timing policy — mirrors index.html constants (r109).
 * Phase 2a scaffold: pure constants only; no Firestore or push side effects.
 */
const PROPOSAL_REMINDER_FIRST_MS = 24 * 60 * 60 * 1000;
const PROPOSAL_REMINDER_REPEAT_MS = 10 * 60 * 60 * 1000;

/** Recommended backend scheduler interval (not yet deployed). */
const PROPOSAL_REMINDER_SCHEDULE_EVERY_MINUTES = 15;

/** Lease for in-flight reminder reservations before reclaim is allowed. */
const PROPOSAL_REMINDER_RESERVATION_LEASE_MS = 15 * 60 * 1000;

module.exports = {
  PROPOSAL_REMINDER_FIRST_MS,
  PROPOSAL_REMINDER_REPEAT_MS,
  PROPOSAL_REMINDER_SCHEDULE_EVERY_MINUTES,
  PROPOSAL_REMINDER_RESERVATION_LEASE_MS,
};
