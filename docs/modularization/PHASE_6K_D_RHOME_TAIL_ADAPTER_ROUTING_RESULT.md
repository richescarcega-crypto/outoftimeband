# Phase 6k-d rHome Tail Adapter Routing Result

**Branch:** `modularization-home-layout-engine-pilot`  
**Implementation baseline:** `a5734e7` — *Add rHome tail controller adapter* (uncommitted 6k-d slice on top)  
**Scope:** Exclusive normal-path routing through HomeController adapter — **legacy fallback preserved**  
**Production default:** `legacy-overlay` (pilot opt-in only)

Reference: `PHASE_6K_C_RHOME_TAIL_ADAPTER_RESULT.md`, `PHASE_6K_A_RHOME_RECONCILE_INVENTORY.md`, `PHASE_6K_RHOME_COALESCER_MIGRATION_PLAN.md`

---

## Browser verification waiver

**Explicitly approved by user** for Phase 6k-d under blocked work-computer local server path (`PHASE_6J_CANDIDATE_A_VERIFICATION_RESULT.md`).

| Item | Status |
|------|--------|
| Local browser smoke | **Not attempted** (waived) |
| Local server debugging | **Not attempted** |
| Verification basis | Static integrity gates + code review |

---

## Summary

Phase 6k-d routes the **normal** `rHome()` tail reconcile path exclusively through `HomeController.requestRHomeTailReconcile({ source: 'rHome:tail' })`. Legacy `requestHomeReconcile('rHome')` + `reconcileHomeLayout('rHome')` remain **only** in the fallback `else` branch when the adapter is unavailable. Adapter ownership of request + direct delegate reconcile is unchanged in behavior; reason string remains **`rHome`**.

**Not committed** unless user approves after review.

---

## Files changed

| File | Change |
|------|--------|
| `index.html` | Exclusive adapter routing with `{ source: 'rHome:tail' }`; fallback else preserved |
| `oot_home_controller.js` | Adapter records `source` in result; `routed: true` marker |
| `tests/integrity/home-controller-package.mjs` | Phase 6k-d routing invariants |
| `tests/integrity/home-layout-engine-package.mjs` | Diff allowlist for 6k-d tail routing |
| `docs/modularization/PHASE_6K_D_RHOME_TAIL_ADAPTER_ROUTING_RESULT.md` | This result record |

No other files modified.

---

## Exact routing change

### Before (Phase 6k-c)

- `var _ootHc = …`; `_ootHc.requestRHomeTailReconcile()` primary
- Fallback else with legacy hooks

### After (Phase 6k-d)

```javascript
try { _recordRHomeTailReconcileDiag(); } catch(e){}
try {
  if (window.OOT && window.OOT.home && window.OOT.home.controller &&
      typeof window.OOT.home.controller.requestRHomeTailReconcile === 'function') {
    window.OOT.home.controller.requestRHomeTailReconcile({ source: 'rHome:tail' });
  } else {
    try { if (typeof requestHomeReconcile === 'function') requestHomeReconcile('rHome'); } catch(e){}
    try { reconcileHomeLayout('rHome'); } catch(e){}
  }
} catch(e){}
```

### Normal-path ownership (adapter)

1. `_record('requestRHomeTailReconcile', 'rHome', payload)`
2. `requestReconcile('rHome', payload)` — coalescer enqueue; **`rHome` delegate skip unchanged**
3. `_resolveLegacyReconcileDelegate()` → `delegate.call(window, 'rHome')`

**Reason string:** `'rHome'` preserved on request and delegate call.

---

## Fallback path preserved

When `requestRHomeTailReconcile` is unavailable:

```javascript
requestHomeReconcile('rHome');
reconcileHomeLayout('rHome');
```

Integrity tests require exactly **one** of each in `index.html`, located only in the fallback `else` branch.

---

## Non-changes confirmed

- No CSS edits
- No Home visual behavior changes
- No layout budget constant tuning
- No cue / pill / band image changes
- No coalescer `rHome` skip removal (full migration not done)
- No `modular-inflow` default enablement
- No broad hook rollout
- No local server debugging

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

Key 6k-d assertions: diagnostic before adapter; normal path has no direct legacy hooks; fallback else retains both hooks; adapter owns `requestReconcile('rHome')` and `delegate.call(window, 'rHome')`.

---

## Recommended next boundary

1. **Commit 6k-d** when user approves, then  
2. **Phase 6k-e** — bounded verification record (integrity + optional diag read of `__ootGetRHomeTailDiag()` / controller journal on known-good path when available), **or**  
3. **Phase 6k-f** — document stack stop / handoff per migration plan, **or**  
4. **Future coalescer migration slice** — remove coalescer `rHome` skip + legacy fallback only with new approved plan and live verification.

Do **not** remove fallback else branch or enable coalescer-only `rHome` execute without explicit approval.

---

## Hard stop

- Narrow **routing ownership** step only — not full tail migration completion.
- **`oot-local-server.ps1`** remains untracked and was not edited.
- **No merge to `main`.**
