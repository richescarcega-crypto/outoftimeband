# Phase 6n — Home Cue / Render Ownership Inventory and Next-Slice Plan

## Status

**Planning-only.** No runtime behavior changed. No extraction approved by this document.

Static code inspection at HEAD `58ae95b`. Browser/manual verification remains **not recorded** for Phase 6m-d pending proposal routing.

---

## 1. Current Branch / HEAD

| Item | Value |
|------|--------|
| Branch | `modularization-home-layout-engine-pilot` |
| HEAD (short) | `58ae95b` — *Document Phase 6m-d verification* |
| Origin | `58ae95b` (in sync) |
| Working tree | Clean except untracked `oot-local-server.ps1` (**do not commit**) |

---

## 2. Completed Cue Renderer Modularization

All three Home cue families now have module build/apply paths with legacy fallback preserved in `index.html`.

### Alert-row cues (single-target pills in `#home-alerts-row`)

| Cue | Module API | `index.html` wrapper | Legacy fallback |
|-----|------------|----------------------|-----------------|
| **Song Vote Pending** | `buildSongVoteCueView`, `applyCueView`, `renderSongVoteCue` | `renderHomeSongVoteCue()` | Inline `_svView` HTML + `_applyHomeCueView` |
| **Rehearsal on Deck** | `buildRehearsalCueView`, `applyCueView`, `renderRehearsalCue` | `renderHomeRehearsalCue()` | Inline `_rhView` HTML + `_applyHomeCueView` |

Shared alert-row apply seam: `_applyHomeCueView(el, view)` delegates to `cueRenderer.applyCueView` with `_legacyApplyHomeCueView` fallback.

Input builders (still in `index.html`, called before module route):

- `_buildHomeSongVoteCueInput(cueItems, userSpecific, sourceBranch)`
- `_buildHomeRehearsalCueInput(args)`

### Pending proposal cue (multi-surface, not an alert-row pill)

| Layer | Status |
|-------|--------|
| View builder | `buildPendingProposalCueView(input)` in `oot_home_cue_renderer.js` |
| Multi-target apply | `applyPendingProposalCueView(targets, view)` in `oot_home_cue_renderer.js` |
| Wrapper route | `renderPendingProposalCue()` calls build + apply when module available |
| Legacy fallback | `_legacyRenderPendingProposalCue(ids)` — Calendar tab badge, Home hero micro-cue, Calendar ACTION NEEDED strip |

Phase 6m-d routing guard: `_ppModuleApplied` — legacy runs when module missing, build/apply throws, targets missing, or `applied` is not true.

### Adjacent modules (consume or sync; do not render cue markup)

| Module | Role |
|--------|------|
| `oot_home_alert_rail.js` | `syncAlertRailState(reason)` — reads `#home-song-vote-cue` / `#home-rehearsal-cue` visibility → `#sc-home[data-home-alert-state]` |
| `oot_home_controller.js` | Record/coalesce/delegate: `activateHome`, `notifyCueChange`, `requestHomeReconcile`, `requestRHomeTailReconcile` |
| `oot_home_layout_engine.js` | Budget/reconcile shell (`reconcileHomeLayout`) — not cue HTML |
| `oot_home_gig_slot.js` | Gig slot footprint sync (`syncGigSlotState`) — not cue HTML |
| `oot_home_band_image.js` | Presentation refresh; reads rehearsal cue visibility |
| `oot_home_diag.js` | Diagnostic snapshots only |

---

## 3. Remaining Home Cue / Render Ownership in `index.html`

Focus: Home tab visual/state behavior, cue feeding, and `rHome` orchestration. Excludes Songs/Setlists/Chat/Flyers/Pay UI except where data directly feeds Home cues.

### A. Cue render orchestration (module-routed but still legacy-heavy)

| Function / block | Approx. lines | Still owns |
|------------------|---------------|------------|
| `renderHomeSongVoteCue()` | ~22886–22968 | Song-vote **state derivation** (`_pendingSongSuggestionsForMe`, `_homeOpenSongSuggestions`, `_homeAnyActiveSongSuggestions`); module route + **full inline legacy HTML fallback**; post-render tails (`syncAlertRailState`, `notifyCueChange`, `requestHomeReconcile`, diag) |
| `renderHomeRehearsalCue()` | ~22768–22884 | Rehearsal **state derivation** (`_r535NextUpcomingRehearsal`, `_r535RehearsalTimes`, `_r535PrettyRehearsalDate`, proposal fallback branch); module route + **full inline legacy HTML fallback**; post-render tails |
| `renderPendingProposalCue()` | ~25925–25955 | `_pendingProposalIdsForMe()` derivation; module build/apply route; `_legacyRenderPendingProposalCue(ids)` fallback |
| `_legacyRenderPendingProposalCue(ids)` | ~25862–25923 | Legacy DOM for badge + micro-cues (intentional fallback) |
| `_legacyApplyHomeCueView` / `_applyHomeCueView` | ~22741–22766 | Alert-row DOM apply seam + legacy fallback |
| `_buildHomeSongVoteCueInput` / `_buildHomeRehearsalCueInput` | ~22718–22739 | Input shaping still in legacy file |

### B. Pending proposal navigation / workspace side effects (not render, but cue-adjacent)

| Function | Approx. lines | Still owns |
|----------|---------------|------------|
| `_pendingProposalIdsForMe()` | ~25819–25832 | Filters `proposals[]` for current member's open responses |
| `_openPendingProposalCue()` | ~25844–25861 | Tab navigation, opens proposals workspace, scroll |
| `_hideCalendarProposalCueWhileWorkspaceOpen()` | ~25834–25842 | Hides `#cal-proposal-micro-cue` when workspace open |

These are **not** routed through `cueRenderer` today. They interact with Calendar tab UX and proposal workspace visibility.

### C. Cue data feeding (Firestore in legacy)

| Function | Approx. lines | Still owns |
|----------|---------------|------------|
| `_ensureHomeCueFallbackListeners()` | ~22977–23021 | Unordered Firestore `onSnapshot` on `suggestions` and `proposals`; merges arrays; re-calls `renderHomeSongVoteCue` / `renderHomeRehearsalCue` |

Primary ordered listeners elsewhere in `index.html` also feed the same arrays — this block is a **fallback data path**, not a renderer.

### D. Rehearsal / song-vote derivation helpers (feeds cue renderers)

| Functions | Role |
|-----------|------|
| `_pendingSongSuggestionsForMe`, `_homeOpenSongSuggestions`, `_homeAnyActiveSongSuggestions` (~22466+) | Song Vote cue input sources |
| `_r535HomeEscape`, `_r535NextUpcomingRehearsal`, `_r535RehearsalTimes`, `_r535PrettyRehearsalDate`, `_r535OpenHomeRehearsal`, etc. (~22545–22648) | Rehearsal cue input + click handler targets |

### E. `rHome()` orchestration stack (Home refresh order)

| Step in `rHome()` (~31009–31072) | Owner today |
|----------------------------------|-------------|
| `activateHome` / skip consume | Controller compat + legacy |
| `_ensureHomeBandBackdrop()` | Legacy DOM (~30916+) |
| `renderPendingProposalCue()` | Cue wrapper (6m-d) |
| `updateCountdown()` | Legacy gig card DOM (~24098+) |
| `#birthday-banner` inline HTML | Legacy string-built markup |
| `_ensureHomeCueFallbackListeners()` | Legacy Firestore fallback bind |
| `renderHomeSongVoteCue()` / `renderHomeRehearsalCue()` | Cue wrappers |
| `syncAlertRailState('rHome')` | Module (via compat global) |
| Band image presentation schedule | `oot_home_band_image.js` via globals |
| `#who-am-i` update | Legacy DOM |
| `requestRHomeTailReconcile` / legacy reconcile tail | Controller + layout module fallback |

### F. Gig slot render (layout-adjacent, not alert cues)

| Function | Approx. lines | Still owns |
|----------|---------------|------------|
| `updateCountdown()` | ~24098–24172 | Next-gig card DOM, timer tick, title/detail HTML |
| `renderNoGigsCard()` | ~24250+ | No-gigs placeholder card HTML |
| `_maybeRequestHomeGigReconcile()` | ~24086–24096 | Home-active gated reconcile request |
| `_wireGigCounterDoubleTap()` | ~24069+ | Gig card interaction |

Module `oot_home_gig_slot.js` syncs slot **state/footprint** only; markup remains legacy.

### G. Diagnostics / observability (low extraction value)

| Function | Role |
|----------|------|
| `_recordHomeCueRenderDiag()` (~22680+) | Cue render diagnostic ring buffer |
| `_recordRHomeTailReconcileDiag()` (~30974+) | rHome tail reconcile diagnostic |

### H. Already modularized — do not re-extract without cause

| Concern | Module |
|---------|--------|
| Alert rail attribute sync | `oot_home_alert_rail.js` |
| Layout budget / reconcile | `oot_home_layout_engine.js` |
| Controller activate/notify/coalesce | `oot_home_controller.js` |
| Band image presentation vars | `oot_home_band_image.js` |
| Gig slot state enum / footprint | `oot_home_gig_slot.js` |

---

## 4. Risk Assessment for Remaining Candidates

| Candidate | Risk | Rationale |
|-----------|------|-----------|
| Move `_buildHomeSongVoteCueInput` / `_buildHomeRehearsalCueInput` into `cueRenderer` with index shim | **Low** | Pure input shaping; no DOM; easy revert |
| Add pure `derivePendingProposalIds(context)` in module; index keeps calling pattern | **Low** | State-only; `_pendingProposalIdsForMe` stays as fallback wrapper |
| Document / inventory `_openPendingProposalCue` + workspace hide as navigation seam (no code) | **Low** | Planning-only; clarifies boundary before any Calendar UX move |
| Manual/browser verification of 6m-d pending proposal surfaces | **Low** | No code; catches DOM regressions before next slice |
| Trim duplicate legacy HTML in alert-row fallbacks (keep behavior, reduce duplication) | **Medium** | Large strings; easy to miss copy/handler drift |
| Move post-render tails (`syncAlertRailState`, reconcile hooks) out of render functions | **Medium** | Order-sensitive; touches layout + controller wiring |
| Extract `#birthday-banner` render from `rHome()` | **Medium–High** | Inline styles; layout height affects budget |
| Route `updateCountdown` / `renderNoGigsCard` through a module | **Medium–High** | Timer lifecycle, Firestore gating, gig slot + layout coupling |
| Move `_ensureHomeCueFallbackListeners` or any Firestore listener | **High / defer** | Firestore ownership, merge semantics, listener ordering |
| Reorder or split `rHome()` step sequence | **High / defer** | Many cross-dependencies (cues → alert rail → band image → reconcile) |
| Touch proposal cue CSS (inline + `app_r913.css` mirror) | **High / defer** | User-facing visual regression risk |
| Broad “move all Home render to modules” | **High / defer** | Violates narrow-slice discipline |

---

## 5. Recommended Next Slice

### Primary recommendation: **Phase 6o-a — Manual verification gate for pending proposal cue (planning + test checklist only)**

**Why this is next:** Phase 6m-d introduced the first **multi-target** cue route (tab badge + Home micro-cue + Calendar strip). Song Vote and Rehearsal were already module-routed but are single-target alert-row pills. Pending proposal is the newest runtime routing change; browser verification was explicitly deferred in `PHASE_6M_D_VERIFICATION_RESULT.md`.

**Scope (no runtime edits unless verification finds a bug):**

1. Produce a short manual test checklist doc or section (optional sub-doc) covering:
   - Pending proposals visible → badge count, Home micro-cue text, Calendar ACTION NEEDED strip
   - Zero pending → all surfaces hidden/removed
   - Click → `_openPendingProposalCue` navigation
   - Workspace open → calendar micro-cue hide behavior
2. Run manual checks on a device/browser when local server is available.
3. Only if PASS (or explicit waiver with recorded reason), authorize the first **code** slice below.

**Hard boundaries:**

- Do not change Firestore listeners, CSS, or `rHome()` order in 6o-a.
- Do not remove `_legacyRenderPendingProposalCue` in 6o-a.

### First code slice after verification (or if verification remains blocked): **Phase 6o-b — Pure pending-proposal ID derivation seam**

If 6o-a is waived again (work-machine server blocker), the safest **code** slice is state-only:

| Target | Module | Legacy fallback |
|--------|--------|-----------------|
| `_pendingProposalIdsForMe()` | Add `derivePendingProposalIds(input)` to `oot_home_cue_renderer.js` (pure function; `{ proposals, me, members, expectedResponderFn }`) | Keep `_pendingProposalIdsForMe()` in `index.html` calling module when available, else existing filter logic |

**Why not something else first:**

- Alert-row cue wrappers are **already routed** — further work there is deduplication (medium risk), not stability.
- Gig slot / birthday / `rHome` reorder are **layout-heavy** and out of cue-renderer scope.
- Firestore fallback listeners are **high risk** and should not be touched until cue state ownership is fully mapped.

**Explicit non-goals for 6o-b:**

- No change to `applyPendingProposalCueView` or `_legacyRenderPendingProposalCue`
- No change to `_openPendingProposalCue`
- No new `index.html` call-site changes for `renderPendingProposalCue()`

---

## 6. Stop Conditions (Next Agent)

Stop and **do not edit** (report to user instead) if:

| Condition | Action |
|-----------|--------|
| Branch ≠ `modularization-home-layout-engine-pilot` or HEAD not at/after `58ae95b` without user approval | Stop — unexpected repo state |
| Working tree has uncommitted runtime changes unrelated to the assigned slice | Stop — clarify scope |
| `OOT.home.cueRenderer` missing expected exports (`buildPendingProposalCueView`, `applyPendingProposalCueView`, alert-row APIs) | Stop — module load/order regression |
| Assigned slice requires **CSS** changes to proposal cue classes or alert-row pills | Stop — out of scope unless user explicitly approves |
| Assigned slice requires **Firestore** listener/query changes | Stop — defer to dedicated Firestore ownership task |
| Unclear whether logic belongs to cue renderer vs Calendar vs proposal workspace | Stop — update inventory doc only |
| Integrity gate failures after a small change | Stop — fix or revert before continuing |
| User asked for planning-only but implementation drift started | Stop — docs only |

---

## 7. Verification Gate

Preserve the five existing integrity package commands after any future runtime slice:

```powershell
$node = "C:\Users\rescarcega\AppData\Local\Programs\cursor\resources\app\resources\helpers\node.exe"
& $node tests/integrity/home-controller-package.mjs
& $node tests/integrity/home-layout-engine-package.mjs
& $node tests/integrity/home-diag-package.mjs
& $node tests/integrity/home-alert-rail-package.mjs
& $node tests/integrity/home-gig-slot-package.mjs
```

At HEAD `58ae95b` (planning checkpoint), all five gates **PASS**.

Manual/browser verification is **supplemental** for multi-target pending proposal DOM and is **not** substituted by integrity tests alone.

---

## 8. Summary

| Area | State after 6m-d |
|------|------------------|
| Cue HTML build/apply (happy path) | Module (`oot_home_cue_renderer.js`) for Song Vote, Rehearsal, Pending Proposal |
| Cue legacy fallback DOM | Still in `index.html` (required) |
| Cue state derivation | Still mostly in `index.html` |
| Alert rail / layout / controller / gig slot sync | Modules + compat globals |
| `rHome()` orchestration + birthday + gig card markup | Still in `index.html` |
| Firestore cue data paths | Still in `index.html` (including r810 fallback listeners) |

**Next safest move:** Phase **6o-a** manual verification gate for pending proposal cue surfaces, then Phase **6o-b** pure derivation seam if continuing code extraction.

No broad extraction. No Firestore moves. No CSS edits.
