# Phase 6l-a Home Cue Renderer Inventory

## Status

**Inventory complete / planning-only.** No runtime behavior changed.

Static code inspection only. No browser-observed behavior is claimed. Local browser smoke remains **BLOCKED** on the work computer (`PHASE_6J_CANDIDATE_A_VERIFICATION_RESULT.md`; waived for Phase 6k-d/e).

---

## Repo State

| Item | Value |
|------|--------|
| Branch | `modularization-home-layout-engine-pilot` |
| HEAD (short) | `a3274d2` |
| HEAD (full) | `a3274d26129478810594369dda80ce30ec6f24fb` |
| Origin | `a3274d26129478810594369dda80ce30ec6f24fb` |
| HEAD == origin | **Yes** |
| Working tree | Clean except untracked local-only file |
| Untracked | `oot-local-server.ps1` (local-only; **do not commit**) |

Verified via `git fetch --all --prune`, `git branch --show-current`, `git status --short`, `git log -8 --oneline --decorate`, `git rev-parse HEAD`, `git rev-parse origin/modularization-home-layout-engine-pilot`.

Runtime baseline for inventory: **`a3274d2`** — Phase 6k-e verification result (rHome tail adapter stack complete).

---

## Purpose

This document identifies the **next modularization seam after rHome tail routing**: **legacy-owned Home cue / action-pill rendering ownership**.

Per `PHASE_6H_HOME_CONTROLLER_NEXT_BOUNDARY_PLAN.md` and `PHASE_6K_A_RHOME_RECONCILE_INVENTORY.md`:

- Phase 6k completed **rHome tail reconcile routing** through `OOT.home.controller.requestRHomeTailReconcile({ source: 'rHome:tail' })` with legacy fallback.
- Cue **HTML/markup** is still built entirely in legacy `index.html` inline renderers.
- `oot_home_alert_rail.js` **reads** cue DOM visibility and syncs `data-home-alert-state`; it does **not** render pills.
- HomeController **records** cue-related notifications and reconcile **requests**; it does **not** own cue markup.

**No extraction is approved by this inventory.**

---

## Files Inspected

| File | Role |
|------|------|
| `index.html` | Static `#home-alerts-row` containers; all cue pill HTML builders; Firestore listeners; helper derivations; rHome cue refresh order |
| `oot_home_alert_rail.js` | Read-only alert-rail state from `#home-song-vote-cue` / `#home-rehearsal-cue` `display:block` |
| `oot_home_controller.js` | `notifyCueChange`, `requestReconcile`, `requestRHomeTailReconcile` (record/coalesce/delegate; no cue HTML) |
| `oot_compat_home.js` | Global shims for `requestHomeReconcile`, `activateHome`, alert rail, layout, diag — **no** `notifyCueChange` shim |
| `oot_home_band_image.js` | Band-image presentation refresh reads `#home-rehearsal-cue` visibility (consumer, not renderer) |
| `oot_home_diag.js` | Referenced via `_homeLayoutDiagSnapshot` calls at cue renderer tails (diagnostic only) |
| `docs/modularization/PHASE_6K_E_VERIFICATION_RESULT.md` | Prior phase verification baseline |
| `docs/modularization/PHASE_6K_D_RHOME_TAIL_ADAPTER_ROUTING_RESULT.md` | rHome tail routing result |
| `docs/modularization/PHASE_6K_A_RHOME_RECONCILE_INVENTORY.md` | rHome reconcile inventory (adjacent seam) |
| `docs/modularization/PHASE_6H_HOME_CONTROLLER_NEXT_BOUNDARY_PLAN.md` | Controller boundary planning context |
| `docs/modularization/PHASE_6H_DECISION_RESULT.md` | Prior boundary decision context |

---

## Current Legacy Cue Renderer Ownership

All Home **alert-row action pills** (large clickable buttons in `#home-alerts-row`) are **legacy-owned in `index.html`**:

| Function | DOM target | What it builds |
|----------|------------|----------------|
| `renderHomeSongVoteCue()` | `#home-song-vote-cue` | Full inline `innerHTML` button; kicker **"Song Vote Pending"** |
| `renderHomeRehearsalCue()` | `#home-rehearsal-cue` | Full inline `innerHTML` button; kicker **"Rehearsal on Deck"** |
| `renderPendingProposalCue()` | `#home-proposal-micro-cue` (dynamic), `#tb-cal` badge, `#cal-proposal-micro-cue` | **Not** an alerts-row pill; tiny Home hero micro-cue + Calendar tab badge + Calendar **"ACTION NEEDED"** strip |

**Modular modules today:**

- **`oot_home_alert_rail.js`** — post-render sync only (`syncAlertRailState` → `#sc-home[data-home-alert-state]`).
- **`oot_home_band_image.js`** — reacts to rehearsal cue visibility for band-image framing (not markup).
- **`oot_home_controller.js`** — optional guarded hooks at renderer tails (`notifyCueChange`, `requestHomeReconcile`); **does not** construct cue HTML.

Static HTML shells (empty, `display:none`) at `index.html` ~18650–18652:

```html
<div id="home-alerts-row" aria-label="Home alerts">
  <div id="home-song-vote-cue" style="display:none;"></div>
  <div id="home-rehearsal-cue" style="display:none;"></div>
</div>
```

**Search note:** `notifySongVote` and `notifyRehearsal` **do not exist** in the codebase. Cue updates use direct renderer calls plus optional `notifyCueChange('renderHomeSongVoteCue'|'renderHomeRehearsalCue')` and Home-active gated `requestHomeReconcile('cue:song-vote'|'cue:rehearsal')`.

---

## Cue Types Found

| Cue / pill name | Source state / data | Render location / function | Listener / update path | Current owner | Known risk |
|-----------------|---------------------|----------------------------|------------------------|---------------|------------|
| **Song Vote Pending** | Global `suggestions[]`; derived via `_pendingSongSuggestionsForMe()` → `_homeOpenSongSuggestions()` → `_homeAnyActiveSongSuggestions()`; `ME` for vote check | `renderHomeSongVoteCue()` → `#home-song-vote-cue` | `listenSuggestions()` snapshot; `_ensureHomeCueFallbackListeners()` unordered `suggestions` snapshot; `listenProposals()` (also re-renders song cue); `rHome()` | Legacy `index.html` | Pre-existing pill placement / dual-alert CSS coupling; fallback tiers can show non-user-specific copy |
| **Rehearsal on Deck** | Global `events[]`, `_eventsHasInit`; `_r535NextUpcomingRehearsal()` (events + `_ootLooksLikeRehearsalRecord` + proposal fallback `_ootNextOpenRehearsalProposal()` from `proposals[]`) | `renderHomeRehearsalCue()` → `#home-rehearsal-cue` | `listenSuggestions()` (paired re-render); `listenProposals()`; `_ensureHomeCueFallbackListeners()` unordered `proposals` snapshot; `listenAgendas()`; `listenEvents()` → full `rHome()`; `rHome()` direct | Legacy `index.html` | Pre-existing placement issue; visibility drives band-image rehearsal mode and extensive `:has(#home-rehearsal-cue…)` CSS |
| **Home proposal micro-cue** (`N rehearsal response needed`) | `proposals[]`; `_pendingProposalIdsForMe()` | `renderPendingProposalCue()` → dynamic `#home-proposal-micro-cue` on `.hero.home-hero-with-controls` | `listenProposals()`; proposal response writeback; workspace close timeout; `rHome()`; `rCal()` | Legacy `index.html` | Intentionally **not** alerts-row pill (r838); separate from alert-rail state |
| **Calendar ACTION NEEDED** | Same `_pendingProposalIdsForMe()` | `renderPendingProposalCue()` → `#cal-proposal-micro-cue` | Same as proposal micro-cue | Legacy `index.html` | Calendar-scoped; out of Home alerts-row extraction scope but shares renderer function |
| **Calendar tab proposal badge** | Same count | `renderPendingProposalCue()` → `.proposal-tab-badge` on `#tb-cal` | Same | Legacy `index.html` | Tab chrome, not Home cue row |

---

## Render Call Sites

| File | Line | Function / context | What it renders | Called by |
|------|------|-------------------|-----------------|-----------|
| `index.html` | 18650–18652 | Static HTML | Empty `#home-song-vote-cue`, `#home-rehearsal-cue` shells | Page load |
| `index.html` | 22452–22453 | `listenSuggestions()` snapshot tail | Song + rehearsal alert pills | Firestore ordered `suggestions` listener |
| `index.html` | 22673–22726 | `renderHomeRehearsalCue()` | Rehearsal on Deck pill (or hide) | Listeners, fallback, rHome |
| `index.html` | 22728–22771 | `renderHomeSongVoteCue()` | Song Vote Pending pill (or hide) | Listeners, fallback, rHome |
| `index.html` | 22801 | `_ensureHomeCueFallbackListeners()` suggestions snapshot | Song Vote Pending pill | Unordered Firestore fallback listener |
| `index.html` | 22819 | `_ensureHomeCueFallbackListeners()` proposals snapshot | Rehearsal on Deck pill | Unordered Firestore fallback listener |
| `index.html` | 23339 | `listenAgendas()` snapshot tail | Rehearsal on Deck pill | Firestore `agendas` listener |
| `index.html` | 25665–25731 | `renderPendingProposalCue()` | Tab badge, Home micro-cue, Calendar ACTION NEEDED | Listeners, rHome, rCal, proposal UX |
| `index.html` | 26649–26651 | `listenProposals()` snapshot tail | Rehearsal pill, song pill, proposal micro-cue | Firestore ordered `proposals` listener |
| `index.html` | 28115 | Proposal response `.then()` | Proposal micro-cue / Calendar cue | Firestore write callback |
| `index.html` | 30452 | Proposal workspace close `setTimeout` | Proposal micro-cue / Calendar cue | Calendar UX |
| `index.html` | 25782 | `listenEvents()` snapshot tail | Full Home refresh including cues | Firestore `events` listener → **`rHome()`** |
| `index.html` | 30791 | `rHome()` early | Proposal micro-cue / Calendar cue | **`rHome()`** |
| `index.html` | 30826–30828 | `rHome()` cue block | Fallback listener bind; song + rehearsal pills | **`rHome()`** |
| `index.html` | 30829 | `rHome()` post-cue | Alert rail sync (no pill HTML) | **`rHome()`** → `syncAlertRailState('rHome')` |
| `index.html` | 31074 | `rCal()` head | Proposal / Calendar cues | Calendar tab render |
| `oot_home_alert_rail.js` | 48–62 | `syncAlertRailState()` | **No markup** — sets `#sc-home[data-home-alert-state]` | Called from cue renderer tails and `rHome()` |

---

## State Inputs

| Variable / data source | Producer / listener | Consumer / render function | Backing |
|------------------------|---------------------|----------------------------|---------|
| `suggestions[]` | `listenSuggestions()` ordered; `_ensureHomeCueFallbackListeners()` unordered merge | `renderHomeSongVoteCue()`, `_pendingSongSuggestionsForMe()`, `_homeOpenSongSuggestions()`, `_homeAnyActiveSongSuggestions()` | Firestore `suggestions` |
| `ME` (current member id) | Auth / session bootstrap | `_songSuggestionMyVote()`, `_pendingSongSuggestionsForMe()`, `_pendingProposalIdsForMe()` | Local session |
| `members[]` | Member bootstrap | `_homeOpenSongSuggestions()` band-size threshold | Firestore / bootstrap |
| `events[]` | `listenEvents()` ordered | `_r535NextUpcomingRehearsal()`, `renderHomeRehearsalCue()` | Firestore `events` |
| `_eventsHasInit` | `listenEvents()` first snapshot | `renderHomeRehearsalCue()` early-exit vs proposal fallback | Local derived flag |
| `proposals[]` | `listenProposals()` ordered; fallback unordered merge | `_ootNextOpenRehearsalProposal()`, `_pendingProposalIdsForMe()`, `renderPendingProposalCue()`, `renderHomeRehearsalCue()` (indirect) | Firestore `proposals` |
| `agendas{}` | `listenAgendas()` | Indirect rehearsal cue refresh only | Firestore `agendas` |
| `#home-song-vote-cue` / `#home-rehearsal-cue` `style.display` | Set by legacy renderers | `oot_home_alert_rail.js` `getAlertRailState()`; CSS `:has()` layout rules | DOM state |
| `#sc-home[data-home-alert-state]` | `syncAlertRailState()` | Layout engine / CSS attribute selectors (`none`/`song`/`rehearsal`/`both`) | DOM derived |
| `_homeLayoutDiagSnapshot(...)` | Cue renderer tails | `oot_home_diag.js` | Diagnostic |
| HomeController event log | `notifyCueChange`, `requestHomeReconcile` guarded tails | Coalescer / delegate (not cue HTML) | Diagnostic / reconcile orchestration |

---

## Current Call Order

Static call order only (no browser timing claims).

### Home entry / rHome path

1. `rHome()` — optional `consumeHomeRHomeActivateSkip()` / `activateHome('rHome')`.
2. `_ensureHomeBandBackdrop()`.
3. `renderPendingProposalCue()` (micro-cue / tab badge / Calendar cue — not alerts-row pills).
4. `updateCountdown()` (+ birthday banner block).
5. `_ensureHomeCueFallbackListeners()` (binds once; async snapshots fire later).
6. `renderHomeSongVoteCue()`.
7. `renderHomeRehearsalCue()`.
8. `syncAlertRailState('rHome')`.
9. `_scheduleHomeImagePresentationRefresh('rHome final')` + optional `notifyImageRefresh`.
10. Who-am-i / diag snapshot.
11. `_recordRHomeTailReconcileDiag()` → `requestRHomeTailReconcile({ source: 'rHome:tail' })` or legacy fallback `requestHomeReconcile('rHome')` + `reconcileHomeLayout('rHome')`.

Each cue renderer exit tail (hidden or visible): `_homeLayoutDiagSnapshot` → `syncAlertRailState('<renderer>')` → optional `notifyCueChange('<renderer>')` → Home-active gated `requestHomeReconcile('cue:song-vote'|'cue:rehearsal')`. Rehearsal renderer also schedules image refresh before diag/alert sync on visible and hidden paths.

### Song vote update path

1. Firestore `suggestions` ordered snapshot → `listenSuggestions()`.
2. Update global `suggestions`, `rVotes()`, `updateVoteBadge()`.
3. `renderHomeSongVoteCue()` then `renderHomeRehearsalCue()` (paired at listener tail).
4. Parallel/async: fallback unordered `suggestions` snapshot may merge and call `renderHomeSongVoteCue()` again.

### Rehearsal proposal update path

1. Firestore `proposals` ordered snapshot → `listenProposals()`.
2. Update global `proposals`, optional banners.
3. `renderHomeRehearsalCue()` → `renderHomeSongVoteCue()` → `renderPendingProposalCue()`.
4. Parallel/async: fallback unordered `proposals` snapshot may merge and call `renderHomeRehearsalCue()` again.
5. Rehearsal pill content also depends on `events[]` via `_r535NextUpcomingRehearsal()`; `listenEvents()` calls full `rHome()` on every events snapshot.

### HomeController notification path

- **Does not render cues.** At renderer tails, legacy code optionally calls:
  - `notifyCueChange('renderHomeSongVoteCue'|'renderHomeRehearsalCue')` — namespaced API is `OOT.home.controller.notifyCueChange`; **no** `oot_compat_home.js` global shim (guarded `typeof` check).
  - `requestHomeReconcile('cue:song-vote'|'cue:rehearsal')` when `#sc-home` has class `on` — shimmed to controller `requestReconcile`.
- rHome tail uses separate `requestRHomeTailReconcile` / `requestHomeReconcile('rHome')` after all cue rendering completes.

### Alert rail / cue visible path

1. Legacy renderer sets `#home-*-cue` `display:block|none` and `innerHTML`.
2. `syncAlertRailState(reason)` reads both cue elements → sets or clears `#sc-home[data-home-alert-state]`.
3. CSS and layout engine consume attribute / `:has()` visibility for spacing, dual-alert compaction, band-image rehearsal mode.

---

## Candidate Extraction Target

**Narrowest safe next extraction:** a **`HomeCueRenderer` scaffold** (or `HomeCueController` that delegates rendering only), loaded alongside existing Home modules, with **no behavior change** in the first phase.

Recommended shape:

1. **Inputs:** accept the same derived inputs the legacy functions already compute (`cueItems`, rehearsal event object, visibility flags) — do not rewrite Firestore listeners in phase 1.
2. **Output:** return or apply the **same markup strings** and set the **same** `#home-song-vote-cue` / `#home-rehearsal-cue` `display` / `innerHTML` as today.
3. **Post-render hooks:** preserve call order: image refresh (rehearsal) → diag snapshot → `syncAlertRailState` → `notifyCueChange` → Home-active `requestHomeReconcile`.
4. **Legacy fallback:** `index.html` keeps thin wrappers calling modular renderer when present, else existing inline bodies (mirrors rHome tail adapter pattern).
5. **Out of scope for first slice:** `renderPendingProposalCue()` (separate micro-cue/badge renderer), Firestore listener moves, CSS, pill placement fixes.

---

## Explicit Non-goals

- No CSS edits.
- No visual pill placement fix yet (known pre-existing issue).
- No data model changes.
- No Firestore listener rewrite.
- No broad hook rollout beyond an approved narrow cue-renderer slice.
- No modular-inflow default enablement (`legacy-overlay` remains production default).
- No fallback removal from rHome tail adapter work (Phase 6k-d `else` branch stays).

---

## Risks

| Risk | Detail |
|------|--------|
| Pre-existing pill placement | Song Vote Pending / Rehearsal on Deck placement in `#home-alerts-row` is a known issue; inventory does not fix it. |
| DOM order / spacing regression | Renderer extraction can accidentally change element order, margins, or dual-alert `:has()` interactions. |
| Layout budget coupling | Cue visibility drives `#sc-home[data-home-alert-state]`, `#home-alerts-row` gap rules, and band-image rehearsal framing. |
| Split renderer ownership | `renderPendingProposalCue()` shares proposal state but uses different DOM targets; bundling it too early widens blast radius. |
| Hook shim asymmetry | `requestHomeReconcile` is compat-shimmed; `notifyCueChange` is not — extraction must preserve guarded optional globals or add explicit shims in a later approved phase. |
| Browser verification gap | Work computer cannot run local smoke; integrity tests only until manual verification is unblocked. |

---

## Recommended Phase 6l-b

**Prefer read-only diagnostics around cue renderer timing/state before extraction**, unless a follow-up review concludes a **no-behavior scaffold** (legacy fallback always wins) is safer to land first.

Suggested 6l-b diagnostics (planning only):

- Snapshot last cue render reason, derived counts, and visibility flags (`song` / `rehearsal` / `both` / `none`) at each renderer exit — mirror `_recordRHomeTailReconcileDiag` pattern.
- Expose read-only getter (e.g. `__ootGetHomeCueRendererDiag()`) without changing markup paths.
- Extend integrity package to assert diag API presence and **no** duplicate renderer ownership.

If inventory timing shows listener/rHome double-render noise is already high, ship diag first; if static ownership is clean enough, a passthrough `HomeCueRenderer.renderSongVote(...)` / `renderRehearsal(...)` scaffold with legacy fallback may be acceptable as 6l-c.

---

## Related prior seams (context)

| Seam | Status at `a3274d2` |
|------|---------------------|
| rHome tail reconcile | Routed via `requestRHomeTailReconcile` + legacy fallback (`PHASE_6K_D`, `PHASE_6K_E`) |
| Cue reconcile **requests** | Home-active gated at renderer tails (`cue:song-vote`, `cue:rehearsal`) |
| Cue **markup** | Still 100% legacy `index.html` inline renderers |
| Alert rail state | Modular read/sync in `oot_home_alert_rail.js` |

**Next approved modularization target after this inventory:** cue/action-pill **renderer** ownership — not listener rewrite, not layout/CSS repair.
