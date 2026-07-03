# Phase 6w-c — Rehearsal Cue Derivation Checkpoint

## Status

**Checkpoint / documentation only.** No runtime behavior changed by this document.

This records the Rehearsal cue **derivation seam** added in Phase **6w-b**, following the planning direction from Phase **6w-a** (`PHASE_6W_A_REHEARSAL_CUE_PARITY_PLAN.md`).

---

## Repo Baseline

| Item | Value |
|------|--------|
| Branch | `modularization-home-layout-engine-pilot` |
| Current HEAD (short) | `699d285` — *Add rehearsal cue derivation seam* |
| Working tree | Clean except untracked `PHASE_6W_A_REHEARSAL_CUE_PARITY_PLAN.md` and `oot-local-server.ps1` (**do not commit `oot-local-server.ps1`**) |

### Phase 6w-b commit recorded

| Commit | Summary |
|--------|---------|
| `699d285` | Add rehearsal cue derivation seam (Phase 6w-b) |

### Phase 6w-a planning result (summary)

Phase **6w-a** compared Rehearsal cue ownership to pending proposal (6o–6q) and Song Vote (6s–6v) arcs:

| Finding | Detail |
|---------|--------|
| Largest gap | Derivation inline in `renderHomeRehearsalCue()` (~30 lines + helper chain) |
| Risk | **Medium** — `_eventsHasInit` early path, r809 proposal fallback, agenda time lookup |
| Recommendation | **6w-b derivation runtime** first (mirror 6s-a); defer orchestration/targets/controller parity |

### Upstream context (Rehearsal cue path)

| Phase | Deliverable |
|-------|-------------|
| **6l-e / 6l-i** | `buildRehearsalCueView`, `renderRehearsalCue` module wrapper |
| **6l-g** | `_buildHomeRehearsalCueInput` input packaging |
| **6g** | Home-active gated `requestHomeReconcile('cue:rehearsal')` hooks (2×) + image refresh tails |
| **6w-a** | Rehearsal parity plan |
| **6w-b** | `deriveRehearsalCueInput` + `_deriveRehearsalCueInput()` wrapper |

Pending proposal and Song Vote cue paths were **not modified** in 6w-b.

---

## Purpose

Phase **6w-b** moved Rehearsal cue **input derivation** (which event/proposal to show, hidden vs visible branch, escaped fields) into `OOT.home.cueRenderer`, mirroring the Song Vote derivation pattern from Phase **6s-a**.

Phase **6w-c** (this document) records that checkpoint without introducing new runtime behavior.

---

## Files Changed in Phase 6w-b

| File | Role |
|------|------|
| `oot_home_cue_renderer.js` | `deriveRehearsalCueInput(input)` pure helper + API export |
| `index.html` | `_deriveRehearsalCueInput()` / `_legacyDeriveRehearsalCueInput()` wrappers; `renderHomeRehearsalCue()` delegates derivation |
| `tests/integrity/home-controller-package.mjs` | `assertPhase6wBRehearsalDeriveSeam`; 6l-g/6l-i guard updates |
| `tests/integrity/home-layout-engine-package.mjs` | `isRehearsalCueDeriveDiffLine` diff allowlist |

---

## Module Seam Added (Phase 6w-b)

### `OOT.home.cueRenderer.deriveRehearsalCueInput(input)`

Pure derivation helper. No DOM, Firestore, listener, or push side effects.

#### Input contract

| Field | Type | Notes |
|-------|------|-------|
| `events` | `Array` | Snapshot of calendar/event docs |
| `proposals` | `Array` | Snapshot of proposal docs (r809 fallback) |
| `eventsHasInit` | `boolean` | Mirrors global `_eventsHasInit` |
| `rehearsalTimesFn` | `function \| null` | Optional callback for agenda-aware times (`_r535RehearsalTimes` from index.html) |

#### Return contract

Object compatible with `_buildHomeRehearsalCueInput` / `buildRehearsalCueView`:

```javascript
{
  hasTarget: true,
  sourceBranch: string,   // see branch order below
  evIdEscaped?: string,
  titleEscaped?: string,
  subEscaped?: string,
  noteEscaped?: string,
  hasNote?: boolean
}
```

Hidden branches return only `{ hasTarget: true, sourceBranch }`.

---

## index.html Wrapper / Fallback Ownership

| Function | Behavior |
|----------|----------|
| `_legacyDeriveRehearsalCueInput()` | Exact pre-6w-b derivation: `_eventsHasInit` early path → `_r535NextUpcomingRehearsal()` → `_buildHomeRehearsalCueInput` |
| `_deriveRehearsalCueInput()` | Prefers `cueRenderer.deriveRehearsalCueInput({ events, proposals, eventsHasInit, rehearsalTimesFn })`; falls back to legacy |
| `_buildHomeRehearsalCueInput()` | Input packaging (unchanged; still index.html) |
| `renderHomeRehearsalCue()` | Public render owner — calls `_deriveRehearsalCueInput()` then existing render/tail path |

Legacy helpers retained for fallback and other call sites:

- `_ootNextOpenRehearsalProposal`, `_r535NextUpcomingRehearsal`, `_r535RehearsalTimes`, `_r535PrettyRehearsalDate`, `_r535HomeEscape`, etc.

---

## sourceBranch Order Preserved (Legacy Behavior)

| Order | Condition | `sourceBranch` |
|-------|-----------|----------------|
| 1 | `!eventsHasInit && empty events` and no open rehearsal proposal | `hidden-no-events` |
| 2 | No upcoming rehearsal after full lookup | `hidden-no-rehearsal` |
| 3 | Upcoming event from open proposal (r809) | `proposalFallback` |
| 4 | Upcoming confirmed rehearsal event | `rehearsalEvent` |

### `_r535NextUpcomingRehearsal` equivalent order (inside module)

1. Future rehearsal events by deadline (looks-like-rehearsal filter)
2. Today-or-later rehearsal events (date fallback)
3. Open future rehearsal proposal synthesized as pseudo-event

Agenda-aware times use `rehearsalTimesFn` when provided; otherwise module falls back to `ev.startTime` / `ev.endTime` fields.

---

## Post-Render Tails Preserved (unchanged by 6w-b)

`renderHomeRehearsalCue()` tails were **not modified**. Both hidden and visible branches retain identical sequence:

```
_recordHomeCueRenderDiag('rehearsal', …)
_applyHomeCueView(el, _rhView)                    [when !moduleApplied]
_ensureHomePresentationObserver()
_scheduleHomeImagePresentationRefresh(imageRefreshReason)
notifyImageRefresh(imageRefreshReason)
_homeLayoutDiagSnapshot(diagTag, …)
syncAlertRailState('renderHomeRehearsalCue')
notifyCueChange('renderHomeRehearsalCue')
requestHomeReconcile('cue:rehearsal')             [Home-active gated, 2× inline]
```

Image refresh reason strings unchanged:

- `rehearsal-cue hidden no events`
- `rehearsal-cue hidden no next rehearsal`
- `rehearsal-cue visible`

---

## Current Rehearsal Cue Architecture (after 6w-b)

```
renderHomeRehearsalCue()                         [index.html — public wrapper / call site]
  ├─ el = document.getElementById('home-rehearsal-cue'); if(!el) return
  ├─ _rhInput = _deriveRehearsalCueInput()     [index.html wrapper — 6w-b]
  │    └─ deriveRehearsalCueInput(input)       [module]
  │         fallback: _legacyDeriveRehearsalCueInput()
  │           └─ _r535NextUpcomingRehearsal / _buildHomeRehearsalCueInput
  ├─ renderRehearsalCue(el, _rhInput)          [module — 6l-i]
  │    fallback: buildRehearsalCueView + inline HTML
  ├─ _applyHomeCueView(el, _rhView)            [when !moduleApplied]
  ├─ image refresh block (observer + notifyImageRefresh)
  ├─ syncAlertRailState('renderHomeRehearsalCue')
  ├─ notifyCueChange('renderHomeRehearsalCue')
  └─ requestHomeReconcile('cue:rehearsal')     [Home-active gated, 2× hooks]
```

| Layer | Owner |
|-------|--------|
| **Derivation** | `OOT.home.cueRenderer.deriveRehearsalCueInput` |
| Input packaging | `_buildHomeRehearsalCueInput` (index.html) |
| View build / apply / render | `buildRehearsalCueView` / `applyCueView` / `renderRehearsalCue` (module) |
| Target collection | Inline `getElementById('home-rehearsal-cue')` — **no seam yet** |
| Render orchestration surface | **No** `renderRehearsalCueSurface` yet |
| Notify / reconcile timing | Generic inline hooks (6g) — **no dedicated HomeController methods** |
| Public entry + fallbacks | `index.html` |

---

## What Was Intentionally Not Moved in Phase 6w-b

| Concern | Status |
|---------|--------|
| Target collection | Still inline `#home-rehearsal-cue` lookup |
| Render orchestration surface | Still direct `renderRehearsalCue` call (no `renderRehearsalCueSurface`) |
| HomeController notify/reconcile | Still generic `notifyCueChange` + inline `requestHomeReconcile('cue:rehearsal')` |
| Image refresh scheduling | Still inline in render tails |
| Pending proposal paths | Untouched |
| Song Vote paths | Untouched |

---

## Behavior Preserved

| Contract | Expected |
|----------|----------|
| `sourceBranch` strings | `hidden-no-events`, `hidden-no-rehearsal`, `proposalFallback`, `rehearsalEvent` |
| `_eventsHasInit` early branch | Unchanged |
| r809 proposal fallback | Unchanged |
| Escaped input fields | Same `_r535HomeEscape` semantics via module `homeEscape` |
| Cue text / kicker / placement | Unchanged |
| Selector `#home-rehearsal-cue` | Unchanged |
| onclick `_r535OpenHomeRehearsal` | Unchanged |
| Post-render tail order | Image refresh before alert-rail sync before notify/reconcile |
| **2×** `cue:rehearsal` reconcile hooks | Unchanged |
| Pending proposal / Song Vote | Untouched |

6w-b did **not** re-run manual browser verification; visible Rehearsal cue behavior is expected to match pre-6w-b because derivation output is identical on the normal and legacy fallback paths.

---

## Integrity Gate Results (Phase 6w-b)

All **five** standard gates **PASS** at commit `699d285`:

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
| `home-controller-package.mjs` | **PASS** — Phase 6q-a + 6s-a + 6t-a + 6u-b + 6v-b + 6w-b checks |
| `home-layout-engine-package.mjs` | **PASS** — Phase 5 layout engine checks |
| `home-diag-package.mjs` | **PASS** — Phase 1/1b/1c + 6b diagnostics |
| `home-alert-rail-package.mjs` | **PASS** — Phase 3 alert rail |
| `home-gig-slot-package.mjs` | **PASS** — Phase 4 gig slot |

This Phase **6w-c** document introduces **no new runtime behavior**.

---

## Hard Boundaries (Still in Force)

| Boundary | Status |
|----------|--------|
| CSS | No changes in 6w-b / 6w-c |
| Cue text | No changes |
| Cue visuals / placement | No changes |
| Target selector id | No changes |
| Firestore read/write logic | No changes |
| Listeners | No changes |
| Push notification behavior | No changes |
| Rehearsal proposal/vote data shape | No changes |
| Pending proposal cue behavior | No changes |
| Song Vote cue behavior | No changes |
| Broad refactor | Not permitted |
| Merge to `main` | Not approved |

---

## Recommended Next Slice

**Phase 6x-a planning / Phase 6x-b runtime — Rehearsal render orchestration surface** (`renderRehearsalCueSurface`), mirroring Song Vote Phase **6t-a**.

Rationale (from 6w-a ladder):

1. Derivation (6w-b) complete — next proven step is orchestration wrapper around existing `renderRehearsalCue` + view fallbacks.
2. Must preserve `imageRefreshReason` / `diagTag` on view objects and all post-render tails unchanged.
3. Target collection (`collectRehearsalCueTargets`) and HomeController notify/reconcile parity remain **later** bounded slices.

### Explicit non-goals

- Do **not** start pending response reminder backend work from this branch.
- Do **not** start flyer/r106 legacy work from this branch.
- Do **not** unify `oot_home_alert_rail.js` / `oot_home_diag.js` target lookups unless a future plan explicitly expands scope.

---

## Related Docs

- `PHASE_6W_A_REHEARSAL_CUE_PARITY_PLAN.md` — 6w-a planning / inspection
- `PHASE_6S_B_SONG_VOTE_DERIVATION_CHECKPOINT.md` — derivation seam pattern reference
- `PHASE_6T_B_SONG_VOTE_RENDER_ORCHESTRATION_CHECKPOINT.md` — next orchestration pattern reference
- `PHASE_6V_C_SONG_VOTE_HOMECONTROLLER_NOTIFY_RECONCILE_CHECKPOINT.md` — Song Vote arc complete through controller parity
