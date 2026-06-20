# Home Root Cause Summary

## Executive summary

Home instability is a **layout ownership problem**, not a registry corruption problem. `HOME_IMAGE_PRESENTATION` values are intact; the band image looks wrong when `#home-social-row` loses height because multiple legacy CSS and JS systems compete for the same vertical space.

The permanent fix is modularization with a single layout owner (`HomeLayoutEngine`), not another CSS patch or resurrection of the failed layout-contract rescue path.

## Production baseline

| Item | Detail |
|------|--------|
| Stable production commit | `8a7ecc6` — *Rollback broken Home layout contract* |
| Rolled back commits | `33613e9` (v1), `6dd020a` (v2), `d8877a2` (v2.1), `5504a08` (v3) |
| Fixed by rollback | Next Gig countdown numbers floating across every page |
| Registry | `HOME_IMAGE_PRESENTATION` — **zero diff** between pre-contract baseline and rollback |

## Original unresolved bug

| Symptom | Detail |
|---------|--------|
| Intermittent misformat | Home can render correctly, then break after tab navigation |
| Primary repro | **Chat → Home** |
| Recovery | Full refresh sometimes restores correct layout |
| Bad state signs | Incorrect pill placement; band/social image squeezed (feet cropped) |

## What is NOT the root cause

| Hypothesis | Result |
|------------|--------|
| Registry corruption | **Ruled out** — registry unchanged; renderer applies to collapsed container |
| `rHome()` running too early after tab activation | **Insufficient** — timing wrapper tested and rejected (see `302_FAILED_HYPOTHESES.md`) |
| Missing gig-slot reservation alone | **Insufficient** — v2 footprint JS was part of the failed contract stack |

## Actual root-cause direction

Home is **over-constrained by competing layout systems** with no single owner:

| Competing region | Selectors / systems |
|------------------|---------------------|
| Logo / hero | `.hero.home-hero-with-controls`, r791 (318px), r823 (324px alert state) |
| Alert rail | `#home-alerts-row`, r798 overlay (`height:0`, `translateY`), r732 dual-pill grid |
| Gig slot | `#next-gig-countdown`, `#no-gigs-card`, r778 (144px) |
| Band viewport | `#home-social-row`, `.home-band-backdrop`, r961 min-height |
| Image placement | `HOME_IMAGE_PRESENTATION`, legacy backdrop CSS |
| Birthday | `#birthday-banner` in-flow between hero and alerts |

### Two incompatible models (pre-rollback)

The failed rescue stacked **contract-era** rules (in-flow 64px alert rail, hero `clamp()` compression, footprint-lock JS) on top of **overlay-era** rules (r798/r823/r824 zero-height row pulled over logo). They fought each other; v2.1 `transform:none` disabled overlay backing; v3 compressed hero without giving birthday its own slot.

That path is **banned**. See `200_ARCHITECTURE_MANDATE.md`.

### Vertical budget (see `303_HOME_VERTICAL_BUDGET_PROBLEM.md`)

When hero + birthday + in-flow alert rail + gig slot consume the column, `#home-social-row` collapses (~20px in live diagnostics). The backdrop paints into a tiny box — image framing looks wrong even when registry values are correct.

### Tab-navigation angle

`go('home')` calls `rHome()` synchronously (~24396, ~30687). Multiple async listeners also call cue renderers and image refresh. Competing layout systems apply at different times; **Chat → Home** may leave the DOM in a state where CSS `:has()` selectors and inline styles disagree. This requires lifecycle ownership (`HomeController`), not a delay hack.

## Target fix direction

1. Extract read-only diagnostics (Phase 1) to capture H8 transitions.
2. Establish module boundaries without visual change (Phases 1–4).
3. Build **new** `HomeLayoutEngine` in-flow model under feature flag (Phase 5).
4. Retire overlay-as-layout CSS only after acceptance matrix passes (Phase 7).

## Related documents

- `301_HOME_CSS_JS_OWNERSHIP_MAP.md` — detailed ownership map
- `302_FAILED_HYPOTHESES.md` — rejected approaches
- `303_HOME_VERTICAL_BUDGET_PROBLEM.md` — slot math
- `201_HOME_TARGET_MODULES.md` — target owners
