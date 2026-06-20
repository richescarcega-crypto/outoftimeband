# Home CSS/JS Ownership Map

## Purpose

Inventory current Home ownership in `index.html` (production baseline `8a7ecc6`). This map drives migration phases and identifies which legacy systems stay temporarily vs retire later.

**Target modules:** see `201_HOME_TARGET_MODULES.md`.

---

## 1. Legacy Home social / image CSS patches

### Observed owners

- r76 through r105-era CSS blocks
- Repeated `#home-social-row` rules
- Repeated `.home-band-backdrop` rules
- Social button sizing and transform rules
- Rehearsal-state `:has(...)` overrides
- Image-index-specific rules (`data-home-image-index="1"`, `"2"`) ~8917+

### Problem

- These rules affect the same elements the registry also controls.
- High specificity and `!important` common.
- Some rules target rehearsal visibility via CSS even though registry mode handling exists in JS.

### Target module

`oot_home_band_image.js` (`HomeBandImagePresentation`)

### Required direction

- Inventory all `.home-band-backdrop` and `#home-social-row` CSS blocks.
- Mark obsolete vs transitional.
- Registry becomes sole image-placement source; CSS provides frame only.
- **Do not** add new image-position CSS blocks during migration.

---

## 2. Home alert rail

### Observed owners

| Owner | Location (approx.) | Role |
|-------|-------------------|------|
| r732 | ~11800–11865 | Dual-pill 50/50 grid when both cues visible |
| r798 | ~12525–12568 | Zero-height overlay row; `translateY(-64px)` |
| r813 | ~12593–12613 | Overlay pill paint (`height:auto`, min 58px) |
| r800 | ~12573–12584 | Logo micro-lift when alerts visible |
| r823 | ~13095–13116 | Alert-state hero 324px; `translateY(-58px)` |
| r824 | ~13124–13151 | `::before` backing behind overlay row |
| `renderHomeSongVoteCue()` | ~22713 | Song vote pill HTML + onclick |
| `renderHomeRehearsalCue()` | ~22650 | Rehearsal pill HTML + onclick |
| `_ensureHomeCueFallbackListeners()` | ~22757 | Firestore fallback re-render |

### Problem

- Alert row evolved from reusable in-flow row to transform/overlay layout.
- r798/r823: pills painted in zero-height row pulled over lower logo — **visual space ≠ layout space**.
- Fragile when logo, birthday banner, gig slot, and band image compete for viewport height.
- `:has(#home-*-cue[style*="display: block"])` selectors are order- and timing-sensitive.

### Target module

`oot_home_alert_rail.js` (`HomeAlertRail`)

### Required direction

- Compute state: `none` | `song` | `rehearsal` | `both`.
- **Target state:** explicit in-flow rail (Phase 5 `HomeLayoutEngine`).
- Preserve overlay CSS temporarily on production until in-flow passes acceptance.
- Cue renderer **bodies** stay in `index.html` until Phase 4+ wrap.

---

## 3. Home gig slot

### Observed owners

| Owner | Role |
|-------|------|
| `#next-gig-countdown` | Active gig countdown DOM |
| `#no-gigs-card` | Empty state card |
| `updateCountdown()` | ~23865 — gig selection + render |
| `renderNoGigsCard()` | ~24008 |
| r777/r778 | `--home-gig-slot-h: 144px` shared footprint (~707) |
| r823 | `margin-top:2px` on gig cards |

### Problem

- 144px lock stabilizes Next Gig vs No Gig — concept is correct.
- Footprint competes with hero, alert rail, and flex band region when not centrally budgeted.
- Failed v2 added `data-home-gig-pending` footprint JS (rolled back with contracts).

### Target module

`oot_home_gig_slot.js` (`HomeGigSlot`)

### Required direction

- Keep stable gig/no-gig footprint concept.
- Centralize pending/init reservation in module (Phase 4).
- Ensure countdown styling cannot leak outside `#sc-home` (H12).

---

## 4. Home image presentation registry

### Observed owners

| Owner | Role |
|-------|------|
| `HOME_IMAGE_PRESENTATION` | ~37363 — per-image, per-mode values |
| `HOME_IMAGE_PRESENTATION_DEFAULTS` | ~37353 |
| `_applyHomeImagePresentation()` | Inline styles on row/backdrop |
| `_refreshHomeImagePresentation()` | ~37698 |
| `_scheduleHomeImagePresentationRefresh()` | ~37707 — debounced refresh |
| `_ensureHomePresentationObserver()` | Mutation observer on rehearsal cue |
| `OOT_HOME_IMAGE_QA` | Dev QA helper ~37735 |
| Legacy `.home-band-backdrop` CSS | Competing placement rules |

### Problem

- Registry exists but is not the only source of truth.
- r594 history: inline `!important` needed because older CSS overrode registry.
- Container height collapse makes registry appear "wrong" when layout is the issue.

### Target module

`oot_home_band_image.js` (`HomeBandImagePresentation`)

### Required direction

- Phase 2: move-only extraction; zero registry value changes.
- CSS provides container frame only.
- Remove competing CSS only after inventory + acceptance gates.

---

## 5. Home layout (no single owner today)

### Observed competing regions

```
#sc-home (flex column, overflow hidden)
├── .hero.home-hero-with-controls     — r791 318px; r823 324px when cues
├── #announce-card                    — optional
├── #birthday-banner                  — rHome() inline render
├── #home-alerts-row                  — overlay or in-flow depending on era
├── #next-gig-countdown | #no-gigs-card — 144px slot
├── #home-social-row                  — flex sink; band viewport
└── (external) #tabs + safe-area
```

### Problem

- **Vertical budget problem** — see `303_HOME_VERTICAL_BUDGET_PROBLEM.md`.
- No tokenized slot model; overlay transforms substitute for real stack budgeting.

### Target module

`oot_home_layout_engine.js` (`HomeLayoutEngine`)

### Banned former owner

`HomeLayoutContract` v1–v3 (rolled back) — **never reintroduce**. See `200_ARCHITECTURE_MANDATE.md`.

---

## 6. Home tab lifecycle

### Observed owners

| Owner | Role |
|-------|------|
| `go(id, btn)` | ~24378 — tab switch; `if (id === 'home') rHome()` |
| `rHome()` | ~30687 — orchestrates countdown, birthday, cues, image refresh |
| `listenSuggestions()` | Firestore → `renderHomeSongVoteCue()` |
| `listenProposals()` | Firestore → `renderHomeRehearsalCue()` |
| `_ensureHomeCueFallbackListeners()` | Boot fallback listeners |

### Problem

- No explicit activate/deactivate lifecycle.
- Async listener renders interleave with tab switch renders.
- Chat→Home (H8) primary regression vector.

### Target module

`oot_home_controller.js` (`HomeController`) — Phase 6

---

## 7. Home diagnostics (absent on production baseline)

### History

- `_homeLayoutDiagSnapshot` / `OOT_HOME_LAYOUT_DIAG` existed at `48f9144` (diagnostics-only commit).
- Removed in rollback `8a7ecc6` (bundled with failed layout-contract removal).

### Target module

`oot_home_diag.js` (`HomeDiagnostics`) — **Phase 1 first seam**

---

## DOM reference (production `8a7ecc6`)

| Element | Between |
|---------|---------|
| `#sc-home` | `#cnt` child |
| `.hero` | top of Home stack |
| `#birthday-banner` | hero → alerts |
| `#home-alerts-row` | birthday → gig |
| `#next-gig-countdown` / `#no-gigs-card` | alerts → social |
| `#home-social-row` | flex remainder |

## Related documents

- `300_HOME_ROOT_CAUSE_SUMMARY.md`
- `202_HOME_MIGRATION_SEQUENCE.md`
- `docs/modularization/HOME_LAYOUT_PILOT_AUDIT.md` — original pilot audit (superseded by this tree for architecture)
