# Next Thread Operating Plan

## Context

| Item | Value |
|------|-------|
| Branch | `modularization-home-pilot` |
| Phase | **0 complete** after this doc set lands |
| Production baseline | `8a7ecc6` |
| App code | **Unchanged** through Phase 0 |

## Immediate objective

Complete Phase 0 documentation, then open Phase 1 branch for `oot_home_diag.js` extraction — **read-only diagnostics, zero visual behavior change**.

---

## Step 1 — Merge Phase 0 docs (this thread)

**Actions:**
- [ ] Review nine files under `02_HOME_MODULE_ARCHITECTURE/`, `03_HOME_AUDIT_AND_ROOT_CAUSE/`, `16_NEXT_THREAD_OPERATING_PLAN/`
- [ ] Commit on `modularization-home-pilot` when approved
- [ ] Do **not** edit `index.html`, `oot_*.js`, or CSS in this step

**Exit:** All architecture docs present; team aligned on banned list and H-matrix.

---

## Step 2 — Open Phase 1 branch

```text
git checkout modularization-home-pilot
git checkout -b modularization-home-diag-extract
```

**Scope:** `oot_home_diag.js` only (+ integrity test + thin `index.html` script tag / compat guard).

**Hard limits:**
- Zero visual behavior change
- No layout CSS
- No registry changes
- No cue renderer body changes
- No Firestore / other-tab changes
- Do not reintroduce layout-contract CSS or footprint-lock JS

---

## Step 3 — Implement Phase 1 diagnostics module

**Reference pattern:** r941 (`oot_version_r941.js` + `oot_compat_r941.js` + integrity package).

**Deliverables:**
1. `oot_home_diag.js` — `window.OOT.home.diag` with `enable()`, `disable()`, `dump()`, `_homeLayoutDiagSnapshot()`
2. `oot_compat_home.js` — restore legacy globals if needed
3. `index.html` — script tags + thin guard only (minimal diff)
4. `tests/integrity/` — load order + namespace check (when test scaffold exists)

**Reconstruct from:** commit `48f9144` diagnostics implementation (pre-contract); do not bundle layout-contract code.

---

## Step 4 — Device baseline capture

**Before any layout work:**

1. Enable diag on Phase 1 build.
2. Capture H0, H1, H6, **H8** (Chat→Home) on primary device.
3. Store screenshots + `dump()` output as pilot baseline.
4. Compare visually to `8a7ecc6` — must be identical (Phase 1 gate).

---

## Step 5 — Phase 2+ queue (do not start until Phase 1 green)

| Order | Branch | Module |
|-------|--------|--------|
| 2 | `modularization-home-band-image-extract` | `oot_home_band_image.js` |
| 3 | `modularization-home-alert-state` | `oot_home_alert_rail.js` (state only) |
| 4 | `modularization-home-gig-slot` | `oot_home_gig_slot.js` |
| 5 | `modularization-home-layout-engine` | `oot_home_layout_engine.js` (flagged) |
| 6 | `modularization-home-controller` | `oot_home_controller.js` |
| 7 | `modularization-home-legacy-retire` | Overlay CSS removal |

---

## Do not do in next thread

- Merge layout CSS to `main`
- Reintroduce Home layout contract v1–v3 or v4 overlay recovery
- Tune `HOME_IMAGE_PRESENTATION` values for layout symptoms
- Add `_onHomeActivated()` timing wrapper
- Rewrite cue renderer onclick paths
- Touch Calendar, Chat, Songs, Setlists, Firebase, Pay, Display Mode

---

## Decision checklist before Phase 1 PR

| Question | Required answer |
|----------|-----------------|
| Does diff touch layout CSS? | No |
| Does diff change registry values? | No |
| Does diff change cue HTML bodies? | No |
| Does integrity test pass? | Yes |
| H0 visual match vs `8a7ecc6`? | Yes |
| H8 diag capture possible? | Yes |

---

## Document index

| Path | Content |
|------|---------|
| `02_HOME_MODULE_ARCHITECTURE/200_ARCHITECTURE_MANDATE.md` | Mandate + banned list |
| `02_HOME_MODULE_ARCHITECTURE/201_HOME_TARGET_MODULES.md` | Module map |
| `02_HOME_MODULE_ARCHITECTURE/202_HOME_MIGRATION_SEQUENCE.md` | Phases 0–7 |
| `02_HOME_MODULE_ARCHITECTURE/203_HOME_ACCEPTANCE_CRITERIA.md` | H0–H12 matrix |
| `03_HOME_AUDIT_AND_ROOT_CAUSE/300_HOME_ROOT_CAUSE_SUMMARY.md` | Root cause |
| `03_HOME_AUDIT_AND_ROOT_CAUSE/301_HOME_CSS_JS_OWNERSHIP_MAP.md` | Ownership map |
| `03_HOME_AUDIT_AND_ROOT_CAUSE/302_FAILED_HYPOTHESES.md` | Rejected approaches |
| `03_HOME_AUDIT_AND_ROOT_CAUSE/303_HOME_VERTICAL_BUDGET_PROBLEM.md` | Slot math |
| `docs/modularization/HOME_LAYOUT_PILOT_AUDIT.md` | Original pilot audit (historical) |

---

## Success criteria for Phase 0 thread

- Nine doc files created
- `index.html` diff empty
- `oot_*.js` diff empty (except future Phase 1)
- Team can answer: "What is the first code seam?" → **`oot_home_diag.js`**
- Team can answer: "What is banned?" → **`200_ARCHITECTURE_MANDATE.md` banned table**
