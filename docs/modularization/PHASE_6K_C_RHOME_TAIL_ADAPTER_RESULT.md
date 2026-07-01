# Phase 6k-c rHome Tail Adapter Result

**Branch:** `modularization-home-layout-engine-pilot`  
**Implementation baseline:** `0001e2e` — *Add rHome tail reconcile diagnostics* (uncommitted 6k-c slice on top)  
**Scope:** HomeController adapter passthrough seam — **no full migration, no behavior change**  
**Production default:** `legacy-overlay` (pilot opt-in only)

Reference: `PHASE_6K_B_RHOME_TAIL_DIAG_RESULT.md`, `PHASE_6K_A_RHOME_RECONCILE_INVENTORY.md`, `PHASE_6K_RHOME_COALESCER_MIGRATION_PLAN.md`

---

## Summary

Phase 6k-c adds **`requestRHomeTailReconcile()`** on HomeController as a narrow passthrough adapter for the `rHome()` tail reconcile path. The adapter preserves the existing sequence: record/coalesce `rHome` request (coalescer still skips delegate) then **synchronous direct** `reconcileHomeLayout('rHome')` via legacy delegate. Legacy fallback in `index.html` remains if the adapter is unavailable.

**Not committed** unless user approves after review.

---

## Files changed

| File | Change |
|------|--------|
| `oot_home_controller.js` | `requestRHomeTailReconcile(options)` adapter method + API export |
| `index.html` | Route `rHome` tail through adapter with legacy else fallback |
| `tests/integrity/home-controller-package.mjs` | Phase 6k-c static invariants |
| `tests/integrity/home-layout-engine-package.mjs` | Diff allowlist for adapter tail seam |
| `docs/modularization/PHASE_6K_C_RHOME_TAIL_ADAPTER_RESULT.md` | This result record |

No other files modified.

---

## Adapter method added

### `HomeController.requestRHomeTailReconcile(options)`

| Property | Detail |
|----------|--------|
| Location | `oot_home_controller.js` |
| Safe with no options | Yes — defaults reason `'rHome'` |
| DOM/CSS/localStorage | **No writes** |
| Timers / listeners | **None** |
| Calls `rHome()` | **No** |
| Journal | Records `requestRHomeTailReconcile` via `_record` |
| Passthrough step 1 | `requestReconcile('rHome')` — same coalescer enqueue + `rHome` skip behavior |
| Passthrough step 2 | `_resolveLegacyReconcileDelegate()` then `delegate.call(window, 'rHome')` — same direct layout reconcile |
| Return value | `{ reason: 'rHome', requested, reconciled, passthrough: true }` |

---

## rHome tail behavior preserved

### Static order in `rHome()` (unchanged semantics)

1. `_homeLayoutDiagSnapshot('rHome:end')`
2. `_recordRHomeTailReconcileDiag()` *(Phase 6k-b)*
3. **Adapter path (primary):** `OOT.home.controller.requestRHomeTailReconcile()`
4. **Legacy fallback (else):** `requestHomeReconcile('rHome')` then `reconcileHomeLayout('rHome')`

### Invariants preserved

| Invariant | Status |
|-----------|--------|
| Exactly one effective request + reconcile per tail pass (adapter **or** fallback, not both) | Preserved |
| Coalescer skips delegate for `rHome` reason | Preserved (adapter uses `requestReconcile`, not coalescer execute for tail) |
| Synchronous direct layout reconcile after request | Preserved (adapter calls delegate immediately) |
| No duplicate tail hooks when adapter available | Preserved |
| `modular-inflow` default | Not enabled |

---

## Fallback path

If `window.OOT.home.controller.requestRHomeTailReconcile` is unavailable, `index.html` executes the **exact prior tail**:

```javascript
try { if (typeof requestHomeReconcile === 'function') requestHomeReconcile('rHome'); } catch(e){}
try { reconcileHomeLayout('rHome'); } catch(e){}
```

Integrity tests require this fallback to remain in the `else` branch.

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

Controller package asserts: adapter exists; no DOM/CSS/localStorage/timers/listeners/rHome calls; preserves `'rHome'` reason strings; diag before adapter; legacy fallback present.

---

## Browser / manual verification

| Item | Status |
|------|--------|
| Local browser smoke | **Not run** |
| Blocker | Work-computer local server path remains blocked per `PHASE_6J_CANDIDATE_A_VERIFICATION_RESULT.md` |
| Live adapter observation | Deferred — static gates only |

---

## Non-changes confirmed

- No CSS edits
- No Home visual behavior changes
- No layout budget constant tuning
- No cue renderer / pill placement changes
- No band image layout changes
- No broad hook rollout
- **No full rHome tail migration** (coalescer-only execute not enabled; direct delegate preserved in adapter)

---

## Recommended next boundary

Per `PHASE_6K_RHOME_COALESCER_MIGRATION_PLAN.md`:

1. **Commit 6k-c slice** when user approves, then  
2. **Phase 6k-d** — route tail exclusively through adapter with feature-flag fallback **only** after browser verification on known-good path or explicit waiver, **or**  
3. **Candidate E handoff** if pausing runtime work.

Do **not** remove legacy fallback or coalescer `rHome` skip without a new approved plan and live verification.

---

## Hard stop

- Adapter is a **passthrough seam**, not migration completion.
- **`oot-local-server.ps1`** remains untracked and was not edited.
- **No merge to `main`.**
- **`modular-inflow` remains opt-in only.**
