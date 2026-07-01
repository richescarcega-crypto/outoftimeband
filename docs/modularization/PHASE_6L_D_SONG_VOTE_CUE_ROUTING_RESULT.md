# Phase 6l-d Song Vote Cue Routing Result

## Status

- **PASS** for integrity verification.
- Browser/manual verification **not run** — work-computer static-server tooling block.
- **No CSS, layout constant, placement, or rehearsal cue routing changes intended.**
- Song-vote cue HTML/visibility now built by scaffold on normal path; legacy fallback preserved.

**Scope:** Route `renderHomeSongVoteCue()` through `OOT.home.cueRenderer.buildSongVoteCueView` at `7a75ad5` baseline + this slice.

---

## Repo State

| Item | Value |
|------|--------|
| Branch | `modularization-home-layout-engine-pilot` |
| Baseline HEAD (short) | `7a75ad5` — *Add Home cue renderer scaffold* |
| Untracked (local-only) | `oot-local-server.ps1` (**do not commit**) |

---

## Files Changed

| File | Change |
|------|--------|
| `oot_home_cue_renderer.js` | Added `buildSongVoteCueView(input)`; phase → `6l-d-song-vote-routing`; `routed.songVote: true` |
| `index.html` | `renderHomeSongVoteCue()` routes through scaffold + legacy fallback apply path |
| `tests/integrity/home-controller-package.mjs` | `assertPhase6lDSongVoteCueRouting` |
| `tests/integrity/home-layout-engine-package.mjs` | Phase 6l-d diff allowlist for song-vote routing refactor |
| `docs/modularization/PHASE_6L_D_SONG_VOTE_CUE_ROUTING_RESULT.md` | This result record |

No CSS edits. No `renderHomeRehearsalCue()` changes.

---

## Song-Vote Cue Routing Change

### Normal path (`index.html`)

After existing state derivation (`cueItems`, `userSpecific`, `sourceBranch`):

1. Resolve `window.OOT.home.cueRenderer`.
2. Call `buildSongVoteCueView({ cueItems, userSpecific, sourceBranch, hasTarget: true })`.
3. Apply returned view to legacy DOM node:
   - hidden: `el.style.display = 'none'`, `el.innerHTML = ''`
   - visible: `el.style.display = 'block'`, `el.innerHTML = _svView.html`
4. Preserve existing 6l-b `_recordHomeCueRenderDiag`, alert-rail sync, notify, and reconcile tails unchanged.

### Scaffold method (`buildSongVoteCueView`)

Returns a small result object (no DOM writes):

| Field | Meaning |
|-------|---------|
| `visible` | Whether cue should display |
| `html` | Exact legacy button markup string (empty when hidden) |
| `sourceBranch` | `pendingForMe` / `openSuggestions` / `anyActive` / `none` |
| `kicker` | **Song Vote Pending** |
| `activeCount` | `cueItems.length` |
| `rendersDom: false` | Module does not apply DOM |

Uses `.slice()` on input array (no mutation of caller arrays).

---

## Fallback Path Preserved

When `OOT.home.cueRenderer` or `buildSongVoteCueView` is unavailable:

```javascript
if (!_svView) {
  // legacy inline build of { visible, html, sourceBranch }
}
```

Fallback HTML, labels, onclick (`openSongVoteModal`), classes, and kicker text match pre-6l-d legacy output character-for-character.

---

## Rehearsal Cue Not Routed

`renderHomeRehearsalCue()` remains fully legacy-owned in `index.html`. Integrity asserts no `buildSongVoteCueView` or `OOT.home.cueRenderer` references inside rehearsal renderer body.

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
| `home-controller-package.mjs` | **PASS** (Phase 6l-d song-vote routing) |
| `home-layout-engine-package.mjs` | **PASS** |
| `home-diag-package.mjs` | **PASS** |
| `home-alert-rail-package.mjs` | **PASS** |
| `home-gig-slot-package.mjs` | **PASS** |

---

## Browser / Manual Verification

**Not run.** Work-computer local static-server path remains blocked.

When unblocked, compare `__ootGetHomeCueRenderDiag()` before/after song-vote activity; confirm pill markup unchanged.

---

## Explicit Non-Changes

- No CSS edits
- No cue placement / layout constant changes
- No rehearsal cue routing
- No Firestore listener changes
- No modular-inflow default enablement

---

## Recommended Next Boundary

**Phase 6l-e (or next approved slice): route rehearsal cue only** — add `buildRehearsalCueView(input)` mirroring this pattern, with legacy fallback, after this commit is pushed and reviewed.

---

## Commit Status

**Not committed** — awaiting review and approval.
