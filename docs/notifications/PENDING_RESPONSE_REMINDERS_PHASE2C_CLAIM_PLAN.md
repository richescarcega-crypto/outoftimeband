# Pending Response Reminders — Phase 2c Firestore Transaction Claim Plan

## Status

**Planning / inspection only.** No runtime behavior changed. No deploy. No push. No production Firestore writes.

Companion docs: `PENDING_RESPONSE_REMINDERS_ARCHITECTURE_CHECKPOINT.md`, `PENDING_RESPONSE_REMINDERS_BACKEND_PHASE2_PLAN.md`, `PENDING_RESPONSE_REMINDERS_PHASE2B_PREFLIGHT.md`.

| Item | Value |
|------|--------|
| Branch | `feature/pending-response-reminders-claim-plan` |
| Baseline | `main` @ `6b36a56` (Phase 2b preflight merged) |
| Slice goal | Document the **exact safest** backend claim-before-send path for the next implementation slice |

---

## Executive Summary

Phase 2b added a live-capable orchestrator (`proposalReminderLiveSweep.js`) that **discovers due candidates correctly** but, when all env gates pass, **sends push without a Firestore transaction claim**. That violates the client dedupe contract and can duplicate reminders under race or retry conditions.

**Phase 2c implementation** must insert a single-document Admin SDK transaction on `proposals/{propId}` **before** any push HTTP call, mirroring `_claimAndSendProposalReminder` in `index.html` (~27344–27400). Pure claim planning already exists in `reminderClaim.js` (`planReminderStateClaim`); the missing piece is an executable transaction wrapper and orchestrator loop refactor.

**Testing without credentials:** Pure claim/due logic and injectable transaction mocks can be unit-tested in-repo. Full Admin SDK integration tests require the **Firebase Emulator** or a staging project with credentials — not required to land the implementation, but recommended before production enablement.

---

## Phase 2b Gap (Current Code)

```133:156:functions/src/proposalReminderLiveSweep.js
  for (let i = 0; i < candidates.length; i++) {
    const c = candidates[i];
    const proposal = proposals.find(function (p) { return String(p.id) === String(c.propId); });
    const pushResult = await sendProposalReminderPush({
      config: config,
      proposal: proposal,
      targetMemberId: c.memberId,
      reminderNumber: c.reminderNumber,
      ...
    });
    ...
  }
```

Problems with this loop:

| Issue | Risk |
|-------|------|
| Uses pre-sweep `reminderNumber` from dry-run candidate list | Stale if another client/backend claim ran between query and push |
| No `reminderState` write before push | Duplicate pushes; ledger drift from client |
| Push may run when `ALLOW_FIRESTORE=0` path is mixed | Preflight gates separate Firestore vs network; push-only path must not exist in production |

**Correct order (client precedent):** transaction claim → (optional prefs gate) → push → `notiflog`.

---

## Client Precedent (Reference Only — Do Not Edit)

Location: `index.html` ~27310–27400.

### Due check (`_proposalReminderDueInfo`)

Same algorithm as `getReminderDueInfo` in `proposalReminderLogic.js` (already ported).

### Claim transaction (`_claimAndSendProposalReminder`)

1. `ref = db.collection('proposals').doc(propId)`
2. `db.runTransaction(tx => tx.get(ref).then(...))`
3. Inside transaction, on fresh doc:
   - Abort `missing` if `!doc.exists`
   - Abort `closed` if `status !== 'open'`
   - Abort `stale` if `_proposalDateIsStale(fresh)`
   - Abort `already-responded` if target not in `_proposalNonResponderIds(fresh)`
   - Abort `not-due` if `!_proposalReminderDueInfo(...)` and `!opts.force`
   - Compute `reminderNumber` from due info or `prior.count + 1` when forced
   - Build `reminderState[memberId]` + capped `history[]` (20 entries)
   - `tx.update(ref, { reminderState: stateRoot })`
   - Return `{ send: true, reminderNumber }`
4. **After** transaction resolves with `send: true`: `_sendProposalReminderAfterClaim` → `notifyBand(...)`

### Backend sentinel differences (already in `reminderClaim.js`)

| Field | Client | Backend |
|-------|--------|---------|
| `sentBy` / `lastSentBy` | `ME` | `'backend-scheduler'` (`SENTINEL_SENDER`) |
| `lastMode` / history `mode` | `'auto'` \| `'manual'` | `'backend-auto'` \| `'manual'` (force only; scheduled sweep never uses force) |
| `policy` | `'24h-then-10h-r114'` | same (`POLICY_TAG`) |

Scheduled backend sweep **does not** replicate `force: true` (`sendProposalRemindersNow` remains client-only).

---

## Firestore Document Path and Query Strategy

### Collection / document

| Item | Value |
|------|--------|
| Collection | `proposals` |
| Claim target | **Single doc** `proposals/{propId}` per candidate |
| Update field | Top-level `reminderState` map (full map replace via `tx.update`, same as client) |
| Member key | `reminderState[String(targetMemberId)]` |

### Sweep query (unchanged — pre-filter only)

```javascript
db.collection('proposals').where('status', '==', 'open').get()
```

Implemented in `loadOpenProposals`. This query is a **hint** for orchestration; it is **not** authoritative for send eligibility.

### Candidate discovery (unchanged — pre-filter only)

`collectDryRunCandidates(proposals, rosterMemberIds, nowMs, todayStr)` in `proposalReminderSweepDryRun.js`:

- For each open, non-stale proposal
- For each non-responder
- If `getReminderDueInfo(...) !== null` → add `{ propId, memberId, reminderNumber, dueAt, ... }`

Also load once per sweep:

```javascript
db.collection('members').get()   // roster ids + names for history / prefs
db.collection('notifprefs').get() // optional but recommended for push parity
```

**Important:** Dry-run candidates must be treated as **work queue hints**. The transaction re-derives due status from the latest document snapshot.

### Why not query by due time?

Due time is computed from `proposedAt`, `reminderState[memberId].lastSentAt`, and policy constants — not indexed Firestore fields. Client uses the same full-scan pattern. Acceptable at current band scale.

---

## Transaction Read / Update Sequence (Target Design)

New module (proposed): `functions/src/reminderClaimTransaction.js`

### Public API

```javascript
async function executeProposalReminderClaim(db, propId, targetMemberId, options)
```

`options`: `{ nowMs, rosterMemberIds, todayStr, targetName, force }` — injectable for tests.

### Sequence

```
executeProposalReminderClaim
  └─ db.runTransaction(async (tx) => {
       1. snap = await tx.get(proposals/{propId})
       2. if !snap.exists → return { send: false, reason: 'missing' }
       3. fresh = { ...snap.data(), id: snap.id }
       4. explicit guards (mirror client order):
            - closed      → status present and !== 'open'
            - stale       → isProposalDateStale(fresh, todayStr)
            - already-responded → target not in getNonResponderIds(fresh, roster)
       5. plan = planReminderStateClaim(fresh, targetMemberId, nowMs, roster, todayStr, { force, targetName })
            - if !plan.send → return { send: false, reason: plan.reason }
       6. tx.update(ref, { reminderState: plan.reminderState })
       7. return { send: true, reason: 'claimed', reminderNumber: plan.reminderNumber, reminderState: plan.reminderState }
     })
```

Use `planReminderStateClaim` for the update shape — do not duplicate history/count logic in the transaction module.

### Enhance `planReminderStateClaim` (small, safe, next slice)

Today `planReminderStateClaim` collapses stale / already-responded / not-due into `reason: 'not-due'`. For operability, add **explicit early returns** matching the client before calling `getReminderDueInfo`:

| Check | Reason code |
|-------|-------------|
| `isProposalDateStale` | `'stale'` |
| Target not in non-responders | `'already-responded'` |
| `!due && !force` | `'not-due'` |

This is a **pure helper change** — testable without emulator.

---

## Re-Check Due Status Inside the Transaction

Authoritative due check: `getReminderDueInfo(fresh, targetMemberId, nowMs, rosterMemberIds, todayStr)` inside `planReminderStateClaim` (after explicit stale/responder guards).

Inputs must use **transaction-fresh** `fresh.reminderState`, not the pre-sweep proposal snapshot.

### Concurrent claim behavior

| Scenario | Transaction outcome |
|----------|---------------------|
| Client claims first | Backend tx reads incremented `count` / `lastSentAt`; likely `not-due` → no push |
| Backend claims first | Client tx reads updated state; likely `not-due` → no push |
| Two backends (misconfig) | Firestore serializes transactions; second sees updated state → `not-due` unless truly due again |

Firestore transaction retries handle write contention automatically (Admin SDK default).

---

## `reminderState` Member Path and Update Shape

Path: `reminderState.{memberId}` on `proposals/{propId}`.

Committed shape (from `planReminderStateClaim`):

```javascript
{
  count: reminderNumber,           // 1-based sequence for this member
  lastSentAt: nowMs,
  lastSentAtIso: new Date(nowMs).toISOString(),
  lastSentBy: 'backend-scheduler',
  lastSentTo: targetName,            // member display name or id fallback
  lastMode: 'backend-auto',          // 'manual' only if force (not used in scheduler)
  policy: '24h-then-10h-r114',
  history: [                         // capped to last 20 entries
    {
      reminderNumber, sentAt, sentAtIso,
      sentBy: 'backend-scheduler',
      sentTo: targetName,
      memberId: String(targetMemberId),
      mode: 'backend-auto',
      dueWindowHours: reminderNumber === 1 ? 24 : 10,
      responseWindowHours: 10,
      policy: '24h-then-10h-r114',
    },
    ...
  ],
}
```

Update op: `tx.update(ref, { reminderState: stateRoot })` where `stateRoot` is a shallow copy of the existing map with one member entry replaced — **same as client**.

---

## Idempotency Key Generation Timing

**Generate only after a successful claim**, using the **committed** `reminderNumber` from the transaction result — not the dry-run candidate's `reminderNumber`.

```javascript
// AFTER executeProposalReminderClaim returns send: true
const idem = buildProposalReminderIdempotency(propId, targetMemberId, claimResult.reminderNumber);
// Used inside buildProposalReminderPushPayload → notificationId + idempotencyUuid
```

Rationale:

| Timing | Problem |
|--------|---------|
| Before claim | Key may not match actual `reminderNumber` if tx aborts or number shifts |
| After claim | Aligns push payload with Firestore ledger; matches Phase 3 deterministic idempotency plan |

Client today does **not** pass deterministic idempotency for proposal reminders; backend preflight already prepares UUID-shaped keys in `reminderIdempotency.js` for worker Phase 3.

---

## Abort Cases (No Push, No `reminderState` Change)

| Reason | Condition | Orchestrator action |
|--------|-----------|---------------------|
| `missing` | Doc deleted / wrong id | Log skip; continue loop |
| `closed` | `status !== 'open'` | Log skip |
| `stale` | Rehearsal `date` < today (local) | Log skip |
| `already-responded` | Target has `responses[targetMemberId]` | Log skip |
| `not-due` | `now < dueAt` or concurrent claim advanced state | Log skip (expected under race) |
| `missing-id` | Malformed input | Log skip |
| Transaction failure | Contention / SDK error after retries | Log error; continue loop (do not push) |

**All responded:** Handled implicitly — no non-responders → sweep produces zero candidates.

**Closed / cancelled / confirmed:** Filtered by open query + transaction `closed` guard.

---

## Logging: Before and After Push

### Structured sweep logging (extend orchestrator return + `console.log` in `index.js`)

Per candidate, append to `results[]`:

```javascript
{
  propId, memberId,
  claim: { send, reason, reminderNumber? },
  prefs: { pushAllowed, reason? },      // if opted out
  push: { sent, reason, httpStatus?, ... },
  notiflog: { ok, reason? },
}
```

### Console (scheduler handler)

Log claim aborts at `info`/`debug` level; log errors at `warn`. Avoid logging secrets or full push response bodies (already truncated in `pushClient.js`).

### `notiflog` writes

| Event | When | `result` field |
|-------|------|----------------|
| Push sent | After successful HTTP 2xx | `'sent'` |
| Push blocked (gates / no fetchImpl) | After claim **or** skip push path | `'push-blocked-preflight'`, `'fetch-not-injected'`, etc. |
| Recipient opted out | After claim, prefs check fails | `'recipient-opted-out'` (match client) |
| Push HTTP failure | After claim | `'push-failed'` / `'push-error'` |

**Client parity note:** Client updates `reminderState` in the transaction **before** `notifyBand` prefs check. If opted out, push is skipped but **claim persists**. Backend must match: **claim first**, then prefs gate, then push.

Use `buildProposalReminderNotifLogEntry` / `writeNotifLogEntry` from `notifLog.js`. Extend meta to include `claimReason` in `note` when useful for audit.

---

## Retry and Error Handling

### Firestore transaction

| Case | Handling |
|------|----------|
| Automatic retries (contention) | Rely on Admin SDK / Firestore defaults |
| Final transaction failure | Catch; `{ send: false, reason: 'transaction-error', error: message }`; **no push**; continue sweep |
| Claim abort (`not-due`, etc.) | Normal; not an error |

### Push after successful claim

| Case | Handling |
|------|----------|
| HTTP non-2xx / network error | Log failure in `notiflog`; **do not roll back** `reminderState` (matches client: claim is durable) |
| Missing `fetchImpl` in production | Should not happen once deploy wires global fetch; until then preflight returns `fetch-not-injected` |

**Operational implication:** A failed push after claim may require manual resend or waiting until next due window (10h). Same as client behavior today. Phase 3 worker idempotency reduces duplicate delivery if a retry is attempted with the same `reminderNumber`.

### `notiflog` write failure

Log warning; do not retry push. Claim and push outcomes stand.

### Sweep-level

One candidate failure must not abort the entire sweep — continue `for` loop.

---

## Orchestrator Refactor (Next Slice)

Replace push-only loop in `runProposalReminderOrchestrator` with:

```
for each candidate c:
  1. claimResult = await executeProposalReminderClaim(db, c.propId, c.memberId, { nowMs, rosterMemberIds, todayStr, targetName })
  2. if !claimResult.send → push to results as claim-only skip; continue
  3. if !config.canSendPush → optional notiflog 'blocked'; continue
  4. if recipient opted out (notifprefs) → notiflog 'recipient-opted-out'; continue (claim already committed)
  5. pushResult = await sendProposalReminderPush({ reminderNumber: claimResult.reminderNumber, ... })
  6. await writeNotifLogEntry(db, buildProposalReminderNotifLogEntry(pushResult, { ... }))
```

### Gate interaction

| Gate | Behavior |
|------|----------|
| `ALLOW_FIRESTORE=1`, `ALLOW_NETWORK=0` | Run claim + notiflog for blocked push if desired; **must not** call push worker |
| `ALLOW_FIRESTORE=0` | No Admin SDK — current early return; no claim, no push |
| All gates on + production fetch wired | Full claim → push → log |

---

## Exact File Changes (Next Implementation Slice)

| File | Change |
|------|--------|
| **NEW** `functions/src/reminderClaimTransaction.js` | `executeProposalReminderClaim` — Admin SDK `runTransaction` wrapper; injectable `runTransaction` for unit tests |
| `functions/src/reminderClaim.js` | Add explicit `stale` / `already-responded` reasons before `not-due` |
| `functions/src/proposalReminderLiveSweep.js` | Replace push-only loop with claim → prefs → push → notiflog; add `loadNotifPrefs` / member name map helpers |
| `functions/src/notifLog.js` | Optional: `buildClaimSkippedNotifLogEntry` or enrich `note` with claim context |
| **NEW** `functions/test/reminderClaim.test.js` | Pure tests for `planReminderStateClaim` (due, stale, responded, concurrent count) |
| **NEW** `functions/test/reminderClaimTransaction.test.js` | Mock `db.runTransaction` + `tx.get` to verify update shape and abort paths **without emulator** |
| `functions/test/livePreflight.test.js` | Assert orchestrator calls claim before push when mock db provided; assert no push when claim returns `not-due` |
| `docs/notifications/PENDING_RESPONSE_REMINDERS_PHASE2D_*` (optional) | Staging validation checklist after implementation |

**Do not change:** `index.html`, `firebase.json` deploy, env secrets, Cloudflare worker, Firestore rules (unless separate rules doc slice).

### Production fetch wiring (separate deploy slice)

`pushClient.js` intentionally requires injected `fetchImpl`. Deploy slice must pass `fetchImpl: global fetch` (or node fetch) from orchestrator only when `canSendPush` — still not part of Phase 2c planning.

---

## Testing Strategy

### Without emulator or credentials (required for CI)

| Layer | Approach |
|-------|----------|
| Due policy | Existing `reminderLogic.test.js` |
| Claim plan | New `reminderClaim.test.js` on `planReminderStateClaim` |
| Transaction executor | Mock `db.runTransaction`, fake `tx.get` returning doc snapshots |
| Orchestrator | Inject mock `firestore`, mock `fetchImpl`; assert ordering claim → push |
| Gates | Existing `livePreflight.test.js` |

### With Firebase Emulator (recommended before staging)

| Test | Purpose |
|------|---------|
| Seed open proposal + run claim | Verify `reminderState` write |
| Parallel claim attempts | Verify single increment |
| Claim then due again after 10h (simulated `nowMs`) | Verify second reminder number |

### Cannot safely do in this planning slice

- Production Firestore reads/writes
- Real push worker HTTP
- End-to-end scheduler without deploy approval

---

## Race Matrix: Client vs Backend

| Event | Outcome |
|-------|---------|
| Both due; client claims first | Backend tx → `not-due`; no duplicate ledger increment |
| Both due; backend claims first | Client tx → `not-due` |
| Backend push fails after claim | Ledger shows send; member may not get push until next due cycle or manual client send |
| Dry-run candidate list stale | Transaction prevents incorrect send |

Worker-level duplicate delivery (same reminderNumber) remains a **Phase 3** hardening item via deterministic `idempotency_key`.

---

## Unchanged Blockers (Still Apply)

| Blocker | Blocks |
|---------|--------|
| Cloudflare worker `Authorization: Bearer` | Production push (`ALLOW_NETWORK=1`) |
| Firebase Secret Manager for `OOT_PUSH_WORKER_SECRET` | Live mode |
| `firebase deploy --only functions` | Scheduler |
| No `firestore.rules` in repo | Document-only until rules slice |

---

## Approval Needed

| Item | Before |
|------|--------|
| Phase 2c implementation (claim transaction module + orchestrator refactor) | Any staging Firestore writes |
| Firebase Emulator integration tests | Optional but recommended |
| Staging enable `ALLOW_FIRESTORE=1` | Human verification of claim + notiflog |
| Staging enable `ALLOW_NETWORK=1` | Worker auth deployed |
| Production scheduler | All staging smoke tests pass |

---

## Summary

The safest backend path is a **strict port** of the client transaction claim on `proposals/{propId}`, using existing pure helpers (`getReminderDueInfo`, `planReminderStateClaim`), then push with **post-claim** `reminderNumber` for idempotency keys, then `notiflog`. Dry-run candidate collection stays as a pre-filter; the transaction is authoritative. Pure logic and mock-transaction tests can land without emulator; emulator or staging credentials are needed for integration confidence before production.
