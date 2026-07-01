# Phase 6l-b Home Cue Render Diagnostic Result

## Status

- **PASS** for integrity verification.
- Browser/manual verification **not run** — work-computer static-server tooling block (same as Phase 6j/6k).
- **No CSS, Home visual, markup, placement, or control-flow changes.**
- **No renderer extraction** implemented.

**Scope:** Bounded read-only diagnostics around legacy Home cue/action-pill renderers at `b00b49e` baseline + this slice.

---

## Repo State

| Item | Value |
|------|--------|
| Branch | `modularization-home-layout-engine-pilot` |
| Baseline HEAD (short) | `b00b49e` — *Document Phase 6l-a Home cue renderer inventory* |
| Working tree | Modified: `index.html`, integrity tests; new result doc |
| Untracked (local-only) | `oot-local-server.ps1` (**do not commit**) |

---

## Files Changed

| File | Change |
|------|--------|
| `index.html` | Added `__ootHomeCueRenderDiag`, `_recordHomeCueRenderDiag`, `__ootGetHomeCueRenderDiag`; instrumented `renderHomeSongVoteCue` and `renderHomeRehearsalCue` |
| `tests/integrity/home-controller-package.mjs` | Added `assertPhase6lBHomeCueRenderDiag` |
| `tests/integrity/home-layout-engine-package.mjs` | Allowlisted Phase 6l-b diagnostic diff lines in `index.html` |
| `docs/modularization/PHASE_6L_B_HOME_CUE_RENDER_DIAG_RESULT.md` | This result record |

No other files touched. No CSS edits. No modular module files changed.

---

## Diagnostics Added

### Global read-only state

```javascript
window.__ootHomeCueRenderDiag = {
  count: 0,
  byCue: { songVote: 0, rehearsal: 0 },
  lastAt: null,
  lastCue: null,
  recent: []   // capped at 12 entries
};
```

### Helper

`_recordHomeCueRenderDiag(cueName, snapshot)` — placed immediately before `renderHomeRehearsalCue()`:

- Increments `count` and `byCue[cueName]`.
- Appends a small snapshot to `recent` (cap **12** via splice).
- Reads `#sc-home.on` for `homeActive` only (read-only DOM read, same pattern as rHome tail diag).
- **Does not:** write DOM/CSS/localStorage/Firestore; call `rHome`, `requestHomeReconcile`, or `reconcileHomeLayout`; mutate cue markup.

### Getter

`window.__ootGetHomeCueRenderDiag()` — returns `JSON.parse(JSON.stringify(d))` clone or `null`.

### Snapshot fields (per recent entry)

| Field | Source |
|-------|--------|
| `cueName` | `'songVote'` or `'rehearsal'` |
| `at` | `Date.now()` |
| `order` | monotonic render order (`count`) |
| `visible` | derived visibility decision |
| `hasTarget` | cue container present (`true` on instrumented paths) |
| `activeCount` | song: `cueItems.length` or `0`; rehearsal visible: `1` |
| `sourceBranch` | song: `pendingForMe` / `openSuggestions` / `anyActive` / `none`; rehearsal: `hidden-no-events` / `hidden-no-rehearsal` / `rehearsalEvent` / `proposalFallback` |
| `homeActive` | `#sc-home` has class `on` |

---

## Cue Renderers Instrumented

| Function | Diagnostic calls | Placement |
|----------|------------------|-----------|
| `renderHomeSongVoteCue()` | 2 | After state derivation, **before** `display` / `innerHTML` mutations (hidden + visible branches) |
| `renderHomeRehearsalCue()` | 3 | Before DOM mutations on hidden-no-events, hidden-no-rehearsal, and visible branches |

**Preserved unchanged:**

- Kicker strings **"Song Vote Pending"** and **"Rehearsal on Deck"**
- Inline pill HTML, CSS classes, onclick handlers
- Post-render tails: `syncAlertRailState`, `notifyCueChange`, `requestHomeReconcile('cue:…')`, image refresh

Added `sourceBranch` tracking variable in song-vote renderer only (label for diag; no logic branch change).

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
| `home-controller-package.mjs` | **PASS** (Phase 6l-b cue render diag checks) |
| `home-layout-engine-package.mjs` | **PASS** |
| `home-diag-package.mjs` | **PASS** |
| `home-alert-rail-package.mjs` | **PASS** |
| `home-gig-slot-package.mjs` | **PASS** |

New controller assertions verify: diag object/helper/getter exist; helper forbids `rHome` / reconcile / localStorage; recent cap 12; both renderers call helper; kicker strings preserved; no modular-inflow default.

---

## Browser / Manual Verification

**Not run.** Work-computer local static-server path remains blocked (`py` not recognized). No CDP smoke. Prior phases waived browser verification for equivalent constraints.

Console inspection when unblocked:

```javascript
__ootGetHomeCueRenderDiag()
```

---

## Explicit Non-Changes

- No CSS edits
- No cue markup / placement / visual behavior changes
- No layout constant changes
- No Firestore listener changes
- No renderer extraction (`HomeCueRenderer` / `HomeCueController` scaffold deferred)
- No modular-inflow default enablement
- No broad hook rollout

---

## Recommended Next Boundary: Phase 6l-c

**No-behavior `HomeCueRenderer` / `HomeCueController` scaffold:**

- Accept existing derived state (same inputs as legacy helpers already compute).
- Return/apply identical markup strings and `display` values.
- Legacy inline renderers remain fallback until deliberately migrated.
- Use Phase 6l-b diag (`__ootGetHomeCueRenderDiag`) to compare render timing/counts before/after scaffold landing.

---

## Commit Status

**Not committed** — awaiting review and approval.
