# Phase C10a — r963 Calendar Month Rows Helper Checkpoint

Date: 2026-07-16

## Status

**C10a / r963 runtime complete on modularization branch. Production merge and phone/PWA verification still pending.**

| Item | Value |
|------|--------|
| Branch | `modularization-home-layout-engine-pilot` |
| HEAD | `cb9fbfe` |
| `origin/modularization-home-layout-engine-pilot` | `cb9fbfe` |
| `origin/main` | `cdc92a2` |
| Build Version | `2026-07-16-r963-calendar-month-rows-helper` |
| Runtime commit | `cb9fbfe` — `Extract Calendar month rows helper` |
| Safe rollback tip (pre-C10a) | `cdc92a2` |
| Production merge | **PENDING** |
| Phone / PWA verification | **PENDING** |

---

## Purpose and Bounded Scope

**C10a / r963 — Calendar Month Rows Helper Extraction.**

Extract only `_calRowsInMonth` from `index.html` into the existing Calendar helpers module. The module helper accepts display rows, year, and month0 explicitly; the legacy zero-argument alias supplies `window._calDisplayRows()`, `window.CY`, and `window.CM`. Bounded helpers-only seam: no display/upcoming row collectors, rendering, drawers, Firestore writes, birthday / holiday / Important Date / Next Up rework, Home cues, Flyer polish, or band-image work.

---

## Runtime Commit

| Item | Value |
|------|--------|
| Runtime commit | `cb9fbfe` |
| Message | `Extract Calendar month rows helper` |
| Build Version | `2026-07-16-r963-calendar-month-rows-helper` |

---

## Production Merge

**PENDING.** r963 has not been merged to production `main`.

| Ref | Value |
|-----|--------|
| `origin/main` (pre-merge) | `cdc92a2` |
| Safe rollback tip | `cdc92a2` |

Phone/PWA verification is still pending after merge.

---

## Files Changed (Runtime Commit)

| File | Role |
|------|------|
| `index.html` | Removed inline `_calRowsInMonth` definition; left module pointer comment; r963 Build Version + What's New |
| `js/calendar-date-helpers.js` | Extended with injected `_calRowsInMonth` + namespace key + legacy alias |
| `tests/integrity/calendar-helpers-package.mjs` | Extended Calendar integrity gate for month-rows exports, alias, wiring, and behavior |

---

## Function Extracted

Moved out of `index.html` into `js/calendar-date-helpers.js`:

- `_calRowsInMonth(displayRows, year, month0)`

The original inline definition was removed.

---

## Call Sites

- **Before extraction:** no live `index.html` callers existed (definition-only).
- **After extraction:** no new `index.html` callers were introduced.
- Legacy alias remains available as `window._calRowsInMonth()` for compatibility.
- Live Calendar stage summary continues to use inline `_calUpcomingRows(60)` only.

---

## Explicit Injection

The module helper accepts:

- `displayRows` — row collection to filter
- `year` — calendar year
- `month0` — zero-based month index

The module helper does not own display-row collection, `CY`, or `CM`.

---

## Namespace Export

Extended `window.OOT_CALENDAR_HELPERS` with:

- `rowsInMonth`

---

## Legacy Zero-Argument Alias

Existing global compatibility is preserved by:

- `window._calRowsInMonth()`

The alias:

- calls `window._calDisplayRows()` when that function exists (otherwise `[]`)
- uses `window.CY`
- uses `window.CM`

---

## Behavior Preservation

- **Same month start and end boundary logic** — first of month through last day via `new Date(year, month0 + 1, 0).getDate()` (local `fmt` equivalent to inline `fD`).
- **Inclusive start and inclusive final-day filtering** — `e.date >= start && e.date <= end`.
- **Original row order** preserved (`filter` only; no sort).
- **Leap-year February behavior** preserved (end date includes Feb 29 when applicable).
- **Null/undefined injected rows** return `[]`.
- **No mutation** of the supplied display-row collection.
- **No** sorting, rendering, navigation, listener, or write changes.

---

## Collectors Left Inline

The following remain inline in `index.html` and unchanged:

- `_calDisplayRows`
- `_calUpcomingRows`

Public Calendar render ownership (`rCal`, drawers, All Events, day details, Next Up stage summary) remains in `index.html`.

---

## Build Version

`2026-07-16-r963-calendar-month-rows-helper`

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

### Phone / PWA — PENDING

Production merge and phone/PWA verification still pending.

---

## Protected Boundaries Not Touched

- No Home band image CSS, layout, assets, or selector changes
- No birthday helper / MM-DD behavior changes
- No federal-holiday helper / exact-date holiday behavior changes
- No Important Date lookup / materializer / collector behavior changes
- No Next Up formatter / open / render handler changes
- No Calendar display/upcoming collectors moved (`_calDisplayRows` / `_calUpcomingRows` remain inline)
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
| Branch | `modularization-home-layout-engine-pilot` |
| HEAD | `cb9fbfe` |
| `origin/modularization-home-layout-engine-pilot` | `cb9fbfe` |
| `origin/main` | `cdc92a2` |
| Safe rollback tip (pre-C10a) | `cdc92a2` |
| Runtime commit | `cb9fbfe` |

---

## Next Recommended Step

1. Create the C10a / r963 merge-to-main plan (documentation only).
2. After approved fast-forward deploy + phone/PWA PASS, update this checkpoint status to production verified.
3. Keep protected Home / Flyer / proposal / birthday / holiday / Important Date / Next Up / display-upcoming collector / render boundaries untouched unless a later approved plan says otherwise.
4. If r963 must be reverted before or after merge: restore to safe rollback tip `cdc92a2` (separate, auditable procedure; Rich approval required).
