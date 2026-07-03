'use strict';

const assert = require('assert');
const { planReminderStateClaim, SENTINEL_SENDER, POLICY_TAG } = require('../src/reminderClaim');
const { PROPOSAL_REMINDER_FIRST_MS } = require('../src/proposalReminderLogic');

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

function testClaimDueFirstReminder() {
  const now = PROPOSED_AT + PROPOSAL_REMINDER_FIRST_MS;
  const plan = planReminderStateClaim(baseProposal(), 'bob', now, ROSTER, TODAY);
  assert.strictEqual(plan.send, true);
  assert.strictEqual(plan.reason, 'claim-planned');
  assert.strictEqual(plan.reminderNumber, 1);
  assert.strictEqual(plan.reminderState.bob.count, 1);
  assert.strictEqual(plan.reminderState.bob.lastSentBy, SENTINEL_SENDER);
  assert.strictEqual(plan.reminderState.bob.lastMode, 'backend-auto');
  assert.strictEqual(plan.reminderState.bob.policy, POLICY_TAG);
  assert.strictEqual(plan.reminderState.bob.history.length, 1);
  assert.strictEqual(plan.reminderState.bob.history[0].mode, 'backend-auto');
}

function testClaimAbortStale() {
  const now = PROPOSED_AT + PROPOSAL_REMINDER_FIRST_MS;
  const plan = planReminderStateClaim(baseProposal({ date: '2026-07-01' }), 'bob', now, ROSTER, TODAY);
  assert.strictEqual(plan.send, false);
  assert.strictEqual(plan.reason, 'stale');
}

function testClaimAbortAlreadyResponded() {
  const now = PROPOSED_AT + PROPOSAL_REMINDER_FIRST_MS;
  const plan = planReminderStateClaim(baseProposal({ responses: { alice: 'yes', bob: 'yes' } }), 'bob', now, ROSTER, TODAY);
  assert.strictEqual(plan.send, false);
  assert.strictEqual(plan.reason, 'already-responded');
}

function testClaimAbortNotDue() {
  const plan = planReminderStateClaim(baseProposal(), 'bob', PROPOSED_AT, ROSTER, TODAY);
  assert.strictEqual(plan.send, false);
  assert.strictEqual(plan.reason, 'not-due');
}

function testClaimAbortClosed() {
  const now = PROPOSED_AT + PROPOSAL_REMINDER_FIRST_MS;
  const plan = planReminderStateClaim(baseProposal({ status: 'cancelled' }), 'bob', now, ROSTER, TODAY);
  assert.strictEqual(plan.send, false);
  assert.strictEqual(plan.reason, 'closed');
}

function testClaimHistoryCap() {
  const history = [];
  for (let i = 1; i <= 21; i++) {
    history.push({ reminderNumber: i, sentAt: i });
  }
  const now = PROPOSED_AT + PROPOSAL_REMINDER_FIRST_MS;
  const plan = planReminderStateClaim(baseProposal({
    reminderState: { bob: { count: 21, lastSentAt: PROPOSED_AT, history: history } },
  }), 'bob', now + PROPOSAL_REMINDER_FIRST_MS, ROSTER, TODAY, { force: true });
  assert.strictEqual(plan.send, true);
  assert.strictEqual(plan.reminderState.bob.history.length, 20);
  assert.strictEqual(plan.reminderState.bob.history[0].reminderNumber, 3);
}

function run() {
  testClaimDueFirstReminder();
  testClaimAbortStale();
  testClaimAbortAlreadyResponded();
  testClaimAbortNotDue();
  testClaimAbortClosed();
  testClaimHistoryCap();
  console.log('PASS: reminder claim tests (6 cases)');
}

run();
