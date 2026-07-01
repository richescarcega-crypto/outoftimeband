# Phase 6l-f Home Cue Apply Seam Result

## Status

- **PASS** for integrity verification.
- Browser/manual verification **not run** — work-computer static-server tooling block.
- **No CSS, layout constant, placement, markup, or Firestore changes intended.**
- Shared DOM apply seam extracted for alert-row cues; build/view routing from 6l-d/6l-e preserved.

**Scope:** Extract shared no-visual-change DOM apply helper for Song Vote Pending and Rehearsal on Deck cues at `9c1128b` baseline + this slice.

---

## Repo State

| Item | Value |
|------|--------|
| Branch | `modularization-home-layout-engine-pilot` |
| Baseline HEAD (short) | `9c1128b` — *Route rehearsal cue through renderer* |
| Working HEAD (uncommitted) | `9c1128b` (same commit; changes staged in working tree only) |
| Untracked (local-only) | `oot-local-server.ps1` (**do not commit**) |

---

## Files Changed

| File | Change |
|------|--------|
| `oot_home_cue_renderer.js` | Added `applyCueView(targetEl, view)`; phase → `6l-f-home-cue-apply-seam`; exposed on `OOT.home.cueRenderer` |
| `index.html` | Added `_legacyApplyHomeCueView` + `_applyHomeCueView`; both alert-row renderers use shared apply on hidden/visible paths |
| `tests/integrity/home-controller-package.mjs` | `assertPhase6lFHomeCueApplySeam`; builder forbidden checks scoped before `applyCueView`; 6l-d/6l-e apply assertions updated |
| `tests/integrity/home-layout-engine-package.mjs` | Phase 6l-f diff allowlist for apply seam refactor |
| `docs/modularization/PHASE_6L_F_HOME_CUE_APPLY_SEAM_RESULT.md` | This result record |

No CSS edits. `renderPendingProposalCue()` untouched.

---

## Shared Apply Seam Added

### Module method (`oot_home_cue_renderer.js`)

```javascript
applyCueView(targetEl, view)
```

Behavior (no side effects beyond target element display/HTML):

| Path | DOM writes |
|------|------------|
| Hidden / invalid | `targetEl.style.display = 'none'`, `targetEl.innerHTML = ''` |
| Visible | `targetEl.style.display = 'block'`, `targetEl.innerHTML = view.html \|\| ''` |

Returns `{ applied, visible, htmlLength, rendersDom: true }` on success.

Does **not** call Firestore, `rHome`, `requestHomeReconcile`, `reconcileHomeLayout`, write CSS vars, or touch `localStorage`.

### Index wrapper (`index.html`)

| Helper | Role |
|--------|------|
| `_legacyApplyHomeCueView(el, view)` | Inline fallback with direct `display` / `innerHTML` (preserves pre-6l-f apply semantics) |
| `_applyHomeCueView(el, view)` | Prefers `cueRenderer.applyCueView`; falls back to `_legacyApplyHomeCueView` |

---

## Song-Vote and Rehearsal Cue Routing Preserved

Both alert-row cues retain the same control flow:

1. Derive state in `index.html` (unchanged)
2. Build view via `buildSongVoteCueView` / `buildRehearsalCueView` (with `if (!_svView)` / `if (!_rhView)` legacy inline build fallback)
3. Record diagnostics via `_recordHomeCueRenderDiag`
4. **Apply DOM** via `_applyHomeCueView(el, view)` (new shared seam)
5. Post-apply tails unchanged in relative order:
   - Rehearsal: image refresh → diag snapshot → alert-rail sync → notify → reconcile
   - Song vote: alert-rail sync → notify → reconcile

Kicker strings (**Song Vote Pending**, **Rehearsal on Deck**), onclick handlers (`openSongVoteModal`, `_r535OpenHomeRehearsal`), classes, and HTML markup strings are unchanged.

---

## Fallback Path Preserved

When `OOT.home.cueRenderer` or `applyCueView` is unavailable, `_applyHomeCueView` delegates to `_legacyApplyHomeCueView`:

```javascript
if(!view.visible){
  el.style.display = 'none';
  el.innerHTML = '';
  return;
}
el.style.display = 'block';
el.innerHTML = view.html || '';
```

Legacy inline view builders in `renderHomeSongVoteCue` / `renderHomeRehearsalCue` (`if (!_svView)` / `if (!_rhView)`) remain intact.

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
| `home-controller-package.mjs` | **PASS** (Phase 6l-f Home cue apply seam) |
| `home-layout-engine-package.mjs` | **PASS** |
| `home-diag-package.mjs` | **PASS** |
| `home-alert-rail-package.mjs` | **PASS** |
| `home-gig-slot-package.mjs` | **PASS** |

Key assertions added/updated:

- `applyCueView` exists and forbids Firestore / reconcile / localStorage / CSS var writes
- `renderHomeSongVoteCue` and `renderHomeRehearsalCue` each call `_applyHomeCueView` twice (hidden + visible)
- `_legacyApplyHomeCueView` retains direct display/innerHTML fallback
- Song-vote and rehearsal kicker/handler strings unchanged
- `renderPendingProposalCue` does not reference apply seam
- No CSS edits; no modular-inflow default

---

## Browser / Manual Verification

**Not run.** Work-computer local static-server path remains blocked.

When unblocked: confirm alert-row pills visually unchanged during song-vote and rehearsal activity; compare `__ootGetHomeCueRenderDiag()` entries for apply paths.

---

## Explicit Non-Changes

- No CSS edits
- No Home visual / layout constant / cue placement changes
- No cue markup text / classes / handler changes
- No Firestore listener changes
- No modular-inflow default enablement
- `renderPendingProposalCue` not routed

---

## Recommended Next Boundary

Either:

1. **Route remaining Home proposal micro-cue** (`renderPendingProposalCue`) through the cue renderer in a separate approved phase, or
2. **Verification/handoff** after this apply seam — integrity-only result record + optional diag snapshot compare before broader cue ownership cleanup

---

## Commit Status

**Not committed** — awaiting review and approval.
