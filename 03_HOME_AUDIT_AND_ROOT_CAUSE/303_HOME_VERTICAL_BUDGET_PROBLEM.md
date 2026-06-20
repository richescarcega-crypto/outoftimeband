# Home Vertical Budget Problem

## Purpose

Explain why Home breaks in dense states without treating it as an image-registry defect. Informs `HomeLayoutEngine` design requirements for Phase 5.

Production baseline: `8a7ecc6` (legacy overlay model).

---

## The column model

`#sc-home` is a fixed-height flex column (`overflow: hidden`). Height equals available space in `#cnt` above the bottom tab bar. Every in-flow child consumes stack height; the band viewport (`#home-social-row`, `flex: 1`) receives only the **remainder**.

### Named slots (target model)

```
#sc-home
├── slot-hero-logo      (.hero.home-hero-with-controls)
├── slot-announcement   (#announce-card) — optional/hidden
├── slot-birthday       (#birthday-banner) — 0 or natural height (~50–60px)
├── slot-action-rail    (#home-alerts-row) — 0 (overlay) or explicit in-flow (target)
├── slot-gig-card       (#next-gig-countdown | #no-gigs-card) — 144px
├── slot-band-viewport  (#home-social-row) — flex remainder
└── (external) bottom-nav — #tabs + safe-area
```

---

## Production overlay behavior (legacy)

When cues are visible, r798/r823 treat `#home-alerts-row` as:

- `height: 0; max-height: 0` in layout stack
- `transform: translateY(-58px)` to paint pills over lower logo

**Visual space ≠ layout space.** This freed ~64px for the band region vs a true in-flow rail — but created fragility:

- Pills anchored from DOM position **after** `#birthday-banner`
- `:has()` CSS depends on inline `style="display: block"` on cues
- Tab return may re-render cues in different order than CSS expects

---

## Failed in-flow experiment (v2.1 — banned)

When the layout-contract path reserved a **real** 64px in-flow alert slot:

### Example budget at ~552px `#sc-home` (cue + birthday + gig)

| Region | Height |
|--------|--------|
| Hero (dense/r823) | 324px |
| Birthday banner | ~58px |
| Alert rail (in-flow) | **64px** |
| Gig slot | 144px |
| Gaps + padding | ~20px |
| **Consumed** | **~610px** |
| **Remainder for band** | **negative → clamped to ~20px** |

Diagnostics observed `socialRow.clientHeight ≈ 20` while `alertsRow.clientHeight ≈ 64`.

The backdrop (`.home-band-backdrop { height: 100% }`) painted into a ~20px-tall box. Registry values were unchanged; feet cropped and FB/IG clipped.

---

## Overlay-era dense state (production baseline)

Same example **without** in-flow 64px (zero-height overlay row):

| Region | Stack height |
|--------|-------------|
| Hero | 324px |
| Birthday | ~58px |
| Alert rail | **0px** (overlay) |
| Gig | 144px |
| Gaps + pad | ~20px |
| **Consumed** | **~546px** |
| **Band remainder** | **~6–50px** depending on device — still tight with birthday |

Overlay helps but does not solve birthday + dual-cue + gig on all viewports. Hence target state is explicit **in-flow budget** in `HomeLayoutEngine`, not overlay patches.

---

## v3 hero compression failure (banned)

v3 tried to subtract band target from hero:

```css
--home-hero-h-computed: calc(100% - gig - alerts - birthday - gaps - band-target);
height: clamp(200px, computed, 318px);
```

Problems:

1. Still depended on v2.1 in-flow 64px alert reservation.
2. Birthday was subtract term, not first-class `flex: 0 0 var(--slot-birthday-h)`.
3. Band protected by hero shrink, not by guaranteed flex remainder.
4. Did not fix overlay vs in-flow model conflict.

---

## Target `HomeLayoutEngine` requirements

Derived from this analysis. **Not** a copy of v1–v3.

1. **One vertical budget equation** — all slots sum to ≤ 100% of `#sc-home` minus guaranteed band minimum.
2. **Band minimum token** — e.g. `clamp(96px, 22%, 140px)` applied as flex remainder floor, not hero subtract hack.
3. **Birthday as first-class slot** — `flex: 0 0 auto` with optional compact token when dense.
4. **In-flow alert rail in target state** — real height, no `translateY` as primary mechanism.
5. **Feature flag** — `legacy-overlay` default until `modular-inflow` passes H0–H12.
6. **Responsive** — percentage-based tokens; no S26-only magic numbers in final engine.
7. **White-label** — tokens overridable per tenant via `data-home-layout-mode` + theme JSON (future).

---

## Diagnostic signals

When vertical budget is exhausted:

| Signal | Bad value |
|--------|-----------|
| `socialRow.clientHeight` | < 96px with cues visible |
| `backdrop.clientHeight` | ≪ `socialRow.clientHeight` |
| `alertsRow.clientHeight` | 64 in-flow + overlay CSS both active (conflict) |
| Visual | Feet cropped; pills low; FB/IG clipped |

Phase 1 `oot_home_diag.js` should capture these on H6, H8 without changing layout.

---

## Related documents

- `300_HOME_ROOT_CAUSE_SUMMARY.md`
- `201_HOME_TARGET_MODULES.md` — `HomeLayoutEngine`
- `203_HOME_ACCEPTANCE_CRITERIA.md` — H-matrix gates
- `302_FAILED_HYPOTHESES.md` — banned v3 approach
