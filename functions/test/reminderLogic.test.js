'use strict';

const assert = require('assert');
const {
  formatTodayLocal,
  getExpectedResponderIds,
  getNonResponderIds,
  isProposalDateStale,
  getReminderDueInfo,
  getNextReminderNumber,
  PROPOSAL_REMINDER_FIRST_MS,
  PROPOSAL_REMINDER_REPEAT_MS,
} = require('../src/proposalReminderLogic');
const {
  collectDryRunCandidates,
  summarizeDryRunCandidates,
} = require('../src/proposalReminderSweepDryRun');

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

function testExpectedResponders() {
  const p = baseProposal({ expectedResponderIds: ['x', 'y'] });
  assert.deepStrictEqual(getExpectedResponderIds(p, ROSTER), ['x', 'y']);
  assert.deepStrictEqual(getExpectedResponderIds(baseProposal({ expectedResponderIds: [] }), ROSTER), ROSTER);
  assert.deepStrictEqual(getExpectedResponderIds(baseProposal({ expectedResponderIds: null }), ROSTER), ROSTER);
}

function testNonResponders() {
  const pending = getNonResponderIds(baseProposal(), ROSTER);
  assert.deepStrictEqual(pending.sort(), ['bob', 'carol']);
}

function testStaleDate() {
  assert.strictEqual(isProposalDateStale(baseProposal({ date: '2026-07-02' }), TODAY), true);
  assert.strictEqual(isProposalDateStale(baseProposal({ date: '2026-07-10' }), TODAY), false);
  assert.strictEqual(isProposalDateStale(baseProposal({ date: TODAY }), TODAY), false);
}

function testFirstReminderDue() {
  const p = baseProposal();
  const dueAt = PROPOSED_AT + PROPOSAL_REMINDER_FIRST_MS;
  const due = getReminderDueInfo(p, 'bob', dueAt, ROSTER, TODAY);
  assert.ok(due);
  assert.strictEqual(due.reminderNumber, 1);
  assert.strictEqual(due.dueAt, dueAt);
  assert.strictEqual(getNextReminderNumber(p, 'bob', dueAt - 1, ROSTER, TODAY), null);
  assert.strictEqual(getNextReminderNumber(p, 'bob', dueAt, ROSTER, TODAY), 1);
}

function testRepeatReminderDue() {
  const lastSentAt = PROPOSED_AT + PROPOSAL_REMINDER_FIRST_MS;
  const p = baseProposal({
    reminderState: {
      bob: { count: 1, lastSentAt: lastSentAt },
    },
  });
  const dueAt = lastSentAt + PROPOSAL_REMINDER_REPEAT_MS;
  const due = getReminderDueInfo(p, 'bob', dueAt, ROSTER, TODAY);
  assert.ok(due);
  assert.strictEqual(due.reminderNumber, 2);
  assert.strictEqual(due.priorCount, 1);
}

function testStopWhenResponded() {
  const p = baseProposal({ responses: { alice: 'yes', bob: 'yes', carol: 'yes' } });
  const now = PROPOSED_AT + PROPOSAL_REMINDER_FIRST_MS + 999;
  assert.strictEqual(getReminderDueInfo(p, 'bob', now, ROSTER, TODAY), null);
}

function testStopWhenClosed() {
  const p = baseProposal({ status: 'cancelled' });
  const now = PROPOSED_AT + PROPOSAL_REMINDER_FIRST_MS;
  assert.strictEqual(getReminderDueInfo(p, 'bob', now, ROSTER, TODAY), null);
}

function testDryRunCandidates() {
  const now = PROPOSED_AT + PROPOSAL_REMINDER_FIRST_MS;
  const proposals = [
    baseProposal(),
    baseProposal({ id: 'prop-2', status: 'cancelled' }),
    baseProposal({ id: 'prop-3', date: '2026-07-01' }),
  ];
  const candidates = collectDryRunCandidates(proposals, ROSTER, now, TODAY);
  assert.strictEqual(candidates.length, 2);
  assert.ok(candidates.every(function (c) { return c.mode === 'dry-run'; }));
  assert.ok(candidates.some(function (c) { return c.memberId === 'bob' && c.reminderNumber === 1; }));
  assert.ok(candidates.some(function (c) { return c.memberId === 'carol' && c.reminderNumber === 1; }));
  const summary = summarizeDryRunCandidates(candidates);
  assert.strictEqual(summary.candidateCount, 2);
  assert.strictEqual(summary.byProposal['prop-1'], 2);
}

function testFormatTodayLocal() {
  assert.strictEqual(formatTodayLocal(new Date('2026-07-03T15:00:00.000Z')), '2026-07-03');
}

function run() {
  testExpectedResponders();
  testNonResponders();
  testStaleDate();
  testFirstReminderDue();
  testRepeatReminderDue();
  testStopWhenResponded();
  testStopWhenClosed();
  testDryRunCandidates();
  testFormatTodayLocal();
  console.log('PASS: proposal reminder logic tests (' + 10 + ' cases)');
}

run();
