# Phase C9a — r962 Calendar Important Date Collector Checkpoint

Date: 2026-07-16

## Status

**C9a / r962 complete.** Fast-forwarded and pushed to production `main` at `c66e2d2`. Local validation and phone/PWA verification passed. User confirmed: **"r962 passed"**.

| Item | Value |
|------|--------|
| Branch | `main` |
| HEAD | `c66e2d2` |
| `origin/main` | `c66e2d2` |
| `origin/modularization-home-layout-engine-pilot` | `c66e2d2` |
| Build Version | `2026-07-16-r962-calendar-important-date-collector` |
| Runtime commit | `26c43e6` — `Extract Calendar important date collector` |
| Production tip (post-FF) | `c66e2d2` |
| Safe rollback tip (pre-C9a) | `3904769` |
| Production merge | **PASS** |
| Phone / PWA verification | **PASS** |

---

## Purpose and Bounded Scope

**C9a / r962 — Calendar Important Date Collector Extraction.**

Extract only `_customEntriesAsRows` from `index.html` into the existing Calendar helpers module, preserving its four zero-argument call sites, Calendar render ownership, and Important Date row behavior. The module helper accepts the Important Date list, current year, and default color explicitly; the legacy zero-argument alias supplies the existing window globals. Bounded helpers-only seam: no display/month/upcoming row collectors, rendering, drawers, Firestore writes, birthday / holiday / Important Date lookup / Next Up rework, Home cues, Flyer polish, or band-image work.

---

## Runtime Commit

| Item | Value |
|------|--------|
| Runtime commit | `26c43e6` |
| Message | `Extract Calendar important date collector` |
| Build Version | `2026-07-16-r962-calendar-important-date-collector` |

---

## Production Merge

**PASS.** r962 was **fast-forwarded and pushed** to production `main` at `c66e2d2`.

After deployment, `main`, `origin/main`, and `origin/modularization-home-layout-engine-pilot` were aligned at `c66e2d2`.

Safe rollback tip (pre-C9a production): `3904769`.

---

## Files Changed (Runtime Commit)

| File | Role |
|------|------|
| `index.html` | Removed inline collector definition; preserved four zero-argument call sites; r962 Build Version + What's New |
| `js/calendar-date-helpers.js` | Extended with injected `_customEntriesAsRows` collector + namespace key + legacy alias |
| `tests/integrity/calendar-helpers-package.mjs` | Extended Calendar integrity gate for collector exports, alias, wiring, and behavior |

---

## Function Extracted

Moved out of `index.html` into `js/calendar-date-helpers.js`:

- `_customEntriesAsRows(importantDatesList, currentYear, defaultColor)`

The original inline definition was removed.

---

## Existing Call Sites Preserved

All four existing `index.html` call sites remain unchanged and zero-argument:

- `_calDisplayRows()` composition
- All Events combined-row path
- day-detail `customForDay` filter
- day-detail `custom2` filter

The legacy alias preserves those call sites.

---

## Explicit Injection

The module helper accepts:

- `importantDatesList` — Important Date source list
- `currentYear` — recurring occurrence base year
- `defaultColor` — row `_customColor`

The module collector does not own the Important Date list, clock, or color constant.

---

## Delegation

Collection continues to delegate each source entry through:

- `_calCustomEntryRows`

The r961 single-entry materializer remains module-owned and behaviorally unchanged.

---

## Namespace Export

Extended `window.OOT_CALENDAR_HELPERS` with:

- `customEntriesAsRows`

---

## Legacy Zero-Argument Alias

Existing call-site compatibility is preserved by:

- `window._customEntriesAsRows()`

The alias injects:

- `window.importantDates`
- `new Date().getFullYear()`
- `window.IDATE_DEFAULT_COLOR`

---

## Behavior Preservation

- **Original iteration order** preserved (`forEach` over the supplied list).
- **Original concatenation behavior** preserved (`out.concat(...)`).
- **One-time and recurring row generation** preserved through unchanged `_calCustomEntryRows`.
- **Malformed / missing-entry handling** preserved (empty contribution).
- **No mutation** of the supplied list or entries.
- **No** sorting, timezone, locale, rendering, navigation, listener, or write changes.

---

## Call Sites and Render Ownership

- All four zero-argument `_customEntriesAsRows()` call sites remain unchanged.
- Public Calendar render ownership (`rCal`, drawers, All Events, day details, display/month/upcoming collectors) remains in `index.html`.
- No render-engine or broader row-collector move; Important Date collector only.

---

## Build Version

`2026-07-16-r962-calendar-important-date-collector`

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
| `git diff --check` | PASS |

### Phone / PWA — PASS

User confirmed phone verification passed (`"r962 passed"`).

| Check | Result |
|-------|--------|
| Build Version r962 | PASS |
| Calendar opened | PASS |
| Month navigation worked | PASS |
| One-time Important Dates displayed correctly | PASS |
| Recurring Important Dates displayed correctly | PASS |
| Ordering remained correct | PASS |
| Normal dates remained normal | PASS |
| Next Up remained correct | PASS |
| Birthdays remained correct | PASS |
| Holidays remained correct | PASS |
| Home rehearsal cue worked | PASS |
| Home band image unchanged | PASS |
| Flyer creation opened | PASS |

---

## Protected Boundaries Not Touched

- No Home band image CSS, layout, assets, or selector changes
- No birthday helper / MM-DD behavior changes
- No federal-holiday helper / exact-date holiday behavior changes
- No Important Date lookup helper (`getImportantDatesOn`) behavior changes
- No `_calCustomEntryRows` materialization behavior changes
- No Next Up formatter / open / render handler changes
- No Calendar display/month/upcoming collectors moved
- No Calendar rendering, navigation, drawers, proposals, or Home cue changes
- No Firestore listener / write changes
- No Flyer UI polish
- No `Band.png` / `band.png` cleanup
- Preserved `window.OOT_CALENDAR_HELPERS` (extend only)
- Public Calendar render ownership stayed in `index.html`
- No production-`main` force push or unapproved merge

---

## Current Branch State

| Ref | Value |
|-----|--------|
| Branch | `main` |
| HEAD | `c66e2d2` |
| `origin/main` | `c66e2d2` |
| `origin/modularization-home-layout-engine-pilot` | `c66e2d2` |
| Safe rollback tip (pre-C9a) | `3904769` |

`main`, `origin/main`, and the modularization branch are aligned at `c66e2d2` after the approved fast-forward deploy.

---

## Next Recommended Step

1. Continue Calendar modularization planning for the next safe helpers seam (post-C9a).
2. Keep protected Home / Flyer / proposal / birthday / holiday / Important Date / Next Up / row-collector / render boundaries untouched unless a later approved plan says otherwise.
3. If r962 must be reverted: restore production `main` to safe rollback tip `3904769` (separate, auditable procedure; Rich approval required).
