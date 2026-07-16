# Phase C4a — r957 Calendar US Federal Holiday Helpers Checkpoint

Date: 2026-07-15

## Status

**C4a / r957 complete.** Fast-forwarded and pushed to production `main` at `d1702f1`. Local validation and phone/PWA verification passed. User confirmed: **"r957 passed"**.

| Item | Value |
|------|--------|
| Branch | `main` |
| HEAD | `d1702f1` |
| `origin/main` | `d1702f1` |
| `origin/modularization-home-layout-engine-pilot` | `d1702f1` |
| Working tree (before this verification update) | Clean |
| Build Version | `2026-07-15-r957-calendar-holiday-helpers` |
| Planning commit | `24751c4` |
| Runtime commit | `ce84ade` |
| Production tip (post-FF) | `d1702f1` |
| Safe rollback tip (pre-C4a) | `189cf29` |
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

## Production Merge

r957 was **fast-forwarded and pushed** to production `main` at `d1702f1`.

After deployment, `main`, `origin/main`, and `origin/modularization-home-layout-engine-pilot` were aligned at `d1702f1`.

Safe rollback tip (pre-C4a production): `189cf29`.

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

### Phone / PWA — PASS

User confirmed phone verification passed (`"r957 passed"`).

| Check | Result |
|-------|--------|
| Build Version r957 | PASS |
| Calendar loaded | PASS |
| Month navigation worked | PASS |
| Holiday display worked | PASS |
| Normal non-holiday behavior worked | PASS |
| Home rehearsal cue remained functional | PASS |
| Home band image remained unchanged | PASS |
| Flyer creation loaded | PASS |

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
| Branch | `main` |
| HEAD | `d1702f1` |
| `origin/main` | `d1702f1` |
| `origin/modularization-home-layout-engine-pilot` | `d1702f1` |
| Safe rollback tip (pre-C4a) | `189cf29` |

Working tree was clean before this verification documentation update. `main`, `origin/main`, and the modularization branch are aligned at `d1702f1` after the approved fast-forward deploy.

---

## Next Recommended Step

1. Continue Calendar modularization planning for the next safe helpers seam (post-C4a).
2. Keep protected Home / Flyer / proposal / render boundaries untouched unless a later approved plan says otherwise.
3. If r957 must be reverted: restore production `main` to safe rollback tip `189cf29` (separate, auditable procedure; Rich approval required).
