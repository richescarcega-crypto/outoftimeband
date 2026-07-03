# Pending Response Reminders — Backend Phase 2 Implementation Plan

## Status

**Planning / readiness inspection only.** No runtime behavior changed. No `functions/` code created in this slice.

Records backend readiness for scheduled proposal reminder delivery and the **safest implementation path** after `PENDING_RESPONSE_REMINDERS_ARCHITECTURE_CHECKPOINT.md`.

| Item | Value |
|------|--------|
| Branch | `feature/pending-response-reminders-backend` |
| Baseline | `main` @ `967e026` (architecture checkpoint committed) |
| Firebase project (client config) | `outoftimeband-27c19` |
| Push worker | `https://oot-push.rich-escarcega.workers.dev` |

---

## Executive Summary

| Question | Answer |
|----------|--------|
| Does repo have Firebase Functions tooling? | **No** — no `firebase.json`, `.firebaserc`, `functions/`, `firestore.rules`, or root `package.json` |
| Can Phase 2 be fully implemented **inside this repo alone**? | **Partially** — repo can hold function source + config + shared logic + tests, but **cannot deploy or run in production without external credentials and infra** |
| Safest architecture | **Cloud Scheduler → Cloud Function (2nd gen)** with Admin SDK transaction claim, then server-authenticated POST to push worker + `notiflog` write |
| Blocker before code? | **Yes** — Firebase/GCP project access, push-worker server auth, and Firestore rules strategy must be approved before first deploy |

---

## Readiness Inspection — Repo Tooling

### Present

| Asset | Location | Notes |
|-------|----------|-------|
| Architecture checkpoint | `docs/notifications/PENDING_RESPONSE_REMINDERS_ARCHITECTURE_CHECKPOINT.md` | Policy, client engine, Phase 2 outline |
| Client reminder engine | `index.html` ~27243–27795 | Complete opportunistic implementation |
| Client notification path | `index.html` `notifyBand`, `_writeNotifLog`, `_applyNotificationFreshness` | Reference for parity |
| Firebase client config | `index.html` ~19409 | `projectId: outoftimeband-27c19` |
| Firestore collections used | `proposals`, `members`, `notifprefs`, `notiflog` | Backend must read/write same shapes |
| Integrity tests (Home) | `tests/integrity/*` | Unaffected by backend; add separate function tests later |

### Absent (must be added for Phase 2)

| Asset | Required? | Purpose |
|-------|-----------|---------|
| `firebase.json` | **Yes** | Functions + optional Firestore rules deploy config |
| `.firebaserc` | **Yes** | Project alias (`outoftimeband-27c19`) |
| `functions/` | **Yes** | Scheduled sweep + shared due/claim logic |
| `functions/package.json` | **Yes** | `firebase-admin`, `firebase-functions` |
| `firestore.rules` | **Recommended** | Document + deploy client rules; constrain `reminderState` if needed |
| Root or functions deploy script | **Recommended** | Documented `firebase deploy --only functions` |
| Push worker source / auth contract | **External** | Not in repo; server secret required |
| Cloud Scheduler job | **External (GCP)** | Created on first functions deploy or manually |
| `.github/workflows/*` | Optional | CI for function lint/test |

### Deploy scripts

**None found.** Deployment today appears to be manual GitHub Pages upload of `index.html` (per build comments). Backend adds a **separate deploy path** via Firebase CLI.

---

## Client Logic Reference (Port Targets)

Line numbers refer to `index.html` at `967e026`.

| Function | Line | Backend port priority |
|----------|------|----------------------|
| `_proposalReminderDueInfo` | ~27310 | **P0** — exact due algorithm |
| `_proposalNonResponderIds` / `_proposalExpectedResponderIds` | ~27296–27307 | **P0** — targeting |
| `_proposalDateIsStale` | ~27286 | **P0** — stop condition |
| `_claimAndSendProposalReminder` | ~27344 | **P0** — transaction claim on `reminderState` |
| `_sendProposalReminderAfterClaim` | ~27330 | **P0** — copy + push payload shape |
| `_runProposalReminderSweep` | ~27773 | **P0** — orchestration loop |
| `notifyBand` | ~20821 | **P1** — prefs + push + log parity |
| `_writeNotifLog` | ~20728 | **P1** — audit trail |
| `_applyNotificationFreshness` | ~20783 | **P2** — Phase 3 idempotency |
| `sendProposalRemindersNow` | ~27403 | Client-only manual path; keep unchanged |
| `_renderProposalReminderAuditPanel` | ~27652 | Client-only UI; keep unchanged |
| `listenProposals` | ~27148 | Client boot; keep unchanged |

### Client vs backend behavioral differences to resolve

| Topic | Client today | Backend should |
|-------|--------------|----------------|
| `sentBy` in `reminderState.history` | Current member `ME` | Use sentinel e.g. `'backend-scheduler'` or function service account id |
| `lastSentBy` | `ME` | Same sentinel |
| `lastMode` | `'auto'` \| `'manual'` | `'backend-auto'` (new mode) or `'auto'` with `sentBy` distinction |
| Member roster | In-memory `members[]` from listener | Query `members` collection at sweep start |
| `notifprefs` lookup | Keyed by member **name** (`prefsByMember[target.name]`) | Must mirror — load members + prefs by name |
| Self-target skip | Client skips `targetMemberId === ME` | N/A — backend has no `ME`; send to all due non-responders |
| Push auth | Unauthenticated POST from browser | **Authenticated POST** with shared secret header |

---

## Can Phase 2 Be Implemented Without External Credentials?

| Capability | In repo alone? | External requirement |
|------------|----------------|----------------------|
| Write function source | ✓ | — |
| Unit-test due/claim logic (pure JS) | ✓ | — |
| Deploy Cloud Function | ✗ | Firebase CLI login, GCP project, billing enabled |
| Admin SDK Firestore access | ✗ | Default service account / credentials in Cloud Functions runtime |
| Cloud Scheduler trigger | ✗ | Created via `firebase deploy` or GCP console |
| Send push via worker | ✗ | Worker must accept server auth; secret in Firebase `functions:config` or Secret Manager |
| Verify production end-to-end | ✗ | Phone + OneSignal + live Firestore |

**Conclusion:** Implementation **scaffolding and shared logic** can land in-repo without secrets. **Production enablement is blocked** until credentials and push-worker auth are provisioned.

---

## Safest Backend Architecture

### High-level flow

```
Cloud Scheduler (every 15–30 min, UTC)
  └─ Cloud Function: proposalReminderSweep (scheduled, us-central1 or preferred region)
       ├─ Load members[] snapshot (members collection)
       ├─ Load notifprefs snapshot (optional cache per sweep)
       ├─ Query proposals where status == 'open'
       ├─ For each proposal:
       │    ├─ Skip if rehearsal date stale
       │    ├─ Compute non-responders
       │    └─ For each non-responder:
       │         ├─ If _proposalReminderDueInfo → due
       │         └─ runTransaction claim reminderState (same rules as client)
       ├─ On claim success:
       │    ├─ Build notify payload (title/message/url/targetExternalIds)
       │    ├─ POST PUSH_WORKER_URL with Authorization: Bearer <secret>
       │    └─ Write notiflog doc (mirror client fields)
       └─ Return summary { scanned, claimed, sent, skipped, errors }
```

### Scheduled cadence

| Setting | Recommendation | Rationale |
|---------|----------------|-----------|
| Interval | **Every 15 minutes** | Max lateness ~15min on 10h repeat; cheaper than 5min |
| Alternative | Every 30 minutes | Matches client sweep; max lateness ~30min |
| Timezone | UTC | Proposal `proposedAt` is epoch ms — timezone-agnostic |

Use **`onSchedule`** (Firebase Functions v2) — Scheduler job created automatically on deploy.

### Admin SDK transaction claim

**Preserve client contract exactly:**

1. `tx.get(proposals/{id})`
2. Re-validate: exists, `status === 'open'`, not stale date, target still non-responder
3. Recompute `_proposalReminderDueInfo` inside transaction with `Date.now()`
4. If not due → abort (no write)
5. Update `reminderState[targetMemberId]` with incremented `count`, `lastSentAt`, `history[]` (cap 20)
6. `tx.update({ reminderState })`
7. Only after transaction success → push + notiflog

This keeps client opportunistic sweep and backend scheduler **safe to run concurrently** — loser transaction retries or skips; no double increment.

### Proposal query strategy

**Phase 2a (simple, sufficient for band scale):**

```javascript
db.collection('proposals').where('status', '==', 'open').get()
```

- Filter stale dates and non-responders in function memory.
- Requires Firestore index on `status` (single-field — auto).

**Phase 2b (optimization, if proposal volume grows):**

- Composite index + query open proposals with `date >= today`
- Or maintain `reminderNextDueAt` field updated on proposal create/response (schema change — defer)

### Push worker auth model

**Current state:** Client `fetch(PUSH_WORKER_URL)` sends JSON with **no Authorization header** (public worker endpoint).

**Required for backend:**

| Option | Recommendation |
|--------|----------------|
| A. Shared secret header | `Authorization: Bearer <OOT_PUSH_WORKER_SECRET>` verified in worker |
| B. HMAC signed body | Stronger; more worker changes |
| C. Cloud Function → OneSignal direct | Bypass worker; duplicates worker logic — **avoid** |

**Recommended:** Option A — minimal worker change; secret stored in **Firebase Secret Manager** (`defineSecret`) or `functions.config()`.

Worker must continue forwarding payload fields to OneSignal unchanged.

### notiflog parity

Mirror client `_writeNotifLog` entry shape:

| Field | Value |
|-------|--------|
| `category` | `'rehearsal-proposal'` |
| `title` / `message` | Same as client reminder copy |
| `sender` | `'backend-scheduler'` |
| `senderId` | `'system'` or service account id |
| `targetIds` | `[targetMemberId]` |
| `targetNames` | Member display name |
| `result` | `'sent'` \| `'failed'` \| `'error'` \| `'recipient-opted-out'` \| `'no-targets'` |
| `httpStatus` / `response` | From worker response |
| `ts` / `tsClient` | Server timestamps |

### Stale / duplicate prevention

| Layer | Mechanism |
|-------|-----------|
| **Primary dedupe** | Firestore transaction on `reminderState` (unchanged) |
| **Stop stale proposals** | `_proposalDateIsStale` — do not remind after rehearsal date passed |
| **Stop closed proposals** | `status !== 'open'` |
| **Stop responded** | Missing from non-responder set |
| **Push idempotency (Phase 3)** | Deterministic `notificationId` / OneSignal `idempotency_key` per `{propId, memberId, reminderNumber}` |
| **Client+backend race** | Transaction prevents double count; Phase 3 prevents double delivery |

### Deployment requirements (external checklist)

- [ ] Firebase CLI installed; `firebase login`
- [ ] `.firebaserc` with project `outoftimeband-27c19`
- [ ] Blaze plan (scheduled functions require billing)
- [ ] `firebase deploy --only functions`
- [ ] Verify Cloud Scheduler job in GCP console
- [ ] Set `OOT_PUSH_WORKER_SECRET` in Secret Manager + grant function access
- [ ] Update Cloudflare worker to require secret for non-browser callers (or separate `/server/push` route)
- [ ] Optional: deploy `firestore.rules` if adding server-only constraints
- [ ] Phone test: create test proposal, shorten intervals in **dev-only** config, verify `notiflog` + push

---

## Recommended Implementation Slices

### Phase 2a — Repo scaffold + shared logic (no deploy)

**Goal:** Add Firebase project structure and **pure** due/claim modules testable without secrets.

| Deliverable | Details |
|-------------|---------|
| `firebase.json`, `.firebaserc` | Minimal functions config |
| `functions/package.json` | Node 20, firebase-admin, firebase-functions v2 |
| `functions/src/reminderPolicy.js` | Constants: 24h, 10h |
| `functions/src/proposalReminderLogic.js` | Port `_proposalReminderDueInfo`, non-responder helpers, stale check |
| `functions/test/reminderLogic.test.js` | Node test runner — due times, stop conditions |
| `functions/src/index.js` | Stub scheduled function logging "dry run" only |

**Hard boundary:** No production deploy; no secrets committed.

### Phase 2b — Transaction claim + push + notiflog (deploy gated)

| Deliverable | Details |
|-------------|---------|
| `functions/src/proposalReminderSweep.js` | Full sweep orchestration |
| `functions/src/pushClient.js` | POST worker with secret from env |
| `functions/src/notifLog.js` | Admin SDK write parity |
| `functions/src/members.js` | Load roster for expected-responder fallback |
| Secret wiring | `defineSecret('OOT_PUSH_WORKER_SECRET')` |

**Blocked until:** Push worker auth + Firebase deploy approval.

### Phase 2c — Production enable + monitoring

| Deliverable | Details |
|-------------|---------|
| Enable scheduler in production | Deploy with 15min cadence |
| Cloud Logging alerts | Function errors / zero-send anomalies |
| Client UI tweak (optional) | Show `lastMode: backend-auto` in Reminder Audit — **separate bounded slice** |
| Dev-only interval override | Environment flag for staging tests |

### Phase 3 — Push idempotency (optional)

| Deliverable | Details |
|-------------|---------|
| Stable `notificationId` | `oot-proposal-reminder-{propId}-{memberId}-r{n}` |
| UUID idempotency key | r912 pattern |
| Client `_sendProposalReminderAfterClaim` | Pass same ids for parity |
| Worker | Forward to OneSignal |

---

## Exact Files — Create or Change (Future Slices)

### New files (Phase 2a–2b)

```
firebase.json
.firebaserc
firestore.rules                    # optional Phase 2a draft
functions/package.json
functions/.gitignore
functions/src/index.js
functions/src/reminderPolicy.js
functions/src/proposalReminderLogic.js
functions/src/proposalReminderSweep.js   # Phase 2b
functions/src/pushClient.js                # Phase 2b
functions/src/notifLog.js                  # Phase 2b
functions/src/members.js                   # Phase 2b
functions/test/reminderLogic.test.js
docs/notifications/PENDING_RESPONSE_REMINDERS_BACKEND_DEPLOY.md  # optional runbook
```

### Unchanged in Phase 2 (unless Phase 3)

| File | Reason |
|------|--------|
| `index.html` | Client engine remains opportunistic fallback; no behavior change in 2a–2b |
| `oot_home_*.js` | Unrelated to reminders |
| `tests/integrity/*` | Home modularization gates |

### External (not in this repo)

| System | Change |
|--------|--------|
| Cloudflare worker `oot-push.*` | Add server auth gate |
| GCP Cloud Scheduler | Auto via Firebase deploy |
| Firebase console | Enable APIs, billing, secrets |

---

## Readiness Gaps / Blockers

| Gap | Severity | Unblocks |
|-----|----------|----------|
| No Firebase Functions project structure | **High** | Phase 2a scaffold commit |
| No push worker server auth | **High** | Phase 2b deploy + real sends |
| No Firebase CLI / deploy credentials in repo | **Expected** | Human operator deploy |
| No `firestore.rules` in repo | **Medium** | Rules audit unknown; Admin SDK bypasses client rules |
| `notifprefs` keyed by name not id | **Low** | Document in function; load members first |
| Client push is unauthenticated | **Medium** | Worker hardening before backend |
| No function integration tests in CI | **Low** | Phase 2a test file |

---

## Hard Boundaries (Future Implementation)

| Boundary | Status |
|----------|--------|
| Do not change client reminder timing in Phase 2a–2b | Keep 24h/10h constants aligned, not divergent |
| Do not remove client sweep until backend proven | Both may run; transaction dedupes |
| Do not change proposal voting UI / CSS | Backend slice only |
| Do not commit secrets | Use Secret Manager / CI env |
| Do not deploy without explicit approval | Each deploy slice gated |
| Do not change push worker without coordinated deploy | Worker + function same release window |

---

## Approval Needed

| Decision | Required before |
|----------|-----------------|
| Approve Phase 2a repo scaffold (`firebase.json`, `functions/`, pure logic tests) | First code commit on this branch |
| Provision Firebase/GCP deploy access | Any `firebase deploy` |
| Approve push worker server-auth design + secret rotation | Phase 2b live sends |
| Approve Cloud Scheduler cadence (15 vs 30 min) | Production enable |
| Optional: Phase 3 idempotency keys | After 2b stable in production |

---

## Related Docs

- `docs/notifications/PENDING_RESPONSE_REMINDERS_ARCHITECTURE_CHECKPOINT.md` — client engine + policy
- `docs/modularization/PHASE_7A_B_HOME_ALERT_ROW_CUE_ARCHITECTURE_CHECKPOINT.md` — do not expand Home cue scope for reminders
