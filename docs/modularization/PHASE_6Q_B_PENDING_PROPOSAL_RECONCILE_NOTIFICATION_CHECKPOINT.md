# Phase 6q-b — Pending Proposal Reconcile Notification Checkpoint

## Status

**Checkpoint / documentation only.** No runtime behavior changed by this document.

This records the HomeController **pending proposal cue reconcile notification/timing seam** added in Phase **6q-a**, on top of the verified pending proposal modularization path (Phases **6o-a** through **6p-b**).

---

## Repo Baseline

| Item | Value |
|------|--------|
| Branch | `modularization-home-layout-engine-pilot` |
| Current HEAD (short) | `9e5bdd6` — *Add pending proposal cue reconcile notification seam* |
| Current HEAD (full) | `9e5bdd637aa1b3b01a8cc26419bca19f521178ff` |
| Working tree | Clean except untracked `oot-local-server.ps1` (**do not commit**) |

### Phase 6q-a commit recorded

| Commit | Summary |
|--------|---------|
| `9e5bdd6` | Add pending proposal cue reconcile notification seam (Phase 6q-a) |

### Upstream context (already complete)

| Phase | Deliverable |
|-------|-------------|
| **6m-b / 6m-c / 6m-d** | View builder, multi-target apply, `renderPendingProposalCue()` module routing |
| **6o-a** | Manual verification PASS — acceptance contract |
| **6o-b** | `derivePendingProposalIds` + `_pendingProposalIdsForMe()` wrapper |
| **6o-c** | `renderPendingProposalCueSurface` + orchestration wrapper |
| **6o-d** | Pending proposal modularization checkpoint |
| **6p-a / 6p-b** | `collectPendingProposalCueTargets` + target collection wrapper/checkpoint |
| **6q-a** | HomeController notify/reconcile seam + `renderPendingProposalCue()` tail hooks |

---

## Purpose

Phase **6q-a** moved **timing/reconcile notification ownership** for pending proposal cue updates toward HomeController, mirroring the song-vote and rehearsal cue reconcile patterns, without changing cue DOM output, text, selectors, or Firestore paths.

Phase **6q-b** (this document) records that checkpoint without introducing new runtime behavior.

---

## Files Changed in Phase 6q-a

| File | Role |
|------|------|
| `oot_home_controller.js` | `notifyPendingProposalCueChange`, `requestPendingProposalCueReconcile` |
| `index.html` | Notify/reconcile wrapper helpers + tail hooks on `renderPendingProposalCue()` |
| `tests/integrity/home-controller-package.mjs` | `assertPhase6qAPendingProposalReconcileNotify` |
| `tests/integrity/home-layout-engine-package.mjs` | Diff allowlist for notify/reconcile delegation lines |

---

## HomeController Seam Added (Phase 6q-a)

### `notifyPendingProposalCueChange(reason, options)`

- Record-only event via `_record('notifyPendingProposalCueChange', …)`.
- Default reason: `'renderPendingProposalCue'`.
- Does not write DOM, Firestore, CSS, or push notifications.

### `requestPendingProposalCueReconcile(options)`

- Records notify via `notifyPendingProposalCueChange('renderPendingProposalCue', payload)`.
- Delegates to `requestReconcile('cue:pending-proposal', payload)`.
- Uses the **same coalescer path** as `cue:song-vote` and `cue:rehearsal` reconcile requests (non-`rHome` delegate on flush).

Both methods are exported on `OOT.home.controller`.

---

## index.html Wrapper / Fallback Additions

| Function | Behavior |
|----------|----------|
| `_legacyNotifyPendingProposalCueChange()` | Fallback to `notifyCueChange('renderPendingProposalCue')` |
| `_legacyRequestPendingProposalCueReconcileIfHomeActive()` | Home-active gated `requestHomeReconcile('cue:pending-proposal')` |
| `_notifyPendingProposalCueChange()` | Prefers `HomeController.notifyPendingProposalCueChange`; falls back to legacy |
| `_requestPendingProposalCueReconcileIfHomeActive()` | Prefers `HomeController.requestPendingProposalCueReconcile`; falls back to legacy |

Legacy fallbacks preserve behavior when HomeController methods are unavailable.

---

## renderPendingProposalCue() Tail Behavior

After render path and `_legacyRenderPendingProposalCue(ids)` fallback (when module orchestration does not apply), `renderPendingProposalCue()` now always runs:

```javascript
try { _notifyPendingProposalCueChange(); } catch(e){}
try { _requestPendingProposalCueReconcileIfHomeActive(); } catch(e){}
```

| Property | Detail |
|----------|--------|
| Tail timing | Runs **after render**, regardless of module path or legacy DOM path |
| Notify | Always attempted (record-only) |
| Reconcile | **Home-active gated** (`#sc-home.on`) — same pattern as alert-row cues |
| Cue DOM | Unchanged by tail; reconcile may adjust layout budget when Home is open |

---

## Current Pending Proposal Cue Architecture (after 6q-a)

```
renderPendingProposalCue()                         [index.html — public wrapper / call site]
  ├─ ids = _pendingProposalIdsForMe()            [index.html wrapper — 6o-b]
  │    └─ derivePendingProposalIds(input)        [module]
  │         fallback: _legacyPendingProposalIdsForMe()
  ├─ renderPendingProposalCueSurface({           [module — 6o-c]
  │      pendingIds: ids,
  │      targets: _pendingProposalCueTargets(),   [index.html wrapper — 6p-a]
  │        └─ collectPendingProposalCueTargets({ document })  [module]
  │             fallback: _legacyPendingProposalCueTargets()
  │      buildView / applyView
  │    })
  │    fallback: _legacyRenderPendingProposalCue(ids)
  ├─ _notifyPendingProposalCueChange()           [index.html — 6q-a]
  │    └─ HomeController.notifyPendingProposalCueChange
  │         fallback: notifyCueChange('renderPendingProposalCue')
  └─ _requestPendingProposalCueReconcileIfHomeActive()  [index.html — 6q-a]
       └─ HomeController.requestPendingProposalCueReconcile
            └─ requestReconcile('cue:pending-proposal')
            fallback: requestHomeReconcile('cue:pending-proposal') when Home active
```

| Layer | Owner |
|-------|--------|
| Pending ID derivation | `OOT.home.cueRenderer.derivePendingProposalIds` |
| Target collection | `OOT.home.cueRenderer.collectPendingProposalCueTargets` |
| Render orchestration | `OOT.home.cueRenderer.renderPendingProposalCueSurface` |
| View build / apply | `buildPendingProposalCueView` / `applyPendingProposalCueView` |
| Reconcile notify/timing | **HomeController** (`notifyPendingProposalCueChange`, `requestPendingProposalCueReconcile`) |
| Public entry + fallbacks | `index.html` |

---

## Behavior Preserved

### Render path (unchanged)

Derivation → orchestration → target collection → legacy DOM fallback when module apply fails.

### Phase 6o-a acceptance contract (unchanged intent)

| Scenario | Expected |
|----------|----------|
| **Rich** — `pendingCount: 0` | No pending proposal cue surfaces |
| **Zach** — `pendingCount: 1` | Calendar badge `"1"` |
| **Zach** — Home micro-cue | Text `"1 rehearsal response needed"`, visible in viewport |
| **Zach** — Calendar strip cue | Present |
| **Zach** — Home cue click | Opens Rehearsal Proposals response view |
| **Cleanup** — proposal deleted | All pending cue surfaces clear |

### Other preserved boundaries

- **Five** external `renderPendingProposalCue()` call sites unchanged.
- Full legacy fallbacks remain if HomeController or cueRenderer methods are missing.
- 6q-a did **not** re-run manual browser verification; 6o-a manual PASS remains the visible-state contract.

---

## Integrity Gate Results (Phase 6q-a)

All **five** standard gates **PASS** at commit `9e5bdd6`:

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
| `home-controller-package.mjs` | **PASS** — `Phase 6q-a Pending proposal reconcile notify checks` |
| `home-layout-engine-package.mjs` | **PASS** — Phase 5 layout engine checks |
| `home-diag-package.mjs` | **PASS** — Phase 1/1b/1c + 6b diagnostics |
| `home-alert-rail-package.mjs` | **PASS** — Phase 3 alert rail |
| `home-gig-slot-package.mjs` | **PASS** — Phase 4 gig slot |

This Phase **6q-b** document introduces **no new runtime behavior**.

---

## Hard Boundaries (Still in Force)

| Boundary | Status |
|----------|--------|
| CSS | No changes in 6q-a / 6q-b |
| Cue text | No changes |
| Cue visuals / placement | No changes |
| Target selectors | No changes |
| Pending proposal derivation logic | No changes |
| Proposal data shape | No changes |
| Firestore read/write logic | No changes |
| Listeners | No changes |
| Push notification behavior | No changes |
| Broad refactor | Not permitted |
| Merge to `main` | Not approved |

---

## Recommended Next Slice

**Phase 6r-a** should be chosen **only after repo verification** on this branch.

### Preferred direction (cautious)

Continue with **another narrow Home cue ownership seam** only if it further reduces `index.html` ownership **without changing visible behavior**. Examples to evaluate in planning (not approved here):

- Further HomeController ownership of pending proposal **scheduling/reconcile lifecycle** (still record-only / coalescer-first).
- Planning checkpoint for remaining Home cue render ownership (song vote / rehearsal derivation, r810 fallback listeners) before any runtime slice.

### Stop / pause conditions

- If the next change looks **larger than a bounded seam**, stop and create a **Phase 6q/6r planning checkpoint** instead of coding.
- **Do not** start reminder notification backend work from this modularization branch.
- **Do not** detour for deferred cleanup (e.g. Rehearsal on Deck pill placement) unless it becomes functional breakage, current-slice regression, major layout instability, failed gates, or repo mismatch.

### Priority-plan decision gate

Classify new issues as **Blocker**, **Current-slice regression**, or **Deferred cleanup**. If unclear, ask one clarifying question before changing direction.

---

## Related Docs

- `PHASE_6O_A_PENDING_PROPOSAL_MANUAL_VERIFICATION.md` — manual PASS (acceptance contract)
- `PHASE_6O_D_PENDING_PROPOSAL_MODULARIZATION_CHECKPOINT.md` — 6o-a/b/c checkpoint
- `PHASE_6P_B_PENDING_PROPOSAL_TARGET_COLLECTION_CHECKPOINT.md` — 6p-a target collection checkpoint
- `PHASE_6N_HOME_CUE_NEXT_PLAN.md` — broader Home cue ownership inventory
