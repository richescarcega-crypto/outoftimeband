# Phase 6c Manual Verification — Controller Diagnostic Bridge

**Branch:** `modularization-home-layout-engine-pilot`  
**Commit:** `74514a1` — *Wire Home controller record-only notifications for Phase 6c*  
**Remote:** Synced before manual smoke (`HEAD` == `origin/modularization-home-layout-engine-pilot`)  
**Working tree:** Clean before this docs note

---

## Purpose

- Verify Phase 6c record-only `HomeController` notifications did **not** change Home behavior.
- Confirm this was **not** a visual fix phase.
- Confirm **no Phase 6d orchestration** was started.

---

## Verification environment

| Item | Value |
|------|--------|
| Server | Local PowerShell TCP server on port **18766** |
| URL | `http://localhost:18766/index.html` |
| Browser | Chrome DevTools mobile viewport |
| Default mode | Production/default tested with `oot_home_layout_pilot` cleared |
| OneSignal localhost warning | Ignored — expected / non-blocking |
| Update-check 404 for `/?_v` | Ignored — expected / non-blocking (app loaded from `/index.html`) |

Before compact console snippets, layout-diag observer noise was suppressed with:

```javascript
OOT_HOME_LAYOUT_DIAG.disable();
```

---

## Smoke results

### Layout mode / pilot gate

| Check | Result |
|-------|--------|
| Default layout mode | Remained **`legacy-overlay`** |
| `modular-inflow` default | **Not** enabled by default |
| Explicit `localStorage` opt-in (`oot_home_layout_pilot=1`) | Enabled **`modular-inflow`** |
| Opt-in removed + reload | Returned to **`legacy-overlay`** |

### HomeController telemetry (record-only)

| Metric | Result |
|--------|--------|
| `eventCount` after `rHome()` | Before **18**, after **20**, delta **+2** |
| `lastMethod` after `rHome()` | **`requestReconcile`** |
| `lastReason` after `rHome()` | **`rHome`** |
| Controller `phase` | **`6c-bridge`** |
| `controllerHasReconcile` | **`false`** |

### Visible layout stability (no new damage observed)

**Idempotent `rHome()`**

| Element | Before | After |
|---------|--------|-------|
| `#sc-home` | 860 | 860 |
| Hero | 322 | 322 |
| `#home-social-row` | 331 | 331 |

**Chat → Home tab return**

| Element | Dimensions |
|---------|------------|
| `#sc-home` | 860 |
| Hero | 322 |
| `#home-social-row` | 331 |

---

## Conclusion

**Phase 6c manual smoke: PASS**

- Phase 6c did **not** show evidence of new Home layout damage.
- Controller remains **record-only** (notifications journal intent; no DOM/CSS/storage writes from controller).
- **`reconcileHomeLayout('rHome')`** remains **legacy-executed**, not controller-routed.
- Pilot remains **opt-in only**; production/default behavior stays **`legacy-overlay`**.

---

## Known issue observed (not Phase 6c scope)

**Song Vote Pending pill placement** is still not correct. It may look slightly improved, possibly due to prior dimension/layout changes from earlier modularization work. Treat this as a **known pre-existing Home action-pill placement issue**, not a Phase 6c regression based on current evidence.

**Do not fix in Phase 6c.**

---

## Hard stop

- **No runtime files** changed by this verification note.
- **No Phase 6d** work started.
- **Next phase** (orchestration / `rHome`/`go` rewiring / coalesced reconcile) requires **separate planning approval**.
