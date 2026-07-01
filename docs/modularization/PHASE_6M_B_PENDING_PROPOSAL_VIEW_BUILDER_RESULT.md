# Phase 6m-b Pending Proposal View Builder Result

## Status

- **PASS** for integrity verification.
- Browser/manual verification **not run** — work-computer static-server tooling block.
- **No runtime behavior change intended.**
- View-only builder added; `renderPendingProposalCue()` not routed or modified.

**Scope:** Add `buildPendingProposalCueView(input)` at `f1c4531` baseline + this slice.

---

## Repo State

| Item | Value |
|------|--------|
| Branch | `modularization-home-layout-engine-pilot` |
| Baseline HEAD (short) | `f1c4531` — *Document pending proposal cue inventory* |
| Working HEAD (uncommitted) | `f1c4531` (same commit; changes in working tree only) |
| Untracked (local-only) | `oot-local-server.ps1` (**do not commit**) |

---

## Files Changed

| File | Change |
|------|--------|
| `oot_home_cue_renderer.js` | Added `buildPendingProposalCueView(input)`; phase → `6m-b-pending-proposal-view-builder` |
| `tests/integrity/home-controller-package.mjs` | `assertPhase6mBPendingProposalViewBuilder` |
| `docs/modularization/PHASE_6M_B_PENDING_PROPOSAL_VIEW_BUILDER_RESULT.md` | This result record |

**Not changed:** `index.html`, CSS, Firestore listeners, `renderPendingProposalCue()` call sites.

---

## Builder Added

### Method (`oot_home_cue_renderer.js`)

```javascript
buildPendingProposalCueView(input)
```

**Input:**

```javascript
{ pendingIds: [...], hasTarget: true }
```

Uses `pendingIds.slice()` — does not mutate caller array.

**Return (visible example):**

| Field | Purpose |
|-------|---------|
| `visible` | `pendingIds.length > 0` |
| `count` | Raw count |
| `countLabel` | `String(count)` or `'9+'` when count > 9 |
| `calendarTabBadge` | `{ visible, countLabel, className: 'proposal-tab-badge', title }` |
| `homeMicroCue` | `{ visible, id: 'home-proposal-micro-cue', html, onclickHandler: '_openPendingProposalCue' }` |
| `calendarMicroCue` | `{ visible, id: 'cal-proposal-micro-cue', html, kicker: 'ACTION NEEDED', onclickHandler: '_openPendingProposalCue' }` |
| `sourceBranch` | `'pending-proposal-visible'` or `'pending-proposal-hidden'` |
| `rendersDom` | **`false`** |

**Hidden path:** all surfaces `visible: false`; empty `html` / badge labels; kicker still `'ACTION NEEDED'` in descriptor metadata.

### Preserved legacy strings

| Surface | Text |
|---------|------|
| Home micro-cue inner HTML | `{N} rehearsal response needed` |
| Calendar kicker | **ACTION NEEDED** |
| Calendar main | `{N} rehearsal proposal waiting for your response` |
| Badge title pattern | `{N} rehearsal proposal(s) waiting` |
| Handler reference | `_openPendingProposalCue` |

Does **not** write DOM, call Firestore, `rHome`, reconcile, localStorage, or CSS vars.

---

## Surfaces Described by Builder

1. **Calendar tab badge** — `.proposal-tab-badge` on `#tb-cal` (descriptor only)
2. **Home hero micro-cue** — `#home-proposal-micro-cue` inner HTML + handler name
3. **Calendar strip cue** — `#cal-proposal-micro-cue` inner HTML + kicker + handler name

---

## renderPendingProposalCue Not Routed / Not Changed

- `index.html` **unchanged**
- Legacy function still derives state via `_pendingProposalIdsForMe()` and applies DOM directly
- No call sites updated
- Builder **not** invoked from `index.html`
- `renderSongVoteCue` / `renderRehearsalCue` wrappers preserved

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
| `home-controller-package.mjs` | **PASS** (Phase 6m-b Pending proposal view builder) |
| `home-layout-engine-package.mjs` | **PASS** |
| `home-diag-package.mjs` | **PASS** |
| `home-alert-rail-package.mjs` | **PASS** |
| `home-gig-slot-package.mjs` | **PASS** |

---

## Browser / Manual Verification

**Not run.** Work-computer local static-server path remains blocked.

No runtime path changed; browser verification would show identical behavior to `f1c4531`.

---

## Explicit Non-Changes

- No CSS edits
- No Home/Calendar visual behavior changes
- No Firestore listener changes
- No modular-inflow default enablement
- No apply/routing of `renderPendingProposalCue`

---

## Recommended Next Boundary

**Phase 6m-c — multi-target apply seam**

Add `applyPendingProposalCueView(view)` in `oot_home_cue_renderer.js` that encapsulates the three-surface DOM block currently in `renderPendingProposalCue()` (25866–25924), with full inline legacy fallback in `index.html`. Do **not** add module wrapper routing until apply seam is proven.

---

## Commit Status

**Not committed** — awaiting review and approval.
