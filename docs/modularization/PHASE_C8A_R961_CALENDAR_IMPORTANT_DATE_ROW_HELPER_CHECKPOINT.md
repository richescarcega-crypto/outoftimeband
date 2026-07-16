# Phase C8a — r961 Calendar Important Date Row Helper Checkpoint

Date: 2026-07-16

## Status

**C8a / r961 runtime extraction complete on the modularization branch.** Local validation passed. **Production merge and phone/PWA verification are still pending.**

| Item | Value |
|------|--------|
| Branch | `modularization-home-layout-engine-pilot` |
| HEAD | `fb4d6fb` |
| `origin/modularization-home-layout-engine-pilot` | `fb4d6fb` |
| `origin/main` | `d6b6f57` |
| Build Version | `2026-07-16-r961-calendar-important-date-row-helper` |
| Runtime commit | `fb4d6fb` — `Extract Calendar important date row helper` |
| Safe rollback tip (pre-C8a) | `d6b6f57` |
| Production merge | **Pending** |
| Phone / PWA verification | **Pending** |

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

**Not merged.** Production `origin/main` remains at `d6b6f57` (pre-C8a / r960 tip).

Do not merge, rebase, or push to `main` until Rich explicitly approves a separate merge plan and phone/PWA verification passes.

Safe rollback tip (pre-C8a): `d6b6f57`.

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

### Phone / PWA — Pending

Phone/PWA verification has **not** been completed for r961.

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
| Branch | `modularization-home-layout-engine-pilot` |
| HEAD | `fb4d6fb` |
| `origin/modularization-home-layout-engine-pilot` | `fb4d6fb` |
| `origin/main` | `d6b6f57` |
| Safe rollback tip (pre-C8a) | `d6b6f57` |

Runtime extraction is on the modularization branch only. Production `main` remains at the pre-C8a tip until an approved merge and phone verification.

---

## Next Recommended Step

1. Phone/PWA verify r961 (Build Version, Calendar grid, one-time and recurring Important Dates, All Events / day details).
2. Only after phone PASS: draft/approve a C8a merge-to-main plan.
3. Keep protected Home / Flyer / proposal / birthday / holiday / Next Up / collector / render boundaries untouched unless a later approved plan says otherwise.
4. If r961 must be reverted before merge: restore the modularization branch to safe rollback tip `d6b6f57` (separate, auditable procedure; Rich approval required).
