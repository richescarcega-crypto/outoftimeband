# Phase 6r-a — Home Cue Ownership Next Seam Plan

## Status

**Planning-first / inventory only.** No runtime behavior changed. No extraction approved by this document.

Static code inspection at HEAD `c32ac7a`. Determines the next safest Home modularization seam after the completed **pending proposal cue arc** (6o through 6q).

---

## 1. Current Repo State

| Item | Value |
|------|--------|
| Branch | `modularization-home-layout-engine-pilot` |
| HEAD (short) | `c32ac7a` — *Document Phase 6q-b pending proposal reconcile checkpoint* |
| HEAD (full) | `c32ac7a0e3e9c2c2d3c96e8152bb39c5ce2bee7f` |
| Working tree | Clean except untracked `oot-local-server.ps1` |
| Local-only | `oot-local-server.ps1` — **must not be edited, staged, or committed** |

Integrity baseline: all five standard gates **PASS** at `9e5bdd6` (6q-a runtime) and remain expected at `c32ac7a` (docs-only since).

---

## 2. Completed Pending Proposal Cue Arc

### Commits (in order)

| Commit | Summary |
|--------|---------|
| `20f2599` | Add pending proposal derivation seam (6o-b) |
| `09a1f93` | Add pending proposal render orchestration seam (6o-c) |
| `db15c60` | Document pending proposal modularization checkpoint (6o-d) |
| `a80676d` | Add pending proposal target collection seam (6p-a) |
| `a04d186` | Document Phase 6p-b pending proposal target collection checkpoint |
| `9e5bdd6` | Add pending proposal cue reconcile notification seam (6q-a) |
| `c32ac7a` | Document Phase 6q-b pending proposal reconcile checkpoint |

*(Upstream: 6m-b/c/d view builder, apply seam, wrapper routing; 6o-a manual verification.)*

### Ownership moved out of `index.html`

| Concern | Module owner |
|---------|----------------|
| Pending ID filter logic | `OOT.home.cueRenderer.derivePendingProposalIds(input)` |
| View descriptor build | `buildPendingProposalCueView(input)` |
| Multi-target DOM apply | `applyPendingProposalCueView(targets, view)` |
| Render orchestration (build → apply → success flag) | `renderPendingProposalCueSurface(input)` |
| DOM target collection | `collectPendingProposalCueTargets({ document })` |
| Reconcile notify/timing | `HomeController.notifyPendingProposalCueChange`, `requestPendingProposalCueReconcile` |

### What remains in `index.html` (wrappers / fallbacks / adjacency)

| Item | Role |
|------|------|
| `_pendingProposalIdsForMe()` | Public derivation entry; delegates to module + `_legacyPendingProposalIdsForMe()` |
| `_legacyPendingProposalIdsForMe()` | Legacy filter using `proposals`, `ME`, `_proposalExpectedResponderIds` |
| `renderPendingProposalCue()` | Public render entry; orchestration + legacy render + notify/reconcile tails |
| `_legacyRenderPendingProposalCue(ids)` | Legacy DOM for badge + micro-cues |
| `_pendingProposalCueTargets()` / `_legacyPendingProposalCueTargets()` | Target resolver + fallback |
| `_notifyPendingProposalCueChange()` / `_legacyNotifyPendingProposalCueChange()` | Notify tail wrappers |
| `_requestPendingProposalCueReconcileIfHomeActive()` / `_legacyRequestPendingProposalCueReconcileIfHomeActive()` | Reconcile tail wrappers |
| `_openPendingProposalCue()` | Calendar navigation / workspace UX (not render) |
| `_hideCalendarProposalCueWhileWorkspaceOpen()` | Workspace visibility side effect |
| Five external `renderPendingProposalCue()` call sites | Unchanged public API |

**Assessment:** Pending proposal **render/derive/target/reconcile** modularization is largely complete. Further pending-proposal slices have diminishing returns unless targeting navigation UX (Calendar workflow — higher coupling) or legacy fallback deduplication (low value).

---

## 3. Behavior That Must Remain Preserved

Phase **6o-a** manual verification is the **acceptance contract** for pending proposal cues and remains binding for any adjacent work:

| Scenario | Expected |
|----------|----------|
| **Rich** — `pendingCount: 0` | No pending proposal cue surfaces |
| **Zach** — `pendingCount: 1` | Calendar badge `"1"` |
| **Zach** — Home micro-cue | Text `"1 rehearsal response needed"`, visible in viewport |
| **Zach** — Calendar strip cue | Present |
| **Zach** — Home cue click | Opens Rehearsal Proposals response view |
| **Cleanup** — test proposal deleted | All pending cue surfaces clear |

Any future slice must not regress this contract. Song vote / rehearsal visible behavior must also remain unchanged when those seams are touched.

---

## 4. Current Home Cue Ownership Inventory

Static inspection of `index.html`, `oot_home_cue_renderer.js`, `oot_home_controller.js`, and adjacent modules. Line refs are approximate at `c32ac7a`.

### 4.1 Pending proposal cue

| Area | Location | Module? | Notes |
|------|----------|---------|-------|
| ID derivation wrapper | `_pendingProposalIdsForMe` ~25834 | Partial | Module + legacy fallback |
| Legacy ID filter | `_legacyPendingProposalIdsForMe` ~25819 | No | Required fallback |
| Render wrapper | `renderPendingProposalCue` ~26001 | Partial | Orchestration in module |
| Legacy DOM render | `_legacyRenderPendingProposalCue` ~25879 | No | Required fallback |
| Target wrappers | `_pendingProposalCueTargets` ~25953 | Partial | Module + legacy |
| Notify/reconcile wrappers | ~25964–25999 | Partial | HomeController + legacy |
| Navigation UX | `_openPendingProposalCue`, `_hideCalendarProposalCueWhileWorkspaceOpen` | No | Calendar workflow; defer |

### 4.2 Song vote cue (alert-row pill)

| Area | Location | Module? | Notes |
|------|----------|---------|-------|
| State derivation | `_pendingSongSuggestionsForMe`, `_homeOpenSongSuggestions`, `_homeAnyActiveSongSuggestions` ~22466+ | **No** | Feeds `renderHomeSongVoteCue` |
| Input builder | `_buildHomeSongVoteCueInput` ~22718 | **No** | Thin object shape |
| Render wrapper | `renderHomeSongVoteCue` ~22886 | Partial | `renderSongVoteCue` module path + inline legacy HTML fallback |
| Apply seam | `_applyHomeCueView` / `_legacyApplyHomeCueView` ~22741+ | Partial | Shared alert-row apply |
| Post-render tails | `syncAlertRailState`, `notifyCueChange`, `requestHomeReconcile('cue:song-vote')` ×2 | Mixed | Generic `notifyCueChange`; reconcile via global shim |
| Target | Static `#home-song-vote-cue` | N/A | Single element; no collection seam yet |

**Gap vs pending proposal arc:** derivation still fully in `index.html`; no dedicated HomeController notify/reconcile methods (uses generic `notifyCueChange` + inline reconcile).

### 4.3 Rehearsal cue (alert-row pill)

| Area | Location | Module? | Notes |
|------|----------|---------|-------|
| State derivation | `_r535NextUpcomingRehearsal`, `_r535RehearsalTimes`, `_r535PrettyRehearsalDate`, etc. ~22545–22648 | **No** | Proposal fallback branch; event graph |
| Input builder | `_buildHomeRehearsalCueInput` ~22727 | **No** | |
| Render wrapper | `renderHomeRehearsalCue` ~22768 | Partial | `renderRehearsalCue` + legacy HTML |
| Image refresh notify | `notifyImageRefresh` on hidden/visible paths | Controller | Rehearsal-specific ordering |
| Post-render tails | `syncAlertRailState`, `notifyCueChange`, `requestHomeReconcile('cue:rehearsal')` ×2 | Mixed | |
| Target | Static `#home-rehearsal-cue` | N/A | |

**Gap:** largest derivation surface; ties to band image presentation and proposal fallback.

### 4.4 Shared cue render / apply helpers (`index.html`)

| Helper | Purpose |
|--------|---------|
| `_applyHomeCueView(el, view)` | Delegates to `cueRenderer.applyCueView` |
| `_legacyApplyHomeCueView` | Legacy single-target apply |
| `_buildHomeSongVoteCueInput` / `_buildHomeRehearsalCueInput` | Input shaping |
| `_recordHomeCueRenderDiag` ~22680 | Diagnostic ring buffer |

Module already owns `applyCueView`, `buildSongVoteCueView`, `buildRehearsalCueView`, alert-row `renderSongVoteCue` / `renderRehearsalCue`.

### 4.5 HomeController cue notify / reconcile paths

| Method | Cue family | Record | Reconcile |
|--------|------------|--------|-----------|
| `notifyCueChange(reason)` | Song vote, rehearsal (generic) | Yes | No |
| `requestReconcile(reason)` | All via shim | Coalesces | Delegates (non-`rHome`) |
| `notifyPendingProposalCueChange` | Pending proposal | Yes | No |
| `requestPendingProposalCueReconcile` | Pending proposal | Yes + notify | `cue:pending-proposal` |
| `requestRHomeTailReconcile` | `rHome` tail | Yes | Special passthrough |

Song vote / rehearsal use **generic** `notifyCueChange('renderHome…')` and inline `requestHomeReconcile('cue:…')` in `index.html` — not dedicated controller methods.

### 4.6 Home activation / `rHome` orchestration touching cues

| Step in `rHome()` (~31087+) | Cue impact |
|-----------------------------|------------|
| `renderPendingProposalCue()` | Pending surfaces |
| `renderHomeSongVoteCue()` | Alert-row song vote |
| `renderHomeRehearsalCue()` | Alert-row rehearsal |
| `syncAlertRailState('rHome')` | Reads alert-row visibility |
| Tail reconcile | `requestRHomeTailReconcile` / legacy |

Other cue refresh paths: `_ensureHomeCueFallbackListeners` (Firestore `onSnapshot` on suggestions/proposals → re-render song vote / rehearsal); proposal listener paths; `listenProposals` area calls all three renderers.

### 4.7 Modules (consume, not render markup)

| Module | Cue role |
|--------|----------|
| `oot_home_alert_rail.js` | Post-render sync from `#home-song-vote-cue` / `#home-rehearsal-cue` visibility |
| `oot_home_band_image.js` | Reads rehearsal cue visibility for presentation |
| `oot_home_layout_engine.js` | Reconcile shell; reacts to cue reconcile reasons |
| `oot_compat_home.js` | Shims `requestHomeReconcile`, not `notifyCueChange` |

---

## 5. Candidate Next Seams

### A. Continue pending proposal cue lifecycle ownership

| Item | Detail |
|------|--------|
| Examples | Extract `_openPendingProposalCue` navigation; dedupe legacy fallbacks; module-level notify tail |
| Files likely touched | `index.html`, possibly Calendar/proposal helpers |
| Behavior impact | **Medium** — navigation touches Calendar workflow |
| Risk | **Medium–High** (cross-tab UX, workspace hide) |
| Integrity tests | Controller + layout + manual 6o-a re-verify |
| Runtime vs docs | Runtime — **not recommended next** |

### B. Song vote cue ownership parity (derivation-first)

| Item | Detail |
|------|--------|
| Examples | `deriveSongVoteCueInput(input)` pure helper; wrapper in `renderHomeSongVoteCue`; legacy fallback |
| Files likely touched | `oot_home_cue_renderer.js`, `index.html` (minimal), integrity tests |
| Behavior impact | **None intended** — same pill text/branches as today |
| Risk | **Low** — mirrors proven 6o-b pattern |
| Integrity tests | vm derivation cases; preserve render wrapper + 2× `cue:song-vote` hooks |
| Runtime vs docs | **Runtime — recommended** |

Sub-phases (if parity with pending proposal): B1 derivation → B2 orchestration surface (partially exists) → B3 target (trivial single el) → B4 HomeController notify/reconcile dedicated methods.

### C. Rehearsal cue ownership parity

| Item | Detail |
|------|--------|
| Examples | Move `_r535*` derivation behind module pure helpers |
| Files likely touched | `oot_home_cue_renderer.js`, `index.html`, integrity tests |
| Behavior impact | **Low intended** |
| Risk | **Medium** — proposal fallback branch, image refresh ordering, band image coupling |
| Integrity tests | Derivation + image refresh reason strings + alert rail |
| Runtime vs docs | Runtime — **defer until after song vote derivation** |

### D. Shared cue-render helper extraction

| Item | Detail |
|------|--------|
| Examples | Move `_applyHomeCueView` tails, shared notify/reconcile tail helper, `_recordHomeCueRenderDiag` |
| Files likely touched | `index.html`, `oot_home_cue_renderer.js`, possibly controller |
| Behavior impact | **Medium** — shared path affects both alert-row cues |
| Risk | **Medium** |
| Integrity tests | All alert-row + layout gates |
| Runtime vs docs | Runtime — **defer** (broader blast radius) |

### E. Stop runtime work — broader Phase 6 cue architecture checkpoint

| Item | Detail |
|------|--------|
| Deliverable | Single doc mapping all three cue families to target end-state |
| Risk | **None** (docs only) |
| When | If next runtime slice exceeds one bounded seam |

---

## 6. Recommendation

### Choose exactly one: **Phase 6s-a — Song Vote cue derivation seam (runtime)**

**Why this is the next safest slice:**

1. **Smallest proven pattern** — identical shape to Phase **6o-b** (`derivePendingProposalIds`), which passed integrity gates and preserved 6o-a contract for pending proposals.
2. **Clear ownership gap** — song vote derivation (`_pendingSongSuggestionsForMe` and related helpers) is still entirely in `index.html` while render/build/apply already live in `cueRenderer`.
3. **No CSS, layout, Firestore, listeners, push, or data-shape changes** when implemented as pure derivation + wrapper fallback.
4. **No visible behavior change** if legacy fallback retains exact branch logic (`pendingForMe` / `openSuggestions` / `anyActive`).
5. **Integrity-testable** — vm tests for empty list, user-specific pending, fallback branches, no input mutation.
6. **Further reduces `index.html` ownership** without touching rehearsal complexity or Calendar navigation.

**Not recommended next:**

- **Pending proposal continuation (A)** — arc complete; remaining items are Calendar UX or low-value dedupe.
- **Rehearsal parity (C)** — higher coupling; do after song vote proves next derivation slice.
- **Shared helper extraction (D)** — too broad for one seam.
- **Docs-only pause (E)** — unnecessary; 6r-a satisfies planning; next step can be bounded runtime.

**Optional follow-on (not part of 6s-a):** Phase 6s-b — HomeController `notifySongVoteCueChange` / `requestSongVoteCueReconcile` mirroring 6q-a (thin wrapper dedupe only).

---

## 7. Explicit Non-Goals

- Do **not** start pending response reminder backend work from this branch.
- Do **not** implement 24-hour / 10-hour reminder notifications.
- Do **not** modify OneSignal or service worker behavior.
- Do **not** work on flyer/r106 legacy work.
- Do **not** change Home band image layout.
- Do **not** change visual placement of Home pills or cues in planning or the recommended runtime slice.
- Do **not** merge to `main` without explicit approval.
- Do **not** touch `oot-local-server.ps1`.

**Deferred cleanup (do not derail):** Rehearsal on Deck pill placement — classify as deferred unless functional breakage or current-slice regression.

---

## 8. Proposed Prompt for Next Runtime Slice (Do Not Execute Yet)

Paste-ready Cursor Agent prompt for **Phase 6s-a** after repo verification:

```
We are continuing Out of Time app Home modularization on branch modularization-home-layout-engine-pilot.

Current verified repo state:
- Branch: modularization-home-layout-engine-pilot
- Expected HEAD: <verify after 6r-a doc commit>
- Working tree clean except untracked oot-local-server.ps1
- Do not edit/stage/delete oot-local-server.ps1

Task: Phase 6s-a — Song Vote cue derivation seam.

Goal:
Move song vote cue input/derivation logic behind a module-safe pure helper, without changing runtime behavior. renderHomeSongVoteCue() in index.html must remain the public wrapper with full legacy fallback.

Strict boundaries:
- No CSS changes.
- No visual/layout changes.
- No Firestore logic changes.
- No listener changes.
- No notification/push behavior changes.
- No proposal data shape changes.
- Do not change renderHomeSongVoteCue() external call sites.
- Do not touch pending proposal cue paths except integrity guards.
- Do not touch rehearsal cue render paths except integrity guards.
- Do not commit unless explicitly instructed.

Implementation intent:
1. Add pure helper to oot_home_cue_renderer.js, e.g. deriveSongVoteCueInput(input) or deriveSongVoteCueItems(input).
2. Accept plain input (suggestions array, currentMemberId, helper fns or equivalent flags) — no global reads in module.
3. Preserve existing branch logic: pendingForMe → openSuggestions → anyActive; userSpecific flag; sourceBranch strings.
4. Keep _buildHomeSongVoteCueInput or fold into helper output shape expected by buildSongVoteCueView/renderSongVoteCue.
5. renderHomeSongVoteCue() delegates to module helper with _legacySongVoteCueInput() (or equivalent) fallback containing exact current logic.
6. Add integrity coverage: export, branch cases, no mutation, renderHomeSongVoteCue wrapper preserved, 2× cue:song-vote reconcile hooks unchanged, pending proposal seams intact.

Allowed files:
- oot_home_cue_renderer.js
- index.html (minimal delegation only)
- tests/integrity/home-controller-package.mjs
- tests/integrity/home-layout-engine-package.mjs (if diff allowlist requires)

After edits, run all five standard integrity gates and report files changed, behavior preserved, git status — do not commit.
```

---

## Related Docs

- `PHASE_6Q_B_PENDING_PROPOSAL_RECONCILE_NOTIFICATION_CHECKPOINT.md`
- `PHASE_6P_B_PENDING_PROPOSAL_TARGET_COLLECTION_CHECKPOINT.md`
- `PHASE_6O_D_PENDING_PROPOSAL_MODULARIZATION_CHECKPOINT.md`
- `PHASE_6O_A_PENDING_PROPOSAL_MANUAL_VERIFICATION.md`
- `PHASE_6N_HOME_CUE_NEXT_PLAN.md`
