# Phase 6v-c — Song Vote HomeController Notify/Reconcile Checkpoint

## Status

**Checkpoint / documentation only.** No runtime behavior changed by this document.

This records the Song Vote cue **HomeController notify/reconcile parity seam** added in Phase **6v-b**, following the planning direction from Phase **6v-a** (`PHASE_6V_A_SONG_VOTE_HOMECONTROLLER_NOTIFY_RECONCILE_PLAN.md`).

---

## Repo Baseline

| Item | Value |
|------|--------|
| Branch | `modularization-home-layout-engine-pilot` |
| Current HEAD (short) | `6b32223` — *Add Song Vote HomeController notify reconcile parity* |
| Working tree | Clean except untracked `oot-local-server.ps1` (**do not commit**) |

### Phase 6v-b commit recorded

| Commit | Summary |
|--------|---------|
| `6b32223` | Add Song Vote HomeController notify reconcile parity (Phase 6v-b) |

### Phase 6v-a planning result (summary)

Phase **6v-a** inspected Song Vote notify/reconcile timing in `renderHomeSongVoteCue()` vs pending proposal Phase **6q-a**:

| Finding | Detail |
|---------|--------|
| Current state (pre-6v-b) | Inline `notifyCueChange('renderHomeSongVoteCue')` + Home-active gated `requestHomeReconcile('cue:song-vote')` on **both** hidden and visible branches |
| Pending proposal reference | Dedicated `notifyPendingProposalCueChange` / `requestPendingProposalCueReconcile` + index wrappers with legacy fallbacks |
| Reconcile path | Already flowed through HomeController coalescer via `requestHomeReconcile` shim; notify was not explicitly controller-owned |
| Risk | **Low** if 6v-b mirrors 6q-a shape exactly (hook order, 2× semantics, Home-active gate, reason strings) |
| Recommendation | Proceed with **6v-b** runtime parity — not a broader cue-controller architecture checkpoint |

6v-a explicitly **did not** expand scope to rehearsal parity, `oot_compat_home.js` global shims, or coalescer logic changes.

### Upstream context (Song Vote cue path)

| Phase | Deliverable |
|-------|-------------|
| **6l-d → 6l-h** | View build, apply seam, `renderSongVoteCue` |
| **6s-a / 6s-b** | `deriveSongVoteCueState` + wrapper/checkpoint |
| **6t-a / 6t-b** | `renderSongVoteCueSurface` + wrapper/checkpoint |
| **6u-a / 6u-b / 6u-c** | `collectSongVoteCueTargets` + target collection wrapper/checkpoint |
| **6v-a** | Notify/reconcile parity plan |
| **6v-b** | HomeController notify/reconcile seam + `renderHomeSongVoteCue()` tail wrappers |

Pending proposal cue (6o through 6q) and rehearsal cue paths were **not modified** in 6v-b.

---

## Purpose

Phase **6v-b** moved Song Vote cue **notify/reconcile timing ownership** toward HomeController, mirroring pending proposal Phase **6q-a**, without changing cue DOM output, text, selectors, Firestore paths, listeners, or push behavior.

Phase **6v-c** (this document) records that checkpoint without introducing new runtime behavior.

---

## Files Changed in Phase 6v-b

| File | Role |
|------|------|
| `oot_home_controller.js` | `notifySongVoteCueChange`, `requestSongVoteCueReconcile` + API export |
| `index.html` | Notify/reconcile wrapper helpers + tail hook replacement in `renderHomeSongVoteCue()` |
| `tests/integrity/home-controller-package.mjs` | `assertPhase6vBSongVoteNotifyReconcile`; updated reconcile-count checks for wrapper pattern |
| `tests/integrity/home-layout-engine-package.mjs` | Diff allowlist for Song Vote notify/reconcile delegation lines |

**Not changed in 6v-b:** `oot_home_cue_renderer.js`, `oot_compat_home.js`, `oot_home_alert_rail.js`, `oot_home_diag.js`, pending proposal wrappers, rehearsal cue render path.

---

## HomeController Seam Added (Phase 6v-b)

### `notifySongVoteCueChange(reason, options)`

- Record-only event via `_record('notifySongVoteCueChange', …)`.
- Default reason: `'renderHomeSongVoteCue'`.
- Does not write DOM, Firestore, CSS, or push notifications.

### `requestSongVoteCueReconcile(options)`

- Records notify via `notifySongVoteCueChange('renderHomeSongVoteCue', payload)`.
- Delegates to `requestReconcile('cue:song-vote', payload)`.
- Uses the **same coalescer path** as `cue:pending-proposal` and `cue:rehearsal` reconcile requests (non-`rHome` delegate on flush).
- Does **not** Home-gate internally; gating lives in the index.html reconcile wrapper (same as pending proposal).

Both methods are exported on `OOT.home.controller`.

---

## index.html Wrapper / Fallback Additions

| Function | Behavior |
|----------|----------|
| `_legacyNotifySongVoteCueChange()` | Fallback to `notifyCueChange('renderHomeSongVoteCue')` |
| `_legacyRequestSongVoteCueReconcileIfHomeActive()` | Home-active gated `requestHomeReconcile('cue:song-vote')` |
| `_notifySongVoteCueChange()` | Prefers `HomeController.notifySongVoteCueChange`; falls back to legacy |
| `_requestSongVoteCueReconcileIfHomeActive()` | Home-active check → `HomeController.requestSongVoteCueReconcile`; falls back to legacy |

Legacy fallbacks preserve behavior when HomeController methods are unavailable.

---

## renderHomeSongVoteCue() Flow (after 6v-b)

```javascript
function renderHomeSongVoteCue(){
  var _svTargets = _songVoteCueTargets();
  var el = _svTargets.songVoteEl;
  if(!el) return;   // early exit — NO post-render tails
  // … _deriveSongVoteCueState() → _buildHomeSongVoteCueInput
  // … renderSongVoteCueSurface({ targetEl: el, … })
  // … _legacyRenderHomeSongVoteCueSurface(el, _svInput) when needed
  // hidden branch OR visible branch tails (identical hook sequence):
  //   _recordHomeCueRenderDiag → _applyHomeCueView (when !moduleApplied)
  //   _homeLayoutDiagSnapshot
  //   syncAlertRailState('renderHomeSongVoteCue')
  //   _notifySongVoteCueChange()
  //   _requestSongVoteCueReconcileIfHomeActive()
}
```

| Property | Detail |
|----------|--------|
| Branch count | **Two** exit paths (hidden + visible), each with identical tail sequence |
| Tail timing | Runs **after render/apply** on the taken branch only |
| Notify | Always attempted via wrapper (record-only on happy path) |
| Reconcile | **Home-active gated** in `_requestSongVoteCueReconcileIfHomeActive` (`#sc-home.on`) |
| **2× reconcile semantics** | Wrapper invoked once per branch — same runtime frequency as pre-6v-b inline hooks |
| Early exit | `if(!el) return` skips derivation, orchestration, and **all** tails |

### Tail order (both branches)

```
syncAlertRailState('renderHomeSongVoteCue')
  → _notifySongVoteCueChange()
  → _requestSongVoteCueReconcileIfHomeActive()
```

---

## Current Song Vote Cue Architecture (after 6v-b)

```
renderHomeSongVoteCue()                         [index.html — public wrapper / call site]
  ├─ _svTargets = _songVoteCueTargets()         [index.html wrapper — 6u-b]
  │    └─ collectSongVoteCueTargets({ document })  [module]
  │         fallback: _legacySongVoteCueTargets()
  ├─ el = _svTargets.songVoteEl; if(!el) return
  ├─ _svDerived = _deriveSongVoteCueState()    [index.html wrapper — 6s-a]
  │    └─ deriveSongVoteCueState(input)        [module]
  ├─ _buildHomeSongVoteCueInput(...)
  ├─ renderSongVoteCueSurface({ targetEl: el, … })  [module — 6t-a]
  │    fallback: _legacyRenderHomeSongVoteCueSurface(el, _svInput)
  ├─ _applyHomeCueView(el, _svView)            [when !moduleApplied]
  ├─ _recordHomeCueRenderDiag('songVote', …)
  ├─ _homeLayoutDiagSnapshot(...)
  ├─ syncAlertRailState('renderHomeSongVoteCue')
  ├─ _notifySongVoteCueChange()                [index.html — 6v-b]
  │    └─ HomeController.notifySongVoteCueChange
  │         fallback: notifyCueChange('renderHomeSongVoteCue')
  └─ _requestSongVoteCueReconcileIfHomeActive()  [index.html — 6v-b]
       └─ HomeController.requestSongVoteCueReconcile
            └─ requestReconcile('cue:song-vote')
            fallback: requestHomeReconcile('cue:song-vote') when Home active
```

| Layer | Owner |
|-------|--------|
| Target collection | `OOT.home.cueRenderer.collectSongVoteCueTargets` |
| Derivation | `OOT.home.cueRenderer.deriveSongVoteCueState` |
| Input packaging | `_buildHomeSongVoteCueInput` (index.html) |
| Render orchestration | `OOT.home.cueRenderer.renderSongVoteCueSurface` |
| View build / apply | `buildSongVoteCueView` / `applyCueView` / `renderSongVoteCue` (module) |
| Inline HTML fallback | `_legacyBuildHomeSongVoteCueView` (index.html) |
| Full orchestration fallback | `_legacyRenderHomeSongVoteCueSurface` (index.html) |
| Alert rail sync | `syncAlertRailState('renderHomeSongVoteCue')` (index.html) |
| **Notify / reconcile timing** | **HomeController** (`notifySongVoteCueChange`, `requestSongVoteCueReconcile`) |
| Public entry + fallbacks | `index.html` |

Song Vote cue modularization ladder is now **complete** through notify/reconcile parity: derive → orchestrate → targets → controller timing.

---

## Remaining index.html Ownership (Song Vote)

| Item | Role |
|------|------|
| `_deriveSongVoteCueState()` / `_legacyDeriveSongVoteCueState()` | Derivation wrappers + legacy helpers |
| `_buildHomeSongVoteCueInput()` | Input packaging |
| `renderHomeSongVoteCue()` | Public render owner + post-render tail orchestration |
| `_songVoteCueTargets()` / `_legacySongVoteCueTargets()` | Target collection wrappers |
| `_legacyRenderHomeSongVoteCueSurface()` | Full legacy orchestration fallback |
| `_legacyBuildHomeSongVoteCueView()` | Inline HTML view builder fallback |
| `_applyHomeCueView()` | Apply when module render path did not apply DOM |
| `_recordHomeCueRenderDiag` | Diagnostic recording |
| `_homeLayoutDiagSnapshot` | Layout diagnostic snapshots |
| `syncAlertRailState('renderHomeSongVoteCue')` | Alert rail sync (still inline in render tails) |
| `_notifySongVoteCueChange()` / `_legacyNotifySongVoteCueChange()` | Notify wrappers + legacy fallback |
| `_requestSongVoteCueReconcileIfHomeActive()` / `_legacyRequestSongVoteCueReconcileIfHomeActive()` | Reconcile wrappers + legacy fallback |

**Not moved in 6v-b:** `oot_home_alert_rail.js` and `oot_home_diag.js` still resolve `#home-song-vote-cue` independently for their own modules.

---

## Behavior Preserved

| Contract | Expected |
|----------|----------|
| Notify reason string | `'renderHomeSongVoteCue'` (via dedicated method / legacy `notifyCueChange`) |
| Reconcile reason string | `'cue:song-vote'` (via `requestReconcile` / legacy `requestHomeReconcile`) |
| **2× reconcile semantics** | Hidden + visible branches each call reconcile wrapper |
| Home-active gating | Reconcile wrapper only when `#sc-home.on` |
| Tail order | `syncAlertRailState` → notify wrapper → reconcile wrapper |
| Legacy fallbacks | Generic `notifyCueChange` / `requestHomeReconcile` preserved in legacy helpers |
| Early exit | `if(!el) return` — no tails when target missing |
| Target collection (6u-b) | Unchanged |
| Derivation (6s-a) | Unchanged |
| Render orchestration (6t-a) | Unchanged |
| Cue text / placement / CSS | Unchanged |
| Pending proposal paths | Untouched |
| Rehearsal paths | Untouched |
| Firestore read/write | Unchanged |
| Listeners | Unchanged |
| Push notification behavior | Unchanged |
| Song suggestion/vote data shape | Unchanged |

6v-b did **not** re-run manual browser verification; visible Song Vote cue behavior is expected to match pre-6v-b because notify/reconcile are record/coalesce-only side effects with identical timing and gating.

---

## Integrity Gate Results (Phase 6v-b)

All **five** standard gates **PASS** at commit `6b32223`:

```powershell
$node = "C:\Users\rescarcega\AppData\Local\Programs\cursor\resources\app\resources\helpers\node.exe"
& $node tests/integrity/home-controller-package.mjs
& $node tests/integrity/home-layout-engine-package.mjs
& $node tests/integrity/home-diag-package.mjs
& $node tests/integrity/home-alert-rail-package.mjs
& $node tests/integrity/home-gig-slot-package.mjs
```

| Gate | Result |
|------|--------|
| `home-controller-package.mjs` | **PASS** — Phase 6q-a + 6s-a + 6t-a + 6u-b + 6v-b checks |
| `home-layout-engine-package.mjs` | **PASS** — Phase 5 layout engine checks |
| `home-diag-package.mjs` | **PASS** — Phase 1/1b/1c + 6b diagnostics |
| `home-alert-rail-package.mjs` | **PASS** — Phase 3 alert rail |
| `home-gig-slot-package.mjs` | **PASS** — Phase 4 gig slot |

This Phase **6v-c** document introduces **no new runtime behavior**.

---

## Hard Boundaries (Still in Force)

| Boundary | Status |
|----------|--------|
| CSS | No changes in 6v-b / 6v-c |
| Cue text | No changes |
| Cue visuals / placement | No changes |
| Target selector id | No changes |
| Firestore read/write logic | No changes |
| Listeners | No changes |
| Push notification behavior | No changes |
| Song suggestion/vote data shape | No changes |
| Pending proposal cue behavior | No changes |
| Rehearsal cue behavior | No changes |
| Broad refactor | Not permitted |
| Merge to `main` | Not approved |

---

## Recommended Next Slice

**Phase 6w-a — planning / inspection only** for **Rehearsal cue derivation/render/target/controller parity**, **or** a broader **Home cue architecture checkpoint** if the thread is becoming too dense.

### Preferred direction (planning first)

Rehearsal cue remains the primary alert-row cue **without** dedicated HomeController notify/reconcile methods. It still uses inline generic hooks (`notifyCueChange('renderHomeRehearsalCue')` + Home-active gated `requestHomeReconcile('cue:rehearsal')`) plus rehearsal-only image refresh scheduling.

| Cue | Derive | Orchestrate | Targets | Controller notify/reconcile |
|-----|--------|-------------|---------|----------------------------|
| Pending proposal | Module (6o-b) | Module (6o-c) | Module (6p-a) | **Dedicated (6q-a)** |
| Song Vote | Module (6s-a) | Module (6t-a) | Module (6u-b) | **Dedicated (6v-b)** |
| Rehearsal | Partial (index.html) | Partial (6l-i) | Inline | **Generic inline** |

Phase **6w-a** should inspect whether rehearsal should follow the same ladder (derive → orchestrate → targets → controller parity) as separate bounded slices, or whether a single architecture checkpoint should plan rehearsal + remaining cross-cue asymmetries together.

Song Vote cue modularization on this branch is **complete** through 6v-b; no further Song Vote slices are required unless regressions appear.

### Explicit non-goals

- Do **not** start pending response reminder backend work from this branch.
- Do **not** start flyer/r106 legacy work from this branch.
- Do **not** unify `oot_home_alert_rail.js` / `oot_home_diag.js` target lookups unless 6w-a explicitly expands scope.
- Do **not** add `notifyCueChange` to `oot_compat_home.js` unless a future slice explicitly requires it.

---

## Related Docs

- `PHASE_6V_A_SONG_VOTE_HOMECONTROLLER_NOTIFY_RECONCILE_PLAN.md` — 6v-a planning / inspection
- `PHASE_6U_C_SONG_VOTE_TARGET_COLLECTION_CHECKPOINT.md` — 6u-b target collection checkpoint
- `PHASE_6Q_B_PENDING_PROPOSAL_RECONCILE_NOTIFICATION_CHECKPOINT.md` — 6q-a pattern reference
- `PHASE_6R_A_HOME_CUE_OWNERSHIP_NEXT_SEAM_PLAN.md` — broader Home cue ownership inventory
- `PHASE_6T_B_SONG_VOTE_RENDER_ORCHESTRATION_CHECKPOINT.md` — 6t-a orchestration checkpoint
- `PHASE_6S_B_SONG_VOTE_DERIVATION_CHECKPOINT.md` — 6s-a derivation checkpoint
