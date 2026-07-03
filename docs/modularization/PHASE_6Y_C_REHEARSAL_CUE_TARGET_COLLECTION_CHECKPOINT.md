# Phase 6y-c — Rehearsal Cue Target Collection Checkpoint

## Status

**Checkpoint / documentation only.** No runtime behavior changed by this document.

This records the Rehearsal cue **target collection seam** added in Phase **6y-b**, following the inspection from Phase **6y-a** and mirroring Song Vote Phase **6u-b**.

---

## Repo Baseline

| Item | Value |
|------|--------|
| Branch | `modularization-home-layout-engine-pilot` |
| Current HEAD (short) | `ec98cca` — *Add rehearsal cue target collection seam* |
| Working tree | Clean except untracked `PHASE_6W_A_REHEARSAL_CUE_PARITY_PLAN.md` and `oot-local-server.ps1` (**do not commit `oot-local-server.ps1`**) |

### Phase 6y-b commit recorded

| Commit | Summary |
|--------|---------|
| `ec98cca` | Add rehearsal cue target collection seam (Phase 6y-b) |

### Phase 6y-a inspection result (summary)

Phase **6y-a** compared Rehearsal target ownership to pending proposal (6p-a) and Song Vote (6u-b):

| Finding | Detail |
|---------|--------|
| Target count | **1** static alert-row slot (`#home-rehearsal-cue`) |
| Gap before 6y-b | Inline `getElementById` in `renderHomeRehearsalCue()`; no `collectRehearsalCueTargets` |
| Risk | **Very low** — bounded single-id seam; `CUE_IDS.rehearsal` already defined |
| Recommendation | Proceed with **6y-b** runtime; do not unify other module lookups in same slice |

### Upstream context (Rehearsal cue path)

| Phase | Deliverable |
|-------|-------------|
| **6l-e / 6l-i** | `buildRehearsalCueView`, `renderRehearsalCue` module wrapper |
| **6w-b / 6w-c** | `deriveRehearsalCueInput` + wrapper/checkpoint |
| **6x-b / 6x-c** | `renderRehearsalCueSurface` + wrapper/checkpoint |
| **6y-b** | `collectRehearsalCueTargets` + `_rehearsalCueTargets()` wrapper |

Pending proposal and Song Vote cue paths were **not modified** in 6y-b.

---

## Purpose

Phase **6y-b** moved Rehearsal cue **DOM target collection** behind `OOT.home.cueRenderer.collectRehearsalCueTargets({ document })`, mirroring Song Vote Phase **6u-b** at the same reduced scope (one target key).

Phase **6y-c** (this document) records that checkpoint without introducing new runtime behavior.

---

## Files Changed in Phase 6y-b

| File | Role |
|------|------|
| `oot_home_cue_renderer.js` | `collectRehearsalCueTargets({ document })` + API export |
| `index.html` | `_legacyRehearsalCueTargets()`, `_rehearsalCueTargets()`; `renderHomeRehearsalCue()` delegates target resolution |
| `tests/integrity/home-controller-package.mjs` | `assertPhase6yBRehearsalTargetCollection`; 6u-b collect-body boundary fix |
| `tests/integrity/home-layout-engine-package.mjs` | `isRehearsalCueTargetCollectionDiffLine` diff allowlist |

---

## Module Seam Added (Phase 6y-b)

### `OOT.home.cueRenderer.collectRehearsalCueTargets({ document })`

Collects the single Rehearsal alert-row DOM target. Read-only; no render, notify, or reconcile side effects.

#### Input contract

| Field | Type | Notes |
|-------|------|-------|
| `document` | `Document` | DOM document snapshot (typically global `document` from index.html) |

#### Return contract

```javascript
{
  rehearsalEl: Element | null
}
```

- Resolves via `document.getElementById(CUE_IDS.rehearsal)` where `CUE_IDS.rehearsal === 'home-rehearsal-cue'`.
- Missing or invalid `document` (no `getElementById`) → `{ rehearsalEl: null }` safely (no throw).

---

## index.html Wrapper / Fallback Ownership

| Function | Role |
|----------|------|
| `_legacyRehearsalCueTargets()` | `{ rehearsalEl: document.getElementById('home-rehearsal-cue') }` |
| `_rehearsalCueTargets()` | Delegates to `cueRenderer.collectRehearsalCueTargets({ document: document })`; falls back to `_legacyRehearsalCueTargets()` |

Mirrors Song Vote `_legacySongVoteCueTargets()` / `_songVoteCueTargets()` pattern.

---

## renderHomeRehearsalCue() Target Seam Usage (after 6y-b)

```javascript
function renderHomeRehearsalCue(){
  var _rTargets = _rehearsalCueTargets();
  var el = _rTargets.rehearsalEl;
  if(!el) return;
  var _rhInput = _deriveRehearsalCueInput();
  // … renderRehearsalCueSurface({ targetEl: el, cueInput: _rhInput, … })
  // … _legacyRenderHomeRehearsalCueSurface(el, _rhInput) when needed
  // … post-render tails (diag, apply, image refresh, alert rail, notify, reconcile)
}
```

| Step | Owner |
|------|--------|
| Target collection | `_rehearsalCueTargets()` → module / legacy |
| Early exit | `if(!el) return` — **no tails** when target missing |
| Orchestration input | Same `el` as `targetEl` on `renderRehearsalCueSurface` |
| Legacy orchestration | Same `el` passed to `_legacyRenderHomeRehearsalCueSurface(el, _rhInput)` |

`renderRehearsalCueSurface` input shape unchanged (`targetEl: el`, not a multi-target object).

---

## Current Rehearsal Cue Architecture (after 6y-b)

```
renderHomeRehearsalCue()                         [index.html — public wrapper / call site]
  ├─ _rTargets = _rehearsalCueTargets()         [index.html wrapper — 6y-b]
  │    └─ collectRehearsalCueTargets({ document })  [module]
  │         fallback: _legacyRehearsalCueTargets()
  ├─ el = _rTargets.rehearsalEl; if(!el) return
  ├─ _rhInput = _deriveRehearsalCueInput()     [index.html wrapper — 6w-b]
  │    └─ deriveRehearsalCueInput(input)       [module]
  ├─ renderRehearsalCueSurface({ targetEl: el, … })  [module — 6x-b]
  │    fallback: _legacyRenderHomeRehearsalCueSurface(el, _rhInput)
  ├─ _applyHomeCueView(el, _rhView)            [when !moduleApplied]
  ├─ image refresh block (observer + notifyImageRefresh)
  ├─ _homeLayoutDiagSnapshot(diagTag, …)
  ├─ syncAlertRailState('renderHomeRehearsalCue')
  ├─ notifyCueChange('renderHomeRehearsalCue')
  └─ requestHomeReconcile('cue:rehearsal')     [Home-active gated, 2× hooks]
```

| Layer | Owner |
|-------|--------|
| Target collection | `OOT.home.cueRenderer.collectRehearsalCueTargets` |
| Derivation | `OOT.home.cueRenderer.deriveRehearsalCueInput` |
| Input packaging | `_buildHomeRehearsalCueInput` (index.html) |
| Render orchestration | `OOT.home.cueRenderer.renderRehearsalCueSurface` |
| View build / apply | `buildRehearsalCueView` / `applyCueView` / `renderRehearsalCue` (module) |
| Inline HTML fallback | `_legacyBuildHomeRehearsalCueView` (index.html) |
| Full orchestration fallback | `_legacyRenderHomeRehearsalCueSurface` (index.html) |
| Post-render side effects | index.html tails (including image refresh) |
| Notify / reconcile timing | Generic `notifyCueChange` + inline reconcile (index.html) — **no HomeController parity yet** |

---

## Preserved Derivation / Orchestration Behavior

| Seam | Status |
|------|--------|
| `_deriveRehearsalCueInput()` | Unchanged (6w-b) |
| `renderRehearsalCueSurface({ targetEl: el, … })` | Unchanged (6x-b) |
| `_legacyRenderHomeRehearsalCueSurface(el, _rhInput)` | Unchanged |
| `_legacyBuildHomeRehearsalCueView` | Unchanged |
| `imageRefreshReason` / `diagTag` on view objects | Unchanged |

6y-b moved **only** the initial DOM lookup behind the target collection seam. Derivation and orchestration chains were not restructured.

---

## Post-Render Tails Preserved (unchanged by 6y-b)

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

## Untouched Other `#home-rehearsal-cue` Consumers

6y-b **did not** funnel these independent lookups through `_rehearsalCueTargets()`:

| Module / function | Usage |
|-------------------|--------|
| `oot_home_alert_rail.js` | `document.getElementById(CUE_IDS.rehearsal)` for alert-rail state |
| `oot_home_diag.js` | `getElementById('home-rehearsal-cue')` for layout diagnostics |
| `oot_home_band_image.js` | `getElementById('home-rehearsal-cue')` for presentation / mutation refresh |
| `_homeRehearsalCueVisible()` (index.html) | Visibility probe for image presentation mode |

Unifying these remains **out of scope** unless a future plan explicitly expands scope.

---

## Behavior Preserved

| Contract | Expected |
|----------|----------|
| Selector id | `#home-rehearsal-cue` unchanged |
| Missing target | Early return — no derivation, orchestration, or tails |
| Same element | Identical `el` passed to `renderRehearsalCueSurface` and legacy fallback |
| Derivation (6w-b) | Unchanged |
| Render orchestration (6x-b) | Unchanged |
| Image refresh / diag tails | Unchanged |
| **2×** `cue:rehearsal` reconcile hooks | Unchanged |
| Cue text / placement / CSS | Unchanged |
| Pending proposal paths | Untouched |
| Song Vote paths | Untouched |

6y-b did **not** re-run manual browser verification; visible Rehearsal cue behavior is expected to match pre-6y-b because target resolution returns the same element on the normal path.

---

## Integrity Gate Results (Phase 6y-b)

All **five** standard gates **PASS** at commit `ec98cca`:

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
| `home-controller-package.mjs` | **PASS** — Phase 6q-a + 6s-a + 6t-a + 6u-b + 6v-b + 6w-b + 6x-b + 6y-b checks |
| `home-layout-engine-package.mjs` | **PASS** — Phase 5 layout engine checks |
| `home-diag-package.mjs` | **PASS** — Phase 1/1b/1c + 6b diagnostics |
| `home-alert-rail-package.mjs` | **PASS** — Phase 3 alert rail |
| `home-gig-slot-package.mjs` | **PASS** — Phase 4 gig slot |

This Phase **6y-c** document introduces **no new runtime behavior**.

---

## Hard Boundaries (Still in Force)

| Boundary | Status |
|----------|--------|
| CSS | No changes in 6y-b / 6y-c |
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

**Phase 6z-a — HomeController Rehearsal cue notify/reconcile parity inspection**

Rationale (from 6w-a / 6x-c ladder):

1. Derivation (6w-b), orchestration (6x-b), and target collection (6y-b) are complete for Rehearsal.
2. Song Vote completed HomeController parity in **6v-b** (`notifySongVoteCueChange` / `requestSongVoteCueReconcile` + index wrappers).
3. Rehearsal still uses generic inline `notifyCueChange('renderHomeRehearsalCue')` and **2×** inline `requestHomeReconcile('cue:rehearsal')` hooks (6g).
4. **6z-a should inspect only** — classify risk and bounded diff before any **6z-b** runtime work.

### Explicit non-goals

- Do **not** unify alert_rail/diag/band_image `#home-rehearsal-cue` lookups in the controller parity slice.
- Do **not** move image refresh scheduling in the same slice as notify/reconcile unless inspection proves unavoidable.
- Do **not** start pending response reminder backend work from this branch.

---

## Related Docs

- `PHASE_6W_A_REHEARSAL_CUE_PARITY_PLAN.md` — 6w-a planning / inspection
- `PHASE_6W_C_REHEARSAL_CUE_DERIVATION_CHECKPOINT.md` — 6w-b derivation checkpoint
- `PHASE_6X_C_REHEARSAL_CUE_RENDER_ORCHESTRATION_CHECKPOINT.md` — 6x-b orchestration checkpoint
- `PHASE_6U_C_SONG_VOTE_TARGET_COLLECTION_CHECKPOINT.md` — target collection pattern reference
- `PHASE_6V_C_SONG_VOTE_HOMECONTROLLER_NOTIFY_RECONCILE_CHECKPOINT.md` — controller parity pattern reference
