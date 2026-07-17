# Phase C12a — r965 Calendar Display Rows Helper Checkpoint

Date: 2026-07-17

## Status

**C12a / r965 complete.** Fast-forwarded and pushed to production `main` at `44845ee`. Local validation and phone/PWA verification passed. User confirmed: **"r965 passed"**. No regression observed.

| Item | Value |
|------|--------|
| Branch | `main` |
| HEAD | `44845ee` |
| `origin/main` | `44845ee` |
| `origin/modularization-home-layout-engine-pilot` | `44845ee` |
| Baseline (pre-C12a) | `53a5438` |
| Build Version | `2026-07-17-r965-calendar-display-rows-helper` |
| Runtime commit | `93f326c` — `Extract Calendar display rows helper` |
| Production tip (post-FF) | `44845ee` |
| Safe rollback tip (pre-C12a) | `53a5438` |
| Production merge | **PASS** |
| Phone / PWA verification | **PASS** |

---

## Purpose and Bounded Scope

**C12a / r965 — Calendar Display Rows Helper Extraction.**

Extract only `_calDisplayRows` from `index.html` into the existing Calendar helpers module. The module helper accepts an events list and custom rows explicitly; the legacy zero-argument alias supplies `window.events` and `window._customEntriesAsRows()`. `_customEntriesAsRows` remains separate. The parallel All Events composition `events.slice().concat(_customEntriesAsRows())` remains inline and unchanged. Bounded helpers-only seam: no Calendar grid, drawers, Firestore writes, Important Date / birthday / holiday / proposal rework, Home cues, Flyer polish, or band-image work.

**No Home, Flyer, Firestore, Calendar grid, drawer, Important Date, birthday, holiday, proposal, or All Events behavior was intentionally changed.**

---

## Runtime Commit

| Item | Value |
|------|--------|
| Baseline | `53a5438` |
| Runtime commit | `93f326c` |
| Message | `Extract Calendar display rows helper` |
| Build Version | `2026-07-17-r965-calendar-display-rows-helper` |

---

## Production Merge

**PASS.** r965 was **fast-forwarded and pushed** to production `main` at `44845ee`.

After deployment, `main`, `origin/main`, and `origin/modularization-home-layout-engine-pilot` were aligned at `44845ee`.

Safe rollback tip (pre-C12a production): `53a5438`.

---

## Files Changed (Runtime Commit)

| File | Role |
|------|------|
| `index.html` | Removed inline `_calDisplayRows`; left module pointer comments; kept All Events parallel composition and `_calUpcomingRows(60)` caller; r965 Build Version + What's New |
| `js/calendar-date-helpers.js` | Extended with injected `_calDisplayRows` + namespace key + legacy alias |
| `tests/integrity/calendar-helpers-package.mjs` | Extended Calendar integrity gate for display-rows exports, alias, wiring, and behavior |

### Diff stat (`53a5438..93f326c`)

```
 index.html                                   |  11 ++-
 js/calendar-date-helpers.js                  |  19 ++++-
 tests/integrity/calendar-helpers-package.mjs | 105 +++++++++++++++++++++++++--
 3 files changed, 119 insertions(+), 16 deletions(-)
```

---

## Function Extracted

Moved out of `index.html` into `js/calendar-date-helpers.js`:

- `_calDisplayRows(eventsList, customRows)`

The original inline definition was removed. `_customEntriesAsRows` remains separate.

---

## Call Sites

- **Live Next Up path unchanged:** `_calRenderStageSummary` → `_calUpcomingRows(60)[0]` (upcoming alias still uses `window._calDisplayRows()`)
- **All Events parallel composition unchanged:** `events.slice().concat(_customEntriesAsRows())` remains inline
- No new `index.html` direct callers of `_calDisplayRows` were introduced
- Legacy alias remains available as `window._calDisplayRows()` for compatibility

---

## Explicit Injection

The module helper accepts:

- `eventsList` — Firestore-backed / Calendar events array (shallow-copied)
- `customRows` — Important Date custom rows to append

The module helper does not own `events`, Important Date collection, listeners, or writes.

---

## Namespace Export

Extended `window.OOT_CALENDAR_HELPERS` with:

- `displayRows` — `OOT_CALENDAR_HELPERS.displayRows(eventsList, customRows)`

---

## Legacy Zero-Argument Alias

Existing global compatibility is preserved by:

- `window._calDisplayRows()`

The alias injects:

- `window.events`
- `window._customEntriesAsRows()`

---

## Behavior Preservation

- **New array returned** on every call (`slice` + `concat`).
- **Event rows first, custom rows second.**
- **Shallow-copy** of the events array; event object identity preserved.
- **Custom row object identity** preserved (same references appended).
- **Duplicates preserved** (no sort, no dedupe).
- **Null/undefined inputs** use empty arrays.
- **No mutation** of either supplied source array.
- **All Events** parallel inline composition remains unchanged.
- **`_calUpcomingRows(60)`** live caller remains unchanged.
- **No** Calendar grid, drawer, navigation, listener, or write changes.

---

## Left Separate / Unchanged

- `_customEntriesAsRows` — remains separate module helper + legacy alias
- All Events `events.slice().concat(_customEntriesAsRows())` — remains inline
- `_calRenderStageSummary` → `_calUpcomingRows(60)[0]` — unchanged
- Public Calendar render ownership remains in `index.html`

---

## Build Version

`2026-07-17-r965-calendar-display-rows-helper`

---

## Validation Completed

### Local (Node) — PASS

| Check | Result |
|-------|--------|
| `tests/integrity/calendar-helpers-package.mjs` | PASS |
| Inline script syntax check | PASS — 8 scripts, 0 failures |
| `git diff --check` | PASS |

### Phone / PWA — PASS

User confirmed phone verification passed (`"r965 passed"`). No regression observed.

| Check | Result |
|-------|--------|
| Build Version r965 | PASS |
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
- No Important Date collector / materializer / lookup behavior changes
- No birthday-helper or holiday-helper API behavior changes
- No intentional Home, Flyer, Firestore, Calendar grid, drawer, Important Date, birthday, holiday, proposal, or All Events behavior changes
- `_customEntriesAsRows` left separate
- All Events parallel composition left inline
- Preserved `window.OOT_CALENDAR_HELPERS` (extend only)
- Public Calendar render ownership stayed in `index.html`

---

## Current Branch State

| Ref | Value |
|-----|--------|
| Branch | `main` |
| HEAD | `44845ee` |
| `origin/main` | `44845ee` |
| `origin/modularization-home-layout-engine-pilot` | `44845ee` |
| Baseline / safe rollback tip (pre-C12a) | `53a5438` |
| Runtime commit | `93f326c` |
| Production tip (post-FF) | `44845ee` |

`main`, `origin/main`, and the modularization branch are aligned at `44845ee` after the approved fast-forward deploy.

---

## Next Recommended Step

1. Continue Calendar modularization planning for the next safe helpers seam (post-C12a).
2. Keep protected Home / Flyer / proposal / Important Date / birthday / holiday / All Events / render boundaries untouched unless a later approved plan says otherwise.
3. If r965 must be reverted: restore production `main` to safe rollback tip `53a5438` (separate, auditable procedure; Rich approval required).
