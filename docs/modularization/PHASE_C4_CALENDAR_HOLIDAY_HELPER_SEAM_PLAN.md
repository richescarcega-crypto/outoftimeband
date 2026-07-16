# Phase C4 — Calendar Holiday Helper Seam Plan

## Status

**Planning only.** No runtime code changed. No Build Version bump. No extraction until Rich approves.

| Item | Value |
|------|--------|
| Repo | `C:\Users\riche\Documents\outoftimeband` |
| Branch | `modularization-home-layout-engine-pilot` |
| HEAD / origin/pilot / origin/main | `189cf29` |
| Working tree (at plan authoring) | Clean |
| Build Version | `2026-07-13-r956-home-rehearsal-proposal-open-fix` |
| Shipped module | `js/calendar-date-helpers.js` |
| Shipped namespace | `window.OOT_CALENDAR_HELPERS` |
| Prior Calendar docs | `PHASE_C1*`, `PHASE_C2*`, `PHASE_C3*`, C1a–C3a checkpoints / extractions |
| Related production fix | r956 Home rehearsal proposal opener (`678c3e3`) — **out of scope** |

---

## 1. Current verified repo state

- Calendar helper package through **r955 (C3a)** is live on `main` / this branch tip.
- **r956** Home “Rehearsal on Deck” proposal-open fix is live and phone-verified.
- Phase 6i-a gig-reconcile backup exists separately; **do not** cherry-pick unless instructed.
- Next Calendar modularization step should be another **pure helper** slice before row collectors, drawers, or Firestore moves.

---

## 2. Calendar helpers already extracted (through r955)

Live in `js/calendar-date-helpers.js` + `OOT_CALENDAR_HELPERS` + legacy aliases:

| Wave | Helpers |
|------|---------|
| **C1a / r953 — display** | `_calTypeIcon`, `_calSafe`, `_calColor`, `_calCompactDateLabel` |
| **C2a / r954 — today/status** | `_calTodayDate`, `_calTodayKey`, `_isPastGig` |
| **C3a / r955 — blackout text** | `_blackoutNameFromTitle`, `_blackoutConflictLine`, `_blackoutConflictMessage` |

Integrity gate: `tests/integrity/calendar-helpers-package.mjs` already asserts those are **not** redefined inline.

---

## 3. Remaining Calendar ownership in `index.html` (selected)

Still inline (not exhaustive):

| Cluster | Examples |
|---------|----------|
| **Holiday math (proposed C4a)** | `_nthDayOfMonth`, `_lastDayOfMonth`, `_pad`, `_fmt`, `getUSFederalHolidays`, `getHolidayOn` |
| Birthday helpers | `isBirthdayToday`, `isBirthdayOnDate`, `getMembersBornOn` (`members`) |
| Important dates | `listenImportantDates`, `getImportantDatesOn`, `_customEntriesAsRows` |
| Row collectors | `_calDisplayRows`, `_calRowsInMonth`, `_calUpcomingRows` |
| Next Up | `_calNextUpCalendarIcon`, `_calNextUpLine`, `_calRenderStageSummary` |
| Grid / nav | `rCal`, swipe, month nav |
| Drawers / sheets | `oDy`, `openDayDrawer`, gig/rehearsal/blackout sheets |
| Blackout confirm UI | `_confirmBlackoutConflict*`, conflict discovery (text already extracted) |
| Proposals / Home cues | proposal workspace; Home cue bridges (r956 opener done) |

---

## 4. Why holiday helpers are the smallest safe next seam

1. Pure date classification — no DOM, Firestore writes, Flyer, or Home ownership.
2. Self-contained federal holiday table + weekday rules (~40 LOC public surface).
3. Clear call sites that only consume `getHolidayOn` / (internally) `getUSFederalHolidays`.
4. Continues the proven “extend `calendar-date-helpers.js` + gate + aliases” pattern.
5. Safer than important-date row materialization (global `importantDates`) or Next Up (DOM + `gigDetails`).
6. Orthogonal to r956 opener and blackout confirm UI.

---

## 5. Exact proposed extraction scope (C4a / r957)

| Symbol | Role |
|--------|------|
| `_nthDayOfMonth` | n-th weekday-of-month day number |
| `_lastDayOfMonth` | last weekday-of-month day number |
| `_pad` | **disposition below — not moved blindly** |
| `_fmt` | `YYYY-MM-DD` from year/month0/day (holiday table builder) |
| `getUSFederalHolidays` | Year → `[{date, name}, …]` |
| `getHolidayOn` | Date string → holiday object or `null` |

---

## 6. Disposition of `_pad` and `_fmt` (inspected)

### `_fmt`

- **Holiday-private.** Call sites in `index.html` are only inside `getUSFederalHolidays`.
- **Safe to move** into the module as a **private** helper (not required on `OOT_CALENDAR_HELPERS` / no need for `window._fmt`).

### `_pad`

- **Shared.** Used by:
  1. `_fmt` / holiday table construction (~25647–25662)
  2. Important Date modal default “today” input (~25824):  
     `dateForInput = now.getFullYear()+'-'+_pad(now.getMonth()+1)+'-'+_pad(now.getDate());`
- **Must not** remove the global `function _pad` from `index.html` as part of C4a, or Important Date create flow breaks.
- **Runtime rule for C4a:**
  - Keep **`function _pad` inline** in `index.html` for the Important Date path.
  - Inside `js/calendar-date-helpers.js`, use a **module-private** pad (e.g. local function used only by holiday `_fmt`) — do **not** replace or export `window._pad`.
  - Do **not** rename the inline `_pad` in this slice unless a separate approved cleanup is planned.

---

## 7. Proposed destination

| Asset | Action |
|-------|--------|
| `js/calendar-date-helpers.js` | **Extend** (no new Calendar file) |
| `window.OOT_CALENDAR_HELPERS` | **Extend** keys |
| Legacy globals | Preserve `window.getUSFederalHolidays`, `window.getHolidayOn` |

Load order unchanged: flyer helpers → **calendar-date-helpers** → inline.

---

## 8. Proposed exported API

```javascript
window.OOT_CALENDAR_HELPERS = {
  // C1a–C3a …
  usFederalHolidays: getUSFederalHolidays, // or holidaysForYear
  holidayOn: getHolidayOn
};

window.getUSFederalHolidays = window.OOT_CALENDAR_HELPERS.usFederalHolidays;
window.getHolidayOn = window.OOT_CALENDAR_HELPERS.holidayOn;
```

Private inside module (not exported): holiday `_fmt`, module-local pad, `_nthDayOfMonth`, `_lastDayOfMonth` (unless tests need them via exports — prefer testing through `getUSFederalHolidays` / `getHolidayOn` only).

---

## 9. Exact current call sites / consumers in `index.html`

| Consumer | Usage |
|----------|--------|
| `getUSFederalHolidays` | Only via `getHolidayOn` (and its own definition) |
| `getHolidayOn` | `_calUpcomingRows` (~31210) — holiday synthetic rows |
| `getHolidayOn` | `rCal` day-tile path (~31327) — holiday flag / marker |
| `getHolidayOn` | `_renderSpecialDayNotes` / drawer notes (~31919) |
| `_nthDayOfMonth` / `_lastDayOfMonth` / `_fmt` | Only holiday table construction |
| `_pad` | Holiday `_fmt` **and** Important Date modal (~25824) — **leave global `_pad` inline** |

---

## 10. Files expected to change in the later runtime slice

| File | Change |
|------|--------|
| `js/calendar-date-helpers.js` | Add holiday helpers + namespace keys + aliases; private pad/fmt |
| `tests/integrity/calendar-helpers-package.mjs` | No-inline defs; behavior smokes |
| `index.html` | Remove holiday defs only; keep `_pad`; r957 Build Version + What’s New |
| `docs/modularization/PHASE_C4A_R957_…_CHECKPOINT.md` | After phone verify (later) |

**This planning commit (when approved):** only this plan doc.

---

## 11. Integrity-test requirements (C4a)

Extend `tests/integrity/calendar-helpers-package.mjs`:

| Check | Detail |
|-------|--------|
| No inline duplicates | `function getUSFederalHolidays`, `function getHolidayOn`, `function _nthDayOfMonth`, `function _lastDayOfMonth`, `function _fmt` absent from `index.html` |
| **Keep** inline `_pad` | Gate must **not** forbid `function _pad` in `index.html` for C4a |
| Namespace | `OOT_CALENDAR_HELPERS.usFederalHolidays` (or agreed name) + `.holidayOn` |
| Legacy aliases | `window.getUSFederalHolidays`, `window.getHolidayOn` |
| Fixed-date checks | e.g. Independence Day `YYYY-07-04`, Christmas `YYYY-12-25`, Juneteenth `YYYY-06-19`, New Year `YYYY-01-01` |
| Rule checks | Thanksgiving = 4th Thursday in November; Memorial Day = last Monday in May; MLK = 3rd Monday in January (spot-check known years) |
| Exact-date lookup | Exact-date behavior only. The current implementation does not substitute Friday or Monday when a fixed-date holiday falls on a weekend. C4a must preserve that behavior. Weekend-observed holiday support is out of scope. Integrity tests should assert `getHolidayOn('YYYY-MM-DD')` returns expected `{date, name}` or `null` for non-holiday using exact calendar dates only — do not introduce observed-holiday logic. |
| Prior C1a–C3a | Escape / icons / colors / today / past-gig / blackout text still pass |
| Script order | flyer-layer → calendar-date-helpers → inline |

---

## 12. Required syntax and existing integrity gates

Before claiming C4a complete:

| Gate | Required |
|------|----------|
| Inline script syntax check on `index.html` | Yes |
| `tests/integrity/calendar-helpers-package.mjs` | Yes |
| Flyer manifest / adapter / layer helpers | Yes (keep green) |
| Home rehearsal cue open package | Smoke / unchanged (no edits) |
| Home dirty-tree Phase 6 allowlist | **Not** a C4a blocking gate |

---

## 13. Phone verification checklist (after runtime)

1. Build Version reports **r957**.
2. Calendar month grid loads.
3. A known federal holiday date shows holiday marker / special-day note as today.
4. Next Up / upcoming strip still lists holidays in range (if applicable).
5. Open **New Important Date** with empty date → default today still fills (covers inline `_pad`).
6. Blackout conflict copy still works (r955 path).
7. Home **Rehearsal on Deck** proposal open still works (r956 — no opener edits).
8. Flyer open/return unchanged; no Home band image changes.

---

## 14. Risks, exclusions, and stop conditions

| Risk / exclusion | Action |
|------------------|--------|
| Removing global `_pad` | **Stop** — Important Date modal depends on it |
| Exporting `window._pad` from module and deleting inline | **Stop** unless separate approved cleanup |
| Moving birthday / `members` helpers in same PR | **Stop** |
| Moving `_customEntriesAsRows` / `listenImportantDates` | **Stop** — next seam |
| Moving Next Up DOM / `rCal` / drawers | **Stop** |
| Touching blackout confirm UI | **Stop** |
| Editing r956 opener / Home cues / proposal vote | **Stop** |
| Flyer UI polish / Home band image / Band.png case collision | **Out of scope** |
| Behavior drift in holiday names/dates | Fixed-year integrity smokes + phone check |

---

## 15. Protected boundaries

- No Home band image CSS, layout, assets, or selector changes
- No r956 opener / `_r535OpenHomeRehearsal` changes
- No Flyer UI polish
- No Band.png / band.png cleanup
- No proposal / Home cue behavior changes
- No production-`main` force push or unapproved merge
- Preserve `window.OOT_CALENDAR_HELPERS` (extend only)
- Public Calendar **render** ownership (`rCal`, drawers) stays in `index.html`

---

## 16. Recommended runtime build / version name

`2026-07-15-r957-calendar-holiday-helpers`

(Do **not** bump until C4a runtime is approved and implemented.)

---

## 17. Explicit approval gate

**No runtime extraction, no `index.html` / module / test edits, no Build Version bump, and no push to `main` until Rich approves this plan.**

### Recommended sequence after approval

1. Extend integrity gate (red on missing holiday exports / still-inline holiday defs).
2. Implement C4a in `js/calendar-date-helpers.js`; remove holiday defs from `index.html`; **keep `_pad`**.
3. Bump Build Version to r957 + What’s New.
4. Run gates + phone checklist.
5. Checkpoint doc after phone pass.

**Immediate follow-on candidates (separate approval):** birthday helpers with injected `members`, **or** injected `getImportantDatesOn` + `_customEntriesAsRows`.
