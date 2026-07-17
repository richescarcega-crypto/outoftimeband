# Phase C11a — r964 Calendar Upcoming Rows Helper Checkpoint

Date: 2026-07-17

## Status

**C11a / r964 complete.** Fast-forwarded and pushed to production `main` at `7c38283`. Local validation and phone/PWA verification passed. User confirmed: **"r964 passed"**. No regression observed.

| Item | Value |
|------|--------|
| Branch | `main` |
| HEAD | `7c38283` |
| `origin/main` | `7c38283` |
| `origin/modularization-home-layout-engine-pilot` | `7c38283` |
| Baseline (pre-C11a) | `c11b9c2` |
| Build Version | `2026-07-17-r964-calendar-upcoming-rows-helper` |
| Runtime commit | `a4fb1a4` — `Extract Calendar upcoming rows helper` |
| Production tip (post-FF) | `7c38283` |
| Safe rollback tip (pre-C11a) | `c11b9c2` |
| Production merge | **PASS** |
| Phone / PWA verification | **PASS** |

---

## Purpose and Bounded Scope

**C11a / r964 — Calendar Upcoming Rows Helper Extraction.**

Extract only `_calUpcomingRows` from `index.html` into the existing Calendar helpers module. The module helper accepts display rows, current date context, days-ahead, and members list explicitly; the legacy one-argument alias supplies `window._calDisplayRows()`, `new Date()`, `daysAhead`, and `window.members`. Holiday lookup uses the existing module-internal helper. `_calDisplayRows` remains inline and unchanged. Bounded helpers-only seam: no Calendar grid, drawers, Firestore writes, Important Date / birthday-helper / holiday-helper / proposal rework, Home cues, Flyer polish, or band-image work.

**No Home, Flyer, Firestore, Calendar grid, drawer, Important Date, birthday, holiday, or proposal behavior was intentionally changed.**

---

## Runtime Commit

| Item | Value |
|------|--------|
| Baseline | `c11b9c2` |
| Runtime commit | `a4fb1a4` |
| Message | `Extract Calendar upcoming rows helper` |
| Build Version | `2026-07-17-r964-calendar-upcoming-rows-helper` |

---

## Production Merge

**PASS.** r964 was **fast-forwarded and pushed** to production `main` at `7c38283`.

After deployment, `main`, `origin/main`, and `origin/modularization-home-layout-engine-pilot` were aligned at `7c38283`.

Safe rollback tip (pre-C11a production): `c11b9c2`.

---

## Files Changed (Runtime Commit)

| File | Role |
|------|------|
| `index.html` | Removed inline `_calUpcomingRows`; kept `_calDisplayRows` and `_calRenderStageSummary` caller; r964 Build Version + What's New |
| `js/calendar-date-helpers.js` | Extended with injected `_calUpcomingRows` + namespace key + legacy alias |
| `tests/integrity/calendar-helpers-package.mjs` | Extended Calendar integrity gate for upcoming-rows exports, alias, wiring, and behavior |

### Diff stat (`c11b9c2..a4fb1a4`)

```
 index.html                                   |  29 +-----
 js/calendar-date-helpers.js                  |  37 ++++++-
 tests/integrity/calendar-helpers-package.mjs | 143 +++++++++++++++++++++++++--
 3 files changed, 176 insertions(+), 33 deletions(-)
```

---

## Function Extracted

Moved out of `index.html` into `js/calendar-date-helpers.js`:

- `_calUpcomingRows(displayRows, nowDate, daysAhead, membersList)`

The original inline definition was removed. `_calDisplayRows` remains inline and unchanged.

---

## Call Sites

- **Live caller preserved:** `_calRenderStageSummary` → `_calUpcomingRows(60)[0]`
- No new `index.html` callers were introduced.
- Legacy alias remains available as `window._calUpcomingRows(daysAhead)` for compatibility.

---

## Explicit Injection

The module helper accepts:

- `displayRows` — row collection to filter
- `nowDate` — current date context (normalized to local midnight)
- `daysAhead` — inclusive window length (defaults to `14`)
- `membersList` — members used for birthday injection

The module helper does not own display-row collection, the clock, or the members array. Holidays use existing module-internal `getHolidayOn`.

---

## Namespace Export

Extended `window.OOT_CALENDAR_HELPERS` with:

- `upcomingRows` — `OOT_CALENDAR_HELPERS.upcomingRows(displayRows, nowDate, daysAhead, membersList)`

---

## Legacy One-Argument Alias

Existing call-site compatibility is preserved by:

- `window._calUpcomingRows(daysAhead)`

The alias injects:

- `window._calDisplayRows()` (or `[]` if missing)
- `new Date()`
- `daysAhead`
- `window.members`

---

## Behavior Preservation

- **Default `daysAhead = 14`** when falsy.
- **Local midnight normalization** of `nowDate` for the window start.
- **Inclusive start and inclusive end** date-string filtering.
- **Filter supplied `displayRows`** into the window (does not mutate source).
- **Birthday injection** from supplied `membersList` via `getMembersBornOn`.
- **Holiday injection** via existing module-internal holiday helper.
- **Birthday title** remains the member’s first name token + `'s Birthday`.
- **Date-only sort** via existing `localeCompare` ordering.
- **Day iteration** retains `+86400000` stepping for parity (including existing DST quirk).
- **Null/empty `displayRows`** still allow synthetic birthday/holiday rows.
- **No mutation** of `displayRows` or `membersList`.
- **No** Calendar grid, drawer, navigation, listener, or write changes.

---

## Left Inline / Unchanged

- `_calDisplayRows` — remains inline in `index.html`
- `_calRenderStageSummary` — still calls `_calUpcomingRows(60)[0]`
- Public Calendar render ownership (`rCal`, drawers, All Events, day details, Next Up stage summary) remains in `index.html`

---

## Build Version

`2026-07-17-r964-calendar-upcoming-rows-helper`

---

## Validation Completed

### Local (Node) — PASS

| Check | Result |
|-------|--------|
| `tests/integrity/calendar-helpers-package.mjs` | PASS |
| Inline script syntax check | PASS — 8 scripts, 0 failures |
| `git diff --check` | PASS |

### Phone / PWA — PASS

User confirmed phone verification passed (`"r964 passed"`). No regression observed.

| Check | Result |
|-------|--------|
| Build Version r964 | PASS |
| Calendar load | PASS |
| Month navigation | PASS |
| Next Up | PASS |
| Calendar rows and markers | PASS |
| All Events | PASS |
| Rehearsal Proposals | PASS |
| Home rehearsal cue | PASS |
| Home band image unchanged | PASS |
| Flyer creation opened | PASS |
| No regression observed | PASS |

Local-only untracked files remained untouched:

- `docs/modularization/PHASE_6W_A_REHEARSAL_CUE_PARITY_PLAN.md`
- `oot-local-server.ps1`

---

## Protected Boundaries Not Touched

- No Home band image CSS, layout, assets, or selector changes
- No Flyer UI polish
- No Firestore listener / write changes
- No Calendar grid, drawer, navigation, or proposal changes
- No Important Date lookup / materializer / collector behavior changes
- No birthday-helper or holiday-helper API behavior changes (upcoming collector only reuses them)
- No intentional Home, Flyer, Firestore, Calendar grid, drawer, Important Date, birthday, holiday, or proposal behavior changes
- `_calDisplayRows` left inline
- Preserved `window.OOT_CALENDAR_HELPERS` (extend only)
- Public Calendar render ownership stayed in `index.html`

---

## Current Branch State

| Ref | Value |
|-----|--------|
| Branch | `main` |
| HEAD | `7c38283` |
| `origin/main` | `7c38283` |
| `origin/modularization-home-layout-engine-pilot` | `7c38283` |
| Baseline / safe rollback tip (pre-C11a) | `c11b9c2` |
| Runtime commit | `a4fb1a4` |
| Production tip (post-FF) | `7c38283` |

`main`, `origin/main`, and the modularization branch are aligned at `7c38283` after the approved fast-forward deploy.

---

## Next Recommended Step

1. Continue Calendar modularization planning for the next safe helpers seam (post-C11a).
2. Keep protected Home / Flyer / proposal / Important Date / birthday / holiday / display-row / render boundaries untouched unless a later approved plan says otherwise.
3. If r964 must be reverted: restore production `main` to safe rollback tip `c11b9c2` (separate, auditable procedure; Rich approval required).
