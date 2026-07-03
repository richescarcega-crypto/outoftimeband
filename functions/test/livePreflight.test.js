'use strict';

const assert = require('assert');
const { evaluateLiveEnablement } = require('../src/liveConfig');
const { runProposalReminderOrchestrator } = require('../src/proposalReminderLiveSweep');
const {
  buildProposalReminderNotificationId,
  buildDeterministicIdempotencyUuid,
  buildProposalReminderIdempotency,
} = require('../src/reminderIdempotency');
const { buildProposalReminderPushPayload, sendProposalReminderPush } = require('../src/pushClient');
const { PROPOSAL_REMINDER_FIRST_MS } = require('../src/proposalReminderLogic');

const PROPOSED_AT = Date.parse('2026-07-01T12:00:00.000Z');
const TODAY = '2026-07-03';
const ROSTER = ['alice', 'bob'];

function baseEnv(overrides) {
  return Object.assign({}, overrides || {});
}

function testDryRunIsDefault() {
  const cfg = evaluateLiveEnablement({});
  assert.strictEqual(cfg.mode, 'dry-run');
  assert.strictEqual(cfg.canUseAdmin, false);
  assert.strictEqual(cfg.canSendPush, false);
}

async function testOrchestratorDryRunDefault() {
  const result = await runProposalReminderOrchestrator({ env: {} });
  assert.strictEqual(result.mode, 'dry-run');
  assert.strictEqual(result.live, false);
}

function testLiveBlockedWithoutSecrets() {
  const cfg = evaluateLiveEnablement({ OOT_PROPOSAL_REMINDER_LIVE: '1' });
  assert.strictEqual(cfg.mode, 'live-blocked');
  assert.ok(cfg.errors.some(function (e) { return e.indexOf('OOT_PUSH_WORKER_SECRET') >= 0; }));
  assert.ok(cfg.errors.some(function (e) { return e.indexOf('ALLOW_SEND') >= 0; }));
  assert.strictEqual(cfg.canSendPush, false);
}

function testLiveBlockedWithoutFirestoreAndNetwork() {
  const cfg = evaluateLiveEnablement({
    OOT_PROPOSAL_REMINDER_LIVE: '1',
    OOT_PUSH_WORKER_SECRET: 'test-secret-not-real',
    OOT_PROPOSAL_REMINDER_ALLOW_SEND: '1',
  });
  assert.strictEqual(cfg.mode, 'live-blocked');
  assert.ok(cfg.errors.some(function (e) { return e.indexOf('ALLOW_FIRESTORE') >= 0; }));
  assert.strictEqual(cfg.canUseAdmin, false);
  assert.strictEqual(cfg.canSendPush, false);
}

function testLiveReadyWhenAllGatesSet() {
  const cfg = evaluateLiveEnablement({
    OOT_PROPOSAL_REMINDER_LIVE: '1',
    OOT_PUSH_WORKER_SECRET: 'test-secret-not-real',
    OOT_PROPOSAL_REMINDER_ALLOW_SEND: '1',
    OOT_PROPOSAL_REMINDER_ALLOW_FIRESTORE: '1',
    OOT_PROPOSAL_REMINDER_ALLOW_NETWORK: '1',
  });
  assert.strictEqual(cfg.mode, 'live-ready');
  assert.strictEqual(cfg.canUseAdmin, true);
  assert.strictEqual(cfg.canSendPush, true);
  assert.strictEqual(cfg.errors.length, 0);
}

function testDeterministicIdempotency() {
  const id = buildProposalReminderNotificationId('prop-1', 'bob', 2);
  assert.strictEqual(id, 'oot-proposal-reminder-prop-1-bob-r2');
  const a = buildDeterministicIdempotencyUuid(id);
  const b = buildDeterministicIdempotencyUuid(id);
  assert.strictEqual(a, b);
  assert.match(a, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  const bundle = buildProposalReminderIdempotency('prop-1', 'bob', 2);
  assert.strictEqual(bundle.notificationId, id);
  assert.strictEqual(bundle.idempotencyUuid, a);
}

async function testPushBlockedWithoutCanSendPush() {
  const cfg = evaluateLiveEnablement({});
  const result = await sendProposalReminderPush({
    config: cfg,
    proposal: { id: 'p1', date: '2026-07-10' },
    targetMemberId: 'bob',
    reminderNumber: 1,
    pushSecret: 'secret',
    fetchImpl: async function () { throw new Error('should not fetch'); },
  });
  assert.strictEqual(result.sent, false);
  assert.strictEqual(result.reason, 'push-blocked-preflight');
}

async function testPushBlockedWithoutFetchImplEvenWhenLive() {
  const cfg = evaluateLiveEnablement({
    OOT_PROPOSAL_REMINDER_LIVE: '1',
    OOT_PUSH_WORKER_SECRET: 'test-secret-not-real',
    OOT_PROPOSAL_REMINDER_ALLOW_SEND: '1',
    OOT_PROPOSAL_REMINDER_ALLOW_FIRESTORE: '1',
    OOT_PROPOSAL_REMINDER_ALLOW_NETWORK: '1',
  });
  const result = await sendProposalReminderPush({
    config: cfg,
    proposal: { id: 'p1', date: '2026-07-10' },
    targetMemberId: 'bob',
    reminderNumber: 1,
    pushSecret: 'test-secret-not-real',
  });
  assert.strictEqual(result.sent, false);
  assert.strictEqual(result.reason, 'fetch-not-injected');
}

async function testPushUsesInjectedFetchOnlyInTestHarness() {
  const cfg = evaluateLiveEnablement({
    OOT_PROPOSAL_REMINDER_LIVE: '1',
    OOT_PUSH_WORKER_SECRET: 'test-secret-not-real',
    OOT_PROPOSAL_REMINDER_ALLOW_SEND: '1',
    OOT_PROPOSAL_REMINDER_ALLOW_FIRESTORE: '1',
    OOT_PROPOSAL_REMINDER_ALLOW_NETWORK: '1',
  });
  let called = false;
  const result = await sendProposalReminderPush({
    config: cfg,
    proposal: { id: 'p1', date: '2026-07-10', startTime: '7pm' },
    targetMemberId: 'bob',
    reminderNumber: 1,
    pushSecret: 'test-secret-not-real',
    fetchImpl: async function (url, init) {
      called = true;
      assert.ok(String(url).indexOf('workers.dev') >= 0);
      assert.strictEqual(init.headers.Authorization, 'Bearer test-secret-not-real');
      const body = JSON.parse(init.body);
      assert.strictEqual(body.targetExternalIds[0], 'bob');
      assert.ok(body.notificationId.indexOf('oot-proposal-reminder-p1-bob-r1') === 0);
      return { status: 200, text: async function () { return 'ok'; } };
    },
  });
  assert.strictEqual(called, true);
  assert.strictEqual(result.sent, true);
}

function testPushPayloadShape() {
  const payload = buildProposalReminderPushPayload(
    { id: 'p1', date: '2026-07-10', location: 'Studio' },
    'bob',
    2
  );
  assert.strictEqual(payload.title, 'Rehearsal proposal waiting for your response');
  assert.ok(payload.message.indexOf('Reminder #2') >= 0);
  assert.strictEqual(payload.data.ootCategory, 'rehearsal-proposal');
}

async function testOrchestratorLiveReadyWithoutSideEffectsWhenFirestoreGateOff() {
  const result = await runProposalReminderOrchestrator({
    env: {
      OOT_PROPOSAL_REMINDER_LIVE: '1',
      OOT_PUSH_WORKER_SECRET: 'test-secret-not-real',
      OOT_PROPOSAL_REMINDER_ALLOW_SEND: '1',
    },
  });
  assert.strictEqual(result.mode, 'live-blocked');
  assert.strictEqual(result.executed, false);
}

async function run() {
  testDryRunIsDefault();
  await testOrchestratorDryRunDefault();
  testLiveBlockedWithoutSecrets();
  testLiveBlockedWithoutFirestoreAndNetwork();
  testLiveReadyWhenAllGatesSet();
  testDeterministicIdempotency();
  await testPushBlockedWithoutCanSendPush();
  await testPushBlockedWithoutFetchImplEvenWhenLive();
  await testPushUsesInjectedFetchOnlyInTestHarness();
  testPushPayloadShape();
  await testOrchestratorLiveReadyWithoutSideEffectsWhenFirestoreGateOff();
  console.log('PASS: live preflight tests (11 cases)');
}

run().catch(function (err) {
  console.error(err);
  process.exit(1);
});
