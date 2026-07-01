# Phase 6l-h Song Vote Render Wrapper Result

## Status

- **PASS** for integrity verification.
- Browser/manual verification **not run** — work-computer static-server tooling block.
- **No CSS, layout constant, placement, markup, or Firestore changes intended.**
- Song Vote cue build+apply ownership moved into cue renderer module; Rehearsal cue path unchanged.

**Scope:** Add module-owned Song Vote render wrapper at `b2d1b41` baseline + this slice.

---

## Repo State

| Item | Value |
|------|--------|
| Branch | `modularization-home-layout-engine-pilot` |
| Baseline HEAD (short) | `b2d1b41` — *Add Home cue input builders* |
| Working HEAD (uncommitted) | `b2d1b41` (same commit; changes in working tree only) |
| Untracked (local-only) | `oot-local-server.ps1` (**do not commit**) |

---

## Files Changed

| File | Change |
|------|--------|
| `oot_home_cue_renderer.js` | Added `renderSongVoteCue(targetEl, input)`; phase → `6l-h-song-vote-render-wrapper` |
| `index.html` | Normal path calls `renderSongVoteCue`; fallback retains `buildSongVoteCueView` + `_applyHomeCueView` + inline legacy |
| `tests/integrity/home-controller-package.mjs` | `assertPhase6lHSongVoteRenderWrapper`; prior phase assertions aligned for fallback apply |
| `tests/integrity/home-layout-engine-package.mjs` | Phase 6l-h diff allowlist |
| `docs/modularization/PHASE_6L_H_SONG_VOTE_RENDER_WRAPPER_RESULT.md` | This result record |

No CSS edits. `renderHomeRehearsalCue()` and `renderPendingProposalCue()` untouched.

---

## Song Vote Wrapper Added

### Module method (`oot_home_cue_renderer.js`)

```javascript
renderSongVoteCue(targetEl, input)
```

Flow:

1. `buildSongVoteCueView(input)`
2. `applyCueView(targetEl, view)`
3. Return `{ rendered, visible, sourceBranch, activeCount, applied, htmlLength, rendersDom: true }`

Does **not** call Firestore, `rHome`, `requestHomeReconcile`, `reconcileHomeLayout`, write CSS vars, or touch `localStorage`. Does not mutate input arrays.

---

## Song Vote Build+Apply Ownership Moved

### Normal path (`index.html`)

After legacy state derivation and `_buildHomeSongVoteCueInput(...)`:

1. Call `cueRenderer.renderSongVoteCue(el, _svInput)` — module owns build + apply
2. Set `_svModuleApplied = true` when wrapper succeeds
3. Preserve diag / alert-rail / notify / reconcile tails using wrapper result metadata

### Fallback paths preserved

| Condition | Behavior |
|-----------|----------|
| `renderSongVoteCue` unavailable | `buildSongVoteCueView(_svInput)` then `_applyHomeCueView` |
| Module unavailable | Inline legacy view build then `_applyHomeCueView` |
| Module applied DOM | Skip `_applyHomeCueView` via `if (!_svModuleApplied)` guard |

---

## Rehearsal Cue Path Preserved

`renderHomeRehearsalCue()` still uses:

- `_buildHomeRehearsalCueInput(...)` for input packaging
- `buildRehearsalCueView(_rhInput)` for view build
- `_applyHomeCueView(el, _rhView)` for DOM apply

Not routed through `renderSongVoteCue`.

---

## Shared Apply Seam Preserved

- `applyCueView` retained in module (called by `renderSongVoteCue` on normal path)
- `_legacyApplyHomeCueView` + `_applyHomeCueView` retained in index.html for Song Vote fallback and Rehearsal cue

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
| `home-controller-package.mjs` | **PASS** (Phase 6l-h Song Vote render wrapper) |
| `home-layout-engine-package.mjs` | **PASS** |
| `home-diag-package.mjs` | **PASS** |
| `home-alert-rail-package.mjs` | **PASS** |
| `home-gig-slot-package.mjs` | **PASS** |

Key assertions:

- `renderSongVoteCue` exists and calls `buildSongVoteCueView` + `applyCueView`
- Forbidden calls absent from wrapper body
- `renderHomeSongVoteCue` calls `renderSongVoteCue` on normal path
- Fallback `buildSongVoteCueView` + `_applyHomeCueView` + inline legacy retained
- Rehearsal cue not routed through `renderSongVoteCue`
- `renderPendingProposalCue` untouched
- No CSS edits; no modular-inflow default

---

## Browser / Manual Verification

**Not run.** Work-computer local static-server path remains blocked.

When unblocked: confirm Song Vote Pending pill unchanged during song-vote activity.

---

## Explicit Non-Changes

- No CSS edits
- No Home visual / layout constant / cue placement changes
- No cue markup text / classes / handler changes
- No Firestore listener changes
- No modular-inflow default enablement
- Rehearsal cue and `renderPendingProposalCue` not routed through new wrapper

---

## Recommended Next Boundary

Either:

1. **Mirror same wrapper for Rehearsal cue** — add `renderRehearsalCue(targetEl, input)` in a separate approved phase, or
2. **Verify/stop** — integrity-only handoff before broader cue ownership cleanup

---

## Commit Status

**Not committed** — awaiting review and approval.
