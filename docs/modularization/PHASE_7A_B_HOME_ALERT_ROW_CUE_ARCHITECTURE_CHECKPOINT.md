# Phase 7a-b — Home Alert-Row Cue Architecture Checkpoint

## Status

**Checkpoint / documentation only.** No runtime behavior changed by this document.

This records the **Home alert-row cue modularization posture** after Phase **7a-a** inspection and the completion of the Rehearsal cue ladder through Phase **6z-c** (`d1f50b4`). All three alert-row cue families (Pending Proposal, Song Vote, Rehearsal) now share the same four-rung modularization ladder on branch `modularization-home-layout-engine-pilot`.

---

## Repo Baseline

| Item | Value |
|------|--------|
| Branch | `modularization-home-layout-engine-pilot` |
| Current HEAD (short) | `d1f50b4` — *Document rehearsal cue controller reconcile checkpoint* |
| Working tree | Untracked `PHASE_6W_A_REHEARSAL_CUE_PARITY_PLAN.md` and `oot-local-server.ps1` (**do not commit `oot-local-server.ps1`**) |

### Phase 7a-a inspection result (summary)

Phase **7a-a** confirmed that no further bounded runtime cue seam is clearly warranted without regression or merge-review blocker:

| Finding | Detail |
|---------|--------|
| Ladder parity | Pending proposal, Song Vote, and Rehearsal each complete derive → orchestrate → targets → controller notify/reconcile |
| Remaining asymmetries | Documentable index.html ownership and cross-module lookup duplication — not blocking further cue runtime slices |
| Risk of additional seams | **Low benefit / medium regression surface** without a dedicated plan |
| Recommendation | **Phase 7a-b** docs-only architecture checkpoint; **stop** on additional runtime cue seams unless regression or clear blocker |

---

## Completed Parity Ladders

### Pending Proposal

| Rung | Module API | index.html wrapper | Phase |
|------|------------|-------------------|-------|
| Derivation | `derivePendingProposalIds` | `_pendingProposalIdsForMe()` | 6o-b |
| Orchestration | `renderPendingProposalCueSurface` | legacy fallbacks in `renderPendingProposalCue()` | 6o-c |
| Target collection | `collectPendingProposalCueTargets` | `_pendingProposalCueTargets()` | 6p-a |
| Controller notify/reconcile | `notifyPendingProposalCueChange`, `requestPendingProposalCueReconcile` | `_notifyPendingProposalCueChange()`, `_requestPendingProposalCueReconcileIfHomeActive()` | 6q-a |

### Song Vote

| Rung | Module API | index.html wrapper | Phase |
|------|------------|-------------------|-------|
| Derivation | `deriveSongVoteCueState` | `_deriveSongVoteCueState()` | 6s-a |
| Orchestration | `renderSongVoteCueSurface` | legacy fallbacks in `renderHomeSongVoteCue()` | 6t-a |
| Target collection | `collectSongVoteCueTargets` | `_songVoteCueTargets()` | 6u-b |
| Controller notify/reconcile | `notifySongVoteCueChange`, `requestSongVoteCueReconcile` | `_notifySongVoteCueChange()`, `_requestSongVoteCueReconcileIfHomeActive()` | 6v-b |

### Rehearsal

| Rung | Module API | index.html wrapper | Phase |
|------|------------|-------------------|-------|
| Derivation | `deriveRehearsalCueInput` | `_deriveRehearsalCueInput()` | 6w-b |
| Orchestration | `renderRehearsalCueSurface` | legacy fallbacks in `renderHomeRehearsalCue()` | 6x-b |
| Target collection | `collectRehearsalCueTargets` | `_rehearsalCueTargets()` | 6y-b |
| Controller notify/reconcile | `notifyRehearsalCueChange`, `requestRehearsalCueReconcile` | `_notifyRehearsalCueChange()`, `_requestRehearsalCueReconcileIfHomeActive()` | 6z-b |

---

## Derivation / Orchestration / Target Collection / Controller Notify-Reconcile Status

| Cue | Derive | Orchestrate | Targets | Controller notify/reconcile |
|-----|--------|-------------|---------|----------------------------|
| Pending proposal | **Module** (6o-b) | **Module** (6o-c) | **Module** (6p-a) | **Dedicated** (6q-a) |
| Song Vote | **Module** (6s-a) | **Module** (6t-a) | **Module** (6u-b) | **Dedicated** (6v-b) |
| Rehearsal | **Module** (6w-b) | **Module** (6x-b) | **Module** (6y-b) | **Dedicated** (6z-b) |

**Module owner:** `OOT.home.cueRenderer` (derive, orchestrate, targets, render/apply helpers).

**Controller owner:** `OOT.home.controller` (per-cue notify/reconcile record + coalesced reconcile requests).

**Public call-site owner:** `index.html` (render entry points, input packaging, shared apply, post-render tails, legacy fallbacks).

---

## Current Alert-Row Cue Architecture (after 6z-c)

```
index.html — public render owners
  renderPendingProposalCue()
  renderHomeSongVoteCue()
  renderHomeRehearsalCue()
       │
       ├─ target collection wrappers → OOT.home.cueRenderer.collect*CueTargets
       ├─ derivation wrappers       → OOT.home.cueRenderer.derive*
       ├─ orchestration             → OOT.home.cueRenderer.render*CueSurface (+ legacy fallbacks)
       ├─ shared apply              → _applyHomeCueView / _legacyApplyHomeCueView
       ├─ post-render tails         → diag, alert rail, image refresh (rehearsal), layout diag
       └─ notify/reconcile wrappers → OOT.home.controller.notify* / request*Reconcile
```

---

## Remaining index.html Ownership

These responsibilities still live in `index.html` after the three cue ladders completed:

| Category | Functions / behavior | Cues affected |
|----------|---------------------|---------------|
| Public render owners | `renderPendingProposalCue()`, `renderHomeSongVoteCue()`, `renderHomeRehearsalCue()` | All |
| Legacy fallbacks | `_legacyRender*`, `_legacyApply*`, `_legacyNotify*`, `_legacyRequest*`, `_legacyPendingProposalIdsForMe`, etc. | All |
| Input packaging | `_buildHomeSongVoteCueInput`, `_buildHomeRehearsalCueInput` | Song Vote, Rehearsal |
| Shared cue apply | `_applyHomeCueView`, `_legacyApplyHomeCueView` | Song Vote, Rehearsal |
| Post-render diag | `_recordHomeCueRenderDiag` | Song Vote, Rehearsal |
| Layout diag snapshots | `_homeLayoutDiagSnapshot(...)` in render tails | Song Vote, Rehearsal |
| Alert rail sync | `syncAlertRailState(...)` in render tails | Song Vote, Rehearsal |
| Rehearsal image refresh | `_ensureHomePresentationObserver`, `_scheduleHomeImagePresentationRefresh`, `notifyImageRefresh` | Rehearsal only |
| Notify/reconcile timing | Wrapper calls at render tail; Home-active gate in reconcile wrappers | All (shape differs — see deferred) |

---

## Items That Should Stay in index.html (For Now)

| Item | Rationale |
|------|-----------|
| Public render entry points | Call-site ownership; rHome and listener paths invoke these by name |
| Legacy fallbacks | Preserve behavior when module or controller methods are unavailable |
| `_buildHomeSongVoteCueInput` / `_buildHomeRehearsalCueInput` | Bridge live DOM / band state into module-safe inputs; moving requires dedicated input-packaging slice |
| `_applyHomeCueView` | Shared DOM apply path used by multiple cues; extraction needs explicit apply-wrapper plan |
| Rehearsal image-refresh tails | Presentation observer + band image registry timing; high regression risk without bounded slice |
| `syncAlertRailState` in render tails | Couples cue visibility to alert rail; alert rail module still resolves targets independently |
| Home-active reconcile gating in wrappers | Intentional: controller methods do not gate; index preserves pre-6q semantics |

---

## Deferred Cleanup Items

These are **known asymmetries or duplication** — not merge blockers and **not** approved for ad-hoc runtime slices on this branch:

| Item | Detail | Risk if moved casually |
|------|--------|------------------------|
| Rehearsal image-refresh tails | `_ensureHomePresentationObserver`, `_scheduleHomeImagePresentationRefresh`, `notifyImageRefresh` remain inline in `renderHomeRehearsalCue()` | Band image presentation timing regressions |
| Pending proposal single-branch notify/reconcile | **1×** notify + reconcile at end of `renderPendingProposalCue()` vs **2×** on hidden/visible branches for Song Vote and Rehearsal | Behavior change if unified without explicit contract |
| Independent alert_rail / diag / band_image lookups | `oot_home_alert_rail.js`, `oot_home_diag.js`, `oot_home_band_image.js` each resolve `#home-*-cue` targets independently of `collect*CueTargets` | Cross-module coupling; needs dedicated unification plan |
| Input packaging helpers | `_buildHomeSongVoteCueInput`, `_buildHomeRehearsalCueInput` not yet module-owned | Requires new pure-input builders + wrapper parity |
| Post-render diag/apply wrappers | `_recordHomeCueRenderDiag`, `_applyHomeCueView` shared across cues | Apply/diag contract must be frozen before extraction |

---

## Notify/Reconcile Branch Semantics (Documented Asymmetry)

| Cue | Hidden branch notify/reconcile | Visible branch notify/reconcile | Notes |
|-----|-------------------------------|--------------------------------|-------|
| Pending proposal | N/A (single path) | N/A (single path) | **1×** at function end |
| Song Vote | **1×** each | **1×** each | **2×** total per render |
| Rehearsal | **1×** each | **1×** each | **2×** total per render; after image-refresh block |

Pending proposal early-exit paths do not duplicate notify/reconcile on branch splits because the render function uses a single tail. Song Vote and Rehearsal preserve **2×** semantics from pre-6q inline hooks. **Do not unify** without explicit approval and integrity contract update.

---

## Behavior Preserved

| Contract | Expected |
|----------|----------|
| Cue text / placement / CSS | Unchanged across 6o–6z ladder |
| Target selector ids | Unchanged (`#home-pending-proposal-cue`, `#home-song-vote-cue`, `#home-rehearsal-cue`) |
| Firestore / listeners / push | Unchanged |
| Cross-cue isolation | Changes to one cue ladder did not modify the other two |
| Integrity gates | All five standard gates **PASS** at `d1f50b4` |

Phase **7a-b** introduces **no new runtime behavior**.

---

## Integrity Gate Results (baseline `d1f50b4`)

All **five** standard gates **PASS**:

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
| `home-controller-package.mjs` | **PASS** — through Phase 6z-b rehearsal controller notify/reconcile |
| `home-layout-engine-package.mjs` | **PASS** — layout engine + cue seam diff allowlists |
| `home-diag-package.mjs` | **PASS** |
| `home-alert-rail-package.mjs` | **PASS** |
| `home-gig-slot-package.mjs` | **PASS** |

---

## Hard Boundaries (Still in Force)

| Boundary | Status |
|----------|--------|
| CSS | No changes in 7a-b |
| Cue text / visuals / placement | No changes |
| Firestore read/write logic | No changes |
| Listeners | No changes |
| Push notification behavior | No changes |
| Broad refactor | Not permitted |
| Merge to `main` | Not approved by this checkpoint alone |

---

## Merge-Readiness Posture

| Aspect | Posture |
|--------|---------|
| Alert-row cue ladder | **Complete** for all three cue families on this branch |
| Runtime risk surface | **Bounded** — incremental seams with integrity gates and legacy fallbacks |
| Remaining index.html ownership | **Documented and intentional** — not hidden debt |
| Deferred items | **Explicitly listed** — safe to defer until post-merge or dedicated slices |
| Branch merge to `main` | **Requires separate approval** — this checkpoint documents readiness of the cue modularization arc, not merge authorization |
| Untracked plan doc | `PHASE_6W_A_REHEARSAL_CUE_PARITY_PLAN.md` may be committed separately or superseded by this checkpoint series |

**Assessment:** The Home alert-row cue modularization pilot on this branch is **architecturally complete** at the planned ladder depth. Further runtime work on cue seams is **not recommended** unless a regression appears or merge review identifies a concrete gap.

---

## Explicit Stop: Additional Runtime Cue Seams

**Stop here** on additional Home alert-row cue runtime modularization unless:

1. A **regression** is observed in cue text, placement, visibility, notify/reconcile timing, or cross-cue behavior, or
2. Merge review identifies a **clear blocker** requiring a bounded fix, or
3. Explicit approval is granted for a **named deferred item** (see Deferred Cleanup Items) with its own phase plan and integrity contract.

Do **not** proceed with opportunistic extractions (input packaging, apply wrappers, cross-module target unification, rehearsal image tails) without meeting the above.

---

## Recommended Next Slice

**Phase 7c — Branch merge review / pilot close-out (process slice, not runtime)**

Rationale:

1. All three cue families reached ladder parity; further cue runtime slices have diminishing returns and rising regression risk.
2. Deferred cleanup items are better addressed **after** merge review or on a fresh branch with explicit scope.
3. Untracked `PHASE_6W_A_REHEARSAL_CUE_PARITY_PLAN.md` can be committed, archived, or superseded during close-out — not required for cue runtime correctness.

Alternative (only if merge review requests it):

- **Phase 7b-* — Named deferred slice** (e.g. rehearsal image-refresh tail extraction) with dedicated plan, approval, and integrity contract — **not** a default next step.

### Explicit non-goals (unchanged)

- Do **not** start pending response reminder backend work from this branch.
- Do **not** start flyer/r106 legacy work from this branch.
- Do **not** unify cross-module `#home-*-cue` lookups without a dedicated plan.
- Do **not** merge to `main` without separate approval.

---

## Related Docs

- `PHASE_6O_D_PENDING_PROPOSAL_MODULARIZATION_CHECKPOINT.md` — pending proposal arc
- `PHASE_6Q_B_PENDING_PROPOSAL_RECONCILE_NOTIFICATION_CHECKPOINT.md` — pending proposal controller parity
- `PHASE_6V_C_SONG_VOTE_HOMECONTROLLER_NOTIFY_RECONCILE_CHECKPOINT.md` — Song Vote arc complete through 6v-b
- `PHASE_6W_C_REHEARSAL_CUE_DERIVATION_CHECKPOINT.md` — rehearsal derivation
- `PHASE_6X_C_REHEARSAL_CUE_RENDER_ORCHESTRATION_CHECKPOINT.md` — rehearsal orchestration
- `PHASE_6Y_C_REHEARSAL_CUE_TARGET_COLLECTION_CHECKPOINT.md` — rehearsal targets
- `PHASE_6Z_C_REHEARSAL_CUE_HOMECONTROLLER_NOTIFY_RECONCILE_CHECKPOINT.md` — rehearsal controller parity (immediate predecessor)
- `PHASE_6W_A_REHEARSAL_CUE_PARITY_PLAN.md` — 6w-a planning (untracked)
