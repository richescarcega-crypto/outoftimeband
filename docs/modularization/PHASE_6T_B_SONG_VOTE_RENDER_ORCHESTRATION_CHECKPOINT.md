# Phase 6t-b — Song Vote Render Orchestration Checkpoint

## Status

**Checkpoint / documentation only.** No runtime behavior changed by this document.

This records the Song Vote cue **render orchestration seam** added in Phase **6t-a**, on top of the verified Song Vote derivation path (Phases **6s-a** / **6s-b**).

---

## Repo Baseline

| Item | Value |
|------|--------|
| Branch | `modularization-home-layout-engine-pilot` |
| Current HEAD (short) | `861b900` — *Add Song Vote cue render orchestration seam* |
| Working tree | Clean except untracked `oot-local-server.ps1` (**do not commit**) |

### Phase 6t-a commit recorded

| Commit | Summary |
|--------|---------|
| `861b900` | Add Song Vote cue render orchestration seam (Phase 6t-a) |

### Upstream context (Song Vote cue path)

| Phase | Deliverable |
|-------|-------------|
| **6l-d / 6l-e / 6l-f** | `buildSongVoteCueView`, shared `applyCueView`, alert-row apply seam |
| **6l-g** | `_buildHomeSongVoteCueInput` input packaging |
| **6l-h** | `renderSongVoteCue` module wrapper (build + apply) |
| **6e-c / 6g** | Home-active gated `requestHomeReconcile('cue:song-vote')` hooks (2×) |
| **6r-a** | Planning inventory — recommended Song Vote derivation as next slice |
| **6s-a / 6s-b** | `deriveSongVoteCueState` + `_deriveSongVoteCueState()` wrapper/checkpoint |
| **6t-a** | `renderSongVoteCueSurface` + orchestration delegation in `renderHomeSongVoteCue()` |

Pending proposal cue modularization (6o through 6q) and rehearsal cue paths were **not modified** in 6t-a.

---

## Purpose

Phase **6t-a** moved Song Vote cue **render orchestration** (post-derivation view resolution) into `OOT.home.cueRenderer`, mirroring the proven pending proposal orchestration pattern from Phase **6o-c** (`renderPendingProposalCueSurface`).

Phase **6t-b** (this document) records that checkpoint without introducing new runtime behavior.

---

## Files Changed in Phase 6t-a

| File | Role |
|------|------|
| `oot_home_cue_renderer.js` | `renderSongVoteCueSurface(input)` orchestration helper + API export |
| `index.html` | Orchestration delegation in `renderHomeSongVoteCue()`; `_legacyRenderHomeSongVoteCueSurface()` / `_legacyBuildHomeSongVoteCueView()` fallbacks |
| `tests/integrity/home-controller-package.mjs` | `assertPhase6tASongVoteRenderOrchestration` |
| `tests/integrity/home-layout-engine-package.mjs` | Diff allowlist for Song Vote orchestration delegation lines |

---

## Module Seam Added (Phase 6t-a)

### `OOT.home.cueRenderer.renderSongVoteCueSurface(input)`

Orchestrates **post-derivation render** only. Does not perform diag, alert rail, notify, or reconcile side effects.

#### Orchestration chain

| Step | Default | Role |
|------|---------|------|
| 1 | `renderCue` → `renderSongVoteCue` | Build view + apply DOM; sets `moduleApplied: true` when `rendered` |
| 2 | `buildView` → `buildSongVoteCueView` | View descriptor when render cue does not succeed |
| 3 | `legacyBuildView` → `_legacyBuildHomeSongVoteCueView` (index.html callback) | Inline HTML view builder fallback |

#### Input contract (typical)

| Field | Type | Notes |
|-------|------|-------|
| `targetEl` | `Element` | `#home-song-vote-cue` DOM target |
| `cueInput` | `Object` | Output of `_buildHomeSongVoteCueInput` |
| `renderCue` | `function` | Optional override; defaults to `renderSongVoteCue` |
| `buildView` | `function` | Optional override; defaults to `buildSongVoteCueView` |
| `legacyBuildView` | `function` | Inline HTML fallback callback from index.html |

#### Return contract

```javascript
{
  moduleApplied: boolean,  // true when renderCue applied DOM successfully
  view: {
    visible: boolean,
    sourceBranch: string,
    html: string           // empty when moduleApplied via renderCue
  }
}
```

When all paths fail, returns hidden view `{ visible: false, sourceBranch: 'none' }` with `moduleApplied: false`.

---

## Current Song Vote Cue Architecture (after 6t-a)

```
renderHomeSongVoteCue()                         [index.html — public wrapper / call site]
  ├─ _svDerived = _deriveSongVoteCueState()    [index.html wrapper — 6s-a]
  │    └─ deriveSongVoteCueState(input)        [module]
  │         fallback: _legacyDeriveSongVoteCueState()
  ├─ _buildHomeSongVoteCueInput(cueItems, userSpecific, sourceBranch)
  ├─ renderSongVoteCueSurface({               [module — 6t-a]
  │      targetEl: el,
  │      cueInput: _svInput,
  │      renderCue / buildView / legacyBuildView
  │    })
  │    chain: renderSongVoteCue → buildSongVoteCueView → legacyBuildView
  │    fallback when no view: _legacyRenderHomeSongVoteCueSurface(el, _svInput)
  ├─ _applyHomeCueView(el, _svView)            [when !moduleApplied]
  ├─ _recordHomeCueRenderDiag('songVote', …)
  ├─ syncAlertRailState('renderHomeSongVoteCue')
  ├─ notifyCueChange('renderHomeSongVoteCue')
  └─ requestHomeReconcile('cue:song-vote')     [Home-active gated, 2× hooks]
```

| Layer | Owner |
|-------|--------|
| Derivation | `OOT.home.cueRenderer.deriveSongVoteCueState` |
| Input packaging | `_buildHomeSongVoteCueInput` (index.html) |
| Render orchestration | `OOT.home.cueRenderer.renderSongVoteCueSurface` |
| View build / apply | `buildSongVoteCueView` / `applyCueView` / `renderSongVoteCue` (module) |
| Inline HTML fallback | `_legacyBuildHomeSongVoteCueView` (index.html) |
| Full orchestration fallback | `_legacyRenderHomeSongVoteCueSurface` (index.html) |
| Post-render side effects | index.html tails (diag, apply, alert rail, notify, reconcile) |
| Public entry + fallbacks | `index.html` |

---

## What Remains in index.html

| Function / tail | Role |
|-----------------|------|
| `_deriveSongVoteCueState()` | Public derivation wrapper → module + legacy fallback |
| `_legacyDeriveSongVoteCueState()` | Legacy branch orchestration using helper chain |
| `_buildHomeSongVoteCueInput()` | Input packaging |
| `renderHomeSongVoteCue()` | Public render owner — derive → orchestrate → tails |
| `_legacyRenderHomeSongVoteCueSurface()` | Full legacy orchestration when surface returns no view |
| `_legacyBuildHomeSongVoteCueView()` | Inline HTML view builder fallback |
| `_recordHomeCueRenderDiag` | Post-render diagnostic recording |
| `_applyHomeCueView` | Apply when module render path did not apply DOM |
| `syncAlertRailState('renderHomeSongVoteCue')` | Alert rail sync |
| `notifyCueChange('renderHomeSongVoteCue')` | Generic cue change notify |
| `requestHomeReconcile('cue:song-vote')` | **2×** Home-active gated reconcile hooks |

Legacy derivation helpers (`_pendingSongSuggestionsForMe`, `_homeOpenSongSuggestions`, `_homeAnyActiveSongSuggestions`) also remain for derivation fallback and other call sites.

---

## What Was Intentionally Not Moved in Phase 6t-a

| Concern | Status |
|---------|--------|
| Target collection / `#home-song-vote-cue` static target | Still resolved inline in `renderHomeSongVoteCue()` |
| HomeController notify/reconcile timing | Still generic `notifyCueChange` + inline reconcile |
| Pending proposal cue paths | Untouched |
| Rehearsal cue paths | Untouched |
| Derivation seam | Completed in 6s-a; preserved, not re-moved |
| Visual / layout behavior | Unchanged |

---

## Behavior Preserved

### Orchestration path

- Surface runs the **same chain** as before:
  `renderSongVoteCue` → `buildSongVoteCueView` → inline HTML fallback through `_legacyBuildHomeSongVoteCueView`.
- `_legacyRenderHomeSongVoteCueSurface` preserves **pre-6t-a orchestration** when surface returns no view.
- Derivation unchanged from **6s-a**.

### Side-effect tails (unchanged)

After view resolution, `renderHomeSongVoteCue()` still runs:

```
_applyHomeCueView (when !moduleApplied)
  → _recordHomeCueRenderDiag
  → _homeLayoutDiagSnapshot
  → syncAlertRailState
  → notifyCueChange
  → requestHomeReconcile('cue:song-vote')
```

- Existing **2×** `cue:song-vote` reconcile hooks remain intact.
- No cue text, visual placement, selectors, CSS, Firestore, listener, push, or data-shape behavior changed.
- Pending proposal and rehearsal cue behavior not changed.
- 6t-a did **not** re-run manual browser verification; visible Song Vote cue behavior is expected to match pre-6t-a because orchestration output is identical on the normal path.

---

## Integrity Gate Results (Phase 6t-a)

All **five** standard gates **PASS** at commit `861b900`:

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
| `home-controller-package.mjs` | **PASS** — Phase 6q-a + 6s-a + 6t-a checks |
| `home-layout-engine-package.mjs` | **PASS** — Phase 5 layout engine checks |
| `home-diag-package.mjs` | **PASS** — Phase 1/1b/1c + 6b diagnostics |
| `home-alert-rail-package.mjs` | **PASS** — Phase 3 alert rail |
| `home-gig-slot-package.mjs` | **PASS** — Phase 4 gig slot |

This Phase **6t-b** document introduces **no new runtime behavior**.

---

## Hard Boundaries (Still in Force)

| Boundary | Status |
|----------|--------|
| CSS | No changes in 6t-a / 6t-b |
| Cue text | No changes |
| Cue visuals / placement | No changes |
| Target selectors | No changes |
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

**Phase 6u-a** should be selected **only after repo verification** on this branch.

### Preferred direction (cautious)

**Song Vote target collection seam / target ownership parity** — mirror pending proposal Phase **6p-a** (`collectPendingProposalCueTargets`), **only if** inspection confirms the diff is narrow and behavior-preserving:

- Song Vote target is currently static `#home-song-vote-cue` resolved inline in `renderHomeSongVoteCue()`.
- A bounded seam would move target resolution behind a module helper with index.html wrapper + legacy fallback.
- Do **not** move HomeController notify/reconcile timing in the same slice unless the diff stays bounded.

### Alternative

Stop and create a **broader Phase 6 cue architecture checkpoint** if the next target seam is not cleanly bounded (e.g. touches shared apply tails, alert rail ordering, or multiple cue families).

### Explicit non-goals

- Do **not** start pending response reminder backend work from this modularization branch.
- Do **not** start flyer/r106 legacy work from this branch.
- Do **not** detour for deferred cleanup (e.g. Rehearsal on Deck pill placement) unless it becomes functional breakage or current-slice regression.

---

## Related Docs

- `PHASE_6S_B_SONG_VOTE_DERIVATION_CHECKPOINT.md` — 6s-a derivation checkpoint
- `PHASE_6R_A_HOME_CUE_OWNERSHIP_NEXT_SEAM_PLAN.md` — planning inventory
- `PHASE_6O_D_PENDING_PROPOSAL_MODULARIZATION_CHECKPOINT.md` — pending proposal derive/render pattern (6o-b/c reference)
- `PHASE_6P_B_PENDING_PROPOSAL_TARGET_COLLECTION_CHECKPOINT.md` — pending proposal target collection pattern (6p-a reference for 6u-a)
- `PHASE_6Q_B_PENDING_PROPOSAL_RECONCILE_NOTIFICATION_CHECKPOINT.md` — pending proposal reconcile notify pattern
