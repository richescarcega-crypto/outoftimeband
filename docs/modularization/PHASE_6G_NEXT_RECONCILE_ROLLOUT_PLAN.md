# Phase 6g Plan - Next Reconcile Rollout (Planning Only)

**Branch:** `modularization-home-layout-engine-pilot`  
**Baseline:** `0581cf8` - *Document Phase 6f verification result*  
**HEAD == origin:** Yes (at time of note)  
**Scope:** Planning only - **no implementation**  
**Production default:** `legacy-overlay` (pilot opt-in only)

Reference docs: `PHASE_6F_VERIFICATION_RESULT.md`, `PHASE_6F_MANUAL_VERIFICATION_AND_DIAG_PLAN.md`, `PHASE_6E_C_LISTENER_NOTIFY_RECONCILE_PLAN.md`, `PHASE_6D_LOCAL_SMOKE_BLOCKER_NOTE.md`

---

## 1. Current safe repo state

| Item | Value |
|------|--------|
| Branch | `modularization-home-layout-engine-pilot` |
| HEAD / origin | `0581cf8` |
| Remote sync | Up to date with `origin/modularization-home-layout-engine-pilot` |
| Working tree | Clean except untracked `oot-local-server.ps1` (local-only; do not commit) |
| Latest runtime commit | `6af4398` - Phase 6e-c song-vote notify-tail pilot |
| Phase 6f verification | **PASS** (integrity gates only; see `PHASE_6F_VERIFICATION_RESULT.md`) |
| Manual browser smoke | **Not attempted**; local server remains blocked per `PHASE_6D_LOCAL_SMOKE_BLOCKER_NOTE.md` |
| Controller phase | `6e-b-reconcile-delegate` |

**Safe to plan next single-tail rollout.** Not safe to assume live Firestore coalescer behavior is proven without optional future smoke.

---

## 2. What Phase 6e / 6f completed

### Phase 6e (runtime)

| Sub-phase | Commit | Delivered |
|-----------|--------|-----------|
| **6e-a** | `4d0c7c8` | Reconcile coalescer scaffold; record-only flush |
| **6e-b** | `efd6a6b` | Coalescer flush delegate to legacy reconcile; `rHome` dedupe skip |
| **6e-c** | `6af4398` | `renderHomeSongVoteCue` -> `requestHomeReconcile('cue:song-vote')` (Home-active gated) |

Supporting docs: `1361381`, `f5e37a7`, `eea93c1`.

### Phase 6f (verification)

| Item | Result |
|------|--------|
| Integrity gates (all five packages) | PASS |
| Manual smoke | Not attempted (blocked policy) |
| Docs | `fab6e45` plan, `0581cf8` result |

### Reconcile topology today

| Path | Request | Execute |
|------|---------|---------|
| `rHome()` tail | `requestHomeReconcile('rHome')` | Direct `reconcileHomeLayout('rHome')` |
| Coalescer (`rHome` reason) | `reconcileCoalesceFlush` | Skip delegate (`skippedRHomeExecution`) |
| `renderHomeSongVoteCue` (Home active) | `requestHomeReconcile('cue:song-vote')` | Coalescer -> legacy delegate |
| All other notify tails | `notify*` only | No reconcile request |

---

## 3. What HomeController now owns

| Responsibility | Owner | Notes |
|----------------|-------|-------|
| Record-only notifications | Controller | `activate`, `notifyCueChange`, `notifyGigSlotChange`, `notifyImageRefresh` |
| Tab entry delegate | Controller | `enterHomeTab('go')` -> legacy `rHome()` (Phase 6d) |
| Reconcile **request** coalescing | Controller | Enqueue, dedupe, rAF flush scheduling |
| Reconcile **execution** (non-`rHome`) | Controller orchestrates | Delegates to `window.reconcileHomeLayout` / `OOT.home.layout.reconcile` |
| Reconcile **execution** (`rHome` full refresh) | Legacy tail | Controller skips delegate |
| Layout budget math / token writes | **Not** controller | Layout engine module |
| DOM / CSS / cue HTML | **Not** controller | `index.html` + modules |
| Home-active tab detection | **Not** controller | Gated at legacy call sites in `index.html` |

---

## 4. What legacy still owns

| Concern | Owner |
|---------|-------|
| `reconcileHomeLayout` implementation | `oot_home_layout_engine.js` |
| `rHome()` ordering and tail hook | `index.html` |
| Cue renderer HTML, onclick, pills | `index.html` (Song Vote / Rehearsal placement unfixed) |
| `syncAlertRailState` / `syncGigSlotState` | Alert rail + gig slot modules (legacy-triggered) |
| Band image presentation | `oot_home_band_image.js` |
| Firestore listeners and renderer bodies | `index.html` |
| Legacy Home CSS | `index.html` |
| Pilot default (opt-in only) | Layout engine + localStorage/query gate |

---

## 5. Should another notify/listener tail be added?

### Decision

**Yes - at most one additional renderer in Phase 6g implementation, if explicitly approved.**

Phase 6f integrity verification passed. Phase 6e-c established the pattern (Home-active gate + `requestHomeReconcile` + coalescer delegate). The next increment should mirror that pattern on **one** deferred candidate only.

| Option | Verdict |
|--------|---------|
| Add second cue renderer (`renderHomeRehearsalCue`) | **Recommended Phase 6g candidate** |
| Add gig `updateCountdown` tails | **Reject** for Phase 6g (timer frequency) |
| Add image-only `notifyImageRefresh` tails | **Reject** for Phase 6g (weak layout coupling) |
| Wire all remaining notify tails at once | **Forbidden** |
| Stop rollout; handoff only | **Valid user choice** - no Phase 6g implementation |

### Alternative: stop after 6f

If the user prefers handoff over further rollout, **do not implement Phase 6g.** The branch remains stable at 6e-c + verified gates. Document handoff state; defer rehearsal/gig pilots indefinitely.

---

## 6. Safest next single candidate (recommended)

### Phase 6g pilot: `renderHomeRehearsalCue` only

Add Home-active gated `requestHomeReconcile('cue:rehearsal')` on **all three** exit tails of `renderHomeRehearsalCue`, **after** existing `syncAlertRailState` and `notifyCueChange` (and after existing `notifyImageRefresh` / image scheduling on that path - do not reorder image steps).

**Hook pattern (same gate as 6e-c):**

```javascript
try { var _hs=document.getElementById('sc-home'); if(_hs&&_hs.classList.contains('on')&&typeof requestHomeReconcile==='function')requestHomeReconcile('cue:rehearsal'); } catch(e){}
```

**Stable reason:** `cue:rehearsal` (all three branches).

**Why this is next safest after song-vote:**

1. Second-highest Phase 6 gap value (alert rail + cue visibility; rehearsal affects band image presentation mode).
2. Same coalescer/delegate path already proven in static gates for song-vote.
3. Moderate Firestore/listener frequency (not 1 Hz timer).
4. Still one renderer function per commit - not a broad rollout.

**Why higher risk than 6e-c (mitigations required):**

- Three exit tails vs two (still one function, one reason string).
- `notifyImageRefresh` + `_scheduleHomeImagePresentationRefresh` precede notify on this renderer - **do not** move image steps; append reconcile request after existing notify block only.
- Rehearsal cue couples to band image presentation - reconcile must remain delegate-only; no layout constant tuning.

**Prefer no `oot_home_controller.js` change** if index-only wiring suffices (same as 6e-c).

---

## 7. Why this must not become a broad listener rollout

| Risk of broad rollout | Consequence |
|-----------------------|-------------|
| Multiple renderers in one commit | Unclear rollback; storm debugging harder |
| Gig countdown + 1 Hz timer | Coalescer/diag stress; false regressions |
| Image-only paths | Reconcile without layout input change justification |
| Direct `reconcileHomeLayout` in renderers/listeners | Bypass coalescer; banned pattern |
| `rHome` tail removal in same commit | Double-miss or double-execute risk |
| CSS / pill / budget fixes smuggled in | Scope violation; invalidates verification |

**Phase 6g rule:** one renderer, one reason string family, one commit, integrity allowlist update only.

---

## 8. Required gates

All five integrity packages must pass before any Phase 6g commit:

```powershell
$node = "C:\Users\rescarcega\AppData\Local\Programs\cursor\resources\app\resources\helpers\node.exe"
Set-Location "C:\Users\rescarcega\Documents\outoftimeband"
& $node tests/integrity/home-layout-engine-package.mjs
& $node tests/integrity/home-diag-package.mjs
& $node tests/integrity/home-alert-rail-package.mjs
& $node tests/integrity/home-gig-slot-package.mjs
& $node tests/integrity/home-controller-package.mjs
```

### Static invariants (add/update for Phase 6g)

- Exactly **one** `reconcileHomeLayout('rHome')` in `index.html`.
- No `reconcileHomeLayout` inside `renderHomeRehearsalCue` (or any cue renderer).
- Exactly **three** `requestHomeReconcile('cue:rehearsal')` hooks (rehearsal renderer tails only).
- Existing **two** `requestHomeReconcile('cue:song-vote')` hooks unchanged.
- `syncAlertRailState` precedes pilot hook on each rehearsal branch.
- Coalescer `rHome` dedupe preserved; Phase 6d `enterHomeTab` preserved.
- Banned strings absent; protected modules untouched.
- No static `modular-inflow` default in HTML.

---

## 9. Manual verification expectations

Follow `PHASE_6D_LOCAL_SMOKE_BLOCKER_NOTE.md` and `PHASE_6F_MANUAL_VERIFICATION_AND_DIAG_PLAN.md`.

| Expectation | Detail |
|-------------|--------|
| Minimum bar | All five integrity gates pass (same as Phase 6f) |
| Browser smoke | **Optional**; one short attempt on known-good server only; then stop |
| If smoke blocked | Document BLOCKED; do not debug local server; gates suffice for narrow merge |
| Controller state | Use `getHomeControllerState()`; check `reconcileCoalesceExecute` with `cue:rehearsal` when Home active |
| Default mode | `legacy-overlay` unchanged |
| Pilot opt-in | Optional check that rehearsal cue toggle updates layout tokens under `modular-inflow` |
| Do not require | Gig, image-only, or multi-renderer manual proof in Phase 6g |

Optional docs-only follow-up: `PHASE_6G_VERIFICATION_RESULT.md` after implementation + gates.

---

## 10. Forbidden files / edits

| Forbidden | Reason |
|-----------|--------|
| Home CSS / cue HTML / onclick / pill placement | Out of scope |
| `oot_home_layout_engine.js` / `.css` | No budget tuning |
| `oot_home_band_image.js` | No image layout changes |
| `oot_home_gig_slot.js` | No gig behavior changes |
| `oot_home_alert_rail.js` | No alert module behavior changes |
| `updateCountdown` reconcile wiring | Defer to Phase 6h+ (timer-safe design) |
| Image-only `requestHomeReconcile` tails | Defer |
| `rHome` tail hook removal/reorder | Coordinated migration only |
| Second cue renderer beyond rehearsal in same commit | Broad rollout |
| Calendar, Chat, Songs, Setlists, Flyers, Pay | Out of scope |
| Firebase config/rules, OneSignalSDKWorker.js | Out of scope |
| opM/clM modal infrastructure | Out of scope |
| `oot-local-server.ps1` | Local-only; no commit/debug |
| CDP / temp smoke scripts | Blocked policy |
| Default `modular-inflow` | Hard boundary |
| Banned rescue paths | `HomeLayoutContract`, `_homeMaybeLockAlertsFootprint`, `data-home-alerts-reserved`, `data-home-gig-pending`, etc. |
| `main` merge | Out of scope |

**Allowed (implementation, if approved):** `index.html` (rehearsal tails only), integrity test allowlists. Prefer **no** controller change.

---

## 11. Pass / fail criteria

### Pass

- All five integrity scripts exit 0.
- Single new pilot: `renderHomeRehearsalCue` -> `requestHomeReconcile('cue:rehearsal')` on three tails only.
- Song-vote pilot (`cue:song-vote`) unchanged.
- No direct `reconcileHomeLayout` in renderers/listeners.
- `rHome` tail reconcile unchanged; no double execute on full refresh.
- Home-active gate on all new hooks.
- Legacy-overlay default unchanged; pilot opt-in only.
- No forbidden file diffs beyond allowlisted index lines + tests.
- Phase 6d `enterHomeTab` preserved.

### Fail

- Multiple renderers or gig/image pilots in same commit.
- Direct `reconcileHomeLayout` in rehearsal renderer.
- Reconcile request when Home tab inactive (missing gate).
- Double reconcile on `rHome()` path.
- Rehearsal/image step reordering that runs reconcile before `syncAlertRailState`.
- Visual/CSS/pill/budget changes.
- Any integrity gate failure.
- Local server debugging treated as definitive app failure.

---

## 12. Rollback criteria

| Trigger | Action |
|---------|--------|
| Phase 6g implementation fails gates | Do not merge; fix or abandon |
| Post-merge regression | `git revert <6g-commit>` |
| Rehearsal pilot causes storm or stale layout | Revert Phase 6g only; song-vote 6e-c remains |
| Coalescer/delegate regression | Revert through `efd6a6b` only if 6e-b broken independently |

**Stable rollback target:** `6af4398` (6e-c only) + `0581cf8` docs.

No migration.

---

## 13. Recommended small commit boundary

**Single commit (Phase 6g implementation, if approved):**

`Wire rehearsal cue tail to coalesced Home reconcile (Phase 6g)`

Includes:

- `index.html` - three guarded `requestHomeReconcile('cue:rehearsal')` lines on `renderHomeRehearsalCue` tails only
- `tests/integrity/home-controller-package.mjs` - rehearsal pilot invariants
- `tests/integrity/home-layout-engine-package.mjs` - allowlisted diff lines for `cue:rehearsal`

Optional separate docs-only commit:

`Document Phase 6g verification result` (after gates / optional smoke)

**Do not combine with:**

- Song-vote hook changes
- Gig slot, image-only, or `rHome` tail migration
- Song Vote / Rehearsal pill placement fix
- Budget tune, pilot default, `main` merge

**If user chooses stop/handoff:** docs-only handoff note instead; **no** Phase 6g implementation commit.

---

## 14. Explicit stop point

**This document is planning only.**

- **No Phase 6g implementation** in this commit.
- **No code or index.html edits.**
- **No local server work.**
- **No CDP automation.**

Await explicit user approval of Section 6 (`renderHomeRehearsalCue` + `cue:rehearsal`) **or** explicit decision to stop and prepare handoff.
