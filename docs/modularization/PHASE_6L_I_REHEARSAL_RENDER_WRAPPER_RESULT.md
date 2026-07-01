# Phase 6l-i Rehearsal Render Wrapper Result

## Status

- **PASS** for integrity verification.
- Browser/manual verification **not run** — work-computer static-server tooling block.
- **No CSS, layout constant, placement, markup, or Firestore changes intended.**
- Rehearsal cue build+apply ownership moved into cue renderer module; Song Vote wrapper path unchanged.

**Scope:** Add module-owned Rehearsal render wrapper at `dbee136` baseline + this slice.

---

## Repo State

| Item | Value |
|------|--------|
| Branch | `modularization-home-layout-engine-pilot` |
| Baseline HEAD (short) | `dbee136` — *Wrap song vote cue render in module* |
| Working HEAD (uncommitted) | `dbee136` (same commit; changes in working tree only) |
| Untracked (local-only) | `oot-local-server.ps1` (**do not commit**) |

---

## Files Changed

| File | Change |
|------|--------|
| `oot_home_cue_renderer.js` | Added `renderRehearsalCue(targetEl, input)`; phase → `6l-i-rehearsal-render-wrapper` |
| `index.html` | Normal path calls `renderRehearsalCue`; fallback retains `buildRehearsalCueView` + `_applyHomeCueView` + inline legacy |
| `tests/integrity/home-controller-package.mjs` | `assertPhase6lIRehearsalRenderWrapper`; prior phase assertions aligned for fallback apply |
| `tests/integrity/home-layout-engine-package.mjs` | Phase 6l-i diff allowlist |
| `docs/modularization/PHASE_6L_I_REHEARSAL_RENDER_WRAPPER_RESULT.md` | This result record |

No CSS edits. `renderHomeSongVoteCue()` and `renderPendingProposalCue()` untouched.

---

## Rehearsal Wrapper Added

### Module method (`oot_home_cue_renderer.js`)

```javascript
renderRehearsalCue(targetEl, input)
```

Flow:

1. `buildRehearsalCueView(input)`
2. `applyCueView(targetEl, view)`
3. Return `{ rendered, visible, sourceBranch, activeCount, imageRefreshReason, diagTag, applied, htmlLength, rendersDom: true }`

Does **not** call Firestore, `rHome`, `requestHomeReconcile`, `reconcileHomeLayout`, write CSS vars, or touch `localStorage`. Does not mutate input arrays.

---

## Rehearsal Build+Apply Ownership Moved

### Normal path (`index.html`)

After legacy state derivation and `_buildHomeRehearsalCueInput(...)`:

1. Call `cueRenderer.renderRehearsalCue(el, _rhInput)` — module owns build + apply
2. Set `_rhModuleApplied = true` when wrapper succeeds
3. Preserve image refresh / diag / alert-rail / notify / reconcile tails using wrapper metadata (`imageRefreshReason`, `diagTag`, `sourceBranch`)

### Fallback paths preserved

| Condition | Behavior |
|-----------|----------|
| `renderRehearsalCue` unavailable | `buildRehearsalCueView(_rhInput)` then `_applyHomeCueView` |
| Module unavailable | Inline legacy view build then `_applyHomeCueView` |
| Module applied DOM | Skip `_applyHomeCueView` via `if (!_rhModuleApplied)` guard |

---

## Song Vote Wrapper Path Preserved

`renderHomeSongVoteCue()` still routes normal path through `renderSongVoteCue(el, _svInput)` with the same fallback chain from Phase 6l-h.

---

## Shared Apply Seam Preserved

- `applyCueView` retained in module (called by both wrappers on normal paths)
- `_legacyApplyHomeCueView` + `_applyHomeCueView` retained in index.html for fallback paths

---

## Integrity Tests Run

```powershell
$node = "C:\Users\rescarcega\AppData\Local\Programs\cursor\resources\app\resources\helpers\node.exe"
& $node tests/integrity/home-controller-package.mjs
& $node tests/integrity/home-layout-engine-package.mjs
& $node tests/integrity/home-diag-package.mjs
& $node tests/integrity/home-alert-rail-package.mjs
& $node tests/integrity/home-gig-slot-package.mjs
```

| Package | Result |
|---------|--------|
| `home-controller-package.mjs` | **PASS** (Phase 6l-i Rehearsal render wrapper) |
| `home-layout-engine-package.mjs` | **PASS** |
| `home-diag-package.mjs` | **PASS** |
| `home-alert-rail-package.mjs` | **PASS** |
| `home-gig-slot-package.mjs` | **PASS** |

Key assertions:

- `renderRehearsalCue` exists and calls `buildRehearsalCueView` + `applyCueView`
- Forbidden calls absent from wrapper body
- `renderHomeRehearsalCue` calls `renderRehearsalCue` on normal path
- Fallback `buildRehearsalCueView` + `_applyHomeCueView` + inline legacy retained
- Song Vote remains on `renderSongVoteCue` path
- `renderPendingProposalCue` untouched
- Rehearsal on Deck kicker and `_r535OpenHomeRehearsal` handler unchanged
- No CSS edits; no modular-inflow default

---

## Browser / Manual Verification

**Not run.** Work-computer local static-server path remains blocked.

When unblocked: confirm Rehearsal on Deck pill unchanged during rehearsal activity.

---

## Explicit Non-Changes

- No CSS edits
- No Home visual / layout constant / cue placement changes
- No cue markup text / classes / handler changes
- No Firestore listener changes
- No modular-inflow default enablement
- Song Vote cue path unchanged
- `renderPendingProposalCue` not routed

---

## Recommended Next Boundary

Verify both alert-row cue ownership is complete (Song Vote + Rehearsal module wrappers), then decide:

1. Route `renderPendingProposalCue` in a separate approved phase, or
2. Stop/handoff with integrity-only verification doc before broader ownership cleanup

---

## Commit Status

**Not committed** — awaiting review and approval.
