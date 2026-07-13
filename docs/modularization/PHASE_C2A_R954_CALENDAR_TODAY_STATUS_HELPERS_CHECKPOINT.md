# Phase C2a — r954 Calendar Today/Status Helpers Checkpoint

Date: 2026-07-13

## Status

**C2a complete and pushed.** Local validation and phone/PWA verification passed.

| Item | Value |
|------|--------|
| Branch | `main` |
| Runtime commit | `13d0bad` |
| Build Version | `2026-07-13-r954-calendar-today-status-helpers` |
| Commit message | `Extract Calendar today status helpers` |

---

## Files Changed

| File | Role |
|------|------|
| `index.html` | Removed inline today/past-gig helpers; r954 build marker + What's New |
| `js/calendar-date-helpers.js` | Extended with today/status helpers |
| `tests/integrity/calendar-helpers-package.mjs` | Extended Calendar helper integrity gate |

---

## What Changed

- Extended existing Calendar helper module: `js/calendar-date-helpers.js`
- Extended shipped namespace: `window.OOT_CALENDAR_HELPERS`
- Moved these helpers out of `index.html`:
  - `_calTodayDate`
  - `_calTodayKey`
  - `_isPastGig`
- Preserved legacy global aliases so existing `index.html` call sites still work
- Updated Calendar helper integrity gate: `tests/integrity/calendar-helpers-package.mjs`
- Bumped Build Version to `2026-07-13-r954-calendar-today-status-helpers`

---

## Validation Completed

### Local (Node)

| Check | Result |
|-------|--------|
| `node --check js/calendar-date-helpers.js` | PASS |
| Calendar helper integrity gate | PASS |
| Flyer manifest gate | PASS |
| Flyer adapter gate | PASS |
| Flyer layer helper gate | PASS |
| Inline script syntax check | PASS |

### Phone / PWA

| Check | Result |
|-------|--------|
| r954 running successfully on phone | PASS |
| Calendar loads successfully | PASS |
| Today/current date behavior looks normal | PASS |
| Future/past gig behavior appears normal | PASS |
| Gig detail opens successfully | PASS |
| Dates, labels, icons, and colors look normal | PASS |
| Flyer attachment / Make Flyer / Edit Saved Flyer remains working | PASS |
| Home cue behavior remains normal | PASS |

---

## Boundaries Preserved

- Did not move `rCal`
- Did not move Calendar render engine
- Did not move Calendar drawers
- Did not move Firestore reads/writes
- Did not move gig actions
- Did not move rehearsal proposal actions
- Did not change Calendar visuals or behavior
- Did not change Flyer behavior
- Did not change Home cue behavior
- Did not change Home band image behavior
- Did not touch root `calendar_*.js` dump files

### Expected untracked files (intentionally untouched)

- `docs/modularization/PHASE_6W_A_REHEARSAL_CUE_PARITY_PLAN.md`
- `oot-local-server.ps1`

---

## Calendar Modularization Status After C2a

| Slice | Status |
|-------|--------|
| Live Calendar modules | **1** — `js/calendar-date-helpers.js` |
| Pure date/display helpers | Extracted (C1a / r953) |
| Today / past-gig status helpers | Extracted (C2a / r954) |
| `rCal` / grid render | Still inline |
| Day drawer / Gig Detail / sheets | Still inline |
| Firestore listeners / writes | Still inline |
| Root `calendar_*.js` dumps | Still unused HTML dumps (not modules) |

Calendar modularization continues via pure helpers inside `OOT_CALENDAR_HELPERS`. Most Calendar orchestration remains in `index.html`.

---

## Next Recommended Slice

**C3 planning** — Inspect the next safest Calendar seam after date/status helpers.

- Planning only
- Prefer pure classification/sorting/display helpers if available
- Do not move `rCal`, drawers, Firestore, gig actions, or rehearsal proposal actions yet unless the plan proves a safer seam
