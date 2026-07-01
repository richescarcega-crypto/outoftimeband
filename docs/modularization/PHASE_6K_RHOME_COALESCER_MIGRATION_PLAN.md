# Phase 6k rHome / Coalescer Migration Plan

**Branch:** `modularization-home-layout-engine-pilot`  
**Planning baseline:** `5ed8493` — *Document Phase 6j HomeController next boundary plan*  
**Runtime baseline:** `fba71aa` — *Wire gig slot reconcile request safely* (Phase 6i-a)  
**Scope:** Planning only — **no implementation approved**  
**Production default:** `legacy-overlay` (pilot opt-in only)

Reference docs: `PHASE_6J_HOME_CONTROLLER_NEXT_BOUNDARY_PLAN.md`, `PHASE_6J_CANDIDATE_A_VERIFICATION_RESULT.md`, `PHASE_6I_A_VERIFICATION_RESULT.md`, `PHASE_6I_GIG_TIMER_SAFE_RECONCILE_PLAN.md`, `PHASE_6H_DECISION_RESULT.md`, `PHASE_6H_HOME_CONTROLLER_NEXT_BOUNDARY_PLAN.md`, `PHASE_6D_LOCAL_SMOKE_BLOCKER_NOTE.md`

**Governing goal:** Build a stable, maintainable, monetizable, white-label-capable app.

---

## 1. Purpose

This is a **planning-only** document. It defines a safe **future** migration path for `rHome` tail reconcile behavior into HomeController/coalescer ownership.

**No implementation is approved by this document.**

Phase 6j Candidate C identified `rHome`/coalescer migration as a deferred, high-risk boundary. Phase 6j Candidate A browser verification was **BLOCKED** on the work computer (`PHASE_6J_CANDIDATE_A_VERIFICATION_RESULT.md`); integrity gates passed, but no live coalescer behavior was observed. This plan therefore describes **how** migration could proceed later — not **when** to execute it.

---

## 2. Current ownership summary

### What `rHome()` still owns (legacy)

| Concern | Owner | Notes |
|---------|-------|-------|
| Full Home render step order | Legacy `rHome()` in `index.html` | Cue renderers, gig countdown refresh, band image, listeners side effects |
| Tail reconcile **execution** | Legacy tail | Direct `reconcileHomeLayout('rHome')` (~30796) |
| Tail reconcile **request recording** | Legacy tail + HomeController | `requestHomeReconcile('rHome')` (~30795) then direct execute |
| Home DOM, CSS, cue HTML, pill placement | Legacy `index.html` | Unchanged by modularization pilot |
| Gig countdown timer loop | Legacy `index.html` | Separate from tail reconcile |

### What HomeController owns today

| Concern | Owner | Notes |
|---------|-------|-------|
| Record-only API (`activate`, `notify*`, `requestReconcile`) | HomeController | Journal + coalescer enqueue |
| Home tab entry delegate | HomeController | `enterHomeTab('go')` → legacy `rHome()` (Phase 6d) |
| Reconcile request coalescing | HomeController | Enqueue, dedupe same pending reason, rAF flush |
| Non-`rHome` reconcile **execution** | HomeController orchestrates | Coalescer flush delegates to `reconcileHomeLayout` |
| **`rHome` reconcile execution** | **Legacy tail (not coalescer delegate)** | Coalescer **skips** delegate when pending reason is `rHome` (Phase 6e-b) |
| Cue/gig `requestHomeReconcile` tails | Legacy `index.html` | Phase 6e-c, 6g, 6i-a — safe **request** paths only |

### Phase 6e / 6i context

Phases 6e–6i added **safe request paths** (cue, gig) and coalescer delegate for **non-`rHome`** reasons. They did **not** migrate full `rHome` tail reconcile ownership. The `rHome` path today is intentionally split:

1. `requestHomeReconcile('rHome')` — records/coalesces the request.
2. `reconcileHomeLayout('rHome')` — executes immediately at tail (coalescer does not delegate).

Integrity packages enforce exactly **one** `reconcileHomeLayout('rHome')` in `index.html`.

### Production posture (unchanged)

| Item | Status |
|------|--------|
| Default Home layout mode | `legacy-overlay` |
| `modular-inflow` | **Opt-in only** — not enabled by default |
| Hook rollout | **Paused** — no new tails without new plan + approval |

---

## 3. Why migration must be cautious

| Risk | Detail |
|------|--------|
| **Central legacy path** | `rHome()` is the primary Home refresh entry from tab navigation, Firestore churn, and internal re-entrancy (`updateCountdown` from tail). Changing tail reconcile timing affects layout token application relative to DOM writes. |
| **Double-execute / miss** | Today: request recorded + direct execute. Moving execute to coalescer-only without removing direct call → **double layout pass**. Removing direct call before coalescer path verified → **missed refresh** on tab entry. |
| **Visual/layout timing** | `reconcileHomeLayout('rHome')` runs after render steps; coalescer rAF flush may shift when budget tokens apply vs legacy overlay CSS. |
| **Coalescer `rHome` skip** | Phase 6e-b explicitly skips delegate for `rHome` reason. Migration must redesign this invariant — not flip it accidentally. |
| **Interaction with cue/gig hooks** | `rHome()` calls `updateCountdown()` before tail; gig helper may request `gig:*` reconcile on same pass. Migration must preserve ordering and avoid reconcile storms. |
| **No live browser signal** | Candidate A BLOCKED — `py` unavailable on work computer; app load not reached. **No new behavior assumption** should be made from manual verification. |
| **Pre-existing pill placement** | Song Vote Pending / Rehearsal On Deck placement is a **known product issue**. Migration must **not** “fix” pills as a side effect — that confounds modularization verification. |
| **Rollback cost** | `rHome` tail is a single point of failure for Home tab UX; regression affects all users, not pilot opt-in only. |

Phase 6h and Phase 6j both **deferred** `rHome`/coalescer migration for these reasons. This Phase 6k plan does not overturn that deferral — it only defines a future path if explicitly approved.

---

## 4. Required preconditions before implementation

All of the following must be satisfied **before any Phase 6k-a+ runtime work**:

| Precondition | Requirement |
|--------------|-------------|
| **Repo state** | Branch `modularization-home-layout-engine-pilot`; HEAD matches expected commit at time of work; no surprise tracked runtime diffs |
| **Integrity gates** | All five packages PASS on implementation baseline |
| **Browser/manual smoke** | Available on a **known-good server path**, **or** explicitly waived by user with BLOCKED doc — not work-computer local-server debug loop |
| **Reviewed implementation plan** | Phase 6k-a inventory complete; slice plan (6k-b…6k-e) approved per slice |
| **Local-server policy** | Follow `PHASE_6D_LOCAL_SMOKE_BLOCKER_NOTE.md` — no debugging loop |
| **Explicit user approval** | Per-slice approval for 6k-a through 6k-e — **this planning doc is not approval** |
| **Hook rollout pause** | No additional cue/gig/listener hooks in same commits as migration slices |

---

## 5. Proposed future migration shape

**Target end state (conceptual):** HomeController/coalescer owns **`rHome` tail reconcile execution** while legacy `rHome()` retains all **rendering** step order unchanged.

### Principles

1. **Preserve `rHome()` call timing first** — do not move rendering logic, cue HTML, CSS, or listener bodies.
2. **Route only the final reconcile request/execute pair** through a narrow HomeController adapter — not the render steps.
3. **Keep direct legacy fallback** until coalescer path is verified (feature flag, shim, or dual-path with integrity assertion that only one path executes).
4. **Remove coalescer `rHome` skip only in a dedicated slice** after adapter proves equivalent behavior.
5. **One behavioral change per slice** — inventory → diagnostics → adapter (no-op) → route → verify → document.

### Proposed adapter (conceptual — not implemented)

- Narrow method e.g. `executeRHomeTailReconcile()` or `requestAndExecuteRHomeReconcile()` on HomeController/compat layer.
- Internally: enqueue `rHome` reason, flush with delegate enabled (future), or call legacy `reconcileHomeLayout('rHome')` through single choke point.
- `index.html` tail replaces inline dual call with adapter call — **only in Phase 6k-d+ after 6k-c no-op shim**.

### Current tail (inventory baseline — do not change in this doc)

```text
requestHomeReconcile('rHome')   // record + coalesce
reconcileHomeLayout('rHome')    // direct execute (coalescer skips delegate today)
```

### Invariants to preserve during migration

- Exactly one effective `reconcileHomeLayout('rHome')` execution per `rHome()` completion (no double, no miss).
- Phase 6d `enterHomeTab('go')` → `rHome()` preserved.
- Cue (`cue:song-vote`, `cue:rehearsal`) and gig (`gig:*`) hooks unchanged unless separate approved phase.
- `modular-inflow` remains opt-in only.

### Optional shim / flag

- Read-only or no-behavior-change flag (query param, storage, or controller phase string) to force legacy direct path during 6k-d verification.
- Default: legacy behavior until flag flipped in manual test session only.

---

## 6. Explicit non-goals

Phase 6k migration work must **not** include:

| Non-goal | Reason |
|----------|--------|
| CSS edits | Out of scope; confounds verification |
| Home visual fixes | Separate product track |
| Song Vote / Rehearsal pill placement fix | Pre-existing; forbidden in modularization phases |
| Band image module changes | Protected |
| Cue renderer extraction | Separate boundary (Phase 6j Candidate D) |
| Broad listener rollout | Storm / rollback risk |
| Firebase logic or rules changes | Out of scope |
| Service worker or notification changes | Out of scope |
| Layout budget constant tuning | Frozen boundary |
| `modular-inflow` default enablement | Hard boundary |
| Merge to `main` | Hard boundary |
| Local server debugging loop | Blocked policy |
| CDP smoke scripts | Blocked unless user explicitly approves |

---

## 7. Candidate implementation phases

Each sub-phase requires **separate explicit user approval**. Do not batch 6k-a through 6k-e in one commit.

| Phase | Deliverable | Allowed change (when approved) |
|-------|-------------|--------------------------------|
| **6k-a** | Inventory doc or test-backed report | Exact `rHome` tail call sites, call order within `rHome()`, coalescer skip behavior, interaction with `updateCountdown` / cue/gig requests. **Docs/tests inventory only** preferred first. |
| **6k-b** | Read-only diagnostics (optional) | Coalescer journal fields, tail timing stamps, `skippedRHomeExecution` visibility in diag export — **no behavior change** |
| **6k-c** | Adapter method, no behavior change | HomeController/compat adapter that calls existing tail logic unchanged; `index.html` may still call legacy inline — adapter unused or passthrough |
| **6k-d** | Route tail through adapter | Replace inline tail dual-call with adapter; retain legacy fallback path behind flag |
| **6k-e** | Bounded verification | Five integrity gates + optional browser smoke on known-good path; coalescer state read after Home tab entry |
| **6k-f** | Result doc + stop | `PHASE_6K_VERIFICATION_RESULT.md` (or similar); hook rollout remains paused; no further migration without new plan |

### Suggested allowed files (future slices — not approved now)

| Slice | Files |
|-------|-------|
| 6k-a | `docs/modularization/` inventory; optionally `tests/integrity/home-controller-package.mjs` read-only assertions |
| 6k-b | `oot_home_controller.js`, `oot_home_diag.js`, `tests/integrity/home-diag-package.mjs` |
| 6k-c / 6k-d | `oot_home_controller.js`, `oot_compat_home.js`, `index.html` (tail only), integrity packages |
| 6k-e / 6k-f | Docs only or docs + prior runtime commits |

---

## 8. Integrity gates to preserve

Run before and after any future implementation slice:

```powershell
$node = "C:\Users\rescarcega\AppData\Local\Programs\cursor\resources\app\resources\helpers\node.exe"
Set-Location "C:\Users\rescarcega\Documents\outoftimeband"
& $node tests/integrity/home-layout-engine-package.mjs
& $node tests/integrity/home-diag-package.mjs
& $node tests/integrity/home-alert-rail-package.mjs
& $node tests/integrity/home-gig-slot-package.mjs
& $node tests/integrity/home-controller-package.mjs
```

### Static invariants (must hold through migration)

| Invariant | Notes |
|-----------|-------|
| Exactly one effective `reconcileHomeLayout('rHome')` per `rHome()` completion | May move call site, not duplicate |
| Coalescer `rHome` skip behavior | Documented change only in approved 6k-d slice |
| Phase 6d `enterHomeTab` preserved | |
| Two `cue:song-vote`, three `cue:rehearsal` hooks | Unchanged |
| Gig helper timer-safe rules | No hooks in `tick()` / `setInterval` |
| Banned strings absent | `HomeLayoutContract`, rescue paths, etc. |
| Protected modules untouched | Unless separate approved diagnostic gap |

**Add or extend tests only after a reviewed implementation plan** for the specific slice (6k-a inventory assertions, 6k-d tail routing checks, etc.).

---

## 9. Stop conditions

Stop immediately and report to user (do not improvise) if:

| Condition | Action |
|-----------|--------|
| Branch or HEAD mismatch vs expected | Stop; no edits |
| Unexpected tracked runtime diff | Stop; investigate |
| Local browser/server path blocked | Docs-only work OK; **no runtime migration slice** unless smoke waived |
| Any need to change CSS or Home visual behavior | Stop — out of scope |
| Reconcile storm or timer-loop coupling observed | Revert slice; restore `fba71aa` tail behavior |
| Temptation to fix pill placement in same phase | Stop — forbidden |
| Double `reconcileHomeLayout('rHome')` on tab entry | Revert 6k-d; fix plan |
| Missed layout refresh on Home tab entry | Revert 6k-d; restore direct tail |
| Integrity gate failure | Revert slice; re-run all five gates |
| User did not approve slice | Do not implement |

### Rollback targets

| Target | Commit | Role |
|--------|--------|------|
| Pre-migration runtime | `fba71aa` | Phase 6i-a complete stack |
| Planning baseline | `5ed8493` | Phase 6j boundary plan |
| Coalescer delegate baseline | `efd6a6b` | Pre-cue hooks if catastrophic |

---

## 10. Recommended next action

1. **Stop after this planning doc.** No Phase 6k-a implementation without explicit user approval.
2. **Then either:**
   - Commit documentation-only results (`PHASE_6J_CANDIDATE_A_VERIFICATION_RESULT.md`, this `PHASE_6K_RHOME_COALESCER_MIGRATION_PLAN.md`) when user requests commit, **or**
   - Prepare **Candidate E handoff** (`HANDOFF_001` with New Agent Startup Protocol from Phase 6h Section 17).
3. **Do not begin Phase 6k-a** until user explicitly approves inventory work.
4. **Do not assume** Candidate A BLOCKED means migration is safe without browser verification on a future slice (6k-e).

---

## Explicit stop point

**This document is planning only.**

- **No rHome/coalescer migration implementation** is approved.
- **No runtime code, `index.html`, CSS, or tests** changed by this planning commit task.
- **No local server work.**
- **No CDP automation.**
- **No merge to `main`.**
- **`modular-inflow` remains opt-in only.**

Await user choice:

- **(A)** Commit docs-only stack (6j Candidate A result + this 6k plan) when requested
- **(B)** Phase 6k-a inventory (requires new explicit approval)
- **(C)** Candidate E handoff authoring
- **(D)** Stop — no further work

**No option above is approved by default.**
