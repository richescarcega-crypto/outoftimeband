# Phase 6p-b — Pending Proposal Target Collection Checkpoint

## Status

**Checkpoint / documentation only.** No runtime behavior changed by this document.

This records the pending proposal **target collection seam** added in Phase **6p-a**, on top of the verified modularization path documented in Phases **6o-a** through **6o-d**.

---

## Repo Baseline

| Item | Value |
|------|--------|
| Branch | `modularization-home-layout-engine-pilot` |
| Current HEAD (short) | `a80676d` — *Add pending proposal target collection seam* |
| Current HEAD (full) | `a80676d16bcbcb92c44349a581459dc96eac4d27` |
| Working tree | Clean except untracked `oot-local-server.ps1` (**do not commit**) |

### Phase 6p-a commit recorded

| Commit | Summary |
|--------|---------|
| `a80676d` | Add pending proposal target collection seam (Phase 6p-a) |

### Upstream context (already complete)

| Phase | Deliverable |
|-------|-------------|
| **6m-b / 6m-c / 6m-d** | `buildPendingProposalCueView`, `applyPendingProposalCueView`, `renderPendingProposalCue()` module routing |
| **6o-a** | Manual verification PASS — acceptance contract |
| **6o-b** | `derivePendingProposalIds` + `_pendingProposalIdsForMe()` wrapper |
| **6o-c** | `renderPendingProposalCueSurface` + `renderPendingProposalCue()` orchestration wrapper |
| **6o-d** | Modularization checkpoint doc |
| **6p-a** | `collectPendingProposalCueTargets` + `_pendingProposalCueTargets()` wrapper |

---

## Purpose

Phase **6p-a** reduced `index.html` ownership of pending proposal cue **DOM target collection** by moving selector resolution behind `OOT.home.cueRenderer.collectPendingProposalCueTargets({ document })`, while preserving full legacy fallback and the Phase **6o-a** acceptance contract.

Phase **6p-b** (this document) records that checkpoint without introducing new runtime behavior.

---

## Phase 6p-a — Target Collection Seam Summary

| Item | Detail |
|------|--------|
| Module API | `OOT.home.cueRenderer.collectPendingProposalCueTargets({ document })` |
| Runtime resolver | `_pendingProposalCueTargets()` in `index.html` |
| Legacy fallback | `_legacyPendingProposalCueTargets()` — original inline target object |
| Phase marker | `6p-a-pending-proposal-target-collection-seam` |

### Targets returned (unchanged selectors)

| Key | Resolution |
|-----|------------|
| `calTabBtn` | `document.getElementById('tb-cal')` |
| `homeHero` | `document.querySelector('#sc-home .hero.home-hero-with-controls')` |
| `calSection` | `document.getElementById('sc-cal')` |
| `calHero` | `document.getElementById('calendar-hero')` |
| `homeMicroCueEl` | `document.getElementById('home-proposal-micro-cue')` |
| `calMicroCueEl` | `document.getElementById('cal-proposal-micro-cue')` |

### Behavior preserved

- Missing or invalid `document` input returns all-null target object safely (no throw).
- `renderPendingProposalCue()` passes `targets: _pendingProposalCueTargets()` into `renderPendingProposalCueSurface`.
- Orchestration, derivation, and `_legacyRenderPendingProposalCue(ids)` fallback unchanged.
- **Five** external `renderPendingProposalCue()` call sites unchanged.
- No CSS, visual, Firestore, listener, notification, or proposal data shape changes.

### Files touched (6p-a code slice)

| File | Role |
|------|------|
| `oot_home_cue_renderer.js` | `collectPendingProposalCueTargets` |
| `index.html` | `_legacyPendingProposalCueTargets`, `_pendingProposalCueTargets`, delegation in `renderPendingProposalCue()` |
| `tests/integrity/home-controller-package.mjs` | `assertPhase6pAPendingProposalTargetCollection` |
| `tests/integrity/home-layout-engine-package.mjs` | Diff allowlist for target collection delegation |

---

## Current Architecture (after 6p-a)

```
renderPendingProposalCue()                    [index.html — public wrapper / call site]
  └─ ids = _pendingProposalIdsForMe()       [index.html wrapper]
       └─ derivePendingProposalIds(input)   [module — 6o-b]
            fallback: _legacyPendingProposalIdsForMe()
  └─ renderPendingProposalCueSurface({       [module — 6o-c]
       pendingIds: ids,
       targets: _pendingProposalCueTargets(), [index.html wrapper — 6p-a]
         └─ collectPendingProposalCueTargets({ document })  [module — 6p-a]
              fallback: _legacyPendingProposalCueTargets()
       buildView / applyView
     })
       fallback: _legacyRenderPendingProposalCue(ids)
```

| Layer | Owner | Fallback in `index.html` |
|-------|--------|---------------------------|
| Pending ID derivation | `derivePendingProposalIds(input)` | `_legacyPendingProposalIdsForMe()` |
| Target collection | `collectPendingProposalCueTargets({ document })` | `_legacyPendingProposalCueTargets()` |
| View build | `buildPendingProposalCueView` | (via orchestration → legacy render) |
| Multi-target apply | `applyPendingProposalCueView` | (via orchestration → legacy render) |
| Render orchestration | `renderPendingProposalCueSurface(input)` | `_legacyRenderPendingProposalCue(ids)` |
| Public entry | `renderPendingProposalCue()` | full legacy render path |

---

## Behavior Preserved from Phase 6o-a (Acceptance Contract)

Manual verification recorded in `PHASE_6O_A_PENDING_PROPOSAL_MANUAL_VERIFICATION.md` remains the acceptance contract. No regression was intended or introduced by 6p-a.

| Scenario | Expected / observed |
|----------|---------------------|
| **Rich** — `pendingCount: 0` | No pending proposal cue surfaces |
| **Zach** — `pendingCount: 1` | Calendar badge text `"1"` |
| **Zach** — Home micro-cue | Text `"1 rehearsal response needed"`, visible in viewport |
| **Zach** — Calendar strip cue | Present with ACTION NEEDED strip behavior |
| **Zach** — Home cue click | Opened Rehearsal Proposals response view |
| **Cleanup** — test proposal deleted | All pending cue surfaces cleared |

**Conclusion:** Rich saw no cue (no pending response). Zach saw cue (pending response). Target collection seam must not alter this contract.

---

## Integrity Status

All **five** standard integrity gates **PASS** for the Phase **6p-a** code slice at HEAD `a80676d`:

```powershell
$node = "C:\Users\rescarcega\AppData\Local\Programs\cursor\resources\app\resources\helpers\node.exe"
& $node tests/integrity/home-controller-package.mjs
& $node tests/integrity/home-layout-engine-package.mjs
& $node tests/integrity/home-diag-package.mjs
& $node tests/integrity/home-alert-rail-package.mjs
& $node tests/integrity/home-gig-slot-package.mjs
```

| Gate | Status (6p-a slice) |
|------|------------------------|
| `home-controller-package.mjs` | **PASS** — `Phase 6p-a Pending proposal target collection checks` |
| `home-layout-engine-package.mjs` | **PASS** |
| `home-diag-package.mjs` | **PASS** |
| `home-alert-rail-package.mjs` | **PASS** |
| `home-gig-slot-package.mjs` | **PASS** |

This Phase **6p-b** document introduces **no new runtime behavior** and does not re-run browser/manual verification.

---

## Hard Boundaries (Still in Force)

| Boundary | Status |
|----------|--------|
| CSS | No changes in 6p-a / 6p-b |
| Visual / layout | No changes |
| Firestore logic | No changes |
| Listeners | No changes |
| Notifications | No changes |
| Proposal data shape | No changes |
| Broad refactor | Not permitted |
| Merge to `main` | Not approved |

---

## Recommended Next Slice

### **Phase 6q-a (proposed) — HomeController pending proposal cue reconcile notification / timing ownership**

After repo verification on this branch, the next **cautious** runtime slice may introduce HomeController **record-only or coalesced notification** for pending proposal cue refresh timing — for example a guarded `notifyCueChange('pending-proposal')` or `requestHomeReconcile('cue:pending-proposal')` tail on `renderPendingProposalCue()` success paths, mirroring Song Vote / Rehearsal patterns.

**Why cautious / not immediate:**

- Timing and coalescer ordering are **medium risk** relative to the stable 6p-a checkpoint.
- Must preserve pending proposal behavior verified in **6o-a through 6p-a**.
- Requires explicit repo verification and integrity gate pass before and after any wiring.
- Must not change cue markup, placement, Firestore paths, or listener bodies.

**Hard boundaries for 6q-a (if approved):**

- No CSS or visual changes.
- No Firestore listener changes.
- No change to `derivePendingProposalIds`, `collectPendingProposalCueTargets`, or `renderPendingProposalCueSurface` behavior unless fixing a regression.
- `renderPendingProposalCue()` remains the public entry; call sites unchanged.
- Full legacy fallbacks preserved.

**Alternative:** Pause runtime changes and produce a planning-only inventory of HomeController ↔ pending proposal cue timing before any wiring.

---

## Priority-Plan Decision Gate

Before interrupting the active modularization task, classify any new issue as:

| Class | Action |
|-------|--------|
| **Blocker** | Stop; fix or revert |
| **Current-slice regression** | Stop slice; fix within scope |
| **Deferred cleanup** | Record only (e.g. Rehearsal on Deck pill placement) |

If unclear, ask one clarifying question before changing direction.

---

## Related Docs

- `PHASE_6O_A_PENDING_PROPOSAL_MANUAL_VERIFICATION.md` — manual PASS record (acceptance contract)
- `PHASE_6O_D_PENDING_PROPOSAL_MODULARIZATION_CHECKPOINT.md` — 6o-a/b/c checkpoint
- `PHASE_6N_HOME_CUE_NEXT_PLAN.md` — broader Home cue ownership inventory
- `PHASE_6M_A_PENDING_PROPOSAL_CUE_INVENTORY.md` — original DOM inventory
