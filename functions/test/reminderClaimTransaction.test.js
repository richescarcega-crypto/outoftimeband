'use strict';

const assert = require('assert');
const { executeProposalReminderClaim } = require('../src/reminderClaimTransaction');
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
          updates.push({ ref: ref, data: data });
        },
      };
      return fn(tx);
    },
  };
  db.updates = updates;
  return db;
}

async function testClaimSuccessUpdatesReminderState() {
  const db = buildMockDb(baseProposalData());
  const now = PROPOSED_AT + PROPOSAL_REMINDER_FIRST_MS;
  const result = await executeProposalReminderClaim(db, 'prop-1', 'bob', {
    nowMs: now,
    rosterMemberIds: ROSTER,
    todayStr: TODAY,
    targetName: 'Bob',
  });
  assert.strictEqual(result.send, true);
  assert.strictEqual(result.reason, 'claimed');
  assert.strictEqual(result.reminderNumber, 1);
  assert.strictEqual(db.updates.length, 1);
  assert.strictEqual(db.updates[0].data.reminderState.bob.count, 1);
  assert.strictEqual(db.updates[0].data.reminderState.bob.lastSentTo, 'Bob');
}

async function testClaimAbortMissing() {
  const db = buildMockDb(baseProposalData(), { missing: true });
  const result = await executeProposalReminderClaim(db, 'prop-1', 'bob', {
    nowMs: PROPOSED_AT + PROPOSAL_REMINDER_FIRST_MS,
    rosterMemberIds: ROSTER,
    todayStr: TODAY,
  });
  assert.strictEqual(result.send, false);
  assert.strictEqual(result.reason, 'missing');
  assert.strictEqual(db.updates.length, 0);
}

async function testClaimAbortNotDueInsideTransaction() {
  const db = buildMockDb(baseProposalData());
  const result = await executeProposalReminderClaim(db, 'prop-1', 'bob', {
    nowMs: PROPOSED_AT,
    rosterMemberIds: ROSTER,
    todayStr: TODAY,
  });
  assert.strictEqual(result.send, false);
  assert.strictEqual(result.reason, 'not-due');
  assert.strictEqual(db.updates.length, 0);
}

async function testClaimTransactionError() {
  const db = {
    collection: function () {
      return { doc: function () { return {}; } };
    },
    runTransaction: async function () {
      throw new Error('contention');
    },
  };
  const result = await executeProposalReminderClaim(db, 'prop-1', 'bob', {
    nowMs: PROPOSED_AT + PROPOSAL_REMINDER_FIRST_MS,
    rosterMemberIds: ROSTER,
    todayStr: TODAY,
  });
  assert.strictEqual(result.send, false);
  assert.strictEqual(result.reason, 'transaction-error');
  assert.strictEqual(result.error, 'contention');
}

async function run() {
  await testClaimSuccessUpdatesReminderState();
  await testClaimAbortMissing();
  await testClaimAbortNotDueInsideTransaction();
  await testClaimTransactionError();
  console.log('PASS: reminder claim transaction tests (4 cases)');
}

run().catch(function (err) {
  console.error(err);
  process.exit(1);
});
