# Phase 6m-d Pending Proposal Wrapper Routing — Verification Result

## Status

- **PASS** for integrity verification (all five gates).
- Browser/manual verification **not run** in this checkpoint.
- Runtime routing change is **intentional and scoped** to `renderPendingProposalCue()` with full legacy fallback.

---

## Branch and HEAD / Origin

| Item | Value |
|------|--------|
| Branch | `modularization-home-layout-engine-pilot` |
| HEAD (short) | `1d7b4c9` — *Route pending proposal cue through renderer* |
| Origin | `1d7b4c9` (in sync) |

---

## Purpose of Phase 6m-d

Phase 6m-d completes the pending proposal cue modularization seam started in 6m-a through 6m-c by routing `renderPendingProposalCue()` in `index.html` through the cue renderer module when available.

### Normal path

When `window.OOT.home.cueRenderer` is present and both helpers are callable:

1. Derive pending IDs via `_pendingProposalIdsForMe()` (unchanged).
2. Build view: `cueRenderer.buildPendingProposalCueView({ pendingIds: ids, hasTarget: true })`.
3. Resolve targets:
   - `calTabBtn` → `#tb-cal`
   - `homeHero` → `#sc-home .hero.home-hero-with-controls`
   - `calSection` → `#sc-cal`
   - `calHero` → `#calendar-hero` (when present)
   - `homeMicroCueEl` / `calMicroCueEl` → existing micro-cue elements when already in DOM
4. Apply: `cueRenderer.applyPendingProposalCueView(targets, view)`.
5. If apply reports `applied: true`, return without running legacy DOM code.

### Legacy fallback

Legacy DOM behavior is preserved verbatim in `_legacyRenderPendingProposalCue(ids)`:

- Calendar tab badge (`.proposal-tab-badge`)
- Home hero micro-cue (`#home-proposal-micro-cue`)
- Calendar strip micro-cue (`#cal-proposal-micro-cue`)

Fallback runs when any of the following is true:

- `cueRenderer` is unavailable
- `buildPendingProposalCueView` or `applyPendingProposalCueView` is missing
- Build or apply throws
- Required targets are missing
- Apply does not report success (`applied` is not true)

This matches the same seam → wrapper → fallback pattern used for Song Vote and Rehearsal alert-row cues (6l-h / 6l-i).

---

## Files Changed by Phase 6m-d

| File | Change |
|------|--------|
| `index.html` | Extracted `_legacyRenderPendingProposalCue(ids)`; routed `renderPendingProposalCue()` through module build/apply with `_ppModuleApplied` guard |
| `tests/integrity/home-controller-package.mjs` | Relaxed 6m-b/6m-c “untouched” guards; added `assertPhase6mDPendingProposalWrapperRouting` |
| `tests/integrity/home-layout-engine-package.mjs` | Added `isPendingProposalCueRoutingDiffLine()` allowlist for the refactor diff |

**Not changed in this phase:** CSS, Firestore logic, cue markup/classes/text/handlers (beyond what 6m-b/6m-c already defined), Songs, Setlists, Chat, Flyers, Pay, service worker, Firebase rules, local server tooling.

---

## Runtime Boundaries Confirmed

| Boundary | Status |
|----------|--------|
| CSS | **No changes** |
| Firestore logic | **No changes** |
| `renderPendingProposalCue()` call sites | **Unchanged** (`listenProposals`, `voteOnProposal`, `closeRehearsalProposalsWorkspace`, `rHome`, `rCal`) |
| Songs / Setlists / Chat / Flyers / Pay | **Not touched** |
| Service worker / Firebase rules | **Not touched** |
| Local server tooling (`oot-local-server.ps1`) | **Not touched** |

---

## Integrity Gate Results

Commands (PowerShell):

```powershell
$node = "C:\Users\rescarcega\AppData\Local\Programs\cursor\resources\app\resources\helpers\node.exe"
& $node tests/integrity/home-controller-package.mjs
& $node tests/integrity/home-layout-engine-package.mjs
& $node tests/integrity/home-diag-package.mjs
& $node tests/integrity/home-alert-rail-package.mjs
& $node tests/integrity/home-gig-slot-package.mjs
```

| Gate | Result | Notes |
|------|--------|-------|
| `tests/integrity/home-controller-package.mjs` | **PASS** | `PASS: Phase 6m-d Pending proposal wrapper routing checks.` |
| `tests/integrity/home-layout-engine-package.mjs` | **PASS** | All Phase 5 layout engine checks passed |
| `tests/integrity/home-diag-package.mjs` | **PASS** | Phase 1/1b/1c + 6b diagnostics checks passed |
| `tests/integrity/home-alert-rail-package.mjs` | **PASS** | Phase 3 alert rail checks passed |
| `tests/integrity/home-gig-slot-package.mjs` | **PASS** | Phase 4 gig slot checks passed |

Verified at checkpoint against HEAD `1d7b4c9`.

---

## Verification Conclusion

- **Phase 6m-d is safe to keep.**
- Pending proposal cue routing is now modularized through `buildPendingProposalCueView` + `applyPendingProposalCueView`, with full legacy fallback preserved in `_legacyRenderPendingProposalCue(ids)`.
- **Recommended next step:** a planning-only decision for the next Home modularization slice — not immediate broad extraction.

---

## Next Recommended Options

### Option A — Safest (recommended)

**Phase 6n planning / inventory** for remaining Home cue and render ownership.

- Document what still lives in `index.html` vs module surfaces.
- Identify the next narrow candidate before any runtime routing change.

### Option B — Continue extraction

Proceed with the **next narrow cue wrapper only**, using the same pattern:

1. Inventory / view builder (view-only)
2. Apply seam (multi-target or single-target as appropriate)
3. `index.html` wrapper route with `_legacy*` fallback
4. Integrity assertions + verification doc

Do not batch multiple cues or broad Home render paths in one slice.

### Option C — Manual / browser verification

Before additional runtime routing, manually verify pending proposal cue behavior:

- Calendar tab badge count and title
- Home hero micro-cue visibility and click → `_openPendingProposalCue`
- Calendar strip kicker (**ACTION NEEDED**) and main text
- Hidden state when no pending proposals remain

Useful if browser smoke was blocked on the work machine during prior phases.

---

## Local-Only Note

`oot-local-server.ps1` remains untracked and must not be committed as part of this workstream.
