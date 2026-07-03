# Pending Response Reminders — Architecture Checkpoint

## Status

**Checkpoint / documentation only.** No runtime behavior changed by this document.

Records the **actual current implementation** of rehearsal proposal pending-response reminder notifications (inspection at `main` baseline through modularization merge) and the **safest backend implementation path** for reliable 24-hour / 10-hour non-responder nudges.

Branch context: `feature/pending-response-reminders-plan` (planning slice).

---

## Repo Baseline

| Item | Value |
|------|--------|
| Inspection baseline | `main` @ modularization merge + r944 version marker |
| Primary implementation | `index.html` (client-side engine r109 / r762 / r826) |
| Backend scheduler | **Not implemented** — no `functions/` directory in repo |
| Push delivery | External Cloudflare worker (`PUSH_WORKER_URL` in `index.html`) |

---

## Product Requirements (Target Policy)

| Rule | Value |
|------|--------|
| First reminder | **24 hours** after proposal posted |
| Repeat reminders | Every **10 hours** to each still-pending member |
| Recipients | **Non-responders only** (expected responders without a `responses` entry) |
| Stop sending | When all expected members respond, proposal is canceled/closed/deleted/confirmed, or rehearsal date is in the past |
| Reliability | Must not depend on a browser being open (requires backend scheduler for guarantee) |
| Safety | Avoid stale notifications and duplicate sends |

---

## Current Proposal Data Model

Firestore collection: **`proposals`**

### Core fields

| Field | Type / values | Role |
|-------|---------------|------|
| `id` | string (doc id) | Proposal identifier |
| `type` | `'rehearsal'` | Proposal kind |
| `status` | `'open'` \| `'cancelled'` \| `'confirmed'` \| `'superseded'` | Lifecycle gate for reminders |
| `proposedAt` | number (ms) | **Primary anchor** for first 24h reminder |
| `createdAt` | number (ms) | Fallback anchor if `proposedAt` missing |
| `proposedBy` | member id | Proposer; auto-votes `yes` on create |
| `date` | `YYYY-MM-DD` | Rehearsal date; reminders stop when date &lt; today |
| `startTime`, `endTime`, `location`, `title`, `focus`, `songs`, `notes` | various | Display / confirm payload (not reminder logic) |

### Response tracking

| Field | Shape | Role |
|-------|-------|------|
| `expectedResponderIds` | `string[]` | Members who must respond; on create defaults to all band members |
| `responses` | `{ [memberId]: 'yes' \| 'no' \| 'maybe' }` | Vote map; **missing key = non-responder** |
| `responseState` | `{ [memberId]: { vote, respondedAt, respondedAtIso } }` | Audit metadata per response |

### Reminder tracking

| Field | Shape | Role |
|-------|-------|------|
| `reminderPolicy` | `{ firstReminderAfterHours: 24, repeatEveryHours: 10, clientManaged: true }` | Documented policy at create time |
| `reminderState` | `{ [memberId]: { count, lastSentAt, lastSentAtIso, lastSentBy, lastSentTo, lastMode, policy, history[] } }` | **Per-member dedupe ledger** updated in Firestore transaction before push |

### Create path (reference)

On new proposal (`saveProposal` flow in `index.html` ~28572):

- `status: 'open'`
- `reminderState: {}`
- `responses` / `responseState` seeded with proposer `yes`
- Initial **broadcast** notification via `notifyBand('rehearsal-proposal', …)` (not a pending-response reminder)

---

## Existing Client-Side Reminder Engine

Location: **`index.html`** (~27243–27795, boot wired from `listenProposals` ~27148).

Comments in code explicitly state this is **not a true backend scheduler** — it works when any member/admin has the app open.

### Timing constants

```javascript
PROPOSAL_REMINDER_FIRST_MS  = 24 * 60 * 60 * 1000   // 24 hours
PROPOSAL_REMINDER_REPEAT_MS = 10 * 60 * 60 * 1000   // 10 hours
PROPOSAL_REMINDER_SWEEP_MS  = 30 * 60 * 1000        // 30-minute interval
```

### Key functions

| Function | Behavior |
|----------|----------|
| `_proposalExpectedResponderIds(p)` | Returns `expectedResponderIds` or all `members[]` |
| `_proposalNonResponderIds(p)` | Expected ids minus those with `responses[id]` |
| `_proposalDateIsStale(p)` | True when `p.date` is before local today → stop reminders |
| `_proposalReminderDueInfo(p, targetMemberId, now)` | Returns `{ reminderNumber, dueAt, lastSentAt }` if reminder is due, else `null` |
| `_runProposalReminderSweep()` | Scans open proposals; for each due non-responder (excluding self-target), calls claim/send; 60s debounce |
| `_claimAndSendProposalReminder(propId, targetMemberId, opts)` | **Firestore transaction** claims `reminderState`, then triggers send |
| `_sendProposalReminderAfterClaim(propId, targetMemberId, reminderNumber)` | Builds copy; `notifyBand('rehearsal-proposal', …, { targetMemberId })` |
| `sendProposalRemindersNow(propId)` | Manual **force** send to all non-responders (proposer/admin only) |
| `_ensureProposalReminderTimer()` | `setInterval(_runProposalReminderSweep, 30min)` |
| `_ensureProposalReminderResumeHooks()` (r762) | Sweeps on `visibilitychange`, `focus`, `online`, startup delay |
| `_renderProposalReminderAuditPanel(p)` (r826) | UI: expected / responded / waiting / next due / CHECK DUE NOW |
| `_runProposalReminderSweepForTest(propId)` | Manual audit trigger (does not force send unless due) |

### Due-time algorithm (per member)

1. Proposal must be `status === 'open'` (or missing status treated as open).
2. Rehearsal date must not be stale.
3. Member must be in non-responder set.
4. `proposedAt` (or `createdAt`) must exist.
5. Read `reminderState[memberId].count` and `lastSentAt`.
6. **First reminder:** `dueAt = proposedAt + 24h`
7. **Follow-ups:** `dueAt = lastSentAt + 10h`
8. Send when `now >= dueAt`.

### Boot / trigger wiring

From `listenProposals()` first snapshot:

- `_ensureProposalReminderTimer()`
- `_ensureProposalReminderResumeHooks()`
- Delayed `_runProposalReminderSweep()` (~3.2s startup, ~1.2s on later snapshots)

---

## Existing Stop Conditions

Reminders do **not** send when any of the following is true:

| Condition | Check location |
|-----------|----------------|
| Proposal not open | `status !== 'open'` in due info, sweep, and transaction |
| Member already responded | Absent from `_proposalNonResponderIds` |
| Rehearsal date in the past | `_proposalDateIsStale(p)` |
| Reminder not yet due | `_proposalReminderDueInfo` returns null (unless `force: true` manual) |
| Target is current user (self) | Skipped in sweep and claim (`notifyBand` suppresses self-DM) |
| Proposal doc missing | Transaction returns `{ send: false, reason: 'missing' }` |
| Everyone responded | Non-responder set empty → sweep skips proposal |
| Confirmed | Proposal doc **deleted** after calendar event created |
| Cancelled (NO vote or manual) | `status: 'cancelled'` then delete (NO path) or delete after notify (manual) |

---

## Existing Dedupe Protections

| Mechanism | Detail |
|-----------|--------|
| **Firestore transaction claim** | `_claimAndSendProposalReminder` reads fresh doc, re-validates due/stop rules, updates `reminderState[memberId]` **before** push. Primary dedupe for client and any future backend using same pattern. |
| **Sweep debounce** | `_proposalReminderLastSweepAt` — min 60s between sweeps |
| **Sweep reentrancy guard** | `_proposalReminderSweepRunning` |
| **Self-DM guard** | `notifyBand` suppresses when `targetMemberId === ME` |
| **Recipient opt-out** | `notifprefs[memberName]['rehearsal-proposal'] === false` → log only, no push |
| **History cap** | `reminderState.history` trimmed to last 20 entries per member |

### Gaps (see Limitations)

- No **deterministic OneSignal idempotency key** per `{ proposalId, memberId, reminderNumber }` for `rehearsal-proposal` category (chat has r911/r912 freshness; proposals do not).
- Client sweep and future backend sweep could **race** — transaction prevents double `reminderState` increment but could still attempt redundant push attempts if not idempotent at worker level.

---

## Current Notification Send Path

```
_claimAndSendProposalReminder (transaction updates reminderState)
  └─ _sendProposalReminderAfterClaim
       └─ notifyBand('rehearsal-proposal', title, msg, '/', { targetMemberId })
            ├─ Load notifprefs → skip if opted out
            ├─ _applyNotificationFreshness(payload, category, opts)
            │    └─ Chat-only: TTL, web_push_topic, idempotency UUID (r911/r912)
            │    └─ Proposals: generic oot* data fields; no category-specific TTL
            ├─ fetch(PUSH_WORKER_URL, POST JSON)
            └─ _writeNotifLog → Firestore collection `notiflog`
```

| Constant | Value |
|----------|--------|
| `PUSH_WORKER_URL` | `https://oot-push.rich-escarcega.workers.dev` |
| Notification category | `'rehearsal-proposal'` |
| DM targeting | `opts.targetMemberId` → single `targetExternalIds` entry |

### Reminder copy (auto)

- Title: `'Rehearsal proposal waiting for your response'`
- Body: formatted date/time/location; appends `' · Reminder #N'` for follow-ups

### Manual send

- `sendProposalRemindersNow(propId)` — proposer/admin; `{ force: true }` bypasses due-time check but still uses transaction + stop rules.

### In-app policy UI (reference only)

Notifications settings UI (~20332) labels future guaranteed nudges as **PLANNED / BACKEND** — consistent with this checkpoint.

---

## Current Limitations

| Limitation | Impact |
|------------|--------|
| **Client-only timing** | Reminders fire only when **some band member’s app is open** (30min sweep + resume hooks). No guarantee at exact 24h/10h if nobody has app open. Code comments (r762, r109) acknowledge this. |
| **Opportunistic sender** | Any member device running the sweep can claim/send; `sentBy` records `ME` of that device. |
| **Proposal reminder idempotency gap** | `_applyNotificationFreshness` does not assign stable idempotency keys for proposal reminders. Duplicate push delivery possible at worker level if races occur. |
| **No `functions/` directory** | No Firebase Cloud Functions, Cloud Scheduler, or server-side cron in repo. |
| **Push worker external** | Worker source not in this repo; backend scheduler must POST with appropriate auth. |
| **Firestore rules not in repo** | Backend writes to `reminderState` may require rules review before deployment. |

### What already works well (preserve in backend)

- `reminderState` transaction claim pattern
- Non-responder targeting and stop conditions
- `notiflog` audit trail
- Manual send + audit UI for phone testing
- Pending proposal **UI cues** (`derivePendingProposalIds` in `oot_home_cue_renderer.js`) — separate from push reminders

---

## Recommended Phase 2 — Backend Scheduler Plan

**Goal:** Guaranteed 24h / 10h reminders without requiring an open app.

### Architecture

```
Cloud Scheduler (every 15–30 min)
  └─ Cloud Function: proposalReminderSweep
       ├─ Query proposals where status == 'open'
       ├─ For each proposal × non-responder:
       │    ├─ Compute due (same rules as _proposalReminderDueInfo)
       │    └─ If due: transaction claim on reminderState (Admin SDK)
       ├─ On successful claim: POST to PUSH_WORKER_URL (service auth)
       └─ Write notiflog entry (Admin SDK) mirroring client shape
```

### Design principles

1. **Reuse semantics, not necessarily copy-paste** — port due/stop/claim logic to match client behavior exactly.
2. **Single source of dedupe truth** — keep `reminderState` on proposal doc; both client and server must use the same transaction pattern (server becomes primary; client sweep optional accelerator).
3. **Scheduler interval** — 15–30 minutes is sufficient (10h repeat granularity does not require minute-level cron).
4. **Do not change proposal UX or Home cue modules** in Phase 2 unless required for wiring.
5. **Auth** — function uses Admin SDK for Firestore; push worker needs shared secret or signed requests (not client-exposed).
6. **Testing** — use existing Reminder Audit panel + `notiflog` + manual `sendProposalRemindersNow` until backend proven; add function-local integration tests if functions directory is created.

### Phase 2 deliverables (future slice)

| Deliverable | Notes |
|-------------|-------|
| `functions/` (or equivalent) | Scheduled function + deploy config |
| Shared due/claim spec | This doc + inline comments in function |
| Firestore rules update | Allow function service account to update `reminderState` only |
| Push worker auth | Server-to-server POST path |
| Rollback | Disable scheduler; client opportunistic sweep remains |

### Explicit non-goals for Phase 2

- Rewriting Home modularization / cue renderer
- Changing proposal voting UI or CSS
- Changing `rehearsal-proposal` notification prefs model
- Deploying from this checkpoint doc alone

---

## Optional Phase 3 — Push Idempotency Hardening

After Phase 2 backend is stable:

| Enhancement | Detail |
|-------------|--------|
| Deterministic notification id | e.g. `oot-proposal-reminder-{propId}-{memberId}-r{reminderNumber}` |
| OneSignal idempotency UUID | Derived or mapped per deterministic id (follow r912 pattern) |
| Optional TTL | Short TTL on reminder pushes to reduce stale replay (evaluate separately from chat TTL) |
| Worker forwarding | Ensure worker passes `idempotency_key`, `data.ootNotificationId` to OneSignal |

Apply to **both** backend send path and client `_sendProposalReminderAfterClaim` for parity.

---

## Files / Functions Likely Involved Later

### Client (existing — reference / optional hardening)

| File | Symbols |
|------|---------|
| `index.html` | `listenProposals`, `_runProposalReminderSweep`, `_claimAndSendProposalReminder`, `_sendProposalReminderAfterClaim`, `_proposalReminderDueInfo`, `_proposalNonResponderIds`, `_proposalExpectedResponderIds`, `sendProposalRemindersNow`, `notifyBand`, `_writeNotifLog`, `_applyNotificationFreshness`, `voteOnProposal`, `confirmProposal`, `cancelProposal`, proposal save ~28572 |
| `oot_home_cue_renderer.js` | `derivePendingProposalIds` (pending **UI cue** only) |

### Backend (to be created)

| Item | Purpose |
|------|---------|
| `functions/src/proposalReminderSweep.ts` (example) | Scheduled sweep + transaction claim |
| `functions/package.json`, deploy config | Firebase / GCP scheduler wiring |
| Firestore security rules | Function-only `reminderState` updates |

### External

| Item | Purpose |
|------|---------|
| Cloudflare worker `oot-push.rich-escarcega.workers.dev` | OneSignal delivery; may need auth + idempotency forwarding |

---

## Hard Boundaries for Future Implementation

| Boundary | Status |
|----------|--------|
| CSS / visual placement | No changes unless separately approved |
| Cue text / Home alert-row pills | No changes in reminder backend slice |
| Firestore proposal schema breaking changes | Avoid — extend `reminderState` only if needed |
| Listeners (`listenProposals`) | Do not remove client listener; backend is additive |
| Push worker behavior | No change without coordinated worker deploy |
| Client sweep removal | Do not disable until backend proven in production |
| Broad refactor of `index.html` | Not permitted — bounded scheduler slice only |
| Merge / deploy | Requires separate approval and test plan |

---

## Integrity / Test Posture (Future)

When implementation slices land:

1. Re-run existing five Home integrity gates (unaffected by backend-only work).
2. Phone test: Reminder Audit panel — expected / responded / waiting / next due.
3. `CHECK DUE NOW` on not-yet-due proposal → no send.
4. `notiflog` entries for auto reminders with `category: rehearsal-proposal`.
5. Backend: staged proposal with shortened intervals in **dev only** before production timers.

---

## Related Docs

- `docs/modularization/PHASE_6M_A_PENDING_PROPOSAL_CUE_INVENTORY.md` — pending proposal UI cue (not push reminders)
- `docs/modularization/PHASE_7A_B_HOME_ALERT_ROW_CUE_ARCHITECTURE_CHECKPOINT.md` — Home cue modularization stop line
- In-app WHATS_NEW / notification policy UI (~20332) — labels guaranteed nudges as PLANNED / BACKEND

---

## Recommended Next Slice

**Phase 2a — Backend scheduler spec + functions scaffold (implementation slice)**

Rationale: Client engine satisfies policy logic and dedupe shape; only guaranteed timing is missing. Scaffold scheduled function mirroring transaction claim before any production enable.

**Approval needed before implementation:** Firebase project setup, scheduler cadence, push worker server auth, and Firestore rules changes.
