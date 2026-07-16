# Phase C8a — r961 Calendar Important Date Row Helper Checkpoint

Date: 2026-07-16

## Status

**C8a / r961 complete.** Fast-forwarded and pushed to production `main` at `66df507`. Local validation and phone/PWA verification passed. User confirmed: **"r961 passed"**.

| Item | Value |
|------|--------|
| Branch | `main` |
| HEAD | `66df507` |
| `origin/main` | `66df507` |
| `origin/modularization-home-layout-engine-pilot` | `66df507` |
| Build Version | `2026-07-16-r961-calendar-important-date-row-helper` |
| Runtime commit | `fb4d6fb` — `Extract Calendar important date row helper` |
| Production tip (post-FF) | `66df507` |
| Safe rollback tip (pre-C8a) | `d6b6f57` |
| Production merge | **PASS** |
| Phone / PWA verification | **PASS** |

---

## Purpose and Bounded Scope

**C8a / r961 — Calendar Important Date Single-Entry Row Materializer Extraction.**

Extract only the single-entry Important Date → row transformation from `_customEntriesAsRows` into the existing Calendar helpers module as `_calCustomEntryRows`, preserving collector ownership, call sites, render ownership, and Important Date row behavior. Bounded helpers-only seam: no full collector move, no row collectors (`_calDisplayRows` / `_calRowsInMonth` / `_calUpcomingRows`), drawers, Firestore writes, birthday / holiday / Next Up rework, Home cues, Flyer polish, or band-image work.

---

## Runtime Commit

| Item | Value |
|------|--------|
| Runtime commit | `fb4d6fb` |
| Message | `Extract Calendar important date row helper` |
| Build Version | `2026-07-16-r961-calendar-important-date-row-helper` |

---

## Production Merge

**PASS.** r961 was **fast-forwarded and pushed** to production `main` at `66df507`.

After deployment, `main`, `origin/main`, and `origin/modularization-home-layout-engine-pilot` were aligned at `66df507`.

Safe rollback tip (pre-C8a production): `d6b6f57`.

---

## Files Changed (Runtime Commit)

| File | Role |
|------|------|
| `index.html` | Single-entry transform delegated to helper; `_customEntriesAsRows` kept inline; r961 Build Version + What's New |
| `js/calendar-date-helpers.js` | Extended with `_calCustomEntryRows` + namespace key + legacy alias |
| `tests/integrity/calendar-helpers-package.mjs` | Extended Calendar helper integrity gate for row-helper exports / wiring / behavior |

---

## Function Extracted

Moved out of the inline `_customEntriesAsRows` body into `js/calendar-date-helpers.js`:

- `_calCustomEntryRows(entry, currentYear, defaultColor)`

`_customEntriesAsRows()` remains inline in `index.html`.

---

## Inline Collector Ownership Preserved

`_customEntriesAsRows()` still owns:

- `importantDates` collection access
- current-year lookup (`todayY = new Date().getFullYear()`)
- original collection ordering (`forEach` over `importantDates`)
- concatenation and collection behavior

Exact delegation:

```js
out = out.concat(_calCustomEntryRows(x, todayY, IDATE_DEFAULT_COLOR));
```

Existing `_customEntriesAsRows()` call sites remain unchanged (display rows, All Events combine, day-detail custom filters).

---

## Explicit Injection

Module signature accepts:

- `entry` — one Important Date object
- `currentYear` — year used for recurring this-year / next-year materialization
- `defaultColor` — row `_customColor` (caller passes `IDATE_DEFAULT_COLOR`)

The helper does not own the Important Date list, year clock, or color constant.

---

## Namespace Export

Extended `window.OOT_CALENDAR_HELPERS` with:

- `customEntryRows`

---

## Legacy Alias

Preserved for Calendar compatibility:

- `window._calCustomEntryRows` → `OOT_CALENDAR_HELPERS.customEntryRows`

---

## Behavior Preservation

- **One-time row shape** preserved (`idate-{id}`, exact date, `_customRecurring: false`).
- **Recurring row shape** preserved (two rows: current year + next year, `_customRecurring: true`).
- **MM-DD recurring input** preserved.
- **YYYY-MM-DD recurring input** preserved (month/day extracted for annual rematerialization).
- **Title fallback** preserved (`title || 'Untitled'`).
- **Note / notes precedence** preserved (`note || notes || ''`).
- **Default color fallback** preserved via injected `defaultColor`.
- **Malformed / missing entry handling** preserved (empty array / skip).
- **No mutation** of the source entry.
- **Original ordering** preserved (collector `forEach` + concat).
- **No** sorting, timezone, locale, rendering, navigation, listener, or write changes.

---

## Call Sites and Render Ownership

- Existing `_customEntriesAsRows()` call sites remain unchanged in ownership and usage pattern.
- Public Calendar **render** ownership (`rCal`, drawers, All Events, day details, row collectors) remains in `index.html`.
- No render-engine or full-collector move; single-entry helper only.

---

## Build Version

`2026-07-16-r961-calendar-important-date-row-helper`

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

User confirmed phone verification passed (`"r961 passed"`).

| Check | Result |
|-------|--------|
| Build Version r961 | PASS |
| Calendar opened | PASS |
| Month navigation worked | PASS |
| One-time Important Dates displayed correctly | PASS |
| Recurring Important Dates displayed correctly | PASS |
| MM-DD recurring entries displayed correctly | PASS |
| YYYY-MM-DD recurring entries displayed correctly | PASS |
| Titles, notes, and colors remained correct | PASS |
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
- No Next Up formatter / open / render handler changes
- No full `_customEntriesAsRows` collector move
- No Calendar row collectors (`_calDisplayRows` / `_calRowsInMonth` / `_calUpcomingRows`) moved
- No Calendar rendering, navigation, drawers, proposals, or Home cue changes
- No Firestore listener / write changes
- No Flyer UI polish
- No Band.png / band.png cleanup
- Preserved `window.OOT_CALENDAR_HELPERS` (extend only)
- Public Calendar render ownership stayed in `index.html`
- No production-`main` force push or unapproved merge

---

## Current Branch State

| Ref | Value |
|-----|--------|
| Branch | `main` |
| HEAD | `66df507` |
| `origin/main` | `66df507` |
| `origin/modularization-home-layout-engine-pilot` | `66df507` |
| Safe rollback tip (pre-C8a) | `d6b6f57` |

`main`, `origin/main`, and the modularization branch are aligned at `66df507` after the approved fast-forward deploy.

---

## Next Recommended Step

1. Continue Calendar modularization planning for the next safe helpers seam (post-C8a).
2. Keep protected Home / Flyer / proposal / birthday / holiday / Next Up / collector / render boundaries untouched unless a later approved plan says otherwise.
3. If r961 must be reverted: restore production `main` to safe rollback tip `d6b6f57` (separate, auditable procedure; Rich approval required).
