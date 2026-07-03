# Phase 6x-c — Rehearsal Cue Render Orchestration Checkpoint

## Status

**Checkpoint / documentation only.** No runtime behavior changed by this document.

This records the Rehearsal cue **render orchestration seam** added in Phase **6x-b**, on top of the verified Rehearsal derivation path (Phases **6w-b** / **6w-c**).

---

## Repo Baseline

| Item | Value |
|------|--------|
| Branch | `modularization-home-layout-engine-pilot` |
| Current HEAD (short) | `bf41e92` — *Add rehearsal cue render orchestration seam* |
| Working tree | Clean except untracked `PHASE_6W_A_REHEARSAL_CUE_PARITY_PLAN.md` and `oot-local-server.ps1` (**do not commit `oot-local-server.ps1`**) |

### Phase 6x-b commit recorded

| Commit | Summary |
|--------|---------|
| `bf41e92` | Add rehearsal cue render orchestration seam (Phase 6x-b) |

### Upstream context (Rehearsal cue path)

| Phase | Deliverable |
|-------|-------------|
| **6l-e / 6l-i** | `buildRehearsalCueView`, `renderRehearsalCue` module wrapper |
| **6l-g** | `_buildHomeRehearsalCueInput` input packaging |
| **6g** | Home-active gated `requestHomeReconcile('cue:rehearsal')` hooks (2×) + image refresh tails |
| **6w-a** | Rehearsal parity plan (untracked planning doc) |
| **6w-b / 6w-c** | `deriveRehearsalCueInput` + `_deriveRehearsalCueInput()` wrapper/checkpoint |
| **6x-b** | `renderRehearsalCueSurface` + orchestration delegation in `renderHomeRehearsalCue()` |

Pending proposal and Song Vote cue paths were **not modified** in 6x-b.

---

## Purpose

Phase **6x-b** moved Rehearsal cue **render orchestration** (post-derivation view resolution) into `OOT.home.cueRenderer`, mirroring the Song Vote orchestration pattern from Phase **6t-a** (`renderSongVoteCueSurface`).

Phase **6x-c** (this document) records that checkpoint without introducing new runtime behavior.

---

## Files Changed in Phase 6x-b

| File | Role |
|------|------|
| `oot_home_cue_renderer.js` | `renderRehearsalCueSurface(input)` orchestration helper + API export |
| `index.html` | Orchestration delegation in `renderHomeRehearsalCue()`; `_legacyRenderHomeRehearsalCueSurface()` / `_legacyBuildHomeRehearsalCueView()` fallbacks |
| `tests/integrity/home-controller-package.mjs` | `assertPhase6xBRehearsalRenderOrchestration` |
| `tests/integrity/home-layout-engine-package.mjs` | `isRehearsalCueOrchestrationDiffLine` diff allowlist |

---

## Module Seam Added (Phase 6x-b)

### `OOT.home.cueRenderer.renderRehearsalCueSurface(input)`

Orchestrates **post-derivation render** only. Does not perform diag, alert rail, image refresh scheduling, notify, or reconcile side effects.

#### Orchestration chain

| Step | Default | Role |
|------|---------|------|
| 1 | `renderCue` → `renderRehearsalCue` | Build view + apply DOM; sets `moduleApplied: true` when `rendered` |
| 2 | `buildView` → `buildRehearsalCueView` | View descriptor when render cue does not succeed |
| 3 | `legacyBuildView` → `_legacyBuildHomeRehearsalCueView` (index.html callback) | Inline HTML view builder fallback |

#### Input contract (typical)

| Field | Type | Notes |
|-------|------|-------|
| `targetEl` | `Element` | `#home-rehearsal-cue` DOM target |
| `cueInput` | `Object` | Output of `_deriveRehearsalCueInput` |
| `renderCue` | `function` | Optional override; defaults to `renderRehearsalCue` |
| `buildView` | `function` | Optional override; defaults to `buildRehearsalCueView` |
| `legacyBuildView` | `function` | Inline HTML fallback callback from index.html |

#### Return contract

```javascript
{
  moduleApplied: boolean,  // true when renderCue applied DOM successfully
  view: {
    visible: boolean,
    sourceBranch: string,
    imageRefreshReason: string,
    diagTag: string,
    html: string           // empty when moduleApplied via renderCue
  }
}
```

When all paths fail, returns hidden view with `sourceBranch: 'hidden-no-rehearsal'`, matching legacy hidden-no-rehearsal refresh/diag strings.

---

## index.html Wrapper / Fallback Ownership

| Function | Behavior |
|----------|----------|
| `_deriveRehearsalCueInput()` | Public derivation wrapper → module + legacy fallback (6w-b; unchanged) |
| `_legacyDeriveRehearsalCueInput()` | Legacy branch orchestration (unchanged) |
| `_buildHomeRehearsalCueInput()` | Input packaging (unchanged) |
| `renderHomeRehearsalCue()` | Public render owner — derive → orchestrate → tails |
| `_legacyRenderHomeRehearsalCueSurface()` | Full legacy orchestration when surface returns no view |
| `_legacyBuildHomeRehearsalCueView()` | Inline HTML view builder fallback (3 branches) |

---

## Current Rehearsal Cue Architecture (after 6x-b)

```
renderHomeRehearsalCue()                         [index.html — public wrapper / call site]
  ├─ el = document.getElementById('home-rehearsal-cue'); if(!el) return
  ├─ _rhInput = _deriveRehearsalCueInput()     [index.html wrapper — 6w-b]
  │    └─ deriveRehearsalCueInput(input)       [module]
  ├─ renderRehearsalCueSurface({               [module — 6x-b]
  │      targetEl: el,
  │      cueInput: _rhInput,
  │      renderCue / buildView / legacyBuildView
  │    })
  │    chain: renderRehearsalCue → buildRehearsalCueView → legacyBuildView
  │    fallback when no view: _legacyRenderHomeRehearsalCueSurface(el, _rhInput)
  ├─ _applyHomeCueView(el, _rhView)            [when !moduleApplied]
  ├─ image refresh block (observer + notifyImageRefresh)
  ├─ _homeLayoutDiagSnapshot(diagTag, …)
  ├─ syncAlertRailState('renderHomeRehearsalCue')
  ├─ notifyCueChange('renderHomeRehearsalCue')
  └─ requestHomeReconcile('cue:rehearsal')     [Home-active gated, 2× hooks]
```

| Layer | Owner |
|-------|--------|
| Derivation | `OOT.home.cueRenderer.deriveRehearsalCueInput` |
| Input packaging | `_buildHomeRehearsalCueInput` (index.html) |
| Render orchestration | `OOT.home.cueRenderer.renderRehearsalCueSurface` |
| View build / apply | `buildRehearsalCueView` / `applyCueView` / `renderRehearsalCue` (module) |
| Inline HTML fallback | `_legacyBuildHomeRehearsalCueView` (index.html) |
| Full orchestration fallback | `_legacyRenderHomeRehearsalCueSurface` (index.html) |
| Target collection | Inline `getElementById('home-rehearsal-cue')` — **no seam yet** |
| Post-render side effects | index.html tails (diag, apply, image refresh, alert rail, notify, reconcile) |
| Public entry + fallbacks | `index.html` |

---

## Preserved Render Chain

Surface runs the **same chain** as pre-6x-b inline orchestration:

1. `renderRehearsalCue(el, cueInput)` — module wrapper (build + apply)
2. `buildRehearsalCueView(cueInput)` — module view builder
3. `_legacyBuildHomeRehearsalCueView(cueInput)` — inline HTML fallback (hidden-no-events, hidden-no-rehearsal, visible rehearsal pill)

`_legacyRenderHomeRehearsalCueSurface` preserves **pre-6x-b orchestration** when surface returns no view.

Derivation unchanged from **6w-b**.

---

## Preserved imageRefreshReason and diagTag

| Branch | `imageRefreshReason` | `diagTag` |
|--------|----------------------|-----------|
| hidden-no-events | `rehearsal-cue hidden no events` | `renderHomeRehearsalCue:hidden-no-events` |
| hidden-no-rehearsal | `rehearsal-cue hidden no next rehearsal` | `renderHomeRehearsalCue:hidden-no-rehearsal` |
| visible | `rehearsal-cue visible` | `renderHomeRehearsalCue:visible` |

`renderRehearsalCueSurface` preserves these fields on the render path via `viewFromRenderOut` and passes through `buildView` / `legacyBuildView` outputs unchanged.

---

## Post-Render Tails Preserved (unchanged by 6x-b)

Both hidden and visible branches retain identical sequence:

```
_recordHomeCueRenderDiag('rehearsal', …)
_applyHomeCueView(el, _rhView)                    [when !moduleApplied]
_ensureHomePresentationObserver()
_scheduleHomeImagePresentationRefresh(imageRefreshReason)
notifyImageRefresh(imageRefreshReason)
_homeLayoutDiagSnapshot(diagTag, …)
syncAlertRailState('renderHomeRehearsalCue')
notifyCueChange('renderHomeRehearsalCue')
requestHomeReconcile('cue:rehearsal')             [Home-active gated, 2× inline]
```

---

## What Was Intentionally Not Moved in Phase 6x-b

| Concern | Status |
|---------|--------|
| Target collection / `#home-rehearsal-cue` static target | Still resolved inline in `renderHomeRehearsalCue()` |
| HomeController notify/reconcile timing | Still generic `notifyCueChange` + inline reconcile |
| Derivation seam | Completed in 6w-b; preserved, not re-moved |
| Image refresh scheduling | Still inline in render tails |
| Pending proposal cue paths | Untouched |
| Song Vote cue paths | Untouched |
| Visual / layout behavior | Unchanged |

---

## Behavior Preserved

| Contract | Expected |
|----------|----------|
| Orchestration chain | `renderRehearsalCue` → `buildRehearsalCueView` → inline HTML fallback |
| `imageRefreshReason` / `diagTag` | Preserved on all view paths |
| `sourceBranch` strings | Unchanged from 6w-b |
| Cue text / kicker / placement | Unchanged |
| Selector `#home-rehearsal-cue` | Unchanged |
| **2×** `cue:rehearsal` reconcile hooks | Unchanged |
| Pending proposal / Song Vote | Untouched |

6x-b did **not** re-run manual browser verification; visible Rehearsal cue behavior is expected to match pre-6x-b because orchestration output is identical on the normal and legacy fallback paths.

---

## Integrity Gate Results (Phase 6x-b)

All **five** standard gates **PASS** at commit `bf41e92`:

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
| `home-controller-package.mjs` | **PASS** — Phase 6q-a + 6s-a + 6t-a + 6u-b + 6v-b + 6w-b + 6x-b checks |
| `home-layout-engine-package.mjs` | **PASS** — Phase 5 layout engine checks |
| `home-diag-package.mjs` | **PASS** — Phase 1/1b/1c + 6b diagnostics |
| `home-alert-rail-package.mjs` | **PASS** — Phase 3 alert rail |
| `home-gig-slot-package.mjs` | **PASS** — Phase 4 gig slot |

This Phase **6x-c** document introduces **no new runtime behavior**.

---

## Hard Boundaries (Still in Force)

| Boundary | Status |
|----------|--------|
| CSS | No changes in 6x-b / 6x-c |
| Cue text | No changes |
| Cue visuals / placement | No changes |
| Target selector id | No changes |
| Firestore read/write logic | No changes |
| Listeners | No changes |
| Push notification behavior | No changes |
| Pending proposal cue behavior | No changes |
| Song Vote cue behavior | No changes |
| Broad refactor | Not permitted |
| Merge to `main` | Not approved |

---

## Recommended Next Slice

**Phase 6y-a / 6y-b — Rehearsal target collection seam** (`collectRehearsalCueTargets`), mirroring Song Vote Phase **6u-b** / pending proposal Phase **6p-a**.

Rationale (from 6w-a ladder):

1. Derivation (6w-b) and render orchestration (6x-b) complete — next proven step is bounded target resolution behind a module helper with index.html wrapper + legacy fallback.
2. Target-only slice is independently safe and does not require moving post-render tails or HomeController timing in the same phase.
3. **After targets:** Phase **6z** — Rehearsal HomeController notify/reconcile parity (mirror 6v-b).

### Explicit non-goals

- Do **not** start pending response reminder backend work from this branch.
- Do **not** start flyer/r106 legacy work from this branch.
- Do **not** move image refresh / diag / alert-rail tails in the target-collection slice unless inspection proves unavoidable.

---

## Related Docs

- `PHASE_6W_A_REHEARSAL_CUE_PARITY_PLAN.md` — 6w-a planning / inspection
- `PHASE_6W_C_REHEARSAL_CUE_DERIVATION_CHECKPOINT.md` — 6w-b derivation checkpoint
- `PHASE_6T_B_SONG_VOTE_RENDER_ORCHESTRATION_CHECKPOINT.md` — orchestration pattern reference
- `PHASE_6U_C_SONG_VOTE_TARGET_COLLECTION_CHECKPOINT.md` — target collection pattern reference
- `PHASE_6V_C_SONG_VOTE_HOMECONTROLLER_NOTIFY_RECONCILE_CHECKPOINT.md` — controller parity pattern reference
