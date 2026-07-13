# Phase C2 — Calendar Next Seam Inspection Plan

## Status

**Planning / inspection only.** No runtime code changed. No `index.html` edits. Build Version unchanged.

| Item | Value |
|------|--------|
| Branch baseline | `main` @ `21a811d` |
| Runtime commit (C1a) | `af96f47` |
| Checkpoint commit | `21a811d` |
| Build Version | `2026-07-13-r953-calendar-date-helpers-extraction` |
| Shipped namespace | `window.OOT_CALENDAR_HELPERS` |
| Prior docs | [PHASE_C1_CALENDAR_MODULARIZATION_INSPECTION_PLAN.md](./PHASE_C1_CALENDAR_MODULARIZATION_INSPECTION_PLAN.md), [PHASE_C1A_R953_CALENDAR_DATE_HELPERS_EXTRACTION_CHECKPOINT.md](./PHASE_C1A_R953_CALENDAR_DATE_HELPERS_EXTRACTION_CHECKPOINT.md) |
| Tooling | [AGENT_TOOLING_DECISION_RULE.md](./AGENT_TOOLING_DECISION_RULE.md) |

---

## Current State After C1a / r953

```
Live Calendar module:
  js/calendar-date-helpers.js
    ├─ _calSafe / _calTypeIcon / _calColor / _calCompactDateLabel
    └─ window.OOT_CALENDAR_HELPERS + legacy aliases

Integrity:
  tests/integrity/calendar-helpers-package.mjs

Still inline in index.html:
  ├─ today / past-gig classification (_calTodayDate, _calTodayKey, _isPastGig)
  ├─ row collectors (_calDisplayRows, _calRowsInMonth, _calUpcomingRows, _customEntriesAsRows)
  ├─ rCal + month nav + swipe
  ├─ day drawer / Gig Detail / sheets
  ├─ Firestore listeners/writes
  ├─ Flyer bridges (_r380*, openFlyerForGig, calendar gig action pills)
  └─ Home cue touchpoints (pending proposal / rehearsal cues)
```

Load order (confirmed): flyer manifest → adapter → layer helpers → **calendar-date-helpers** → inline.

---

## Calendar Modularization Percentage Estimate After C1a

| Slice | Estimate | Reasoning |
|-------|----------|-----------|
| Calendar logic still in `index.html` | **~93–97%** | Grid, drawers, sheets, Firestore, proposals still monolith |
| Live Calendar modules | **1** | `js/calendar-date-helpers.js` |
| Extracted helper surface | **~2–4%** | Four pure display helpers (~50 LOC) vs multi-kLOC Calendar orchestration |

**Verdict:** Modularization has started but remains early. Prefer another pure-helper slice before any render/drawer/Firestore move.

---

## Exact Code Areas Inspected

| Asset / area | Location | Notes |
|--------------|----------|-------|
| C1 plan + C1a checkpoint | `docs/modularization/PHASE_C1*` | Recommended second-wave leftovers |
| Shipped module | `js/calendar-date-helpers.js` | `OOT_CALENDAR_HELPERS` |
| Integrity gate | `tests/integrity/calendar-helpers-package.mjs` | Alias + behavior smoke |
| Today / rollover | `index.html` ~24936–24956 | `_calTodayDate`, `_calTodayKey`; rollover stays DOM-bound |
| Past gig | ~27141–27149 | `_isPastGig` duplicates today-key string math |
| Display remaining | ~31184–31261 | Row collectors; `_calNextUpLine` / icon |
| Grid render | ~31297+ | `rCal`, nav, swipe |
| Important dates → rows | ~31767–31814 | `_customEntriesAsRows` |
| Gig Detail / drawers | ~32092+, ~32419+ | DOM orchestration + flyer thumbs |
| Blackout text helpers | ~32996–33121 | Name + conflict **message** builders |
| Flyer bridges | ~28762+, ~35655+ | Dual return paths — protect |
| Home cue touchpoints | ~26089+, `rCal` → `renderPendingProposalCue` | Protect Home ownership |

---

## Remaining Calendar Functions / Blocks in `index.html` (Selected)

### Best next pure helpers

| Function | ~Line | Role |
|----------|-------|------|
| `_calTodayDate` | 24936 | `new Date()` wrapper |
| `_calTodayKey` | 24937 | Local `YYYY-MM-DD` key |
| `_isPastGig` | 27141 | Strict `ev.date < today` |

### Strong follow-on pure / near-pure (C2b+)

| Function | Role |
|----------|------|
| `_blackoutNameFromTitle` | Title → person name |
| `_blackoutConflictLine` / `_blackoutConflictMessage` | Conflict text only (not confirm UI) |
| `getImportantDatesOn` | Filter important dates (inject data) |
| `_customEntriesAsRows` | Important dates → calendar row shape |
| `_eventColor` | `EC` lookup (tiny; `_calColor` already defers) |
| `_calNextUpCalendarIcon` / `_calNextUpLine` | Next Up formatters (`gigDetails` inject for line) |

### Keep deferred

| Block | Why |
|-------|-----|
| `_calDisplayRows` / `_calRowsInMonth` / `_calUpcomingRows` | Global coupling (`events`, `CY`/`CM`, birthdays/holidays) |
| `rCal` / nav / swipe / stage summary | Full render engine + Home cue refresh |
| Drawers / sheets / Gig Detail orchestration | DOM + Firestore + Flyer |
| Firestore listeners/writes | Highest data risk |
| Flyer bridges / Home cue bridges | Boundary protection |

---

## Candidate Next Seams

| Rank | Seam | Purity | DOM | Firestore | Flyer/Home risk |
|------|------|--------|-----|-----------|-----------------|
| **1** | Today + past-gig classification | High | None | None | None / Low |
| 2 | Blackout name + conflict **message** builders | High | None | None | None |
| 3 | `getImportantDatesOn` + `_customEntriesAsRows` (injected) | Med–High | None | Reads in-memory only | Low |
| 4 | `_eventColor` / `EC` co-locate | High | None | None | Low |
| 5 | Next Up formatters | Med | None | None | Low |
| 6 | Row collectors (`_calDisplayRows`…) | Med–Low | Indirect | Indirect | Med |
| Avoid | `rCal`, drawers, Firestore writes, Flyer/Home cue bridges | Low | High | High | High |

---

## Recommended Next Runtime Seam

**C2a — Calendar today / past-gig helpers extraction**

**Exact functions to move:**

1. `_calTodayDate`
2. `_calTodayKey`
3. `_isPastGig`

**Module approach:** **Extend** existing `js/calendar-date-helpers.js` (do not add a new Calendar file yet).

**Namespace approach:** **Preserve and extend** shipped `window.OOT_CALENDAR_HELPERS`:

```javascript
window.OOT_CALENDAR_HELPERS = {
  // existing C1a
  typeIcon, safe, color, compactDateLabel,
  // C2a
  todayDate: _calTodayDate,
  todayKey: _calTodayKey,
  isPastGig: _isPastGig
};
// Keep window._calTodayDate / _calTodayKey / _isPastGig aliases
```

**Optional behavior-neutral cleanup in the same seam:** implement `_isPastGig` via `_calTodayKey()` instead of duplicating the today-string construction (same strict `< today` semantics).

**Keep inline:** `_calIsVisible`, `_calRefreshForTodayRollover` (DOM + `rCal`).

---

## Why That Seam Is Safest

1. Continues C1a’s own “optional leftovers” (`_calTodayKey` / past-gig) from the C1 plan.
2. Pure classification — no DOM, no Firestore, no Flyer, no Home cue ownership change.
3. Tiny blast radius (~15–20 LOC) inside the already-proven Calendar helpers package + gate.
4. Avoids inventing a second Calendar namespace or premature new file for three functions.
5. Unblocks later row-materialization work with consistent today-key helpers without touching `rCal`.

---

## What Should Not Be Moved Next

- Full `rCal` / month nav / swipe / stage summary
- Day drawer / Gig Detail / sheets orchestration
- `_calDisplayRows` / `_calRowsInMonth` / `_calUpcomingRows`
- Firestore listeners or write/action paths
- Flyer open/return/save / calendar Make Flyer pills
- Home pending-proposal / rehearsal cue bridges
- Blackout **confirm** UI / ack state / member form wiring (messages-only later is fine)
- Root `calendar_*.js` ChatGPT dumps
- Do not rename or replace `window.OOT_CALENDAR_HELPERS`

---

## Required Integrity Gates Before Runtime Extraction

Extend **`tests/integrity/calendar-helpers-package.mjs`** (preferred) before removing inline defs:

| Check | Detail |
|-------|--------|
| No inline defs | `function _calTodayDate` / `_calTodayKey` / `_isPastGig` absent from `index.html` |
| Namespace keys | `OOT_CALENDAR_HELPERS.todayDate` / `todayKey` / `isPastGig` |
| Legacy aliases | `window._calTodayDate`, `window._calTodayKey`, `window._isPastGig` |
| Behavior smoke | Today key `YYYY-MM-DD`; past / same-day / missing-date cases for `_isPastGig` |
| Script order | flyer-layer → calendar-date-helpers → inline unchanged |
| Prior C1a checks | Escape / icon / color / compact label still pass |

Also keep flyer integrity packages green.  
**Do not** treat Home dirty-tree Phase 6d `index.html` allowlist failures as a C2a blocking requirement (same lesson as C1a).

Phone smoke after runtime: Build Version r954, Calendar opens, Gig Detail opens, no broken date/past-gig behavior.

---

## Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| `_isPastGig` semantics drift (same-day = not past) | High | Explicit VM cases: past true, today false, missing false |
| Accidental move of rollover/DOM helpers | Medium | Leave `_calIsVisible` / `_calRefreshForTodayRollover` inline |
| Dual today-string implementations diverge before extraction | Low | Prefer `_isPastGig` → `_calTodayKey()` in same slice |
| Expanding into row collectors in same PR | High | Hard scope: three functions only |
| Home dirty-tree gate noise | Medium | Skip for this Calendar-only slice; validate post-commit if needed |
| Second namespace / new file churn | Low | Extend `OOT_CALENDAR_HELPERS` + existing module |

---

## Proposed Build Version (runtime later)

`2026-07-13-r954-calendar-today-past-helpers-extraction`

Do **not** bump Build Version during this planning-only slice.

---

## Recommended Runtime Slice Name

**C2a / r954 — Calendar today + past-gig helpers extraction**

Scope preview:

1. Extend integrity gate first (or with module edit).
2. Add the three helpers to `js/calendar-date-helpers.js` + extend `OOT_CALENDAR_HELPERS` + aliases.
3. Remove matching inline defs from `index.html` only.
4. Bump Build Version to r954 + What's New.
5. Phone verify Calendar + Gig Detail; no Home/Flyer regressions.
6. Checkpoint doc after phone pass.

**Explicitly not in C2a:** `rCal`, drawers, Firestore, Flyer bridges, row collectors, UI polish, green save checkmark.

**Immediate follow-on (C2b, separate approval):** blackout name + conflict message builders, **or** important-date row materialization (`getImportantDatesOn` / `_customEntriesAsRows`) — pure/injectable only.

---

## Hard Boundaries

- Planning only in this slice
- Do not edit `index.html` or runtime JS here
- Do not add modules yet
- Do not change Build Version yet
- Do not change Calendar visuals or behavior
- Do not change Flyer behavior
- Do not change Home cue behavior
- Do not change Home band image behavior
- Do not touch root `calendar_*.js` dump files
- Do not touch:
  - `docs/modularization/PHASE_6W_A_REHEARSAL_CUE_PARITY_PLAN.md`
  - `oot-local-server.ps1`
- Preserve shipped namespace: `window.OOT_CALENDAR_HELPERS`

---

## Commit Recommendation

| Step | Action | Commit message |
|------|--------|----------------|
| Now (this slice) | Plan doc only | `Document Calendar next seam inspection plan` |
| Next (C2a runtime) | Extend helpers module + gate + r954 | `Extract Calendar today past helpers` |
| After phone verify | Checkpoint doc | `Document r954 Calendar today past helpers checkpoint` |

---

## Explicit Next Step

1. Review and approve this C2 plan.
2. Implement **C2a** only after integrity gate extension is accepted.
3. Do not start `rCal`, drawer, or Firestore extraction until C2a is phone-verified.
4. Tooling: Cursor Agent for architecture; PowerShell for bounded validation/commit after approval.
