'use strict';

const assert = require('assert');
const {
  executeProposalReminderReserve,
  executeProposalReminderFinalize,
  executeProposalReminderRelease,
  executeProposalReminderClaim,
} = require('../src/reminderClaimTransaction');
const { PROPOSAL_REMINDER_FIRST_MS } = require('../src/proposalReminderLogic');

const ROSTER = ['alice', 'bob'];
const TODAY = '2026-07-03';
const PROPOSED_AT = Date.parse('2026-07-01T12:00:00.000Z');

function baseProposalData() {
  return {
    status: 'open',
    date: '2026-07-10',
    proposedAt: PROPOSED_AT,
    expectedResponderIds: ROSTER.slice(),
    responses: { alice: 'yes' },
    reminderState: {},
  };
}

function buildMockDb(proposalData, hooks) {
  hooks = hooks || {};
  const updates = [];
  const db = {
    collection: function (name) {
      return {
        doc: function (id) {
          return { collection: name, id: id };
        },
      };
    },
    runTransaction: async function (fn) {
      const tx = {
        get: async function () {
          if (hooks.missing) {
            return { exists: false };
          }
          return {
            exists: true,
            id: 'prop-1',
            data: function () {
              return proposalData;
            },
          };
        },
        update: function (ref, data) {
          if (data && data.reminderState) {
            proposalData.reminderState = data.reminderState;
          }
          updates.push({ ref: ref, data: data });
        },
      };
      return fn(tx);
    },
  };
  db.updates = updates;
  return db;
}

async function testReserveSuccessDoesNotFinalize() {
  const data = baseProposalData();
  const db = buildMockDb(data);
  const now = PROPOSED_AT + PROPOSAL_REMINDER_FIRST_MS;
  const result = await executeProposalReminderReserve(db, 'prop-1', 'bob', {
    nowMs: now,
    rosterMemberIds: ROSTER,
    todayStr: TODAY,
    targetName: 'Bob',
  });
  assert.strictEqual(result.send, true);
  assert.strictEqual(result.reason, 'reserved');
  assert.strictEqual(result.reminderNumber, 1);
  assert.strictEqual(db.updates.length, 1);
  assert.strictEqual(data.reminderState.bob.count, 0);
  assert.strictEqual(data.reminderState.bob.reservation.status, 'reserved');
}

async function testConcurrentReserveBlocked() {
  const data = baseProposalData();
  const db = buildMockDb(data);
  const now = PROPOSED_AT + PROPOSAL_REMINDER_FIRST_MS;
  const first = await executeProposalReminderReserve(db, 'prop-1', 'bob', {
    nowMs: now,
    rosterMemberIds: ROSTER,
    todayStr: TODAY,
  });
  assert.strictEqual(first.send, true);
  const second = await executeProposalReminderReserve(db, 'prop-1', 'bob', {
    nowMs: now + 10,
    rosterMemberIds: ROSTER,
    todayStr: TODAY,
  });
  assert.strictEqual(second.send, false);
  assert.strictEqual(second.reason, 'reserved');
  assert.strictEqual(data.reminderState.bob.count, 0);
}

async function testFinalizeAfterReserve() {
  const data = baseProposalData();
  const db = buildMockDb(data);
  const now = PROPOSED_AT + PROPOSAL_REMINDER_FIRST_MS;
  const reserved = await executeProposalReminderReserve(db, 'prop-1', 'bob', {
    nowMs: now,
    rosterMemberIds: ROSTER,
    todayStr: TODAY,
    targetName: 'Bob',
  });
  const finalized = await executeProposalReminderFinalize(db, 'prop-1', 'bob', {
    nowMs: now + 5,
    reminderNumber: reserved.reminderNumber,
    targetName: 'Bob',
  });
  assert.strictEqual(finalized.ok, true);
  assert.strictEqual(finalized.reason, 'finalized');
  assert.strictEqual(data.reminderState.bob.count, 1);
  assert.strictEqual(data.reminderState.bob.lastSentAt, now + 5);
  assert.strictEqual(data.reminderState.bob.reservation, undefined);
}

async function testReleaseAfterReserve() {
  const data = baseProposalData();
  const db = buildMockDb(data);
  const now = PROPOSED_AT + PROPOSAL_REMINDER_FIRST_MS;
  await executeProposalReminderReserve(db, 'prop-1', 'bob', {
    nowMs: now,
    rosterMemberIds: ROSTER,
    todayStr: TODAY,
  });
  const released = await executeProposalReminderRelease(db, 'prop-1', 'bob', {
    nowMs: now + 5,
    reminderNumber: 1,
    outcome: 'fetch-not-injected',
    reason: 'fetch-not-injected',
  });
  assert.strictEqual(released.ok, true);
  assert.strictEqual(data.reminderState.bob.count, 0);
  assert.strictEqual(data.reminderState.bob.lastSentAt, undefined);
  assert.strictEqual(data.reminderState.bob.reservation, undefined);
  assert.strictEqual(data.reminderState.bob.lastAttempt.outcome, 'fetch-not-injected');
}

async function testClaimAliasReservesOnly() {
  const data = baseProposalData();
  const db = buildMockDb(data);
  const now = PROPOSED_AT + PROPOSAL_REMINDER_FIRST_MS;
  const result = await executeProposalReminderClaim(db, 'prop-1', 'bob', {
    nowMs: now,
    rosterMemberIds: ROSTER,
    todayStr: TODAY,
  });
  assert.strictEqual(result.send, true);
  assert.strictEqual(data.reminderState.bob.count, 0);
  assert.ok(data.reminderState.bob.reservation);
}

async function testReserveAbortMissing() {
  const db = buildMockDb(baseProposalData(), { missing: true });
  const result = await executeProposalReminderReserve(db, 'prop-1', 'bob', {
    nowMs: PROPOSED_AT + PROPOSAL_REMINDER_FIRST_MS,
    rosterMemberIds: ROSTER,
    todayStr: TODAY,
  });
  assert.strictEqual(result.send, false);
  assert.strictEqual(result.reason, 'missing');
  assert.strictEqual(db.updates.length, 0);
}

async function testReserveAbortNotDueInsideTransaction() {
  const db = buildMockDb(baseProposalData());
  const result = await executeProposalReminderReserve(db, 'prop-1', 'bob', {
    nowMs: PROPOSED_AT,
    rosterMemberIds: ROSTER,
    todayStr: TODAY,
  });
  assert.strictEqual(result.send, false);
  assert.strictEqual(result.reason, 'not-due');
  assert.strictEqual(db.updates.length, 0);
}

async function testReserveTransactionError() {
  const db = {
    collection: function () {
      return { doc: function () { return {}; } };
    },
    runTransaction: async function () {
      throw new Error('contention');
    },
  };
  const result = await executeProposalReminderReserve(db, 'prop-1', 'bob', {
    nowMs: PROPOSED_AT + PROPOSAL_REMINDER_FIRST_MS,
    rosterMemberIds: ROSTER,
    todayStr: TODAY,
  });
  assert.strictEqual(result.send, false);
  assert.strictEqual(result.reason, 'transaction-error');
  assert.strictEqual(result.error, 'contention');
}

async function run() {
  await testReserveSuccessDoesNotFinalize();
  await testConcurrentReserveBlocked();
  await testFinalizeAfterReserve();
  await testReleaseAfterReserve();
  await testClaimAliasReservesOnly();
  await testReserveAbortMissing();
  await testReserveAbortNotDueInsideTransaction();
  await testReserveTransactionError();
  console.log('PASS: reminder claim transaction tests (8 cases)');
}

run().catch(function (err) {
  console.error(err);
  process.exit(1);
});
