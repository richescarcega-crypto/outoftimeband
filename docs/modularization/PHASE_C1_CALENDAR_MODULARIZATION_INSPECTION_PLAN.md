# Phase C1 — Calendar Modularization Inspection Plan

## Status

**Planning / inspection only.** No runtime code changed. No `index.html` edits. Build Version unchanged.

| Item | Value |
|------|--------|
| Branch baseline | `main` @ `bae8205` |
| Runtime Build Version | `2026-07-09-r952-flyer-layer-helpers-extraction` |
| Prior flyer slice | F8a / r952 — layer helpers complete, phone-verified, checkpointed |
| Tooling | [AGENT_TOOLING_DECISION_RULE.md](./AGENT_TOOLING_DECISION_RULE.md) |
| Related | [PHASE_F8_FLYER_RENDER_HELPER_EXTRACTION_PLAN.md](./PHASE_F8_FLYER_RENDER_HELPER_EXTRACTION_PLAN.md), [PHASE_F8A_R952_FLYER_LAYER_HELPERS_EXTRACTION_CHECKPOINT.md](./PHASE_F8A_R952_FLYER_LAYER_HELPERS_EXTRACTION_CHECKPOINT.md) |

---

## Current Repo / Runtime State

```
Live modules (loaded):
  js/flyer-template-manifest.js
  js/flyer-template-adapter.js
  js/flyer-layer-helpers.js
  oot_home_*.js (cue renderer, controller, layout, gig slot, alert rail, …)

Calendar:
  index.html — ALL Calendar tab logic still inline
  No live js/calendar-*.js modules
  No tests/integrity/calendar-*-package.mjs

Dead / misleading inventory (NOT loaded, NOT modules):
  calendar_helpers_r928.js, calendar_viewport_r917.js, calendar_today_r920.js,
  calendar_lifecycle_r919.js, calendar_drawer_r918.js, calendar_keyboard_r926.js,
  calendar_key__r921.js, calendar_layout_r916.js, calendar_layout_r914.js
  → ChatGPT HTML page dumps (<!DOCTYPE html>), do not reconnect or treat as extracted Calendar code
```

Build Version remains `2026-07-09-r952-flyer-layer-helpers-extraction`.

Calendar modularization docs prior to this file: **none** (`PHASE_C*` did not exist).

---

## Calendar Modularization Percentage Estimate

| Slice | Estimate | Reasoning |
|-------|----------|-----------|
| Calendar logic still in `index.html` | **~95–98%** | Grid render (`rCal`), day drawer, gig/rehearsal/blackout sheets, important dates, legend, filters, Firestore listeners/writes all inline |
| Live Calendar modules extracted | **~0%** | Zero loaded Calendar JS packages under `js/` |
| Boundary area helped by Home/Flyer | **~5–15% of Calendar surface** | Pending-proposal Calendar badge/micro-cue owned via Home cue renderer; Flyer *engine* extracted — Calendar still owns entry/return/thumbs |

**Verdict:** Calendar modularization has **not started**. Home cue work and Flyer F5–F8a provide **boundary insulation**, not Calendar extraction.

---

## What Calendar Pieces Are Already Indirectly Helped

### Flyer (F5 → F8a / r950–r952)

- Flyer config, adapters, and layer helpers live outside `index.html`.
- Calendar phone path (Make Flyer / Edit Saved Flyer from gig) exercises a smaller, gated Flyer blast radius.
- Calendar may keep thin wrappers (`openFlyerForGig`, `_r380*`) while Flyer internals stay external.

### Home cues (6L–6Z / 7A)

- Pending-proposal Calendar tab badge and ACTION NEEDED strip route through `oot_home_cue_renderer.js` (`calendarTabBadge`, `calendarMicroCue`, `#tb-cal`, `#cal-proposal-micro-cue`).
- Home integrity gates already lock cue call-site contracts involving Calendar DOM ids.
- Rehearsal / song-vote cues are Home-first; Calendar still owns events grid, day drawer, and rehearsal sheets/proposals.

---

## Exact Areas Inspected

| Area | Primary locations in `index.html` |
|------|-----------------------------------|
| Calendar markup | `#sc-cal` ~18696; hero/key/today; `#cal-drawer` ~18745; `#evl`; `#tb-cal`; `#gig-detail-modal`; `#flyer-modal` |
| Home → Calendar nav | `_getNextCountdownGig`, `_r318OpenHeaderNextGig`, `goToCalendar` ~24156–24506 |
| Today / rollover | `_calTodayDate`, `_calTodayKey`, `_calRefreshForTodayRollover` ~24926–24954 |
| Important dates | `listenImportantDates` … `rImportantDatesList` ~25662–25928 |
| Pending proposal ↔ Calendar | `_hideCalendarProposalCueWhileWorkspaceOpen`, `_openPendingProposalCue`, `renderPendingProposalCue` ~26087–26266 |
| Events / past gig | `listenEvents`, `_isPastGig` ~26277+, ~27139 |
| Rehearsal proposals / forms | `listenProposals`, `rProposals`, rehearsal sheets ~27149+ |
| Flyer bridge | `_r380*` ~28757–28774; `openFlyerForGig` |
| Gig details Firestore | `listenGigDetails` ~30537+ |
| Pure-ish Calendar helpers | `_calTypeIcon`, `_calSafe`, `_calColor`, `_calCompactDateLabel` ~31182–31278 |
| Row / upcoming helpers | `_calDisplayRows`, `_calRowsInMonth`, `_calUpcomingRows`, `_customEntriesAsRows` |
| Main grid | `rCal()` ~31324+ |
| Day drawer | `openDayDrawer` ~32119+ |
| Gig Detail / sheets | `_r366*`, `openGigSheet`, blackout/rehearsal sheets ~32431–33642 |
| Calendar gig → flyer pills | `_r633CalendarGigActionRowHtml`, `_r633WireCalendarGigActions` ~35682+ |
| Home modules | `oot_home_cue_renderer.js` and related `oot_home_*.js` |
| Flyer modules | `js/flyer-template-*.js`, `js/flyer-layer-helpers.js` |
| Integrity | `tests/integrity/home-*-package.mjs`, `flyer-*-package.mjs` (no Calendar package yet) |
| Docs | F5/F7/F8/F8a flyer checkpoints; Home cue 6x/7A checkpoints; agent tooling rule |

---

## Calendar Functions / Blocks Still in `index.html`

### Recommended first-cut helpers (pure / near-pure)

| Function | ~Line | Role |
|----------|-------|------|
| `_calTypeIcon` | 31182 | Type → icon markup |
| `_calSafe` | 31192 | HTML escape |
| `_calColor` | 31228 | Type/row → color |
| `_calCompactDateLabel` | 31272 | Compact weekday/day label |
| `_calTodayKey` | 24935 | Today key helper |
| `_isPastGig` | 27139 | Past-gig classification |

### Closely related (second wave, still helper-shaped)

| Function | Role |
|----------|------|
| `_customEntriesAsRows` | Important dates → calendar rows (needs injected data) |
| `_calNextUpLine` / related formatters | Next Up string builders (inject `gigDetails`) |
| `_blackoutNameFromTitle` / conflict message builders | Classification text only — not confirm UI |
| `getImportantDatesOn` | Pure date match filter |

### Keep inline for now (orchestration / high risk)

| Block | Why |
|-------|-----|
| `rCal` / month nav / `_wireCalSwipe` | Full render engine + swipe + hero state |
| `openDayDrawer` / `oDy` / EV list filters | DOM orchestration; Flyer thumbs; Home return paths |
| Gig/rehearsal/blackout sheets + saves | Firestore writes + modal UX |
| Important date CRUD listeners/saves | Firestore + modal |
| `_r380*` / `openFlyerForGig` / flyer modal | Flyer boundary — protect, don't move with Calendar |
| Pending-proposal open/hide navigation | Cue boundary already partially modularized on Home |
| `saveEvent` / `listenEvents` / `listenGigDetails` | Shared data path |

---

## Known Calendar ↔ Home Touchpoints

| Touchpoint | Direction | Names |
|------------|-----------|-------|
| Book / empty → Calendar | Home → Cal | `goToCalendar`, no-gigs card |
| Header next gig → day drawer | Home → Cal | `_r318OpenHeaderNextGig` → `go('cal')` + `rCal` + `openDayDrawer` |
| Pending proposal badge / micro-cue | Home ↔ Cal DOM | `oot_home_cue_renderer` + `renderPendingProposalCue` / `_openPendingProposalCue` |
| Hide cue while workspace open | Cal UX | `_hideCalendarProposalCueWhileWorkspaceOpen` |
| `rCal` refreshes cue | Cal → cue | `rCal` calls `renderPendingProposalCue()` |
| Shared events data | Shared | Home rehearsal/song-vote cues read same event universe |

**Protect:** Home cue integrity call-site gates; Home band image; Home alert/cue ownership.

---

## Known Calendar ↔ Flyer Touchpoints

| Touchpoint | Names |
|------------|-------|
| Gig Detail Make Flyer / edit | `_r366OpenGigReadOnly` → `_r380OpenFlyerFromGigDetail` |
| Gig sheet Make Flyer / thumb | `openGigSheet` |
| Day drawer flyer thumb | `openDayDrawer` → `openFlyerForGig` |
| Calendar gig action pill | `_r633WireCalendarGigActions` → `openFlyerForGig` |
| Return after flyer | `_r380ReturnToGigDetailIfNeeded` → Gig Detail |
| Save attaches flyer to gig | Flyer commit / Save to Gig; `saveGigDetail` preserves flyer fields |
| Drawer refresh after flyer | `_refreshDrawerForCurrentDay` |

**Protect:** Dual return paths (drawer vs Gig Detail). Do not extract Flyer entry/return in C1a.

---

## Candidate Extraction Seams (Ranked)

1. **Pure date / display helpers** — `_calSafe`, `_calTypeIcon`, `_calColor`, `_calCompactDateLabel` (+ optional `_calTodayKey` / `_isPastGig`). Lowest risk.
2. **Row classification helpers (pure with injection)** — `_customEntriesAsRows`, blackout name/conflict *message* builders, `getImportantDatesOn`.
3. **Next Up formatters** — string builders with injected deps.
4. **Thin Gig Detail HTML builders** — `_r366Esc` / field HTML helpers (still strings; no writes).
5. **Row collectors with globals** — `_calDisplayRows` / `_calUpcomingRows` / `_calRowsInMonth` (medium risk until deps injected).
6. **Avoid first** — `rCal`, drawers, sheets, Firestore listeners/writes, Flyer bridges, proposal workspace navigation.

---

## Recommended First Runtime Seam

**C1a — Calendar date/display helpers extraction**

Proposed module: `js/calendar-date-helpers.js`

Proposed bridge:

```javascript
window.OOT_CALENDAR_HELPERS = {
  typeIcon: _calTypeIcon,
  safe: _calSafe,
  color: _calColor,
  compactDateLabel: _calCompactDateLabel
  // optional: todayKey, isPastGig
};
// Preserve window._cal* aliases for zero call-site churn
```

Proposed load order (after flyer helpers, before or with other externals as approved):

```html
<script src="js/flyer-template-manifest.js"></script>
<script src="js/flyer-template-adapter.js"></script>
<script src="js/flyer-layer-helpers.js"></script>
<script src="js/calendar-date-helpers.js"></script>
<!-- … home modules / inline … -->
```

**Why this seam first**

- Matches Flyer F5/F7 pattern: pure helpers before render/orchestration.
- Tiny blast radius; no Firestore; no Calendar visuals intent change.
- Easy integrity gate and phone smoke (Calendar open + month grid looks unchanged).
- Proves Calendar module load-order + alias discipline before touching `rCal` or drawers.

---

## What Should Not Be Moved First

- Entire Calendar render engine (`rCal`, swipe, month navigation)
- Day drawer / Gig Detail / sheets orchestration
- Firestore listeners or write/action paths
- Flyer open/return/save bridges
- Pending-proposal navigation UX (treat as Home/Calendar cue boundary)
- Root `calendar_*.js` ChatGPT dumps (do not load or “revive”)
- Home band image or Home cue renderer ownership

---

## Required Integrity Gates Before Runtime Extraction

New gate (required before merge): **`tests/integrity/calendar-helpers-package.mjs`**

| Check | Detail |
|-------|--------|
| File exists | `js/calendar-date-helpers.js` |
| Script wiring | Loaded from `index.html`; order relative to flyer helpers documented |
| No inline defs | Moved `_calSafe` / `_calTypeIcon` / `_calColor` / `_calCompactDateLabel` absent as `function` defs in `index.html` |
| Namespace + aliases | `window.OOT_CALENDAR_HELPERS` + legacy `_cal*` aliases |
| Behavior smoke | Escape / icon / color / compact label samples stable in VM |
| Home/Flyer gates still pass | Existing home + flyer integrity packages |

Keep Home packages green — they encode Calendar DOM cue contracts.

---

## Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Mistaking ChatGPT `calendar_*.js` dumps for live modules | High | Explicit dump disclaimer; never add as `<script src>` without rewrite |
| Global coupling (`events`, `EC`, `CY`/`CM`, `gigDetails`) | Medium | First seam only moves pure helpers with no/minimal globals |
| Breaking Home cue call-site gates | High | Don't move `renderPendingProposalCue` call sites in C1a |
| Breaking dual Flyer return paths | High | Leave `_r380*` / drawer flyer thumbs untouched |
| Visual drift in grid/drawer | Medium | Don't extract `rCal` / drawer in first slice; phone verify Calendar grid |
| CSS still monolithic | Low for C1a | JS-first; CSS later |

---

## Proposed Build Version (runtime later)

`2026-07-13-r953-calendar-date-helpers-extraction`

Do **not** bump Build Version during this planning-only slice.

---

## Recommended Next Runtime Slice Name

**C1a / r953 — Calendar date helpers extraction**

Scope preview:

1. Add integrity gate first (or with module).
2. Add `js/calendar-date-helpers.js` with chosen pure helpers + `OOT_CALENDAR_HELPERS` + aliases.
3. Wire script tag; remove matching inline defs only.
4. Bump Build Version to r953; What's New.
5. Phone verify Calendar tab + month grid + open a gig day (no Flyer/Home regressions).
6. Checkpoint doc after phone pass.

**Explicitly not in C1a:** `rCal`, drawers, sheets, Firestore writes, Flyer bridges, UI polish, green save checkmark, new templates.

---

## Hard Boundaries

- Planning only in this slice
- Do not edit `index.html` or runtime JS here
- Do not add modules yet
- Do not change Build Version yet
- Do not change Calendar visuals or behavior
- Do not change Flyer behavior
- Do not change Home band image behavior
- Do not touch:
  - `docs/modularization/PHASE_6W_A_REHEARSAL_CUE_PARITY_PLAN.md`
  - `oot-local-server.ps1`

### Deferred UX (recorded, not in scope)

User prefers a green save checkmark over autosave/kebab Save to Gig for Flyer — continue modularization first; do not implement in Calendar C1.

---

## Commit Recommendation

| Step | Action | Commit message |
|------|--------|----------------|
| Now (this slice) | Plan doc only | `Document Calendar modularization inspection plan` |
| Next (C1a runtime) | Helpers module + gate + wiring + r953 | `Extract calendar date helpers` |
| After phone verify | Checkpoint doc | `Document r953 calendar date helpers extraction checkpoint` |

---

## Explicit Next Step

1. Review and approve this C1 plan.
2. Implement **C1a** only after integrity gate strategy is accepted.
3. Do not start `rCal`, drawer, or Firestore extraction until C1a is phone-verified.
4. Tooling: Cursor Agent for further architecture inspection; PowerShell for bounded validation/commit after approval ([AGENT_TOOLING_DECISION_RULE.md](./AGENT_TOOLING_DECISION_RULE.md)).
