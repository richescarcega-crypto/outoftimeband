# Phase C4a — r957 Calendar US Federal Holiday Helpers Checkpoint

Date: 2026-07-15

## Status

**C4a runtime complete on modularization branch.** Local integrity/syntax validation passed. Phone/PWA verification is **PENDING** — do not claim production verification.

| Item | Value |
|------|--------|
| Branch | `modularization-home-layout-engine-pilot` |
| HEAD | `ce84ade` |
| `origin/modularization-home-layout-engine-pilot` | `ce84ade` |
| `origin/main` | `189cf29` |
| Working tree (before this checkpoint doc) | Clean |
| Build Version | `2026-07-15-r957-calendar-holiday-helpers` |
| Planning commit | `24751c4` |
| Runtime commit | `ce84ade` |
| Planning doc | `docs/modularization/PHASE_C4_CALENDAR_HOLIDAY_HELPER_SEAM_PLAN.md` |

---

## Purpose and Approved Scope

**C4a / r957 — Calendar US Federal Holiday Helpers Extraction.**

Extract pure US federal holiday date helpers from `index.html` into the existing Calendar helpers module, preserving call sites, render ownership, and exact-date holiday behavior. No drawers, Firestore, birthday helpers, Important Date collectors, Home cues, Flyer polish, or band-image work.

---

## Planning Document and Planning Commit

| Item | Value |
|------|--------|
| Planning doc | `docs/modularization/PHASE_C4_CALENDAR_HOLIDAY_HELPER_SEAM_PLAN.md` |
| Planning commit | `24751c4` |

---

## Runtime Commit

| Item | Value |
|------|--------|
| Runtime commit | `ce84ade` |
| Build Version | `2026-07-15-r957-calendar-holiday-helpers` |

---

## Files Changed

| File | Role |
|------|------|
| `index.html` | Removed holiday helper defs; kept `_pad`; r957 Build Version + What’s New |
| `js/calendar-date-helpers.js` | Extended with holiday helpers + namespace keys + legacy aliases |
| `tests/integrity/calendar-helpers-package.mjs` | Extended Calendar helper integrity gate for holiday exports / no-inline defs |

---

## Functions Extracted

Moved out of `index.html` into `js/calendar-date-helpers.js`:

- `_nthDayOfMonth`
- `_lastDayOfMonth`
- `getUSFederalHolidays`
- `getHolidayOn`

---

## Helper Disposition

| Helper | Disposition |
|--------|-------------|
| `_pad` | **Remained inline** in `index.html` (Important Date modal default-date path) |
| Holiday formatting helper (`_fmt` / module-local pad) | **Module-private** inside `js/calendar-date-helpers.js` — not exported on `OOT_CALENDAR_HELPERS` / not `window._pad` |

---

## Namespace Exports

Extended `window.OOT_CALENDAR_HELPERS` with:

- `usFederalHolidays`
- `getUSFederalHolidays`
- `holidayOn`
- `getHolidayOn`

---

## Legacy Aliases

Preserved so existing `index.html` call sites continue to work:

- `window.getUSFederalHolidays`
- `window.getHolidayOn`

---

## Call Sites and Render Ownership

- Existing `index.html` call sites for `getHolidayOn` / holiday consumption remain unchanged.
- Public Calendar **render** ownership (`rCal`, drawers, row collectors) remains in `index.html`.
- No render-engine move; helpers only.

---

## Exact-Date Behavior Only

- Holiday lookup remains **exact calendar date** behavior only.
- **No** Friday/Monday weekend substitution.
- **No** observed-holiday behavior added.
- Fixed-date holidays (e.g. July 4, Dec 25) resolve on the calendar date itself, matching pre-C4a behavior.

---

## Build Version

`2026-07-15-r957-calendar-holiday-helpers`

---

## Validation Completed

### Local (Node) — PASS

| Check | Result |
|-------|--------|
| `tests/integrity/calendar-helpers-package.mjs` | PASS |
| `tests/integrity/flyer-adapter-package.mjs` | PASS |
| `tests/integrity/flyer-layer-helpers-package.mjs` | PASS |
| `tests/integrity/flyer-manifest-package.mjs` | PASS |
| Inline script syntax check | PASS — 8 scripts, 0 failures |

### Phone / PWA

| Check | Result |
|-------|--------|
| Phone / PWA verification | **PENDING** |

Do **not** claim production verification from this checkpoint.

---

## Protected Boundaries Not Touched

- No Home band image CSS, layout, assets, or selector changes
- No r956 opener / `_r535OpenHomeRehearsal` changes
- No Flyer UI polish
- No Band.png / band.png cleanup
- No proposal / Home cue behavior changes
- No production-`main` force push or unapproved merge
- Preserved `window.OOT_CALENDAR_HELPERS` (extend only)
- Public Calendar render ownership (`rCal`, drawers) stayed in `index.html`
- Did not move birthday helpers / `members` dependents
- Did not move Important Date listeners / `_customEntriesAsRows` / `getImportantDatesOn`
- Did not move `rCal`, drawers, Firestore reads/writes, gig actions, or rehearsal proposal actions
- Did not remove inline `_pad` from `index.html`

---

## Current Branch State

| Ref | Value |
|-----|--------|
| Branch | `modularization-home-layout-engine-pilot` |
| HEAD | `ce84ade` |
| `origin/modularization-home-layout-engine-pilot` | `ce84ade` |
| `origin/main` | `189cf29` |

Working tree was clean before creating this untracked checkpoint document.

---

## Next Recommended Step

1. Review this checkpoint.
2. Commit/push this checkpoint doc on `modularization-home-layout-engine-pilot` when approved.
3. Prepare a bounded merge-to-main plan.
4. **Do not** merge or push production `main` without Rich’s approval.
