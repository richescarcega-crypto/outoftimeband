# Phase 6k-b rHome Tail Diagnostic Result

**Branch:** `modularization-home-layout-engine-pilot`  
**HEAD (implementation baseline):** `c741589` — *Document Phase 6k-a rHome reconcile inventory* (uncommitted 6k-b runtime slice on top)  
**Scope:** Read-only rHome tail reconcile diagnostics — **no migration, no behavior change**  
**Production default:** `legacy-overlay` (pilot opt-in only)

Reference: `PHASE_6K_A_RHOME_RECONCILE_INVENTORY.md`, `PHASE_6K_RHOME_COALESCER_MIGRATION_PLAN.md`, `PHASE_6J_CANDIDATE_A_VERIFICATION_RESULT.md`

---

## Summary

Phase 6k-b adds a **read-only diagnostic snapshot** for the `rHome()` tail reconcile path. Existing `requestHomeReconcile('rHome')` and `reconcileHomeLayout('rHome')` calls are **unchanged in behavior and order**. No CSS, layout constants, cue rendering, or migration work was performed.

**Not committed** as part of this task unless user approves after review.

---

## Files changed

| File | Change |
|------|--------|
| `index.html` | Diagnostic state object, `_recordRHomeTailReconcileDiag()` helper, `__ootGetRHomeTailDiag` getter, one call site before tail reconcile |
| `tests/integrity/home-controller-package.mjs` | Phase 6k-b static invariants |
| `tests/integrity/home-layout-engine-package.mjs` | Narrow diff allowlist for 6k-b diag lines |
| `docs/modularization/PHASE_6K_B_RHOME_TAIL_DIAG_RESULT.md` | This result record |

No other files modified.

---

## Diagnostic added

### State object

`window.__ootRHomeTailDiag` with fields:

| Field | Purpose |
|-------|---------|
| `count` | Total tail-record invocations |
| `lastAt` | Timestamp of last record |
| `lastOrder` | Fixed `'pre-tail-record'` marker |
| `recent` | Ring buffer capped at **10** entries |
| `lastHomeActive` | Whether `#sc-home` had class `on` at record time |
| `lastHadRequestHomeReconcile` | Whether `requestHomeReconcile` was a function |
| `lastHadReconcileHomeLayout` | Whether `reconcileHomeLayout` was a function |

### Helper

`_recordRHomeTailReconcileDiag()` — record-only:

- Does **not** write DOM, CSS vars, or `localStorage`
- Does **not** call `requestHomeReconcile` or `reconcileHomeLayout`
- Swallows its own errors (`try/catch`)

### Getter

`window.__ootGetRHomeTailDiag()` — returns `JSON.parse(JSON.stringify(...))` snapshot clone; read-only.

### Call site

Invoked in `rHome()` **immediately before** existing tail lines (after `_homeLayoutDiagSnapshot('rHome:end')`):

1. `_recordRHomeTailReconcileDiag()` *(new)*
2. `requestHomeReconcile('rHome')` *(preserved)*
3. `reconcileHomeLayout('rHome')` *(preserved)*

---

## rHome tail behavior preserved

| Invariant | Status |
|-----------|--------|
| Exactly one `requestHomeReconcile('rHome')` | Preserved |
| Exactly one `reconcileHomeLayout('rHome')` | Preserved |
| Order: request then reconcile | Preserved |
| Coalescer `rHome` skip + direct tail execute | Unchanged |
| No migration to HomeController execute path | **Not implemented** |

---

## Integrity gate results

Verification runner: bundled Node (`cursor` helpers `node.exe`).

| Package | Result |
|---------|--------|
| `tests/integrity/home-controller-package.mjs` | **PASS** |
| `tests/integrity/home-layout-engine-package.mjs` | **PASS** |
| `tests/integrity/home-diag-package.mjs` | **PASS** |
| `tests/integrity/home-alert-rail-package.mjs` | **PASS** |
| `tests/integrity/home-gig-slot-package.mjs` | **PASS** |

Controller package asserts: helper does not **call** reconcile APIs; `recent` cap at 10; getter returns JSON clone; tail order preserved.

---

## Browser / manual verification

| Item | Status |
|------|--------|
| Local browser smoke | **Not run** |
| Blocker | Work-computer local server path remains blocked per `PHASE_6J_CANDIDATE_A_VERIFICATION_RESULT.md` (`py` launcher unavailable) |
| Runtime observation | Diagnostic is static-code verified only; live `__ootGetRHomeTailDiag()` read deferred |

---

## Non-changes confirmed

- No CSS edits
- No Home visual behavior changes
- No layout budget constant tuning
- No cue renderer / pill placement changes
- No band image layout changes
- No broad hook rollout
- No `rHome` tail reconcile migration

---

## Recommended next boundary

Per `PHASE_6K_RHOME_COALESCER_MIGRATION_PLAN.md`:

1. **Commit 6k-b slice** when user approves (this diagnostic only), then  
2. **Phase 6k-c** — add HomeController adapter method with **no behavior change** (passthrough), **or**  
3. **Candidate E handoff** if pausing further runtime work.

Do **not** proceed to Phase 6k-d (route tail through adapter) without browser verification on a known-good path or explicit user waiver.

---

## Hard stop

- Diagnostic is **read-only** — not a migration.
- **`oot-local-server.ps1`** remains untracked and was not edited.
- **No merge to `main`.**
- **`modular-inflow` remains opt-in only.**
