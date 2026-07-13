# Phase C3 — Calendar Helper Seam Inspection Plan

## Status

**Planning / inspection only.** No runtime code changed. No `index.html` edits. Build Version unchanged.

| Item | Value |
|------|--------|
| Branch baseline | `main` @ `15d38b8` |
| Runtime commit (C2a) | `13d0bad` |
| Checkpoint commit | `15d38b8` |
| Build Version | `2026-07-13-r954-calendar-today-status-helpers` |
| Shipped namespace | `window.OOT_CALENDAR_HELPERS` |
| Module | `js/calendar-date-helpers.js` |
| Prior docs | [PHASE_C1](./PHASE_C1_CALENDAR_MODULARIZATION_INSPECTION_PLAN.md), [PHASE_C1A](./PHASE_C1A_R953_CALENDAR_DATE_HELPERS_EXTRACTION_CHECKPOINT.md), [PHASE_C2](./PHASE_C2_CALENDAR_NEXT_SEAM_INSPECTION_PLAN.md), [PHASE_C2A](./PHASE_C2A_R954_CALENDAR_TODAY_STATUS_HELPERS_CHECKPOINT.md) |
| Tooling | [AGENT_TOOLING_DECISION_RULE.md](./AGENT_TOOLING_DECISION_RULE.md) |

---

## Current State After C2a / r954

```
Live Calendar module:
  js/calendar-date-helpers.js
    C1a: _calSafe / _calTypeIcon / _calColor / _calCompactDateLabel
    C2a: _calTodayDate / _calTodayKey / _isPastGig
    └─ window.OOT_CALENDAR_HELPERS + legacy aliases

Integrity:
  tests/integrity/calendar-helpers-package.mjs

Still inline:
  ├─ blackout conflict TEXT helpers (_blackoutNameFromTitle, Line, Message)
  ├─ blackout confirm UI / ack / member form helpers
  ├─ important-date filters + _customEntriesAsRows
  ├─ row collectors (_calDisplayRows / RowsInMonth / UpcomingRows)
  ├─ Next Up formatters
  ├─ holiday / birthday math helpers
  ├─ rCal + month nav + swipe
  ├─ drawers / Gig Detail / sheets
  ├─ Firestore listeners/writes
  ├─ Flyer bridges
  └─ Home cue touchpoints
```

Load order unchanged: flyer helpers → **calendar-date-helpers** → inline.

---

## Calendar Modularization Percentage Estimate After C2a

| Slice | Estimate | Reasoning |
|-------|----------|-----------|
| Calendar logic still in `index.html` | **~91–96%** | Grid, drawers, sheets, Firestore, proposals still monolith |
| Live Calendar modules | **1** | Same file, now ~74 LOC |
| Extracted helper surface | **~4–7%** | Seven pure helpers across C1a + C2a |

**Verdict:** Modularization continues via pure helpers. Prefer another pure text/classification slice before row collectors or render engine work.

---

## Exact Code Areas Inspected

| Area | Location | Notes |
|------|----------|-------|
| Shipped module + gate | `js/calendar-date-helpers.js`, `tests/integrity/calendar-helpers-package.mjs` | C1a + C2a |
| Blackout text helpers | `index.html` ~32981–33106 | Name / Line / Message |
| Blackout confirm UI | ~33108–33136 | `appConfirm` — do **not** move |
| Blackout member/form | ~32985–33072 | DOM + members — do not move |
| Important dates | ~25691–25707, ~31752–31798 | `getImportantDatesOn`, `_customEntriesAsRows` |
| Row collectors / Next Up | ~31169–31245 | Remaining `_cal*` display helpers |
| `_eventColor` / `EC` | ~24955, ~31574 | Tiny; `_calColor` already defers |
| Holiday / birthday math | ~25606–25657 | Pure but larger |
| `rCal` / drawers / Firestore / Flyer / Home cues | prior C1/C2 inventories | Protect boundaries |

---

## Remaining Calendar Functions / Blocks in `index.html` (Selected)

### Best next pure helpers

| Function | ~Line | Role |
|----------|-------|------|
| `_blackoutNameFromTitle` | 32981 | Title → person name |
| `_blackoutConflictLine` | 33092 | Conflicts → availability sentence |
| `_blackoutConflictMessage` | 33101 | Full conflict copy for confirm dialogs |

### Strong follow-ons (C3b+)

| Function | Role |
|----------|------|
| Holiday block (`getUSFederalHolidays`, `getHolidayOn`, support) | Pure date classification |
| `getImportantDatesOn` + `_customEntriesAsRows` | Injectable row materialization |
| `_calNextUpCalendarIcon` / `_calNextUpLine` | Display formatters (`gigDetails` inject for line) |
| `_eventColor` | Tiny EC lookup |

### Keep deferred

| Block | Why |
|-------|-----|
| `_confirmBlackoutConflictBeforeOpen/Save` + ack | Confirm UI, not text |
| `_blackoutConflictsForDate` / member selectors | Globals + DOM |
| `_calDisplayRows` / `_calRowsInMonth` / `_calUpcomingRows` | Global coupling |
| `rCal` / drawers / sheets / Firestore / Flyer / Home cues | High risk |

---

## Candidate Next Seams

| Rank | Seam | Purity | DOM | Firestore | Flyer/Home |
|------|------|--------|-----|-----------|------------|
| **1** | Blackout conflict **text** trio | High | None | None | None |
| 2 | Holiday math block | High | None | None | None |
| 3 | Important-date filter + row materialization (injected) | Med–High | None | In-memory only | Low |
| 4 | Next Up formatters | Med | None | None | Low |
| 5 | `_eventColor` alone | High | None | None | Low (too thin alone) |
| 6 | Row collectors | Med–Low | Indirect | Indirect | Med |
| Avoid | `rCal`, drawers, confirms, Firestore, Flyer/Home bridges | Low | High | High | High |

---

## Recommended Next Runtime Seam

**C3a — Calendar blackout conflict text helpers extraction**

**Exact functions to move:**

1. `_blackoutNameFromTitle`
2. `_blackoutConflictLine`
3. `_blackoutConflictMessage`

**Module approach:** **Extend** existing `js/calendar-date-helpers.js` (no new Calendar file).

**Namespace approach:** **Preserve and extend** `window.OOT_CALENDAR_HELPERS`:

```javascript
window.OOT_CALENDAR_HELPERS = {
  // C1a + C2a …
  blackoutNameFromTitle: _blackoutNameFromTitle,
  blackoutConflictLine: _blackoutConflictLine,
  blackoutConflictMessage: _blackoutConflictMessage
};
// Keep window._blackoutNameFromTitle / _blackoutConflictLine / _blackoutConflictMessage aliases
```

**Keep inline:** `_confirmBlackoutConflictBeforeOpen`, `_confirmBlackoutConflictBeforeSave`, `_blackoutConflictsForDate`, ack map, member/form helpers.

---

## Why That Seam Is Safest

1. Already named as the immediate pure follow-on in the C2 plan (C2b option).
2. Pure string/classification helpers — no DOM, Firestore, Flyer, or Home cue ownership.
3. Clear hard boundary vs confirm UI (`appConfirm` stays inline and only *consumes* the message).
4. Tiny blast radius (~26 LOC) inside the proven Calendar helpers package + gate.
5. Safer than important-date row materialization (no global inject) and safer than holidays (smaller, more bounded call surface for this slice).

---

## What Should Not Be Moved Next

- Full `rCal` / month nav / swipe / stage summary
- Day drawer / Gig Detail / sheets orchestration
- Firestore listeners or write/action paths
- Flyer open/return/save bridges
- Home pending-proposal / rehearsal cue bridges
- Blackout **confirm** UI, ack state, conflict date querying, member selectors
- Row collectors without a dedicated inject design
- Root `calendar_*.js` dumps
- Do not rename or replace `window.OOT_CALENDAR_HELPERS`

---

## Required Integrity Gates Before Runtime Extraction

Extend **`tests/integrity/calendar-helpers-package.mjs`** before removing inline defs:

| Check | Detail |
|-------|--------|
| No inline defs | `function _blackoutNameFromTitle` / `_blackoutConflictLine` / `_blackoutConflictMessage` absent from `index.html` |
| Namespace keys | `blackoutNameFromTitle` / `blackoutConflictLine` / `blackoutConflictMessage` on `OOT_CALENDAR_HELPERS` |
| Legacy aliases | Matching `window._blackout*` functions |
| Behavior smoke | Name strip (`'Alex Unavailable'` → `'Alex'`); singular vs plural conflict lines; open vs save message verbs |
| Prior C1a/C2a checks | Escape / icons / colors / today / past-gig still pass |
| Script order | flyer-layer → calendar-date-helpers → inline |

Keep flyer integrity packages green.  
Skip Home dirty-tree Phase 6d allowlist as a C3a blocking gate (same C1a/C2a lesson).

Phone smoke after runtime: Calendar opens; blackout conflict **copy** unchanged when opening/saving on a blackout date; confirm buttons/ack unchanged; Flyer/Home cues unchanged.

---

## Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Accidental move of confirm UI with text helpers | High | Hard scope: three text functions only |
| Message wording drift (open vs save) | High | Exact string smoke cases for both modes |
| Pulling `_blackoutConflictsForDate` early | Medium | Leave conflict discovery inline |
| Expanding into important-date rows same PR | High | Defer to C3b |
| Home dirty-tree gate noise | Medium | Not required for this Calendar-only slice |

---

## Proposed Build Version (runtime later)

`2026-07-13-r955-calendar-blackout-text-helpers`

Do **not** bump Build Version during this planning-only slice.

---

## Recommended Runtime Slice Name

**C3a / r955 — Calendar blackout text helpers extraction**

Scope preview:

1. Extend integrity gate.
2. Add the three helpers to `js/calendar-date-helpers.js` + extend `OOT_CALENDAR_HELPERS` + aliases.
3. Remove matching inline defs from `index.html` only.
4. Bump Build Version to r955 + What's New.
5. Phone verify Calendar + blackout conflict copy; no Home/Flyer regressions.
6. Checkpoint doc after phone pass.

**Explicitly not in C3a:** confirm dialogs, ack state, conflict querying, `rCal`, drawers, Firestore, Flyer bridges, row collectors.

**Immediate follow-on (C3b, separate approval):** holiday math block, **or** injected `getImportantDatesOn` + `_customEntriesAsRows`.

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
| Now (this slice) | Plan doc only | `Document Calendar helper seam inspection plan` |
| Next (C3a runtime) | Extend helpers + gate + r955 | `Extract Calendar blackout text helpers` |
| After phone verify | Checkpoint doc | `Document r955 Calendar blackout text helpers checkpoint` |

---

## Explicit Next Step

1. Review and approve this C3 plan.
2. Implement **C3a** only after integrity gate extension is accepted.
3. Do not start `rCal`, drawer, or Firestore extraction until C3a is phone-verified.
4. Tooling: Cursor Agent for architecture; PowerShell for bounded validation/commit after approval.
