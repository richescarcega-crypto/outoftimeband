# Home Target Modules

## Overview

Home modularization splits the monolithic `index.html` Home surface into named modules. Each module gets an external file, a `window.OOT.home.*` namespace, and (where needed) a thin `oot_compat_home.js` legacy-global restore following the r941 Build Version pattern.

**Production baseline:** commit `8a7ecc6`. No `oot_home_*` modules exist yet.

## Target module map

| File | Namespace | Owner responsibility | Absorbs / replaces |
|------|-----------|-------------------|-------------------|
| `oot_home_controller.js` | `window.OOT.home.controller` | Home tab lifecycle: activate/deactivate, deterministic render order, tab-return reconciliation | `go('home') → rHome()` direct coupling; scattered `rHome()` side-effect ordering |
| `oot_home_layout_engine.js` | `window.OOT.home.layout` | **Single vertical budget owner**: named regions, layout tokens, responsive height math, `data-home-layout-mode` | Legacy overlay-as-layout (r798/r823); scattered flex rules; **not** the banned v1–v3 contract stack |
| `oot_home_alert_rail.js` | `window.OOT.home.alerts` | Alert state machine (`none` \| `song` \| `rehearsal` \| `both`); one-pill / two-pill geometry; DOM class/attr application | r732 `:has()` grid; r798 zero-height + `translateY`; r824 `::before` backing as layout crutch |
| `oot_home_gig_slot.js` | `window.OOT.home.gig` | Stable 144px gig/no-gig footprint; pending/init reservation; countdown mount safety | `updateCountdown()` layout side-effects; r777/r778 scattered CSS |
| `oot_home_band_image.js` | `window.OOT.home.bandImage` | Sole image-placement authority: registry read/apply, refresh scheduling, mutation observer | `HOME_IMAGE_PRESENTATION`, `_applyHomeImagePresentation()`, `_scheduleHomeImagePresentationRefresh()`; competing `#home-social-row` / `.home-band-backdrop` CSS |
| `oot_home_diag.js` | `window.OOT.home.diag` | Dev-only region height/state snapshots; navigation-transition logging | Inline `OOT_HOME_LAYOUT_DIAG` (existed pre-contract; rolled back with layout contracts) |
| `oot_compat_home.js` | — | Thin legacy-global restore when namespaced API exists but globals missing | Inline compatibility bridges during migration |

## `HomeLayoutEngine` vs banned `HomeLayoutContract`

| | `HomeLayoutEngine` (target) | `HomeLayoutContract` v1–v3 (banned) |
|--|----------------------------|-------------------------------------|
| Status | To be built in Phase 5 | Rolled back at `8a7ecc6` |
| Mechanism | New in-flow vertical budget under feature flag | Layered CSS patches + footprint JS on legacy overlay |
| File | `oot_home_layout_engine.js` | Inline blocks at ~18627–18756 (removed from production) |
| Goal | One layout owner for white-label tenants | Emergency production recovery (failed) |

## Target render orchestration (post-migration)

```
HomeController.activate()
  → HomeLayoutEngine.applyShell()       // regions + tokens only
  → HomeAlertRail.render()              // in-flow rail (target state)
  → HomeGigSlot.render()                // gig / no-gig
  → rHome data sections (birthday, who-am-i)   // until optional birthday module split
  → HomeBandImagePresentation.apply()   // registry only
```

## Legacy systems preserved temporarily

Keep unchanged on production until the matching target module passes acceptance for that slice.

| Legacy system | Location (approx.) | Preserve because | Sunset trigger |
|---------------|-------------------|------------------|----------------|
| r798/r813/r800/r823/r824 overlay stack | `index.html` ~11800–13150 | Phone-stable production geometry | `HomeLayoutEngine` + `HomeAlertRail` pass in-flow acceptance matrix |
| r732 dual-pill `:has()` grid | ~11800–11865 | Two-cue layout in production | `HomeAlertRail` owns `both` state |
| r791/r823 hero heights (318/324px) | ~9070–9206, ~13095 | Production logo box | `HomeLayoutEngine` tokenizes hero region |
| r778 `--home-gig-slot-h: 144px` | ~707 | Stable gig footprint concept is correct | `HomeGigSlot` owns token |
| `updateCountdown()` / `renderNoGigsCard()` | ~23865+ | Gig content logic works | `HomeGigSlot` absorbs footprint + render |
| `renderHomeSongVoteCue()` / `renderHomeRehearsalCue()` bodies | ~22650–22748 | Pill HTML/onclick stable | Phase 4+ — rail module wraps; does not rewrite onclick initially |
| `HOME_IMAGE_PRESENTATION` registry + apply path | ~37353+ | Registry values correct; container layout is not | `oot_home_band_image.js` extraction |
| Legacy `#home-social-row` / `.home-band-backdrop` CSS | scattered (r76–r105 era) | Frame CSS until registry is sole placement source | Band-image module + CSS inventory pass |
| `go('home') → rHome()` | ~24378, ~30687 | Only Home entry point today | `HomeController` replaces call; keeps `rHome` shim |
| `OOT_HOME_IMAGE_QA` helper | ~37735+ | Existing dev QA path | Fold into `oot_home_diag.js` later |
| `#birthday-banner` inline renderer in `rHome()` | ~30692–30722 | Data-driven; pre-existing | Optional `oot_home_birthday.js` in Phase 6+ |

## Legacy systems to retire later

| System | Why retire | Phase |
|--------|-----------|-------|
| r798 `translateY(-64px/-58px)` overlay | Visual space ≠ layout space; fragile on birthday + tab return | Phase 7 |
| r824 `::before` backing fill | Compensates for overlay hack | Phase 7 |
| r732 / scattered `:has(cue[style*=...])` layout selectors | Fragile, order-dependent | Phase 5–7 |
| Image-index-specific CSS (`data-home-image-index="1/2"`) | Duplicates registry | Phase 2–7 |
| Inline `!important` in cue pill HTML | Fights module-owned presentation | Phase 4+ |
| r961 `min-height:340px` on `#home-social-row` | Competes with vertical budget engine | Phase 5+ |
| Monolithic `rHome()` orchestration | No single lifecycle owner | Phase 6 |

See `200_ARCHITECTURE_MANDATE.md` for the **banned / never reintroduce** list.

## Optional future module

| File | When |
|------|------|
| `oot_home_birthday.js` | Phase 6+ if birthday slot needs explicit budget token |

## Related documents

- `202_HOME_MIGRATION_SEQUENCE.md` — when each module is introduced
- `301_HOME_CSS_JS_OWNERSHIP_MAP.md` — current legacy owners
- `203_HOME_ACCEPTANCE_CRITERIA.md` — gates per module
