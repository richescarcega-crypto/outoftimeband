# Phase 6s-b — Song Vote Derivation Checkpoint

## Status

**Checkpoint / documentation only.** No runtime behavior changed by this document.

This records the Song Vote cue **derivation seam** added in Phase **6s-a**, following the planning direction from Phase **6r-a** (`PHASE_6R_A_HOME_CUE_OWNERSHIP_NEXT_SEAM_PLAN.md`).

---

## Repo Baseline

| Item | Value |
|------|--------|
| Branch | `modularization-home-layout-engine-pilot` |
| Current HEAD (short) | `90b5487` — *Add Song Vote cue derivation seam* |
| Working tree | Clean except untracked `oot-local-server.ps1` (**do not commit**) |

### Phase 6s-a commit recorded

| Commit | Summary |
|--------|---------|
| `90b5487` | Add Song Vote cue derivation seam (Phase 6s-a) |

### Upstream context (Song Vote cue path)

| Phase | Deliverable |
|-------|-------------|
| **6l-d / 6l-e / 6l-f** | `buildSongVoteCueView`, shared `applyCueView`, alert-row apply seam |
| **6l-g** | `_buildHomeSongVoteCueInput` input packaging |
| **6l-h** | `renderSongVoteCue` module wrapper |
| **6e-c / 6g** | Home-active gated `requestHomeReconcile('cue:song-vote')` hooks (2×) |
| **6r-a** | Planning inventory — recommended Song Vote derivation as next slice |
| **6s-a** | `deriveSongVoteCueState` + `_deriveSongVoteCueState()` wrapper |

Pending proposal cue modularization (6o through 6q) remains a separate arc and was **not modified** in 6s-a.

---

## Purpose

Phase **6s-a** moved Song Vote cue **input derivation** (which suggestions to show, user-specific vs fallback branch) into `OOT.home.cueRenderer`, mirroring the proven pending proposal derivation pattern from Phase **6o-b**.

Phase **6s-b** (this document) records that checkpoint without introducing new runtime behavior.

---

## Files Changed in Phase 6s-a

| File | Role |
|------|------|
| `oot_home_cue_renderer.js` | `deriveSongVoteCueState(input)` pure helper + API export |
| `index.html` | `_deriveSongVoteCueState()` / `_legacyDeriveSongVoteCueState()` wrappers; `renderHomeSongVoteCue()` delegates derivation |
| `tests/integrity/home-controller-package.mjs` | `assertPhase6sASongVoteDeriveSeam` |
| `tests/integrity/home-layout-engine-package.mjs` | Diff allowlist for Song Vote derivation delegation lines |

---

## Module Seam Added (Phase 6s-a)

### `OOT.home.cueRenderer.deriveSongVoteCueState(input)`

Pure derivation helper. No DOM, Firestore, listener, or push side effects.

#### Input contract

| Field | Type | Notes |
|-------|------|-------|
| `suggestions` | `Array` | Snapshot of current suggestion docs |
| `currentMemberId` | `string` | Current member id (`ME` in index.html) |
| `members` | `Array` | Band member list (used for band-size vote threshold) |

#### Return contract

```javascript
{
  cueItems: Array,      // suggestions selected for the cue
  userSpecific: boolean,
  sourceBranch: string  // 'pendingForMe' | 'openSuggestions' | 'anyActive'
}
```

When all branches yield no items, return is `{ cueItems: [], userSpecific: false, sourceBranch: 'anyActive' }` — matching legacy inline behavior.

---

## Branch Order Preserved (Legacy Behavior)

Derivation runs three filters in order; first non-empty result wins:

| Order | Branch | Logic |
|-------|--------|-------|
| 1 | **`pendingForMe`** | Suggestions where the current member has **not** voted (`yesVoters` / `noVoters` do not include `currentMemberId`) |
| 2 | **`openSuggestions`** | Open suggestions (not closed/cancelled/deleted) where total votes `(yes + no) < bandSize` |
| 3 | **`anyActive`** | Broad fallback: suggestions not closed/cancelled/deleted/archived and not `deleted` / `archived` |

| Branch | `userSpecific` |
|--------|----------------|
| `pendingForMe` | `true` |
| `openSuggestions` | `false` |
| `anyActive` | `false` |

---

## What Remains in index.html

| Function | Role |
|----------|------|
| `_pendingSongSuggestionsForMe()` | Legacy helper; still used elsewhere (including `pendingSuggestionVotes` count) |
| `_homeOpenSongSuggestions()` | Legacy fallback helper (r808 incomplete-vote path) |
| `_homeAnyActiveSongSuggestions()` | Legacy fallback helper (r809 broad active path) |
| `_legacyDeriveSongVoteCueState()` | Legacy branch orchestration using the three helpers above |
| `_deriveSongVoteCueState()` | Public wrapper — prefers module; falls back to `_legacyDeriveSongVoteCueState()` |
| `_buildHomeSongVoteCueInput()` | Input packaging remains in index.html |
| `renderHomeSongVoteCue()` | Public render owner — calls `_deriveSongVoteCueState()` then existing render path |

---

## What Was Intentionally Not Moved in Phase 6s-a

| Concern | Status |
|---------|--------|
| Render orchestration | Still in `renderHomeSongVoteCue()` → `renderSongVoteCue` / fallbacks |
| Target collection | Static `#home-song-vote-cue` — no collection seam |
| HomeController notify/reconcile timing | Still generic `notifyCueChange` + inline `requestHomeReconcile('cue:song-vote')` |
| Rehearsal cue paths | Untouched |
| Pending proposal cue paths | Untouched |

---

## Current Song Vote Cue Architecture (after 6s-a)

```
renderHomeSongVoteCue()                         [index.html — public wrapper / call site]
  ├─ _svDerived = _deriveSongVoteCueState()    [index.html wrapper — 6s-a]
  │    └─ deriveSongVoteCueState(input)        [module]
  │         fallback: _legacyDeriveSongVoteCueState()
  │           └─ _pendingSongSuggestionsForMe / _homeOpenSongSuggestions / _homeAnyActiveSongSuggestions
  ├─ _buildHomeSongVoteCueInput(cueItems, userSpecific, sourceBranch)
  ├─ renderSongVoteCue(el, _svInput)           [module — 6l-h]
  │    fallback: buildSongVoteCueView + _applyHomeCueView + inline HTML
  ├─ syncAlertRailState('renderHomeSongVoteCue')
  ├─ notifyCueChange('renderHomeSongVoteCue')
  └─ requestHomeReconcile('cue:song-vote')     [Home-active gated, 2× hooks preserved]
```

| Layer | Owner |
|-------|--------|
| Derivation | `OOT.home.cueRenderer.deriveSongVoteCueState` |
| Input packaging | `_buildHomeSongVoteCueInput` (index.html) |
| View build / apply / render | `buildSongVoteCueView` / `applyCueView` / `renderSongVoteCue` (module) |
| Notify / reconcile timing | Generic `notifyCueChange` + inline reconcile (index.html) |
| Public entry + fallbacks | `index.html` |

---

## Behavior Preserved

### Derivation path

- Module logic is a **direct copy** of the three legacy filters plus branch selection that previously lived inline in `renderHomeSongVoteCue()`.
- `_deriveSongVoteCueState()` passes the same `suggestions`, `ME` / `currentMemberId`, and `members` snapshots the legacy path used.
- On module failure, `_legacyDeriveSongVoteCueState()` runs the original helper chain unchanged.

### Render path (unchanged after derivation)

```
_buildHomeSongVoteCueInput
  → renderSongVoteCue / buildSongVoteCueView fallbacks
  → _applyHomeCueView
  → _recordHomeCueRenderDiag
  → syncAlertRailState
  → notifyCueChange
  → requestHomeReconcile('cue:song-vote')
```

- Existing **2×** `cue:song-vote` notify/reconcile hooks remain unchanged.
- No cue text, placement, selectors, CSS, Firestore, listener, push, or data-shape behavior changed.
- 6s-a did **not** re-run manual browser verification; visible Song Vote cue behavior is expected to match pre-6s-a because derivation output is identical on the normal path.

---

## Integrity Gate Results (Phase 6s-a)

All **five** standard gates **PASS** at commit `90b5487`:

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
| `home-controller-package.mjs` | **PASS** — Phase 6q-a + Phase 6s-a checks |
| `home-layout-engine-package.mjs` | **PASS** — Phase 5 layout engine checks |
| `home-diag-package.mjs` | **PASS** — Phase 1/1b/1c + 6b diagnostics |
| `home-alert-rail-package.mjs` | **PASS** — Phase 3 alert rail |
| `home-gig-slot-package.mjs` | **PASS** — Phase 4 gig slot |

This Phase **6s-b** document introduces **no new runtime behavior**.

---

## Hard Boundaries (Still in Force)

| Boundary | Status |
|----------|--------|
| CSS | No changes in 6s-a / 6s-b |
| Cue text | No changes |
| Cue visuals / placement | No changes |
| Target selectors | No changes |
| Firestore read/write logic | No changes |
| Listeners | No changes |
| Push notification behavior | No changes |
| Song suggestion/vote data shape | No changes |
| Pending proposal cue behavior | No changes |
| Rehearsal cue behavior | No changes |
| Broad refactor | Not permitted |
| Merge to `main` | Not approved |

---

## Recommended Next Slice

**Phase 6t-a** should be selected **only after repo verification** on this branch.

### Preferred direction (cautious)

**Song Vote render orchestration seam** — mirror pending proposal Phase **6o-c** (`renderPendingProposalCueSurface`), **only if** the diff remains narrow and behavior-preserving:

- Extract build → apply → success-flag orchestration behind a module helper (e.g. `renderSongVoteCueSurface(input)`).
- Keep `renderHomeSongVoteCue()` as public wrapper with full legacy fallback.
- Do **not** move HomeController notify/reconcile timing in the same slice unless the diff stays bounded.

### Alternative

Stop and create a **broader Phase 6 cue architecture checkpoint** if the next Song Vote render seam appears larger than expected (e.g. touches shared apply tails, alert rail ordering, or multiple cue families).

### Explicit non-goals

- Do **not** start pending response reminder backend work from this branch.
- Do **not** detour for deferred cleanup (e.g. Rehearsal on Deck pill placement) unless it becomes functional breakage or current-slice regression.

---

## Related Docs

- `PHASE_6R_A_HOME_CUE_OWNERSHIP_NEXT_SEAM_PLAN.md` — planning inventory; recommended 6s-a derivation
- `PHASE_6Q_B_PENDING_PROPOSAL_RECONCILE_NOTIFICATION_CHECKPOINT.md` — pending proposal arc checkpoint (parallel pattern reference)
- `PHASE_6O_D_PENDING_PROPOSAL_MODULARIZATION_CHECKPOINT.md` — pending proposal derive/render checkpoint (6o-b/c pattern to mirror for 6t-a)
- `PHASE_6N_HOME_CUE_NEXT_PLAN.md` — broader Home cue ownership inventory
