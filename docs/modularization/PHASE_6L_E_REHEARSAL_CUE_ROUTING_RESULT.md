# Phase 6l-e Rehearsal Cue Routing Result

## Status

- **PASS** for integrity verification.
- Browser/manual verification **not run** — work-computer static-server tooling block.
- **No CSS, layout constant, placement, or Firestore changes intended.**
- Rehearsal cue HTML/visibility now built by scaffold on normal path; legacy fallback preserved.
- Song-vote cue routing from Phase 6l-d **preserved**.

**Scope:** Route `renderHomeRehearsalCue()` through `OOT.home.cueRenderer.buildRehearsalCueView` at `62c7337` baseline + this slice.

---

## Repo State

| Item | Value |
|------|--------|
| Branch | `modularization-home-layout-engine-pilot` |
| Baseline HEAD (short) | `62c7337` — *Route song vote cue through renderer* |
| Untracked (local-only) | `oot-local-server.ps1` (**do not commit**) |

---

## Files Changed

| File | Change |
|------|--------|
| `oot_home_cue_renderer.js` | Added `buildRehearsalCueView(input)`; phase → `6l-e-rehearsal-routing`; `routed.rehearsal: true` |
| `index.html` | `renderHomeRehearsalCue()` routes through scaffold + legacy fallback unified apply |
| `tests/integrity/home-controller-package.mjs` | `assertPhase6lERehearsalCueRouting`; updated Phase 6g/6l-b rehearsal hook counts for unified apply |
| `tests/integrity/home-layout-engine-package.mjs` | Phase 6l-e diff allowlist |
| `docs/modularization/PHASE_6L_E_REHEARSAL_CUE_ROUTING_RESULT.md` | This result record |

No CSS edits. No song-vote routing changes beyond test alignment.

---

## Rehearsal Cue Routing Change

### State derivation (unchanged logic, repackaged)

`renderHomeRehearsalCue()` still derives:

- Early hidden when `!_eventsHasInit && !events.length && !earlyProp` → `sourceBranch: 'hidden-no-events'`
- Else `_r535NextUpcomingRehearsal()` → hidden or visible packaging
- Visible path passes pre-escaped fields: `evIdEscaped`, `titleEscaped`, `subEscaped`, `noteEscaped`, `hasNote`, `sourceBranch` (`proposalFallback` | `rehearsalEvent`)

### Normal path

1. Resolve `OOT.home.cueRenderer`
2. Call `buildRehearsalCueView(_rhInput)`
3. Apply unified result:
   - hidden: `display:none`, clear HTML, image refresh + diag + alert-rail + notify + reconcile tails
   - visible: `display:block`, `innerHTML = _rhView.html`, same tail order as legacy

### Scaffold method (`buildRehearsalCueView`)

Returns metadata + HTML string only (`rendersDom: false`):

| Field | Purpose |
|-------|---------|
| `visible` | Show/hide cue |
| `html` | Exact legacy Rehearsal on Deck button markup |
| `sourceBranch` | Diagnostic branch label |
| `imageRefreshReason` | Routed notify/schedule strings |
| `diagTag` | `_homeLayoutDiagSnapshot` tag |
| `kicker` | **Rehearsal on Deck** |

Hidden branches return empty `html` with branch-specific `imageRefreshReason` / `diagTag`.

---

## Fallback Path Preserved

When scaffold unavailable:

```javascript
if (!_rhView) {
  // legacy inline build for hidden-no-events, hidden-no-rehearsal, or visible HTML
}
```

Fallback preserves `_r535OpenHomeRehearsal` onclick, kicker text, classes, and tail reason strings.

---

## Song-Vote Cue Routing Preserved

`renderHomeSongVoteCue()` still routes via `buildSongVoteCueView` + `if (!_svView)` legacy fallback (Phase 6l-d). Integrity asserts both paths remain.

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
| `home-controller-package.mjs` | **PASS** (Phase 6l-e rehearsal routing) |
| `home-layout-engine-package.mjs` | **PASS** |
| `home-diag-package.mjs` | **PASS** |
| `home-alert-rail-package.mjs` | **PASS** |
| `home-gig-slot-package.mjs` | **PASS** |

---

## Browser / Manual Verification

**Not run.** Work-computer local static-server path remains blocked.

When unblocked: compare `__ootGetHomeCueRenderDiag()` and `getHomeCueRendererState()` (`routed.songVote` + `routed.rehearsal` both true) during rehearsal/song-vote activity; confirm pills unchanged.

---

## Explicit Non-Changes

- No CSS edits
- No cue placement / layout constant changes
- No Firestore listener changes
- No modular-inflow default enablement
- Song-vote routing unchanged (6l-d)

---

## Recommended Next Boundary: Phase 6l-f

**Verification/result record** after both alert-row cues route through scaffold:

- Integrity-only verification doc (like Phase 6k-e)
- Optional read-only compare of `__ootGetHomeCueRenderDiag` vs `getHomeCueRendererState()` snapshot counts
- Then consider Home cue ownership cleanup (e.g. dedupe fallback HTML bodies into module-only with thin legacy shim) in a later approved phase

---

## Commit Status

**Not committed** — awaiting review and approval.
