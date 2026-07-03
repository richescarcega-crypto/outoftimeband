# Phase 6u-c — Song Vote Target Collection Checkpoint

## Status

**Checkpoint / documentation only.** No runtime behavior changed by this document.

This records the Song Vote cue **target collection seam** added in Phase **6u-b**, following the planning direction from Phase **6u-a** (`PHASE_6U_A_SONG_VOTE_TARGET_COLLECTION_PLAN.md`).

---

## Repo Baseline

| Item | Value |
|------|--------|
| Branch | `modularization-home-layout-engine-pilot` |
| Current HEAD (short) | `0a04fc9` — *Add Song Vote cue target collection seam* |
| Working tree | Clean except untracked `oot-local-server.ps1` (**do not commit**) |

### Phase 6u-b commit recorded

| Commit | Summary |
|--------|---------|
| `0a04fc9` | Add Song Vote cue target collection seam (Phase 6u-b) |

### Phase 6u-a planning result (summary)

Phase **6u-a** inspected the `#home-song-vote-cue` target path and compared it to pending proposal Phase **6p-a**:

| Finding | Detail |
|---------|--------|
| Target count | **1** static alert-row slot vs 6 pending-proposal surfaces |
| Functional need | **Low** — arc parity driver, not behavior driver |
| Risk | **Low** — bounded single-id seam |
| Recommendation | Proceed with **6u-b** runtime; do not unify alert_rail/diag lookups in same slice |

6u-a explicitly **did not** expand scope to `oot_home_alert_rail.js`, `oot_home_diag.js`, or `renderSongVoteCueSurface` API changes.

### Upstream context (Song Vote cue path)

| Phase | Deliverable |
|-------|-------------|
| **6l-d → 6l-h** | View build, apply seam, `renderSongVoteCue` |
| **6s-a / 6s-b** | `deriveSongVoteCueState` + wrapper/checkpoint |
| **6t-a / 6t-b** | `renderSongVoteCueSurface` + wrapper/checkpoint |
| **6u-a** | Target collection plan |
| **6u-b** | `collectSongVoteCueTargets` + `_songVoteCueTargets()` wrapper |

Pending proposal cue modularization (6o through 6q) and rehearsal cue paths were **not modified** in 6u-b.

---

## Purpose

Phase **6u-b** moved Song Vote cue **DOM target collection** behind `OOT.home.cueRenderer.collectSongVoteCueTargets({ document })`, mirroring the pending proposal target collection pattern from Phase **6p-a** at reduced scope (one target key).

Phase **6u-c** (this document) records that checkpoint without introducing new runtime behavior.

---

## Files Changed in Phase 6u-b

| File | Role |
|------|------|
| `oot_home_cue_renderer.js` | `collectSongVoteCueTargets({ document })` + API export |
| `index.html` | `_legacySongVoteCueTargets()`, `_songVoteCueTargets()`; `renderHomeSongVoteCue()` delegates target resolution |
| `tests/integrity/home-controller-package.mjs` | `assertPhase6uBSongVoteTargetCollection`; 6p-a collect-body boundary fix |
| `tests/integrity/home-layout-engine-package.mjs` | Diff allowlist for target collection delegation lines |

---

## Module Seam Added (Phase 6u-b)

### `OOT.home.cueRenderer.collectSongVoteCueTargets({ document })`

Collects the single Song Vote alert-row DOM target. Read-only; no render, notify, or reconcile side effects.

#### Input contract

| Field | Type | Notes |
|-------|------|-------|
| `document` | `Document` | DOM document snapshot (typically global `document` from index.html) |

#### Return contract

```javascript
{
  songVoteEl: Element | null
}
```

- Resolves via `document.getElementById(CUE_IDS.songVote)` where `CUE_IDS.songVote === 'home-song-vote-cue'`.
- Missing or invalid `document` (no `getElementById`) → `{ songVoteEl: null }` safely (no throw).

---

## index.html Wrappers Added (Phase 6u-b)

| Function | Role |
|----------|------|
| `_legacySongVoteCueTargets()` | `{ songVoteEl: document.getElementById('home-song-vote-cue') }` |
| `_songVoteCueTargets()` | Delegates to `cueRenderer.collectSongVoteCueTargets({ document: document })`; falls back to `_legacySongVoteCueTargets()` |

Mirrors pending proposal `_legacyPendingProposalCueTargets()` / `_pendingProposalCueTargets()` pattern.

---

## renderHomeSongVoteCue() Target Flow (after 6u-b)

```javascript
function renderHomeSongVoteCue(){
  var _svTargets = _songVoteCueTargets();
  var el = _svTargets.songVoteEl;
  if(!el) return;
  // … _deriveSongVoteCueState() → _buildHomeSongVoteCueInput
  // … renderSongVoteCueSurface({ targetEl: el, cueInput, … })
  // … _legacyRenderHomeSongVoteCueSurface(el, _svInput) when needed
  // … post-render tails (diag, apply, alert rail, notify, reconcile)
}
```

| Step | Owner |
|------|--------|
| Target collection | `_songVoteCueTargets()` → module / legacy |
| Early exit | `if(!el) return` — **no tails** when target missing |
| Orchestration input | Same `el` as `targetEl` on `renderSongVoteCueSurface` |
| Legacy orchestration | Same `el` passed to `_legacyRenderHomeSongVoteCueSurface(el, _svInput)` |

`renderSongVoteCueSurface` input shape unchanged (`targetEl: el`, not a multi-target object).

---

## Current Song Vote Cue Architecture (after 6u-b)

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
  ├─ syncAlertRailState('renderHomeSongVoteCue')
  ├─ notifyCueChange('renderHomeSongVoteCue')
  └─ requestHomeReconcile('cue:song-vote')     [Home-active gated, 2× hooks]
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
| Post-render side effects | index.html tails |
| Notify / reconcile timing | Generic `notifyCueChange` + inline reconcile (index.html) |

---

## Remaining index.html Ownership (Song Vote)

| Item | Role |
|------|------|
| `_deriveSongVoteCueState()` / `_legacyDeriveSongVoteCueState()` | Derivation wrappers + legacy helpers |
| `_buildHomeSongVoteCueInput()` | Input packaging |
| `renderHomeSongVoteCue()` | Public render owner + post-render tails |
| `_songVoteCueTargets()` / `_legacySongVoteCueTargets()` | Target collection wrappers |
| `_legacyRenderHomeSongVoteCueSurface()` | Full legacy orchestration fallback |
| `_legacyBuildHomeSongVoteCueView()` | Inline HTML view builder fallback |
| `_applyHomeCueView()` | Apply when module render path did not apply DOM |
| `_recordHomeCueRenderDiag` | Diagnostic recording |
| `syncAlertRailState('renderHomeSongVoteCue')` | Alert rail sync |
| `notifyCueChange('renderHomeSongVoteCue')` | Generic cue change notify |
| `requestHomeReconcile('cue:song-vote')` | **2×** Home-active gated reconcile hooks |

**Not moved in 6u-b:** `oot_home_alert_rail.js` and `oot_home_diag.js` still resolve `#home-song-vote-cue` independently for their own modules.

---

## Behavior Preserved

| Contract | Expected |
|----------|----------|
| Selector id | `#home-song-vote-cue` unchanged |
| Missing target | Early return — no derivation, orchestration, or tails |
| Same element | Identical `el` passed to `renderSongVoteCueSurface` and legacy fallback |
| Derivation (6s-a) | Unchanged |
| Render orchestration (6t-a) | Unchanged |
| Post-render tails | `_applyHomeCueView`, diag, alert rail, notify, reconcile unchanged |
| **2×** `cue:song-vote` reconcile hooks | Unchanged |
| Cue text / placement / CSS | Unchanged |
| Pending proposal paths | Untouched |
| Rehearsal paths | Untouched |

6u-b did **not** re-run manual browser verification; visible Song Vote cue behavior is expected to match pre-6u-b because target resolution returns the same element on the normal path.

---

## Integrity Gate Results (Phase 6u-b)

All **five** standard gates **PASS** at commit `0a04fc9`:

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
| `home-controller-package.mjs` | **PASS** — Phase 6q-a + 6s-a + 6t-a + 6u-b checks |
| `home-layout-engine-package.mjs` | **PASS** — Phase 5 layout engine checks |
| `home-diag-package.mjs` | **PASS** — Phase 1/1b/1c + 6b diagnostics |
| `home-alert-rail-package.mjs` | **PASS** — Phase 3 alert rail |
| `home-gig-slot-package.mjs` | **PASS** — Phase 4 gig slot |

This Phase **6u-c** document introduces **no new runtime behavior**.

---

## Hard Boundaries (Still in Force)

| Boundary | Status |
|----------|--------|
| CSS | No changes in 6u-b / 6u-c |
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

**Phase 6v-a — planning / inspection only** for **HomeController Song Vote notify/reconcile parity**.

### Preferred direction (planning first — no immediate runtime)

Mirror pending proposal Phase **6q-a** dedicated controller methods:

| Pending proposal (6q-a) | Song Vote gap (current) |
|---------------------------|-------------------------|
| `notifyPendingProposalCueChange` | Uses generic `notifyCueChange('renderHomeSongVoteCue')` |
| `requestPendingProposalCueReconcile` | Uses inline `requestHomeReconcile('cue:song-vote')` in index.html tails |

Phase **6v-a** should inspect:

- Exact tail hook locations in `renderHomeSongVoteCue()` (hidden + visible branches).
- Whether dedicated wrappers reduce index.html ownership without changing coalescer behavior.
- Risk vs value compared to further Song Vote slices (already complete: derive → orchestrate → targets).

Phase **6v-b** runtime (if 6v-a approves) would add `notifySongVoteCueChange` / `requestSongVoteCueReconcile` with index.html wrappers — **not** started from this checkpoint.

### Explicit non-goals

- Do **not** start pending response reminder backend work from this branch.
- Do **not** start flyer/r106 legacy work from this branch.
- Do **not** unify `oot_home_alert_rail.js` / `oot_home_diag.js` target lookups in the next slice unless 6v-a explicitly expands scope.

---

## Related Docs

- `PHASE_6U_A_SONG_VOTE_TARGET_COLLECTION_PLAN.md` — 6u-a planning / inspection
- `PHASE_6T_B_SONG_VOTE_RENDER_ORCHESTRATION_CHECKPOINT.md` — 6t-a orchestration checkpoint
- `PHASE_6S_B_SONG_VOTE_DERIVATION_CHECKPOINT.md` — 6s-a derivation checkpoint
- `PHASE_6P_B_PENDING_PROPOSAL_TARGET_COLLECTION_CHECKPOINT.md` — 6p-a pattern reference
- `PHASE_6Q_B_PENDING_PROPOSAL_RECONCILE_NOTIFICATION_CHECKPOINT.md` — 6q-a pattern reference for 6v-a
