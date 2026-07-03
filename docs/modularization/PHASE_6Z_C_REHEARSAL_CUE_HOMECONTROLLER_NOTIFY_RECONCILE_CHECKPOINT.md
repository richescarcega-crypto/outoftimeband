# Phase 6z-c — Rehearsal Cue HomeController Notify/Reconcile Checkpoint

## Status

**Checkpoint / documentation only.** No runtime behavior changed by this document.

This records the Rehearsal cue **HomeController notify/reconcile parity seam** added in Phase **6z-b**, following the inspection from Phase **6z-a** and mirroring Song Vote Phase **6v-b** / pending proposal Phase **6q-a**.

---

## Repo Baseline

| Item | Value |
|------|--------|
| Branch | `modularization-home-layout-engine-pilot` |
| Current HEAD (short) | `0d39e9f` — *Add rehearsal cue controller reconcile seam* |
| Working tree | Clean except untracked `PHASE_6W_A_REHEARSAL_CUE_PARITY_PLAN.md` and `oot-local-server.ps1` (**do not commit `oot-local-server.ps1`**) |

### Phase 6z-b commit recorded

| Commit | Summary |
|--------|---------|
| `0d39e9f` | Add rehearsal cue controller reconcile seam (Phase 6z-b) |

### Phase 6z-a inspection result (summary)

Phase **6z-a** compared Rehearsal notify/reconcile timing to pending proposal (6q-a) and Song Vote (6v-b):

| Finding | Detail |
|---------|--------|
| Gap before 6z-b | Inline `notifyCueChange('renderHomeRehearsalCue')` + Home-active gated `requestHomeReconcile('cue:rehearsal')` on **both** hidden and visible branches |
| Reference pattern | Dedicated controller methods + index wrappers with legacy fallbacks |
| Risk | **Low–medium** — proven 6v-b template; must preserve rehearsal image-refresh tails before notify/reconcile |
| Recommendation | Proceed with **6z-b** runtime parity |

### Upstream context (Rehearsal cue path — now complete through 6z-b)

| Phase | Deliverable |
|-------|-------------|
| **6l-e / 6l-i** | `buildRehearsalCueView`, `renderRehearsalCue` module wrapper |
| **6w-b / 6w-c** | `deriveRehearsalCueInput` + wrapper/checkpoint |
| **6x-b / 6x-c** | `renderRehearsalCueSurface` + wrapper/checkpoint |
| **6y-b / 6y-c** | `collectRehearsalCueTargets` + target collection wrapper/checkpoint |
| **6z-b** | HomeController notify/reconcile seam + `renderHomeRehearsalCue()` tail wrappers |

Pending proposal and Song Vote cue paths were **not modified** in 6z-b.

---

## Purpose

Phase **6z-b** moved Rehearsal cue **notify/reconcile timing ownership** toward HomeController, mirroring pending proposal Phase **6q-a** and Song Vote Phase **6v-b**, without changing cue DOM output, text, selectors, Firestore paths, listeners, or push behavior.

Phase **6z-c** (this document) records that checkpoint without introducing new runtime behavior.

**Rehearsal cue modularization ladder on this branch is now complete** (derive → orchestrate → targets → controller notify/reconcile).

---

## Files Changed in Phase 6z-b

| File | Role |
|------|------|
| `oot_home_controller.js` | `notifyRehearsalCueChange`, `requestRehearsalCueReconcile` + API export |
| `index.html` | Notify/reconcile wrapper helpers + tail hook replacement in `renderHomeRehearsalCue()` |
| `tests/integrity/home-controller-package.mjs` | `assertPhase6zBRehearsalControllerNotifyReconcile`; updated reconcile-count checks for wrapper pattern |
| `tests/integrity/home-layout-engine-package.mjs` | `isRehearsalCueControllerNotifyReconcileDiffLine` diff allowlist |

**Not changed in 6z-b:** `oot_home_cue_renderer.js`, `oot_compat_home.js`, `oot_home_alert_rail.js`, `oot_home_band_image.js`, `oot_home_diag.js`, pending proposal wrappers, Song Vote wrappers.

---

## HomeController Seam Added (Phase 6z-b)

### `notifyRehearsalCueChange(reason, options)`

- Record-only event via `_record('notifyRehearsalCueChange', …)`.
- Default reason: `'renderHomeRehearsalCue'`.
- Does not write DOM, Firestore, CSS, or push notifications.

### `requestRehearsalCueReconcile(options)`

- Records notify via `notifyRehearsalCueChange('renderHomeRehearsalCue', payload)`.
- Delegates to `requestReconcile('cue:rehearsal', payload)`.
- Uses the **same coalescer path** as other non-`rHome` cue reconcile requests.
- Does **not** Home-gate internally; gating lives in the index.html reconcile wrapper (same as pending proposal and Song Vote).

Both methods are exported on `OOT.home.controller`.

---

## index.html Wrapper / Fallback Ownership

| Function | Behavior |
|----------|----------|
| `_legacyNotifyRehearsalCueChange(reason)` | Fallback to `notifyCueChange('renderHomeRehearsalCue')` |
| `_legacyRequestRehearsalCueReconcileIfHomeActive(source)` | Home-active gated `requestHomeReconcile('cue:rehearsal')` |
| `_notifyRehearsalCueChange(reason)` | Prefers `HomeController.notifyRehearsalCueChange`; falls back to legacy |
| `_requestRehearsalCueReconcileIfHomeActive(source)` | Home-active check → `HomeController.requestRehearsalCueReconcile`; falls back to legacy |

Wrappers live after `_legacyRenderHomeRehearsalCueSurface` (before Song Vote target/notify helpers). Legacy fallbacks preserve behavior when HomeController methods are unavailable.

---

## renderHomeRehearsalCue() Tail-Call Integration (after 6z-b)

```javascript
function renderHomeRehearsalCue(){
  var _rTargets = _rehearsalCueTargets();
  var el = _rTargets.rehearsalEl;
  if(!el) return;   // early exit — NO post-render tails
  // … _deriveRehearsalCueInput()
  // … renderRehearsalCueSurface({ targetEl: el, … })
  // … _legacyRenderHomeRehearsalCueSurface(el, _rhInput) when needed
  // hidden branch OR visible branch tails (identical hook sequence):
  //   _recordHomeCueRenderDiag → _applyHomeCueView (when !moduleApplied)
  //   _ensureHomePresentationObserver → _scheduleHomeImagePresentationRefresh
  //   notifyImageRefresh(imageRefreshReason)
  //   _homeLayoutDiagSnapshot(diagTag, …)
  //   syncAlertRailState('renderHomeRehearsalCue')
  //   _notifyRehearsalCueChange('renderHomeRehearsalCue')
  //   _requestRehearsalCueReconcileIfHomeActive('renderHomeRehearsalCue')
}
```

| Property | Value |
|----------|--------|
| Notify calls | **2×** `_notifyRehearsalCueChange('renderHomeRehearsalCue')` (hidden + visible) |
| Reconcile calls | **2×** `_requestRehearsalCueReconcileIfHomeActive('renderHomeRehearsalCue')` (hidden + visible) |
| Legacy inline reconcile | **1×** `requestHomeReconcile('cue:rehearsal')` in `_legacyRequestRehearsalCueReconcileIfHomeActive` only |
| Home-active gate | Preserved in reconcile wrapper (not in controller method) |

---

## Preserved Tail Order

Both hidden and visible branches retain identical sequence:

```
_recordHomeCueRenderDiag('rehearsal', …)
_applyHomeCueView(el, _rhView)                    [when !moduleApplied]
_ensureHomePresentationObserver()
_scheduleHomeImagePresentationRefresh(imageRefreshReason)
notifyImageRefresh(imageRefreshReason)
_homeLayoutDiagSnapshot(diagTag, …)
syncAlertRailState('renderHomeRehearsalCue')
_notifyRehearsalCueChange('renderHomeRehearsalCue')
_requestRehearsalCueReconcileIfHomeActive('renderHomeRehearsalCue')
```

Rehearsal-specific image refresh scheduling remains in `renderHomeRehearsalCue()` (not moved to HomeController in 6z-b).

---

## Preserved Derivation / Orchestration / Target Collection

6z-b changed **only** notify/reconcile tail hooks in `renderHomeRehearsalCue()`. Prior seams unchanged:

| Seam | Owner | Phase |
|------|-------|-------|
| Derivation | `deriveRehearsalCueInput` / `_deriveRehearsalCueInput()` | 6w-b |
| Render orchestration | `renderRehearsalCueSurface` / legacy fallbacks | 6x-b |
| Target collection | `collectRehearsalCueTargets` / `_rehearsalCueTargets()` | 6y-b |
| `imageRefreshReason` / `diagTag` | Preserved on all view paths | 6x-b |

---

## Current Rehearsal Cue Architecture (after 6z-b)

```
renderHomeRehearsalCue()                         [index.html — public wrapper / call site]
  ├─ _rTargets = _rehearsalCueTargets()         [6y-b]
  ├─ _rhInput = _deriveRehearsalCueInput()       [6w-b]
  ├─ renderRehearsalCueSurface({ targetEl: el, … })  [6x-b]
  ├─ image refresh + layout diag tails           [index.html — rehearsal-only]
  ├─ syncAlertRailState('renderHomeRehearsalCue')
  ├─ _notifyRehearsalCueChange('renderHomeRehearsalCue')     [6z-b]
  └─ _requestRehearsalCueReconcileIfHomeActive('renderHomeRehearsalCue')  [6z-b]
       └─ HomeController.requestRehearsalCueReconcile → requestReconcile('cue:rehearsal')
```

### Alert-row cue parity (after 6z-b)

| Cue | Derive | Orchestrate | Targets | Controller notify/reconcile |
|-----|--------|-------------|---------|----------------------------|
| Pending proposal | Module (6o-b) | Module (6o-c) | Module (6p-a) | **Dedicated (6q-a)** |
| Song Vote | Module (6s-a) | Module (6t-a) | Module (6u-b) | **Dedicated (6v-b)** |
| Rehearsal | Module (6w-b) | Module (6x-b) | Module (6y-b) | **Dedicated (6z-b)** |

---

## Behavior Preserved

| Contract | Expected |
|----------|----------|
| Notify timing | After `syncAlertRailState`, before reconcile — both branches |
| Reconcile timing | Home-active gated via wrapper; **2×** per render on normal paths |
| Reason strings | `'renderHomeRehearsalCue'` notify; `'cue:rehearsal'` reconcile |
| Legacy fallback | Single inline `requestHomeReconcile('cue:rehearsal')` when controller unavailable |
| Cue text / placement / CSS | Unchanged |
| Pending proposal / Song Vote | Untouched |

6z-b did **not** re-run manual browser verification; visible Rehearsal cue behavior is expected to match pre-6z-b because notify/reconcile are record/coalesce-only side effects with identical timing and gating.

---

## Integrity Gate Results (Phase 6z-b)

All **five** standard gates **PASS** at commit `0d39e9f`:

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
| `home-controller-package.mjs` | **PASS** — Phase 6q-a + 6s-a + 6t-a + 6u-b + 6v-b + 6w-b + 6x-b + 6y-b + 6z-b checks |
| `home-layout-engine-package.mjs` | **PASS** — Phase 5 layout engine checks |
| `home-diag-package.mjs` | **PASS** — Phase 1/1b/1c + 6b diagnostics |
| `home-alert-rail-package.mjs` | **PASS** — Phase 3 alert rail |
| `home-gig-slot-package.mjs` | **PASS** — Phase 4 gig slot |

This Phase **6z-c** document introduces **no new runtime behavior**.

---

## Hard Boundaries (Still in Force)

| Boundary | Status |
|----------|--------|
| CSS | No changes in 6z-b / 6z-c |
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

**Phase 7a — Home alert-row cue architecture checkpoint (docs-only)**

Rationale:

1. All three alert-row cue families (pending proposal, Song Vote, Rehearsal) now share the same modularization ladder on this branch.
2. Remaining asymmetries are **documentable**, not blocking further bounded runtime seams:
   - Rehearsal-only image refresh / presentation observer tails still inline in `renderHomeRehearsalCue()`
   - `oot_home_alert_rail.js`, `oot_home_diag.js`, `oot_home_band_image.js` still resolve cue targets independently
   - Untracked `PHASE_6W_A_REHEARSAL_CUE_PARITY_PLAN.md` may be committed or superseded by this checkpoint series
3. No further Rehearsal cue runtime slices are **required** unless regressions appear or merge review identifies gaps.

### Explicit non-goals

- Do **not** start pending response reminder backend work from this branch.
- Do **not** start flyer/r106 legacy work from this branch.
- Do **not** unify cross-module `#home-*-cue` lookups in a single slice without a dedicated plan.
- Do **not** move rehearsal image refresh tails to HomeController without a separate bounded slice and explicit approval.

---

## Related Docs

- `PHASE_6W_A_REHEARSAL_CUE_PARITY_PLAN.md` — 6w-a planning / inspection (untracked)
- `PHASE_6W_C_REHEARSAL_CUE_DERIVATION_CHECKPOINT.md` — 6w-b derivation checkpoint
- `PHASE_6X_C_REHEARSAL_CUE_RENDER_ORCHESTRATION_CHECKPOINT.md` — 6x-b orchestration checkpoint
- `PHASE_6Y_C_REHEARSAL_CUE_TARGET_COLLECTION_CHECKPOINT.md` — 6y-b target collection checkpoint
- `PHASE_6V_C_SONG_VOTE_HOMECONTROLLER_NOTIFY_RECONCILE_CHECKPOINT.md` — controller parity pattern reference
- `PHASE_6Q_B_PENDING_PROPOSAL_RECONCILE_NOTIFICATION_CHECKPOINT.md` — pending proposal controller parity reference
