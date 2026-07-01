# Phase 6l-g Home Cue Input Builders Result

## Status

- **PASS** for integrity verification.
- Browser/manual verification **not run** — work-computer static-server tooling block.
- **No CSS, layout constant, placement, markup, or Firestore changes intended.**
- Named input-packaging helpers extracted for alert-row cues; view routing and apply seam from 6l-d/6l-e/6l-f preserved.

**Scope:** Extract Home alert-row cue input builder helpers at `2b3e24d` baseline + this slice.

---

## Repo State

| Item | Value |
|------|--------|
| Branch | `modularization-home-layout-engine-pilot` |
| Baseline HEAD (short) | `2b3e24d` — *Add shared Home cue apply seam* |
| Working HEAD (uncommitted) | `2b3e24d` (same commit; changes in working tree only) |
| Untracked (local-only) | `oot-local-server.ps1` (**do not commit**) |

---

## Files Changed

| File | Change |
|------|--------|
| `index.html` | Added `_buildHomeSongVoteCueInput` + `_buildHomeRehearsalCueInput`; render functions call helpers after state derivation |
| `tests/integrity/home-controller-package.mjs` | `assertPhase6lGHomeCueInputBuilders` |
| `tests/integrity/home-layout-engine-package.mjs` | Phase 6l-g diff allowlist |
| `docs/modularization/PHASE_6L_G_HOME_CUE_INPUT_BUILDERS_RESULT.md` | This result record |

No CSS edits. `oot_home_cue_renderer.js` untouched. `renderPendingProposalCue()` untouched.

---

## Input Builders Added

### Song vote (`index.html`)

```javascript
_buildHomeSongVoteCueInput(cueItems, userSpecific, sourceBranch)
```

Returns plain object:

| Field | Value |
|-------|--------|
| `cueItems` | Passed array reference (no mutation) |
| `userSpecific` | Boolean from state derivation |
| `sourceBranch` | `pendingForMe` / `openSuggestions` / `anyActive` |
| `hasTarget` | `true` |

### Rehearsal (`index.html`)

```javascript
_buildHomeRehearsalCueInput(args)
```

Returns plain object with `hasTarget: true` and branch-specific fields:

| Branch | Fields packaged |
|--------|-----------------|
| `hidden-no-events` / `hidden-no-rehearsal` | `sourceBranch` only |
| `proposalFallback` / `rehearsalEvent` | `sourceBranch`, `evIdEscaped`, `titleEscaped`, `subEscaped`, `noteEscaped`, `hasNote` |

Neither helper writes DOM, CSS vars, or localStorage; does not call Firestore, `rHome`, `requestHomeReconcile`, or `reconcileHomeLayout`.

---

## Song-Vote and Rehearsal Routing Preserved

### Song vote flow (unchanged semantics)

1. Derive `cueItems`, `userSpecific`, `sourceBranch` via existing `_pendingSongSuggestionsForMe` / fallback queries
2. Call `buildSongVoteCueView(_buildHomeSongVoteCueInput(...))`
3. Legacy view fallback (`if (!_svView)`) unchanged
4. Apply via `_applyHomeCueView`; diag / alert-rail / notify / reconcile order unchanged

### Rehearsal flow (unchanged semantics)

1. Derive event/rehearsal state via existing early-hidden, `_r535NextUpcomingRehearsal`, escape/format helpers
2. Package via `_buildHomeRehearsalCueInput({ ... })`
3. Call `buildRehearsalCueView(_rhInput)`
4. Legacy view fallback (`if (!_rhView)`) unchanged
5. Apply via `_applyHomeCueView`; image refresh / diag / alert-rail / notify / reconcile order unchanged

Kicker strings (**Song Vote Pending**, **Rehearsal on Deck**), onclick handlers, classes, and HTML markup strings unchanged.

---

## Shared Apply Seam Preserved

- `OOT.home.cueRenderer.applyCueView` unchanged in module
- `_legacyApplyHomeCueView` + `_applyHomeCueView` unchanged
- Both render functions still call `_applyHomeCueView(el, view)` on hidden + visible paths

---

## Fallback Paths Preserved

- Song vote: `if (!_svView)` inline view build unchanged
- Rehearsal: `if (!_rhView)` inline view build unchanged
- Apply: `_applyHomeCueView` → `applyCueView` with `_legacyApplyHomeCueView` fallback

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
| `home-controller-package.mjs` | **PASS** (Phase 6l-g Home cue input builders) |
| `home-layout-engine-package.mjs` | **PASS** |
| `home-diag-package.mjs` | **PASS** |
| `home-alert-rail-package.mjs` | **PASS** |
| `home-gig-slot-package.mjs` | **PASS** |

Key assertions:

- `_buildHomeSongVoteCueInput` and `_buildHomeRehearsalCueInput` exist
- Both render functions call their input builder helper
- Builders forbid DOM/Firestore/reconcile/localStorage/CSS var writes
- `buildSongVoteCueView` / `buildRehearsalCueView` routing retained
- Shared apply seam and legacy fallbacks retained
- `renderPendingProposalCue` untouched
- No CSS edits; no modular-inflow default

---

## Browser / Manual Verification

**Not run.** Work-computer local static-server path remains blocked.

When unblocked: confirm alert-row pills unchanged during song-vote and rehearsal activity.

---

## Explicit Non-Changes

- No CSS edits
- No Home visual / layout constant / cue placement changes
- No cue markup text / classes / handler changes
- No Firestore listener changes
- No modular-inflow default enablement
- `renderPendingProposalCue` not routed
- `oot_home_cue_renderer.js` not modified

---

## Recommended Next Boundary

Either:

1. **Move one full cue renderer ownership wrapper** into `oot_home_cue_renderer.js` (e.g. input builders + thin index.html delegate), or
2. **Verify/stop** — integrity-only handoff doc after input-builder seam before broader ownership cleanup

---

## Commit Status

**Not committed** — awaiting review and approval.
