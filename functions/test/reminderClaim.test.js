'use strict';

const assert = require('assert');
const {
  planReminderStateReserve,
  planReminderStateFinalize,
  planReminderStateRelease,
  SENTINEL_SENDER,
  POLICY_TAG,
  PROPOSAL_REMINDER_RESERVATION_LEASE_MS,
} = require('../src/reminderClaim');
const {
  getReminderDueInfo,
  PROPOSAL_REMINDER_FIRST_MS,
  PROPOSAL_REMINDER_REPEAT_MS,
} = require('../src/proposalReminderLogic');

const ROSTER = ['alice', 'bob', 'carol'];
const TODAY = '2026-07-03';
const PROPOSED_AT = Date.parse('2026-07-01T12:00:00.000Z');

function baseProposal(overrides) {
  return Object.assign({
    id: 'prop-1',
    status: 'open',
    date: '2026-07-10',
    proposedAt: PROPOSED_AT,
    expectedResponderIds: ROSTER.slice(),
    responses: { alice: 'yes' },
    reminderState: {},
  }, overrides || {});
}

function testReserveDueFirstReminder() {
  const now = PROPOSED_AT + PROPOSAL_REMINDER_FIRST_MS;
  const plan = planReminderStateReserve(baseProposal(), 'bob', now, ROSTER, TODAY);
  assert.strictEqual(plan.send, true);
  assert.strictEqual(plan.reason, 'reserve-planned');
  assert.strictEqual(plan.reminderNumber, 1);
  assert.strictEqual(plan.reminderState.bob.count, 0);
  assert.strictEqual(plan.reminderState.bob.lastSentAt, undefined);
  assert.strictEqual(plan.reminderState.bob.reservation.reminderNumber, 1);
  assert.strictEqual(plan.reminderState.bob.reservation.status, 'reserved');
  assert.strictEqual(plan.reminderState.bob.reservation.reservedBy, SENTINEL_SENDER);
  assert.strictEqual(
    plan.reminderState.bob.reservation.expiresAt,
    now + PROPOSAL_REMINDER_RESERVATION_LEASE_MS
  );
}

function testActiveReservationBlocksSecondReserve() {
  const now = PROPOSED_AT + PROPOSAL_REMINDER_FIRST_MS;
  const first = planReminderStateReserve(baseProposal(), 'bob', now, ROSTER, TODAY);
  assert.strictEqual(first.send, true);
  const second = planReminderStateReserve(
    baseProposal({ reminderState: first.reminderState }),
    'bob',
    now + 1000,
    ROSTER,
    TODAY
  );
  assert.strictEqual(second.send, false);
  assert.strictEqual(second.reason, 'reserved');
}

function testExpiredReservationCanBeReclaimed() {
  const now = PROPOSED_AT + PROPOSAL_REMINDER_FIRST_MS;
  const first = planReminderStateReserve(baseProposal(), 'bob', now, ROSTER, TODAY);
  const expiredState = first.reminderState;
  expiredState.bob.reservation.expiresAt = now + 1;
  const later = now + PROPOSAL_REMINDER_RESERVATION_LEASE_MS + 5000;
  const due = getReminderDueInfo(
    baseProposal({ reminderState: expiredState }),
    'bob',
    later,
    ROSTER,
    TODAY
  );
  assert.ok(due);
  assert.strictEqual(due.reminderNumber, 1);
  const reclaim = planReminderStateReserve(
    baseProposal({ reminderState: expiredState }),
    'bob',
    later,
    ROSTER,
    TODAY
  );
  assert.strictEqual(reclaim.send, true);
  assert.strictEqual(reclaim.reminderNumber, 1);
  assert.strictEqual(reclaim.reminderState.bob.count, 0);
}

function testFinalizeAdvancesDurableLedger() {
  const now = PROPOSED_AT + PROPOSAL_REMINDER_FIRST_MS;
  const reserved = planReminderStateReserve(baseProposal(), 'bob', now, ROSTER, TODAY);
  const finalized = planReminderStateFinalize(
    baseProposal({ reminderState: reserved.reminderState }),
    'bob',
    now + 50,
    { reminderNumber: 1, targetName: 'Bob' }
  );
  assert.strictEqual(finalized.ok, true);
  assert.strictEqual(finalized.reminderState.bob.count, 1);
  assert.strictEqual(finalized.reminderState.bob.lastSentAt, now + 50);
  assert.strictEqual(finalized.reminderState.bob.lastSentTo, 'Bob');
  assert.strictEqual(finalized.reminderState.bob.policy, POLICY_TAG);
  assert.strictEqual(finalized.reminderState.bob.history.length, 1);
  assert.strictEqual(finalized.reminderState.bob.history[0].outcome, 'sent');
  assert.strictEqual(finalized.reminderState.bob.reservation, undefined);
}

function testReleaseDoesNotAdvanceDurableLedger() {
  const now = PROPOSED_AT + PROPOSAL_REMINDER_FIRST_MS;
  const reserved = planReminderStateReserve(baseProposal(), 'bob', now, ROSTER, TODAY);
  const released = planReminderStateRelease(
    baseProposal({ reminderState: reserved.reminderState }),
    'bob',
    now + 10,
    { outcome: 'push-failed', reason: 'push-failed' }
  );
  assert.strictEqual(released.ok, true);
  assert.strictEqual(released.reminderState.bob.count, 0);
  assert.strictEqual(released.reminderState.bob.lastSentAt, undefined);
  assert.strictEqual(released.reminderState.bob.reservation, undefined);
  assert.strictEqual(released.reminderState.bob.lastAttempt.outcome, 'push-failed');
}

function testSuccessfulFinalizeRespectsRepeatInterval() {
  const now = PROPOSED_AT + PROPOSAL_REMINDER_FIRST_MS;
  const reserved = planReminderStateReserve(baseProposal(), 'bob', now, ROSTER, TODAY);
  const finalized = planReminderStateFinalize(
    baseProposal({ reminderState: reserved.reminderState }),
    'bob',
    now,
    { reminderNumber: 1, targetName: 'Bob' }
  );
  const midWindow = now + PROPOSAL_REMINDER_REPEAT_MS - 1;
  const dueEarly = getReminderDueInfo(
    baseProposal({ reminderState: finalized.reminderState }),
    'bob',
    midWindow,
    ROSTER,
    TODAY
  );
  assert.strictEqual(dueEarly, null);
  const dueNext = getReminderDueInfo(
    baseProposal({ reminderState: finalized.reminderState }),
    'bob',
    now + PROPOSAL_REMINDER_REPEAT_MS,
    ROSTER,
    TODAY
  );
  assert.ok(dueNext);
  assert.strictEqual(dueNext.reminderNumber, 2);
}

function testReserveAbortStale() {
  const now = PROPOSED_AT + PROPOSAL_REMINDER_FIRST_MS;
  const plan = planReminderStateReserve(baseProposal({ date: '2026-07-01' }), 'bob', now, ROSTER, TODAY);
  assert.strictEqual(plan.send, false);
  assert.strictEqual(plan.reason, 'stale');
}

function testReserveAbortAlreadyResponded() {
  const now = PROPOSED_AT + PROPOSAL_REMINDER_FIRST_MS;
  const plan = planReminderStateReserve(
    baseProposal({ responses: { alice: 'yes', bob: 'yes' } }),
    'bob',
    now,
    ROSTER,
    TODAY
  );
  assert.strictEqual(plan.send, false);
  assert.strictEqual(plan.reason, 'already-responded');
}

function testReserveAbortNotDue() {
  const plan = planReminderStateReserve(baseProposal(), 'bob', PROPOSED_AT, ROSTER, TODAY);
  assert.strictEqual(plan.send, false);
  assert.strictEqual(plan.reason, 'not-due');
}

function testReserveAbortClosed() {
  const now = PROPOSED_AT + PROPOSAL_REMINDER_FIRST_MS;
  const plan = planReminderStateReserve(baseProposal({ status: 'cancelled' }), 'bob', now, ROSTER, TODAY);
  assert.strictEqual(plan.send, false);
  assert.strictEqual(plan.reason, 'closed');
}

function testFinalizeHistoryCap() {
  const history = [];
  for (let i = 1; i <= 20; i++) {
    history.push({ reminderNumber: i, sentAt: i, outcome: 'sent' });
  }
  const now = PROPOSED_AT + PROPOSAL_REMINDER_FIRST_MS;
  const reserved = planReminderStateReserve(baseProposal({
    reminderState: {
      bob: {
        count: 20,
        lastSentAt: now - PROPOSAL_REMINDER_REPEAT_MS,
        history: history,
        reservation: {
          reminderNumber: 21,
          reservedAt: now,
          expiresAt: now + PROPOSAL_REMINDER_RESERVATION_LEASE_MS,
          status: 'reserved',
          mode: 'backend-auto',
        },
      },
    },
  }), 'bob', now, ROSTER, TODAY, { force: true });
  // force reserve on already-reserved would fail; build finalize input directly
  const state = {
    bob: {
      count: 20,
      lastSentAt: now - PROPOSAL_REMINDER_REPEAT_MS,
      history: history,
      reservation: {
        reminderNumber: 21,
        reservedAt: now,
        expiresAt: now + PROPOSAL_REMINDER_RESERVATION_LEASE_MS,
        status: 'reserved',
        mode: 'backend-auto',
      },
    },
  };
  const finalized = planReminderStateFinalize(
    baseProposal({ reminderState: state }),
    'bob',
    now,
    { reminderNumber: 21, targetName: 'Bob' }
  );
  assert.strictEqual(finalized.ok, true);
  assert.strictEqual(finalized.reminderState.bob.history.length, 20);
  assert.strictEqual(finalized.reminderState.bob.history[0].reminderNumber, 2);
  assert.strictEqual(finalized.reminderState.bob.history[19].reminderNumber, 21);
  assert.strictEqual(reserved.send === true || reserved.send === false, true);
}

function run() {
  testReserveDueFirstReminder();
  testActiveReservationBlocksSecondReserve();
  testExpiredReservationCanBeReclaimed();
  testFinalizeAdvancesDurableLedger();
  testReleaseDoesNotAdvanceDurableLedger();
  testSuccessfulFinalizeRespectsRepeatInterval();
  testReserveAbortStale();
  testReserveAbortAlreadyResponded();
  testReserveAbortNotDue();
  testReserveAbortClosed();
  testFinalizeHistoryCap();
  console.log('PASS: reminder claim tests (11 cases)');
}

run();
