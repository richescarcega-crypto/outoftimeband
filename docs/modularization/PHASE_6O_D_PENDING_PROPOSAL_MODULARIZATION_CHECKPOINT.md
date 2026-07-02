# Phase 6o-d — Pending Proposal Modularization Checkpoint

## Status

**Checkpoint / documentation only.** No runtime behavior changed by this document.

This records the verified pending proposal cue modularization path after Phases **6o-a** (manual verification), **6o-b** (derivation seam), and **6o-c** (render orchestration seam).

---

## Repo Baseline

| Item | Value |
|------|--------|
| Branch | `modularization-home-layout-engine-pilot` |
| Current HEAD (short) | `09a1f93` — *Add pending proposal render orchestration seam* |
| Working tree | Clean except untracked `oot-local-server.ps1` (**do not commit**) |

### Prior relevant commits

| Commit | Summary |
|--------|---------|
| `8dfca3d` | Document Phase 6o-a pending proposal verification results |
| `20f2599` | Add pending proposal derivation seam (Phase 6o-b) |
| `09a1f93` | Add pending proposal render orchestration seam (Phase 6o-c) |

### Upstream context (already complete before 6o)

Pending proposal **view builder** and **multi-target apply** were added in Phases **6m-b** / **6m-c** and routed through `renderPendingProposalCue()` in **6m-d**, with `_legacyRenderPendingProposalCue(ids)` fallback. Phases 6o-a through 6o-c refine and verify that path without changing the user-visible contract.

---

## Purpose

This checkpoint documents that the pending proposal cue path is now modularized in three layers:

1. **Manual visible-state verification** (6o-a) — confirms DOM and click behavior match legacy expectations.
2. **Derivation seam** (6o-b) — pure ID derivation moved behind `derivePendingProposalIds` with wrapper fallback.
3. **Render orchestration seam** (6o-c) — build/apply orchestration moved behind `renderPendingProposalCueSurface` with wrapper fallback.

Together, these slices preserve the behavior verified in 6o-a while reducing inline orchestration in `index.html`.

---

## Phase 6o-a — Manual Verification Summary

**Source:** `PHASE_6O_A_PENDING_PROPOSAL_MANUAL_VERIFICATION.md` (results recorded at `8dfca3d`).

| Scenario | Result |
|----------|--------|
| **Rich** — `pendingCount: 0`, `ME: 3`, no pending IDs | **PASS** — no Calendar badge, no Home micro-cue, no Calendar strip |
| **Test proposal create** — visible in Calendar / Rehearsal Proposals | **PASS** — save/listener path confirmed |
| **Zach** — `pendingCount: 1`, `ME: 6`, pending ID `1783022306892` | **PASS** — Calendar badge `"1"`; Home micro-cue `"1 rehearsal response needed"` (`inline-flex`); Calendar strip cue present (`flex`) |
| **Home cue position/visibility (Zach)** | **PASS** — in `#sc-home .hero.home-hero-with-controls`, visible in viewport |
| **Home cue click** | **PASS** — opened Rehearsal Proposals response view |
| **Cleanup after deleting test proposal** | **PASS** — all surfaces cleared |

### Conclusion (6o-a)

Pending proposal cue routing **works**. Rich did not see the cue because Rich had no pending response. Zach saw the cue because Zach had a pending response. This manual result is the **acceptance contract** for all subsequent seams.

---

## Phase 6o-b — Derivation Seam Summary

| Item | Detail |
|------|--------|
| Module API | `OOT.home.cueRenderer.derivePendingProposalIds(input)` |
| Runtime wrapper | `_pendingProposalIdsForMe()` remains in `index.html` |
| Delegation | Wrapper calls module helper with `{ proposals, currentMemberId, currentMemberName, members, expectedResponderIdsFn }` |
| Fallback | `_legacyPendingProposalIdsForMe()` — original filter logic unchanged |
| Phase marker | `6o-b-pending-proposal-derive-seam` (superseded in module header by 6o-c marker; function retained) |

### Behavior preserved

- Same open-proposal filter, expected-responder check, and response check.
- `_proposalExpectedResponderIds(p)` passed as `expectedResponderIdsFn` when available (preserves empty-`expectedResponderIds` → all-members behavior).
- No proposal data shape, Firestore, listener, notification, CSS, or visual changes.
- `renderPendingProposalCue()` still calls `_pendingProposalIdsForMe()` — call sites unchanged.

---

## Phase 6o-c — Render Orchestration Seam Summary

| Item | Detail |
|------|--------|
| Module API | `OOT.home.cueRenderer.renderPendingProposalCueSurface(input)` |
| Runtime wrapper | `renderPendingProposalCue()` remains in `index.html` |
| Input shape | `{ pendingIds, targets, buildView, applyView }` (optional `legacyRender` for module tests) |
| Orchestration | Build via `buildPendingProposalCueView` → apply via `applyPendingProposalCueView` → `moduleApplied: true` on success |
| Fallback | `_legacyRenderPendingProposalCue(ids)` when orchestration does not report `moduleApplied` |
| Phase marker | `6o-c-pending-proposal-render-orchestration-seam` |

### Behavior preserved

- Same DOM targets collected in wrapper (`#tb-cal`, Home hero, `#sc-cal`, `#calendar-hero`, optional micro-cue elements).
- Empty pending IDs still clear/hide surfaces through build/apply hidden path.
- **Five** external `renderPendingProposalCue()` call sites unchanged (`listenProposals`, `voteOnProposal`, close workspace, `rHome`, `rCal`).
- No CSS, visual, Firestore, listener, or notification changes.

---

## Files Touched Across 6o-b / 6o-c (and 6o-a doc)

| File | Role |
|------|------|
| `oot_home_cue_renderer.js` | `derivePendingProposalIds`, `renderPendingProposalCueSurface` |
| `index.html` | `_pendingProposalIdsForMe()` and `renderPendingProposalCue()` wrapper delegation + legacy fallbacks |
| `tests/integrity/home-controller-package.mjs` | `assertPhase6oB`, `assertPhase6oC`; updated 6m-d routing checks |
| `tests/integrity/home-layout-engine-package.mjs` | Diff allowlist for delegation/orchestration lines |
| `docs/modularization/PHASE_6O_A_PENDING_PROPOSAL_MANUAL_VERIFICATION.md` | Manual verification checklist + PASS results |

---

## Integrity Gates

All **five** standard gates **PASS** after each code slice (6o-b, 6o-c). Run after any future runtime change:

```powershell
$node = "C:\Users\rescarcega\AppData\Local\Programs\cursor\resources\app\resources\helpers\node.exe"
& $node tests/integrity/home-controller-package.mjs
& $node tests/integrity/home-layout-engine-package.mjs
& $node tests/integrity/home-diag-package.mjs
& $node tests/integrity/home-alert-rail-package.mjs
& $node tests/integrity/home-gig-slot-package.mjs
```

| Gate | 6o-b | 6o-c |
|------|------|------|
| `home-controller-package.mjs` | PASS | PASS (`Phase 6o-c Pending proposal render orchestration checks`) |
| `home-layout-engine-package.mjs` | PASS | PASS |
| `home-diag-package.mjs` | PASS | PASS |
| `home-alert-rail-package.mjs` | PASS | PASS |
| `home-gig-slot-package.mjs` | PASS | PASS |

6o-a was documentation/manual verification only — no runtime diff.

---

## Current State / Behavior Preserved

| Layer | Owner today |
|-------|-------------|
| **ID derivation** | Module (`derivePendingProposalIds`) with `_pendingProposalIdsForMe()` wrapper + `_legacyPendingProposalIdsForMe()` fallback |
| **View build** | Module (`buildPendingProposalCueView`) |
| **Multi-target apply** | Module (`applyPendingProposalCueView`) |
| **Render orchestration** | Module (`renderPendingProposalCueSurface`) with `renderPendingProposalCue()` wrapper + `_legacyRenderPendingProposalCue()` fallback |
| **Public call sites** | Legacy `index.html` — `renderPendingProposalCue()` name and invocations unchanged |
| **Acceptance contract** | Phase 6o-a manual verification (Rich/Zach scenarios) |

---

## Remaining Ownership Still in `index.html`

| Area | Notes |
|------|-------|
| `renderPendingProposalCue()` wrapper | Still gathers DOM targets via `document.getElementById` / `querySelector` before calling orchestration seam |
| Legacy fallbacks | `_legacyPendingProposalIdsForMe`, `_legacyRenderPendingProposalCue` remain in `index.html` (required for reversibility) |
| Navigation UX | `_openPendingProposalCue`, `_hideCalendarProposalCueWhileWorkspaceOpen` — Calendar/proposal workspace flow |
| HomeController timing | Does **not** yet own pending proposal cue refresh timing or dedicated reconcile notification for this cue family |
| Other cue paths | Song Vote / Rehearsal alert-row wrappers, derivation helpers, post-render tails (`syncAlertRailState`, `requestHomeReconcile`, diag) |
| Home lifecycle | `rHome()` orchestration, birthday banner, gig slot markup, r810 fallback listeners |

---

## Recommended Next Slice

### Preferred: **Phase 6p-a — Pending proposal target collection seam**

Extract DOM target resolution into a small, module-safe helper (for example `collectPendingProposalCueTargets(document)` or a thin `index.html` shim that delegates to a pure target-descriptor builder), **only if** it reduces `index.html` ownership without changing behavior.

**Why this is safer than HomeController reconcile notification next:**

- Target collection is a **narrow, reversible** seam adjacent to the work just completed (6o-c still leaves target gathering in the wrapper).
- It does not introduce new timing, coalescing, or cross-module notification ordering.
- It keeps the 6o-a acceptance contract easy to re-verify (same surfaces, same placement).
- HomeController pending-proposal reconcile hooks touch layout/coalescer ordering and are **medium risk** relative to the current stable checkpoint.

**Hard boundaries for 6p-a:**

- No CSS, visual, Firestore, listener, or notification changes.
- `renderPendingProposalCue()` remains the public entry; call sites unchanged.
- Full legacy fallback preserved if target helper unavailable.

### Alternative: **Pause and document**

If target collection proves too DOM-specific to move without behavior drift, **do not force extraction**. Instead, update the Home cue ownership inventory (`PHASE_6N_HOME_CUE_NEXT_PLAN.md` successor) and pause runtime changes until the next seam is clearly low-risk.

**Not recommended next:** broad HomeController ownership of pending proposal cue timing until 6p-a (or explicit inventory pause) is resolved.

---

## Deferred Cleanup Note

**Rehearsal on Deck pill placement** is a known deferred cleanup item. It must **not** derail modularization unless it becomes:

- Functional breakage
- A clear **current-slice regression**
- Major Home layout instability
- Failed integrity gates
- Repo mismatch / unexpected state

Otherwise classify as **Deferred cleanup** and continue the planned seam sequence.

---

## Priority-Plan Decision Gate

Before interrupting the active modularization task, classify any new issue as:

| Class | Action |
|-------|--------|
| **Blocker** | Stop; fix or revert before continuing |
| **Current-slice regression** | Stop slice; fix within scope or revert |
| **Deferred cleanup** | Record; do not change direction mid-slice |

If classification is unclear, **ask one clarifying question** before changing direction.

---

## Related Docs

- `PHASE_6O_A_PENDING_PROPOSAL_MANUAL_VERIFICATION.md` — manual PASS record
- `PHASE_6M_D_VERIFICATION_RESULT.md` — 6m-d wrapper routing integrity record
- `PHASE_6N_HOME_CUE_NEXT_PLAN.md` — broader Home cue ownership inventory
- `PHASE_6M_A_PENDING_PROPOSAL_CUE_INVENTORY.md` — original pending proposal DOM inventory
