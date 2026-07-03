# Pending Response Reminders — Phase 2b Live Preflight

## Status

**Preflight / disabled implementation.** Live backend code exists behind hard environment gates. **Not deployed.** **No secrets in repo.** **No push worker changes in repo.**

Companion: `PENDING_RESPONSE_REMINDERS_ARCHITECTURE_CHECKPOINT.md`, `PENDING_RESPONSE_REMINDERS_BACKEND_PHASE2_PLAN.md`.

---

## What Was Added (Phase 2b preflight)

| Module | Role |
|--------|------|
| `functions/src/liveConfig.js` | Evaluates env gates; dry-run default |
| `functions/src/proposalReminderLiveSweep.js` | Orchestrator; Admin SDK only when `canUseAdmin` |
| `functions/src/pushClient.js` | Payload builder; **never calls global fetch** — `fetchImpl` required |
| `functions/src/reminderIdempotency.js` | Deterministic notificationId + UUID idempotency |
| `functions/src/reminderMessage.js` | Copy parity with client |
| `functions/src/reminderClaim.js` | Pure `reminderState` claim planner |
| `functions/src/notifLog.js` | `notiflog` entry shape |
| `functions/test/livePreflight.test.js` | Gate + no-send + idempotency tests |

---

## Environment Gates (all required for production live send)

| Variable | Purpose |
|----------|---------|
| `OOT_PROPOSAL_REMINDER_LIVE=1` | Escapes dry-run default |
| `OOT_PUSH_WORKER_SECRET` | Bearer token for push worker (**Secret Manager only**) |
| `OOT_PROPOSAL_REMINDER_ALLOW_SEND=1` | Explicit send authorization |
| `OOT_PROPOSAL_REMINDER_ALLOW_FIRESTORE=1` | Allows Admin SDK + claim transaction |
| `OOT_PROPOSAL_REMINDER_ALLOW_NETWORK=1` | Allows HTTP to push worker |

**Default (unset):** `mode: dry-run` — scheduled function logs and returns without Firestore or HTTP.

Optional override:

| Variable | Default |
|----------|---------|
| `OOT_PUSH_WORKER_URL` | `https://oot-push.rich-escarcega.workers.dev` |

---

## Readiness Gaps (blockers before deploy)

### 1. Cloudflare push worker server auth — **NOT IN REPO**

**Current client behavior:** `index.html` POSTs to `PUSH_WORKER_URL` with **no Authorization header**.

**Required for backend:**

- Worker validates `Authorization: Bearer <OOT_PUSH_WORKER_SECRET>`
- Reject unsigned POSTs from non-browser callers (or separate `/server/push` route)
- Forward existing payload fields to OneSignal unchanged
- Forward `idempotency_key` / `notificationId` / `data.oot*` fields (Phase 3)

**This repo does not contain worker source.** Plan and deploy worker change **before** setting `OOT_PROPOSAL_REMINDER_ALLOW_NETWORK=1` in production.

### 2. Firebase deploy credentials

- Firebase CLI login + Blaze plan
- `firebase deploy --only functions`
- Secret binding: `OOT_PUSH_WORKER_SECRET` via Firebase Secret Manager

### 3. Firestore security rules

- No `firestore.rules` in repo today
- Admin SDK bypasses client rules; document client rules separately if tightening `reminderState` writes

### 4. Transaction claim + push ordering

Phase 2b preflight orchestrator sends push when gates allow but **does not yet run Firestore transaction claim** in the orchestrator loop (push-only path in preflight). **Phase 2c** should wire `planReminderStateClaim` into `runTransaction` before push — matching client `_claimAndSendProposalReminder` order.

---

## Safe Enablement Checklist (human operator)

1. Deploy Cloudflare worker auth (staging first)
2. Store secret in Firebase Secret Manager; bind to function
3. Deploy functions **without** live flags → verify dry-run logs
4. Set `LIVE=1` + secret + `ALLOW_SEND=1` only → verify `live-blocked` preflight errors for missing FIRESTORE/NETWORK
5. Enable `ALLOW_FIRESTORE=1` in staging → verify claim + notiflog with test proposals
6. Enable `ALLOW_NETWORK=1` in staging → verify single test push to one device
7. Production enable after phone smoke

---

## Tests

```powershell
cd functions
npm test
```

Runs:

- `test/reminderLogic.test.js` (Phase 2a due policy)
- `test/livePreflight.test.js` (gates, idempotency, no real network)

---

## Hard Boundaries (unchanged)

- Do not commit secrets
- Do not deploy from this preflight slice alone
- Do not change `index.html` client sweep until backend proven
- Do not disable client opportunistic sweep until production validation

---

## Approval Needed

| Item | Before |
|------|--------|
| Cloudflare worker auth design + deploy | `ALLOW_NETWORK=1` in any environment |
| Firebase functions deploy | Scheduler enabled |
| Phase 2c transaction claim wiring | Production sends |
| Phase 3 idempotency in worker | Duplicate delivery hardening |
