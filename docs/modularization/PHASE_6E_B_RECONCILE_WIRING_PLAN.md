# Phase 6e-b Plan - Coalesced Reconcile Wiring (Planning Only)

**Branch:** `modularization-home-layout-engine-pilot`  
**Baseline:** `4d0c7c8` - *Add HomeController reconcile coalescer scaffold*  
**HEAD == origin:** Yes (at time of note)  
**Scope:** Planning only - **no implementation**  
**Production default:** `legacy-overlay` (pilot opt-in only)

Parent plan: `PHASE_6E_HOME_CONTROLLER_RECONCILE_PLAN.md`  
Smoke policy: `PHASE_6D_LOCAL_SMOKE_BLOCKER_NOTE.md`  
Call-site context: `PHASE_6B_CALLSITE_INVENTORY.md`

---

## 1. Current Phase 6e-a scaffold behavior

Committed at `4d0c7c8`. Controller phase: `6e-a-coalesce-scaffold`.

| Component | Behavior today |
|-----------|----------------|
| `requestReconcile(reason)` | Records `requestReconcile` event, enqueues coalescer |
| `_enqueueReconcileCoalesce` | First request sets `pending`, `pendingId`, `pendingReason`; duplicates increment `duplicateCount` while retaining first reason |
| `_scheduleReconcileCoalescerFlush` | Schedules one rAF (or `setTimeout(0)`) flush per pending window |
| `_flushReconcileCoalescer` | Record-only: emits `reconcileCoalesceFlush` with coalesce metadata; clears pending state |
| `getReconcileCoalescerState()` | Exposes pending/coalesce observability |
| `getState()` | Includes `reconcileCoalescer` snapshot |
| Layout execution | **None from controller** |

**Sole reconcile executor in runtime:** `reconcileHomeLayout('rHome')` at `rHome()` tail in `index.html` (unchanged).

**Sole `requestHomeReconcile` call site today:** `rHome()` tail immediately before that reconcile hook.

**Listener / cue paths today:** `notifyCueChange`, `notifyGigSlotChange`, `notifyImageRefresh` only (record-only). They do **not** call `requestHomeReconcile`.

**Phase 6d preserved:** `go('home')` -> `enterHomeTab('go')` -> legacy `rHome()`.

---

## 2. What remains record-only after 6e-a

These must stay record-only in any approved 6e-b boundary unless explicitly listed in the wiring candidate below:

| API / path | Record-only today | 6e-b default |
|------------|-------------------|--------------|
| `activate` / `activateHome('rHome')` | Yes | Yes |
| `notifyCueChange` (cue renderers, listeners) | Yes | Yes |
| `notifyGigSlotChange` (`updateCountdown`) | Yes | Yes |
| `notifyImageRefresh` (band image, cue visibility) | Yes | Yes |
| `enterHomeTab` / `go('home')` delegate | Orchestrates legacy `rHome` only | Unchanged |
| `requestReconcile` coalescer flush | Records `reconcileCoalesceFlush` only | See Section 4-5 |
| `reconcileCoalesceFlush` event | Telemetry only | No layout side effects |

**Gap unchanged by 6e-a:** Firestore/fallback listener paths update cue DOM and call `syncAlertRailState` but do not trigger layout reconcile until the next `rHome()`.

---

## 3. What legacy still owns

| Concern | Owner | Notes |
|---------|-------|-------|
| `reconcileHomeLayout` implementation | `oot_home_layout_engine.js` via `OOT.home.layout.reconcile` | Budget math, token writes, pilot gating |
| `rHome()` step ordering | `index.html` | `syncAlertRailState` before tail reconcile (P6-6) |
| Cue renderer HTML / onclick / pills | `index.html` | Song Vote Pending placement unfixed |
| `updateCountdown` DOM | `index.html` | Gig slot content |
| Band image registry / apply | `oot_home_band_image.js` | Presentation only |
| Alert / gig attr sync | `oot_home_alert_rail.js`, `oot_home_gig_slot.js` | Triggered by legacy tails |
| Legacy Home CSS | `index.html` | No visual edits in 6e-b |
| Pilot default | Opt-in only | No static `modular-inflow` in HTML |
| Global reconcile shim | `oot_compat_home.js` | `window.reconcileHomeLayout` from layout module |

**Controller role (target):** orchestration and coalescing timing only - **not** layout owner.

---

## 4. Should 6e-b wire anything or remain observational?

### Decision

**6e-b should wire a narrow controller-only execution delegate - not remain purely observational - but must not expand listener-path reconcile call sites in this phase.**

Rationale:

| Approach | Verdict |
|----------|---------|
| Remain purely observational (6e-b = more telemetry only) | **Insufficient.** Coalescer scaffold exists; next safe step is proving delegate path without widening blast radius. |
| Full parent-plan 6e-b (index.html notify tails + flush execute) | **Out of scope for 6e-b** under current hard boundaries (`index.html` forbidden unless separately approved). Defer notify-tail `requestHomeReconcile` to **Phase 6e-c**. |
| **Recommended 6e-b:** controller flush -> legacy reconcile delegate with strict guards | **Approved candidate** if user accepts implementation. Behavior-neutral on today's call graph; ready for 6e-c listener wiring. |

### Why behavior-neutral today is acceptable

Without `index.html` changes, the only `requestHomeReconcile` reason is `'rHome'`. The coalescer must **not** double-execute reconcile on that path because `index.html` still calls `reconcileHomeLayout('rHome')` directly after `requestHomeReconcile('rHome')`.

Therefore 6e-b execution wiring must include an **`rHome` dedupe guard:** coalescer flush records `reconcileCoalesceFlush` but **skips legacy reconcile delegate** when `pendingReason === 'rHome'`.

Non-`rHome` coalesced requests (future, from 6e-c) become the first reasons that trigger coalescer-driven legacy reconcile.

### Listener paths in 6e-b

**Remain observational** (`notify*` only). Do **not** add `requestHomeReconcile` at cue/gig/image tails in 6e-b.

---

## 5. Safest candidate path (if approved)

### Phase 6e-b boundary (single small commit)

**Goal:** Prove coalescer flush can delegate to legacy reconcile **without** new listener-path executions, **without** `index.html` edits, **without** double reconcile on `rHome`.

#### Step B1 - Controller flush delegate (guarded)

In `_flushReconcileCoalescer`, after existing record-only flush telemetry:

1. If `pendingReason === 'rHome'`: **return after record** (legacy tail remains sole executor for full refresh).
2. Else if coalescer execution is enabled (phase flag / internal guard):
   - Resolve legacy delegate: prefer `window.reconcileHomeLayout` if function (compat shim), else `OOT.home.layout.reconcile` if function.
   - Invoke **once** with coalesced `pendingReason` (or stable reason string agreed for telemetry).
   - Record `reconcileCoalesceExecute` event (new method name) with `{ pendingId, duplicateCount, coalescedRequestCount, delegated: true }`.
3. Clear pending state (unchanged from 6e-a).

**Hard rule:** Controller calls the legacy global/module function only. It must not import or reimplement layout logic.

#### Step B2 - Home-active gate (minimal, no new DOM coupling)

Before delegate invoke (non-`rHome` only):

- Prefer **legacy-provided predicate** if one exists at implementation time (e.g. layout module `isHomeActive()`), added only with separate approval.
- If no predicate exists, **6e-b may defer active-tab gate** because no non-`rHome` requests exist yet; document gate as mandatory before 6e-c enables listener reasons.
- Do **not** add `document.getElementById`, `querySelector`, or `classList` to controller (integrity forbidden list).

#### Step B3 - Phase bump and observability

- Bump controller `PHASE` to `6e-b-reconcile-delegate`.
- Extend `getReconcileCoalescerState()` with: `executionEnabled`, `lastDelegatedReason`, `lastDelegatedAt`, `skippedRHomeExecution` (or equivalent).
- Keep `getHomeControllerState()` / compat shim unchanged unless new fields require doc-only note.

#### Explicitly not in 6e-b

| Item | Deferred to |
|------|-------------|
| `requestHomeReconcile` at notify tails | Phase 6e-c (+ `index.html` approval) |
| Remove / replace `rHome` tail `reconcileHomeLayout('rHome')` | Phase 6e-c or later coordinated change |
| Coalesce `rHome` request with tail execute into single controller-owned call | Later; requires `index.html` |
| Home-active DOM checks inside controller | Avoid; use legacy predicate or defer to 6e-c |

### Phase 6e-c preview (planning only, not 6e-b)

When `index.html` edits are approved:

- Add thin guarded `requestHomeReconcile('<reason>')` after existing `notifyCueChange` / `notifyGigSlotChange` / `notifyImageRefresh` tails (not inside cue HTML bodies).
- Reasons examples: `cue:visible`, `cue:hidden`, `gig:countdown`, `image:refresh` (exact strings fixed at implementation).
- Coalescer flush (non-`rHome`) executes legacy reconcile at most once per coalesced window while Home is active.
- Revisit `rHome` tail: either keep dedupe guard or migrate sole execution to coalescer with tail hook removed (coordinated single commit).

---

## 6. Why the controller must not directly become layout owner

| Risk if controller owns layout | Mitigation |
|--------------------------------|------------|
| Duplicates budget math already in `oot_home_layout_engine.js` | Delegate to legacy reconcile only |
| Reintroduces banned rescue patterns (`HomeLayoutContract`, footprint attrs, etc.) | Controller stays string-clean; layout module stays executor |
| Breaks pilot gating / `legacy-overlay` default | No controller writes to layout mode or tokens |
| Splits reconcile ownership (listener ad-hoc + controller + rHome tail) | Single delegate path from coalescer flush only |
| Makes rollback harder | Controller orchestration revert does not require layout module revert |

**Invariant:** `reconcileHomeLayout === OOT.home.layout.reconcile` (global shim). Controller may **call** it; it must not **be** it.

---

## 7. Why listener paths must not create new reconcile execution

| Anti-pattern | Why forbidden in 6e-b |
|--------------|----------------------|
| `reconcileHomeLayout(...)` inside `renderHomeSongVoteCue` / `renderHomeRehearsalCue` | Reconcile storms under Firestore bursts; bypasses coalescer |
| Second ad-hoc hook in cue HTML / onclick handlers | Violates single logical owner; untestable ordering |
| Reconcile before `syncAlertRailState` on listener paths | Stale alert rail inputs (violates P6-6 spirit) |
| Reconcile when Home tab inactive | Wasted work; wrong lifecycle (pre-existing gap is acceptable until coalesced path exists) |

**Correct pattern (6e-c target):** listener tail -> legacy DOM/sync unchanged -> `notify*` (record) -> `requestHomeReconcile` (coalesce) -> **one** coalescer flush -> legacy reconcile delegate.

6e-b establishes the last arrow only, without opening the listener `requestHomeReconcile` seam yet.

---

## 8. Allowed files (future 6e-b implementation)

| File | Permitted change |
|------|------------------|
| `oot_home_controller.js` | Guarded flush delegate; `rHome` skip; phase bump; coalescer state extensions; optional `reconcileCoalesceExecute` record |
| `oot_compat_home.js` | Only if shim needs explicit `getReconcileCoalescerState` global (optional; not required if `getHomeControllerState` suffices) |
| `tests/integrity/home-controller-package.mjs` | Prove delegate path, `rHome` dedupe, no banned strings, no forbidden DOM hooks |
| `tests/integrity/home-layout-engine-package.mjs` | Only if invariant text needs coalescer-delegate allowance (unlikely if `index.html` untouched) |
| `docs/modularization/` | Optional `PHASE_6E_B_MANUAL_VERIFICATION.md` after smoke or blocker note |

**Not allowed in 6e-b:** `index.html` (per current hard boundary).

---

## 9. Forbidden files / edits

| Forbidden | Reason |
|-----------|--------|
| `index.html` | No notify-tail `requestHomeReconcile`; no `rHome` tail reorder in 6e-b |
| `oot_home_layout_engine.js` / `.css` | No budget tuning; implementation stays in layout module |
| `oot_home_band_image.js` | No image layout/framing changes |
| `oot_home_gig_slot.js` | No gig behavior changes |
| `oot_home_alert_rail.js` | Alert sync stays legacy-triggered |
| Home CSS / cue HTML / pill placement | Out of scope |
| Calendar, Chat, Songs, Setlists, Flyers, Pay | Out of scope |
| Firebase config/rules, OneSignalSDKWorker.js | Out of scope |
| opM/clM modal infrastructure | Out of scope |
| `oot-local-server.ps1` | Local-only; do not commit or debug |
| Default `modular-inflow` | Hard boundary |
| Banned rescue paths | `HomeLayoutContract`, `_homeMaybeLockAlertsFootprint`, `data-home-alerts-reserved`, `data-home-gig-pending`, etc. |
| CDP / temp smoke scripts | See `PHASE_6D_LOCAL_SMOKE_BLOCKER_NOTE.md` |
| Local server debugging loops | One short attempt max; then stop |
| `main` merge | Out of scope |

---

## 10. Required integrity gates

All five packages must pass before any 6e-b commit:

```powershell
$node = "C:\Users\rescarcega\AppData\Local\Programs\cursor\resources\app\resources\helpers\node.exe"
Set-Location "C:\Users\rescarcega\Documents\outoftimeband"
& $node tests/integrity/home-layout-engine-package.mjs
& $node tests/integrity/home-diag-package.mjs
& $node tests/integrity/home-alert-rail-package.mjs
& $node tests/integrity/home-gig-slot-package.mjs
& $node tests/integrity/home-controller-package.mjs
```

### Static invariants (add/update for 6e-b)

- Controller contains coalescer flush delegate to legacy reconcile (symbol reference allowed; implementation stays external).
- Controller does **not** embed budget formulas or banned strings.
- **`rHome` dedupe:** coalescer must not invoke legacy reconcile when `pendingReason === 'rHome'` (integrity test or documented guard string).
- Exactly **one** `reconcileHomeLayout('rHome')` hook remains in `index.html` (unchanged count).
- No new `reconcileHomeLayout` call sites in `index.html` or cue renderers.
- Controller must not add `document.getElementById`, `querySelector`, `classList`, `setProperty` (existing forbidden list).
- Phase 6d `enterHomeTab('go')` delegate preserved.
- No static `data-home-layout-mode="modular-inflow"` in HTML.
- Protected modules untouched: band image, alert rail, gig slot, layout engine CSS.

### Manual verification (when smoke available)

Follow `PHASE_6D_LOCAL_SMOKE_BLOCKER_NOTE.md`:

1. Integrity + forbidden checks first.
2. One short browser smoke attempt on known-good server only; stop if blocked.
3. No CDP runners unless explicitly approved.

When smoke works:

- Default `legacy-overlay`; pilot opt-in only.
- `rHome()` still produces exactly one layout reconcile (no double execute from coalescer).
- `getHomeControllerState().reconcileCoalescer` shows flush records; `skippedRHomeExecution` or equivalent on `rHome` path.
- Phase 6d `go('home')` path unchanged.

Before measurement snippets: `OOT_HOME_LAYOUT_DIAG.disable();`  
Use `getHomeControllerState()` (not `OOT_HOME_CONTROLLER.getSnapshot`).

---

## 11. Pass / fail criteria

### Pass

- All five integrity scripts exit 0.
- Coalescer flush delegate exists with `rHome` skip guard (behavior-neutral on current call graph).
- No double `reconcileHomeLayout` on `rHome()` path.
- Listener paths still record-only (`notify*` only; no new reconcile executions).
- Legacy-overlay default unchanged; pilot opt-in only.
- No forbidden file diffs (especially `index.html`, layout CSS, cue HTML, protected modules).
- Phase 6d `enterHomeTab` behavior preserved.
- Controller does not implement layout math; banned strings absent.

### Fail

- Coalescer invokes legacy reconcile on `rHome` path while tail hook still executes (double reconcile).
- New `reconcileHomeLayout` call site in cue renderers or listener HTML paths.
- Controller embeds budget logic or banned rescue strings.
- Missed `rHome` tail reconcile (if tail hook accidentally removed or gated).
- Reconcile storm from premature listener wiring.
- Song Vote pill fix, budget tune, or pilot default smuggled in.
- Local server debugging treated as app failure.

---

## 12. Rollback criteria

Revert 6e-b commit if:

- Any pass criterion fails on integrity or manual smoke (when available).
- Double reconcile detected on `rHome()` path.
- Controller delegate regresses legacy-overlay layout on default path.
- Forbidden file touched or banned string introduced.

**Action:** `git revert <6e-b-commit>` (or reset to `4d0c7c8` if unpushed). No migration.

6e-a scaffold remains valid rollback target.

---

## 13. Small commit boundary

**Single commit (6e-b):**

`Wire guarded coalescer flush delegate to legacy reconcile (Phase 6e-b)`

Includes:

- `oot_home_controller.js` delegate + `rHome` skip + phase bump + coalescer observability fields
- `tests/integrity/home-controller-package.mjs` updates

Optional follow-up (separate approval):

- `docs/modularization/PHASE_6E_B_MANUAL_VERIFICATION.md` (docs-only, after smoke or blocker note)

**Do not combine with:**

- `index.html` notify-tail `requestHomeReconcile` (6e-c)
- `rHome` tail hook removal
- Song Vote pill fix, budget tune, pilot default, `main` merge

**Next phase after 6e-b:** Phase 6e-c - listener `requestHomeReconcile` wiring (`index.html` approval required).

---

## 14. Explicit stop point

**This document is planning only.**

- **No Phase 6e-b implementation** in this commit.
- **No `index.html` edits.**
- **No local server work.**
- **No CDP automation.**
- **No Phase 7 / pilot promotion.**

Await explicit user approval of the Section 5 candidate boundary before any code changes.
