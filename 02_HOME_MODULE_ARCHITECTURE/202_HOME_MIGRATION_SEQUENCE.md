# Home Migration Sequence

## Principles

1. **Documentation before code** — Phase 0 completes before any `index.html` or module edit.
2. **One seam at a time** — each phase has a single primary extraction or feature.
3. **Zero visual regression by default** — Phases 1–4 are move-only or read-only unless explicitly gated.
4. **Never reintroduce the banned layout-contract path** — see `200_ARCHITECTURE_MANDATE.md`.
5. **`HomeLayoutEngine` is new work** — not a port of v1–v3 rules or a v4 overlay recovery patch.
6. **Production stays on legacy overlay** until Phase 5 `modular-inflow` passes the full H-matrix on device.

## Phase summary

| Phase | Name | App behavior change | Primary deliverable |
|-------|------|---------------------|-------------------|
| **0** | Architecture freeze | **None** | This document set |
| **1** | Diagnostics seam | **None** (read-only) | `oot_home_diag.js` |
| **2** | Band image boundary | **None** (move-only) | `oot_home_band_image.js` |
| **3** | Alert rail state | **None** (read-only state attr) | `oot_home_alert_rail.js` state API |
| **4** | Gig slot footprint | **Minimal** (delegate footprint only) | `oot_home_gig_slot.js` |
| **5** | Layout engine | **Flagged pilot only** | `oot_home_layout_engine.js` + `modular-inflow` flag |
| **6** | Home controller | **Navigation orchestration** | `oot_home_controller.js` |
| **7** | Legacy CSS retirement | **Production promotion** | Remove overlay CSS; single owner |

---

## Phase 0 — Architecture freeze (current)

**Branch:** `modularization-home-pilot`

**Actions:**
- Publish `02_HOME_MODULE_ARCHITECTURE/`, `03_HOME_AUDIT_AND_ROOT_CAUSE/`, `16_NEXT_THREAD_OPERATING_PLAN/`.
- Record production baseline: `8a7ecc6`.
- Record banned paths and H0–H12 test matrix.

**Exit criteria:**
- All Phase 0 docs merged on pilot branch.
- `index.html` and `oot_*.js` untouched.

---

## Phase 1 — First seam: `oot_home_diag.js` only

**Branch:** `modularization-home-diag-extract` (from pilot)

**Scope:**
- Re-extract `OOT_HOME_LAYOUT_DIAG` / `_homeLayoutDiagSnapshot` as external module.
- Wire like r941: `<script src="oot_home_diag.js">` + thin compat guard in `index.html`.
- Add integrity check for load order and `window.OOT.home.diag` namespace.

**Explicit constraints:**
- **Zero visual behavior change.**
- No layout CSS edits.
- No registry value changes.
- No cue renderer body changes.
- No Firestore or other-tab changes.
- Gated by `localStorage` / dev flag; off by default in production unless explicitly enabled.

**Exit criteria:**
- `OOT_HOME_LAYOUT_DIAG.enable()` works.
- H0 and H8 snapshots capturable.
- Integrity test passes.
- Side-by-side screenshot vs `8a7ecc6` shows no visual delta.

---

## Phase 2 — `oot_home_band_image.js` (registry boundary)

**Scope:**
- Move `HOME_IMAGE_PRESENTATION` tables, `_applyHomeImagePresentation`, `_refreshHomeImagePresentation`, `_scheduleHomeImagePresentationRefresh`, presentation observer.
- `index.html` keeps thin shim calling `window.OOT.home.bandImage.*`.
- **Move only — same outputs.**

**Exit criteria:**
- Registry diff zero on all H-states.
- `OOT_HOME_IMAGE_QA` still works.
- No new image-position CSS blocks.

---

## Phase 3 — `oot_home_alert_rail.js` (state only)

**Scope:**
- Extract read-only `getAlertRailState()` → `none` | `song` | `rehearsal` | `both`.
- Module may set `data-home-alert-state` on `#sc-home`.
- **Does not** change overlay CSS or cue renderer bodies.

**Exit criteria:**
- State matches visual cue presence on H1–H3.
- No layout CSS changes.

---

## Phase 4 — `oot_home_gig_slot.js` (footprint owner)

**Scope:**
- Extract gig pending footprint + `--home-gig-slot-h` application.
- `updateCountdown()` delegates footprint to module; content logic remains in `index.html` initially.

**Exit criteria:**
- H4, H5, H12 pass.
- No countdown styling outside `#sc-home`.

---

## Phase 5 — `oot_home_layout_engine.js` (new in-flow model)

**Scope:**
- Implement **new** vertical budget: hero, optional birthday, **in-flow** alert rail, gig slot, band viewport.
- Feature flag on `#sc-home`:
  - `data-home-layout-mode="legacy-overlay"` — **default** (production)
  - `data-home-layout-mode="modular-inflow"` — pilot only
- Design from tokens + `203_HOME_ACCEPTANCE_CRITERIA.md`; **do not** port v1–v3 rules.

**Exit criteria:**
- `modular-inflow` passes full H0–H12 matrix on S26 (or equivalent device).
- `legacy-overlay` unchanged for production default.

---

## Phase 6 — `oot_home_controller.js`

**Scope:**
- Replace `go('home') → rHome()` with `HomeController.activate()`.
- Controller sequences submodules; `rHome()` becomes thin data renderer.
- Tab-return reconciliation for Chat→Home (H8) without `_onHomeActivated()` timing hacks.

**Exit criteria:**
- H8, H9 stable under diag.
- No banned-path regressions.

---

## Phase 7 — Legacy CSS retirement

**Scope:**
- Remove r798/r824 overlay rules when `modular-inflow` is production default.
- Inventory and delete obsolete `#home-social-row` / backdrop CSS.
- Migrate inline cue styles to module-owned classes (optional sub-phase).

**Exit criteria:**
- Single layout owner (`HomeLayoutEngine`).
- Full H-matrix green on production flag.
- Banned list items absent from `index.html`.

---

## First code-seam selection criteria

Applies to Phase 1 (`oot_home_diag.js`).

| Criterion | Required |
|-----------|----------|
| Zero production visual change | Yes |
| Read-only or move-only | Yes |
| Single bounded extraction (<200 lines target) | Yes |
| No failed-path reuse | Yes |
| Integrity enforceable | Yes |
| Aids H8/H9 diagnosis | Yes |
| Home-only surface | Yes |
| `oot_*` + `oot_compat_*` pattern | Yes |
| Dev-gated by default | Yes |

**Why diagnostics first:** supports the unresolved Chat→Home bug without touching layout. Was proven at `48f9144` and removed only because it shipped in the same rollback bundle as the failed layout-contract path.

**Explicitly not first seam:** `HomeLayoutEngine`, alert rail render rewrite, any overlay/contract CSS patch.

## Related documents

- `201_HOME_TARGET_MODULES.md` — module owners
- `203_HOME_ACCEPTANCE_CRITERIA.md` — H-matrix gates
- `1600_NEXT_THREAD_PLAN.md` — immediate next thread actions
