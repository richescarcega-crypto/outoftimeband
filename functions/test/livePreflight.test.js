'use strict';

const assert = require('assert');
const { evaluateLiveEnablement } = require('../src/liveConfig');
const {
  runProposalReminderOrchestrator,
  runScheduledProposalReminderSweep,
  buildScheduledSweepOptions,
  resolveRuntimeFetchImpl,
} = require('../src/proposalReminderLiveSweep');
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

function liveEnvAllGates() {
  return {
    OOT_PROPOSAL_REMINDER_LIVE: '1',
    OOT_PUSH_WORKER_SECRET: 'test-secret-not-real',
    OOT_PROPOSAL_REMINDER_ALLOW_SEND: '1',
    OOT_PROPOSAL_REMINDER_ALLOW_FIRESTORE: '1',
    OOT_PROPOSAL_REMINDER_ALLOW_NETWORK: '1',
  };
}

function makeDueProposal() {
  return {
    id: 'prop-1',
    status: 'open',
    date: '2026-07-10',
    proposedAt: PROPOSED_AT,
    expectedResponderIds: ROSTER.slice(),
    responses: { alice: 'yes' },
    reminderState: {},
  };
}

function makeClaimMockDb(proposal) {
  return {
    collection: function (name) {
      return {
        doc: function (id) {
          return { collection: name, id: id };
        },
        where: function () {
          return {
            get: async function () {
              return {
                forEach: function (fn) {
                  fn({ id: 'prop-1', data: function () { return proposal; } });
                },
              };
            },
          };
        },
        get: async function () {
          return { forEach: function () {} };
        },
      };
    },
    runTransaction: async function (fn) {
      const tx = {
        get: async function () {
          return {
            exists: true,
            id: 'prop-1',
            data: function () { return proposal; },
          };
        },
        update: function (ref, data) {
          if (data && data.reminderState) {
            proposal.reminderState = data.reminderState;
          }
        },
      };
      return fn(tx);
    },
  };
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

async function testScheduledSweepDryRunUnchanged() {
  const result = await runScheduledProposalReminderSweep({ env: {} });
  assert.strictEqual(result.mode, 'dry-run');
  assert.strictEqual(result.live, false);
  assert.strictEqual(result.executed, undefined);
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
  const cfg = evaluateLiveEnablement(liveEnvAllGates());
  assert.strictEqual(cfg.mode, 'live-ready');
  assert.strictEqual(cfg.canUseAdmin, true);
  assert.strictEqual(cfg.canSendPush, true);
  assert.strictEqual(cfg.errors.length, 0);
  assert.strictEqual(cfg.warnings.length, 0);
}

function testLiveReadyClaimWithoutNetworkGate() {
  const cfg = evaluateLiveEnablement({
    OOT_PROPOSAL_REMINDER_LIVE: '1',
    OOT_PUSH_WORKER_SECRET: 'test-secret-not-real',
    OOT_PROPOSAL_REMINDER_ALLOW_SEND: '1',
    OOT_PROPOSAL_REMINDER_ALLOW_FIRESTORE: '1',
  });
  assert.strictEqual(cfg.mode, 'live-ready');
  assert.strictEqual(cfg.canUseAdmin, true);
  assert.strictEqual(cfg.canSendPush, false);
  assert.strictEqual(cfg.errors.length, 0);
  assert.ok(cfg.warnings.some(function (w) { return w.indexOf('ALLOW_NETWORK') >= 0; }));
}

function testScheduledOptionsSupplyFetchImpl() {
  const opts = buildScheduledSweepOptions({});
  assert.strictEqual(typeof opts.fetchImpl, 'function');
  assert.strictEqual(typeof resolveRuntimeFetchImpl(), 'function');
  const custom = async function () { return null; };
  assert.strictEqual(resolveRuntimeFetchImpl(custom), custom);
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
  const cfg = evaluateLiveEnablement(liveEnvAllGates());
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
  const cfg = evaluateLiveEnablement(liveEnvAllGates());
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

async function testOrchestratorReserveFinalizeOnSuccess() {
  const now = PROPOSED_AT + PROPOSAL_REMINDER_FIRST_MS;
  const proposal = makeDueProposal();
  let pushCalled = false;
  const mockDb = makeClaimMockDb(proposal);

  const result = await runProposalReminderOrchestrator({
    env: liveEnvAllGates(),
    firestore: mockDb,
    proposals: [proposal],
    rosterMemberIds: ROSTER,
    memberNamesById: { bob: 'Bob' },
    notifPrefsByMemberName: {},
    nowMs: now,
    todayStr: TODAY,
    writeNotifLog: false,
    fetchImpl: async function () {
      pushCalled = true;
      return { status: 200, text: async function () { return 'ok'; } };
    },
  });

  assert.strictEqual(result.mode, 'live-executed');
  assert.strictEqual(result.executed, true);
  assert.strictEqual(pushCalled, true);
  assert.strictEqual(result.results.length, 1);
  assert.strictEqual(result.results[0].reserve.send, true);
  assert.strictEqual(result.results[0].finalize.ok, true);
  assert.strictEqual(result.results[0].push.sent, true);
  assert.strictEqual(proposal.reminderState.bob.count, 1);
  assert.strictEqual(proposal.reminderState.bob.reservation, undefined);
}

async function testScheduledSweepAttemptsPushWithMockedFetch() {
  const now = PROPOSED_AT + PROPOSAL_REMINDER_FIRST_MS;
  const proposal = makeDueProposal();
  let pushCalled = false;
  const mockDb = makeClaimMockDb(proposal);

  const result = await runScheduledProposalReminderSweep({
    env: liveEnvAllGates(),
    firestore: mockDb,
    proposals: [proposal],
    rosterMemberIds: ROSTER,
    memberNamesById: { bob: 'Bob' },
    notifPrefsByMemberName: {},
    nowMs: now,
    todayStr: TODAY,
    writeNotifLog: false,
    fetchImpl: async function () {
      pushCalled = true;
      return { status: 200, text: async function () { return 'ok'; } };
    },
  });

  assert.strictEqual(result.mode, 'live-executed');
  assert.strictEqual(pushCalled, true);
  assert.strictEqual(result.results[0].push.sent, true);
  assert.strictEqual(proposal.reminderState.bob.count, 1);
}

async function testScheduledSweepWithoutFetchReleasesReservation() {
  const now = PROPOSED_AT + PROPOSAL_REMINDER_FIRST_MS;
  const proposal = makeDueProposal();
  const mockDb = makeClaimMockDb(proposal);

  const result = await runScheduledProposalReminderSweep({
    env: liveEnvAllGates(),
    firestore: mockDb,
    proposals: [proposal],
    rosterMemberIds: ROSTER,
    memberNamesById: { bob: 'Bob' },
    notifPrefsByMemberName: {},
    nowMs: now,
    todayStr: TODAY,
    writeNotifLog: false,
    fetchImpl: undefined,
  });

  assert.strictEqual(result.mode, 'live-executed');
  assert.strictEqual(result.executed, true);
  assert.strictEqual(result.results[0].reserve.send, true);
  assert.strictEqual(result.results[0].push.sent, false);
  assert.strictEqual(result.results[0].push.reason, 'fetch-not-injected');
  assert.strictEqual(result.results[0].release.ok, true);
  assert.strictEqual(proposal.reminderState.bob.count, 0);
  assert.strictEqual(proposal.reminderState.bob.lastSentAt, undefined);
  assert.strictEqual(proposal.reminderState.bob.reservation, undefined);
  assert.strictEqual(proposal.reminderState.bob.lastAttempt.outcome, 'fetch-not-injected');
}

async function testOrchestratorSkipsWhenNotDue() {
  const proposal = makeDueProposal();
  let pushCalled = false;
  const mockDb = makeClaimMockDb(proposal);

  const result = await runProposalReminderOrchestrator({
    env: liveEnvAllGates(),
    firestore: mockDb,
    proposals: [proposal],
    rosterMemberIds: ROSTER,
    memberNamesById: { bob: 'Bob' },
    candidates: [{
      propId: 'prop-1',
      memberId: 'bob',
      reminderNumber: 1,
      dueAt: PROPOSED_AT,
      mode: 'dry-run',
    }],
    nowMs: PROPOSED_AT,
    todayStr: TODAY,
    writeNotifLog: false,
    fetchImpl: async function () {
      pushCalled = true;
      return { status: 200, text: async function () { return 'ok'; } };
    },
  });

  assert.strictEqual(result.executed, true);
  assert.strictEqual(pushCalled, false);
  assert.strictEqual(result.results[0].reserve.send, false);
  assert.strictEqual(result.results[0].reserve.reason, 'not-due');
}

async function testNetworkGateOffReleasesWithoutBurningWindow() {
  const now = PROPOSED_AT + PROPOSAL_REMINDER_FIRST_MS;
  const proposal = makeDueProposal();
  const mockDb = makeClaimMockDb(proposal);

  const result = await runProposalReminderOrchestrator({
    env: {
      OOT_PROPOSAL_REMINDER_LIVE: '1',
      OOT_PUSH_WORKER_SECRET: 'test-secret-not-real',
      OOT_PROPOSAL_REMINDER_ALLOW_SEND: '1',
      OOT_PROPOSAL_REMINDER_ALLOW_FIRESTORE: '1',
    },
    firestore: mockDb,
    proposals: [proposal],
    rosterMemberIds: ROSTER,
    memberNamesById: { bob: 'Bob' },
    nowMs: now,
    todayStr: TODAY,
    writeNotifLog: false,
  });

  assert.strictEqual(result.mode, 'live-claim-executed');
  assert.strictEqual(result.executed, true);
  assert.strictEqual(result.results[0].reserve.send, true);
  assert.strictEqual(result.results[0].push.reason, 'push-blocked-preflight');
  assert.strictEqual(result.results[0].release.ok, true);
  assert.strictEqual(proposal.reminderState.bob.count, 0);
  assert.strictEqual(proposal.reminderState.bob.lastSentAt, undefined);
  assert.strictEqual(proposal.reminderState.bob.reservation, undefined);
}

async function testOptOutReleasesWithoutBurningWindow() {
  const now = PROPOSED_AT + PROPOSAL_REMINDER_FIRST_MS;
  const proposal = makeDueProposal();
  const mockDb = makeClaimMockDb(proposal);
  let pushCalled = false;

  const result = await runProposalReminderOrchestrator({
    env: liveEnvAllGates(),
    firestore: mockDb,
    proposals: [proposal],
    rosterMemberIds: ROSTER,
    memberNamesById: { bob: 'Bob' },
    notifPrefsByMemberName: { Bob: { 'rehearsal-proposal': false } },
    nowMs: now,
    todayStr: TODAY,
    writeNotifLog: false,
    fetchImpl: async function () {
      pushCalled = true;
      return { status: 200, text: async function () { return 'ok'; } };
    },
  });

  assert.strictEqual(pushCalled, false);
  assert.strictEqual(result.results[0].push.reason, 'recipient-opted-out');
  assert.strictEqual(result.results[0].release.ok, true);
  assert.strictEqual(proposal.reminderState.bob.count, 0);
  assert.strictEqual(proposal.reminderState.bob.lastAttempt.outcome, 'opted-out');
}

async function testHttpFailureReleasesReservation() {
  const now = PROPOSED_AT + PROPOSAL_REMINDER_FIRST_MS;
  const proposal = makeDueProposal();
  const mockDb = makeClaimMockDb(proposal);

  const result = await runProposalReminderOrchestrator({
    env: liveEnvAllGates(),
    firestore: mockDb,
    proposals: [proposal],
    rosterMemberIds: ROSTER,
    memberNamesById: { bob: 'Bob' },
    notifPrefsByMemberName: {},
    nowMs: now,
    todayStr: TODAY,
    writeNotifLog: false,
    fetchImpl: async function () {
      return { status: 500, text: async function () { return 'fail'; } };
    },
  });

  assert.strictEqual(result.results[0].push.sent, false);
  assert.strictEqual(result.results[0].push.reason, 'push-failed');
  assert.strictEqual(result.results[0].release.ok, true);
  assert.strictEqual(proposal.reminderState.bob.count, 0);
  assert.strictEqual(proposal.reminderState.bob.lastSentAt, undefined);
}

async function run() {
  testDryRunIsDefault();
  await testOrchestratorDryRunDefault();
  await testScheduledSweepDryRunUnchanged();
  testLiveBlockedWithoutSecrets();
  testLiveBlockedWithoutFirestoreAndNetwork();
  testLiveReadyWhenAllGatesSet();
  testLiveReadyClaimWithoutNetworkGate();
  testScheduledOptionsSupplyFetchImpl();
  testDeterministicIdempotency();
  await testPushBlockedWithoutCanSendPush();
  await testPushBlockedWithoutFetchImplEvenWhenLive();
  await testPushUsesInjectedFetchOnlyInTestHarness();
  testPushPayloadShape();
  await testOrchestratorLiveReadyWithoutSideEffectsWhenFirestoreGateOff();
  await testOrchestratorReserveFinalizeOnSuccess();
  await testScheduledSweepAttemptsPushWithMockedFetch();
  await testScheduledSweepWithoutFetchReleasesReservation();
  await testOrchestratorSkipsWhenNotDue();
  await testNetworkGateOffReleasesWithoutBurningWindow();
  await testOptOutReleasesWithoutBurningWindow();
  await testHttpFailureReleasesReservation();
  console.log('PASS: live preflight tests (21 cases)');
}

run().catch(function (err) {
  console.error(err);
  process.exit(1);
});
