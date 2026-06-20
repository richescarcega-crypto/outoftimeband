# Home Architecture Mandate

## Purpose

The Home screen instability is not a cosmetic defect. It is evidence that the monolithic Home implementation in `index.html` no longer has a single owner for layout, render order, or image presentation.

The project goal is a stable, maintainable, monetizable, white-label-capable app. Home is the **pilot module** for modularization. Architecture and ownership isolation come **before** visual correction.

## Production baseline

| Item | Value |
|------|-------|
| Production commit | `8a7ecc6` — *Rollback broken Home layout contract* |
| Branch for pilot work | `modularization-home-pilot` |
| App code changes on pilot | **None until Phase 1** |

The failed layout-contract rescue (commits `33613e9` through `5504a08`) was rolled back from production. The catastrophic cross-page Next Gig countdown leak introduced by that path is fixed on the rollback baseline.

## Permanent direction

- Do **not** continue patching Home with isolated CSS edits.
- Do **not** optimize for fastest visible improvement.
- Do **not** add new magic numbers to make one phone state look correct on one device.
- Do **not** make production Home layout changes until module boundaries, migration sequence, and acceptance criteria are explicit and Phase 1+ seams pass their gates.
- Do **not** reintroduce any item on the [banned list](#banned--never-reintroduce).

## Required architecture before behavior changes

1. Define Home module boundaries (`201_HOME_TARGET_MODULES.md`).
2. Map legacy Home CSS and JS ownership (`301_HOME_CSS_JS_OWNERSHIP_MAP.md`).
3. Decide which legacy systems are transitional vs target-state (`202_HOME_MIGRATION_SEQUENCE.md`).
4. Define migration order that avoids changing all Home behavior at once.
5. Define Home test states before code changes (`203_HOME_ACCEPTANCE_CRITERIA.md`).
6. Only then create the first code seam (Phase 1: `oot_home_diag.js` only).

## Target-state principle

- Home must have **one layout owner**: `HomeLayoutEngine` (see naming rule below).
- Alert rail, gig slot, and band image presentation must not fight for viewport space through unrelated CSS patches.
- Layout must be driven by **named regions, tokens, and state** — not hidden transforms and accumulated overrides.
- The implementation must support future tenant branding, alternate logos, different image sets, different alert types, and different device sizes.

## Naming rule: `HomeLayoutEngine` vs banned `HomeLayoutContract`

| Term | Meaning |
|------|---------|
| **`HomeLayoutEngine`** | **Target module** (`oot_home_layout_engine.js`). A new vertical-budget owner built during Phase 5 under a feature flag. Defines named regions and responsive height math. |
| **`HomeLayoutContract`** (v1–v3) | **Banned implementation path**. The failed production rescue CSS/JS stack (commits `33613e9`–`5504a08`) that layered in-flow alert reservation, hero `clamp()` compression, and footprint-lock JS on top of legacy overlay CSS. Rolled back at `8a7ecc6`. **Never reintroduce.** |

When documentation or conversation says "layout contract," assume the **banned path** unless explicitly prefixed with `HomeLayoutEngine`.

## Banned / never reintroduce

| System | Why banned |
|--------|------------|
| Home layout contract **v1** (`33613e9`) | Started flex-column contract conflicting with legacy overlay CSS |
| Home layout contract **v2** (`6dd020a`) | In-flow alert + gig footprint reservation via `data-home-*` attrs |
| Home layout contract **v2.1** (`d8877a2`) | Forced in-flow 64px alert rail; `transform:none`; disabled r824 backing |
| Home layout contract **v3** (`5504a08`) | Hero `clamp()` dense compression; subtractive band budget math |
| `_homeMaybeLockAlertsFootprint()` | Set `data-home-alerts-reserved="1"`; forced v2/v2.1/v3 CSS |
| `data-home-alerts-pending` / `data-home-alerts-reserved` footprint attrs | Drove in-flow rail against overlay-era CSS |
| v3 hero `clamp()` / `--home-band-region-target` tokens | Patched symptoms; did not establish ownership |
| `_onHomeActivated()` timing wrapper | Tested locally; did not fix Chat→Home misformat |
| Any resurrection of v1–v3 rules as a "recovery" or "v4 overlay contract" production patch | Pilot targets **new `HomeLayoutEngine` in-flow model**, not another overlay/contract patch stack |

## Decision

- Continue modularization; Home is the pilot.
- Phase 0 (this document set) is documentation only — **zero app behavior change**.
- Phase 1 first code seam is `oot_home_diag.js` — read-only diagnostics, zero visual delta.
- Visual correction and layout replacement come after ownership seams and acceptance gates, not before.

## Related documents

- `201_HOME_TARGET_MODULES.md` — module map
- `202_HOME_MIGRATION_SEQUENCE.md` — phased migration
- `203_HOME_ACCEPTANCE_CRITERIA.md` — test states and gates
- `03_HOME_AUDIT_AND_ROOT_CAUSE/` — root cause and ownership audit
- `16_NEXT_THREAD_OPERATING_PLAN/1600_NEXT_THREAD_PLAN.md` — immediate next steps
