# Phase 6l-c Home Cue Renderer Scaffold Result

## Status

- **PASS** for integrity verification.
- Browser/manual verification **not run** — work-computer static-server tooling block (same as Phase 6j/6k/6l-b).
- **No CSS, Home visual, markup, placement, or control-flow changes.**
- **No cue renderer routing** — legacy `renderHomeSongVoteCue` / `renderHomeRehearsalCue` still own all visible output.

**Scope:** No-behavior `OOT.home.cueRenderer` scaffold at `b09e0f7` baseline + this slice.

---

## Repo State

| Item | Value |
|------|--------|
| Branch | `modularization-home-layout-engine-pilot` |
| Baseline HEAD (short) | `b09e0f7` — *Add Home cue render diagnostics* |
| Working tree | Modified/new files listed below |
| Untracked (local-only) | `oot-local-server.ps1` (**do not commit**) |

---

## Files Changed

| File | Change |
|------|--------|
| `oot_home_cue_renderer.js` | **New** — metadata-only cue renderer scaffold |
| `index.html` | Script include only (`oot_home_cue_renderer.js`) |
| `oot_compat_home.js` | Read-only compat globals for cue renderer |
| `tests/integrity/home-controller-package.mjs` | `assertPhase6lCHomeCueRendererScaffold` |
| `tests/integrity/home-layout-engine-package.mjs` | Script ref + load-order + diff allowlist |
| `docs/modularization/PHASE_6L_C_HOME_CUE_RENDERER_SCAFFOLD_RESULT.md` | This result record |

No CSS edits. No changes to legacy renderer bodies, Firestore listeners, or reconcile hooks.

---

## Scaffold Added

### Namespace

`window.OOT.home.cueRenderer`

### Phase marker

`PHASE = '6l-c-cue-renderer-scaffold'`, `scaffold: true`, `routed: false`

### Methods (metadata-only)

| Method | Purpose |
|--------|---------|
| `getState()` | Scaffold phase, snapshot counters, cue IDs, kicker labels |
| `snapshot()` | JSON-cloned `getState()` |
| `describe()` | Read-only module descriptor (methods list, owner=`legacy-index-html`, `routed: false`) |
| `canRenderSongVoteCue(input)` | Returns boolean from `activeCount` / `hasTarget` — no DOM |
| `canRenderRehearsalCue(input)` | Returns boolean from `visible` / `activeCount` / `hasTarget` — no DOM |
| `renderSongVoteCueSnapshot(input)` | Returns metadata object with `rendersDom: false`, kicker **Song Vote Pending** |
| `renderRehearsalCueSnapshot(input)` | Returns metadata object with `rendersDom: false`, kicker **Rehearsal on Deck** |

### Constants exposed on API

- `CUE_IDS`: `home-song-vote-cue`, `home-rehearsal-cue`
- `KICKERS`: canonical kicker strings (metadata only)

### Read-only globals

- `window.getHomeCueRendererState` (from module; restored by compat)
- `window.describeHomeCueRenderer` (from module; restored by compat)

### Explicit non-behavior

The module does **not**:

- Write DOM or CSS vars
- Write localStorage or touch Firestore
- Call `rHome`, `requestHomeReconcile`, or `reconcileHomeLayout`
- Generate or apply visible HTML
- Mutate `suggestions[]`, `events[]`, or `proposals[]`

---

## Script / Module Wiring

Load order in `index.html`:

```
oot_home_band_image.js
oot_home_alert_rail.js
oot_home_cue_renderer.js   ← new
oot_home_gig_slot.js
oot_home_layout_engine.js
oot_home_diag.js
oot_home_controller.js
oot_compat_home.js
```

**No runtime calls** from `index.html` into `OOT.home.cueRenderer` yet — script include only.

`oot_compat_home.js` adds read-only shims:

- `getHomeCueRendererState` ← `cueRenderer.getState`
- `describeHomeCueRenderer` ← `cueRenderer.describe`

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
| `home-controller-package.mjs` | **PASS** (Phase 6l-c scaffold checks) |
| `home-layout-engine-package.mjs` | **PASS** |
| `home-diag-package.mjs` | **PASS** |
| `home-alert-rail-package.mjs` | **PASS** |
| `home-gig-slot-package.mjs` | **PASS** |

New assertions verify: module packaged/referenced, namespace + methods, forbidden-call scan, script load order, legacy renderers + kicker strings preserved, no `OOT.home.cueRenderer` routing in `index.html`, no modular-inflow default.

---

## Browser / Manual Verification

**Not run.** Work-computer local static-server path remains blocked. When unblocked:

```javascript
describeHomeCueRenderer()
getHomeCueRendererState()
OOT.home.cueRenderer.renderSongVoteCueSnapshot({ activeCount: 1, sourceBranch: 'pendingForMe' })
```

Expect metadata only (`rendersDom: false`); Home pills unchanged.

---

## Explicit Non-Changes

- No CSS edits
- No cue markup / placement / visual behavior changes
- No layout constant changes
- No Firestore listener changes
- No routing through scaffold (Phase 6l-d)
- No modular-inflow default enablement
- No broad hook rollout

---

## Recommended Next Boundary: Phase 6l-d

**Route one cue path through scaffold with legacy fallback:**

- Candidate: song-vote cue first (simpler branch model than rehearsal proposal fallback).
- Pattern: mirror rHome tail adapter — try `OOT.home.cueRenderer` apply helper when present, else existing inline `innerHTML` body unchanged.
- Use Phase 6l-b diag (`__ootGetHomeCueRenderDiag`) + scaffold `getState().snapshotCount` to confirm no double-render or behavior drift before second cue migration.

---

## Commit Status

**Not committed** — awaiting review and approval.
