# Phase C1a — r953 Calendar Date Helpers Extraction Checkpoint

Date: 2026-07-13

## Status

**C1a complete and pushed.** Local validation and phone/PWA verification passed.

| Item | Value |
|------|--------|
| Branch | `main` |
| Runtime commit | `af96f47` |
| Build Version | `2026-07-13-r953-calendar-date-helpers-extraction` |
| Commit message | `Extract Calendar date helpers` |

---

## Files Changed

| File | Role |
|------|------|
| `index.html` | Removed inline pure Calendar date/display helpers; added Calendar helpers script tag; r953 build marker + What's New |
| `js/calendar-date-helpers.js` | First live Calendar module — pure date/display helpers |
| `tests/integrity/calendar-helpers-package.mjs` | Calendar helper integrity gate |

---

## What Changed

- Created first live Calendar module: `js/calendar-date-helpers.js`
- Moved pure Calendar date/display helpers out of `index.html`:
  - `_calSafe`
  - `_calTypeIcon`
  - `_calColor`
  - `_calCompactDateLabel`
- Added `window.OOT_CALENDAR_HELPERS` namespace
- Preserved legacy `_cal*` global aliases so existing `index.html` call sites still work
- Added Calendar helper integrity gate: `tests/integrity/calendar-helpers-package.mjs`
- Bumped Build Version to `2026-07-13-r953-calendar-date-helpers-extraction`

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
| r953 running successfully on phone | PASS |
| Calendar loads successfully | PASS |
| Gig detail opens successfully | PASS |
| No blank screen / broken icons / bad date labels | PASS |

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

## Calendar Modularization Status After C1a

| Slice | Status |
|-------|--------|
| Live Calendar modules | **1** — `js/calendar-date-helpers.js` |
| Pure date/display helpers | **Extracted** (C1a / r953) |
| `rCal` / grid render | Still inline |
| Day drawer / Gig Detail / sheets | Still inline |
| Firestore listeners / writes | Still inline |
| Root `calendar_*.js` dumps | Still unused HTML dumps (not modules) |

Calendar modularization has started. Most Calendar orchestration remains in `index.html`.

---

## Next Recommended Slice

**C2 planning** — Inspect the next safest Calendar seam after pure date/display helpers.

- Planning only
- Do not move `rCal`, drawers, Firestore, gig actions, or rehearsal proposal actions yet unless the plan proves a safer seam
