# Phase 6e-c Plan - Listener Notify Reconcile Pilot (Planning Only)

**Branch:** `modularization-home-layout-engine-pilot`  
**Baseline:** `efd6a6b` - *Wire HomeController reconcile delegate guard*  
**HEAD == origin:** Yes (at time of note)  
**Scope:** Planning only - **no implementation**  
**Production default:** `legacy-overlay` (pilot opt-in only)

Parent plans: `PHASE_6E_HOME_CONTROLLER_RECONCILE_PLAN.md`, `PHASE_6E_B_RECONCILE_WIRING_PLAN.md`  
Smoke policy: `PHASE_6D_LOCAL_SMOKE_BLOCKER_NOTE.md`  
Call-site context: `PHASE_6B_CALLSITE_INVENTORY.md`

---

## 1. What Phase 6e-b now coordinates

Committed at `efd6a6b`. Controller phase: `6e-b-reconcile-delegate`.

| Component | Behavior today |
|-----------|----------------|
| `requestReconcile(reason)` | Records event, enqueues coalescer |
| Coalescer flush | Records `reconcileCoalesceFlush` with coalesce metadata |
| `flushReason === 'rHome'` | **Skips** legacy delegate; increments `skippedRHomeExecution`; legacy `rHome()` tail remains sole executor |
| Non-`rHome` flush + `executionEnabled` | Delegates once to `window.reconcileHomeLayout` or `OOT.home.layout.reconcile`; records `reconcileCoalesceExecute` |
| Coalescing | Duplicate requests in one window retain first `pendingReason`; `duplicateCount` tracks extras |
| Observability | `getReconcileCoalescerState()` exposes `executionEnabled`, `lastDelegatedReason`, `skippedRHomeExecution`, etc. |

**Runtime reconcile call sites today:**

| Call site | Reason | Executor |
|-----------|--------|----------|
| `rHome()` tail in `index.html` | `requestHomeReconcile('rHome')` then `reconcileHomeLayout('rHome')` | Legacy tail (direct) |
| Coalescer flush (non-`rHome`) | Any future non-`rHome` reason | Controller delegate (ready, unused on current call graph) |

**No listener/notify tail calls `requestHomeReconcile` yet.** Notify hooks remain record-only.

**Phase 6d preserved:** `go('home')` -> `enterHomeTab('go')` -> legacy `rHome()`.

---

## 2. What remains legacy-owned

| Concern | Owner | 6e-c constraint |
|---------|-------|-----------------|
| `reconcileHomeLayout` implementation | `oot_home_layout_engine.js` | No budget tuning; no controller layout math |
| `rHome()` step ordering | `index.html` | Tail reconcile hook stays unless coordinated sub-phase approved |
| Cue renderer HTML / onclick / pills | `index.html` | Song Vote Pending placement unfixed |
| `updateCountdown` DOM + timer loop | `index.html` | No gig-path pilot in first 6e-c commit |
| Band image registry / apply | `oot_home_band_image.js` | Untouched |
| `syncAlertRailState` / `syncGigSlotState` | Alert rail + gig slot modules | Still invoked by legacy tails before any reconcile request |
| Firestore listeners | `index.html` | Trigger renderers; no direct reconcile hooks in listener bodies |
| Legacy Home CSS | `index.html` | No visual/CSS edits in 6e-c |
| Pilot default | Opt-in only | No static `modular-inflow` in HTML |
| Coalescer delegate | `oot_home_controller.js` | Orchestration only; legacy module executes |

---

## 3. Notify/listener paths that currently change Home state

These paths mutate Home-related DOM or module state. All currently end with record-only `notify*` (except `rHome` tail).

### 3.1 Cue renderers (Firestore-driven)

**`renderHomeSongVoteCue()`** (~22725)

| Branch | State change | Current notify tail |
|--------|--------------|---------------------|
| Hidden | Cue DOM cleared; `syncAlertRailState` | `notifyCueChange('renderHomeSongVoteCue')` |
| Visible | Cue HTML built; `syncAlertRailState` | `notifyCueChange('renderHomeSongVoteCue')` |

Triggered by: `listenSuggestions` / proposal listeners, `rHome()`, roster/init paths.

**`renderHomeRehearsalCue()`** (~22673)

| Branch | State change | Current notify tail |
|--------|--------------|---------------------|
| Hidden (no events) | Cue hidden; image refresh notify; `syncAlertRailState` | `notifyImageRefresh`, `notifyCueChange` |
| Hidden (no next rehearsal) | Same pattern | `notifyImageRefresh`, `notifyCueChange` |
| Visible | Cue shown; image refresh notify; `syncAlertRailState` | `notifyImageRefresh`, `notifyCueChange` |

Triggered by: agenda/event listeners, `rHome()`, init paths.

### 3.2 Gig slot / countdown

**`updateCountdown()`** (~23883)

| Branch | State change | Current notify tail |
|--------|--------------|---------------------|
| Pending approval | Gig pending DOM | `notifyGigSlotChange('updateCountdown:pending')` |
| No gigs | `syncGigSlotState`; no-gigs card | `notifyGigSlotChange('updateCountdown:no-gigs')` |
| Active countdown | `syncGigSlotState`; timer text | `notifyGigSlotChange('updateCountdown:countdown')` |

Triggered by: events listener, `rHome()`, **1-second timer interval** when countdown active.

### 3.3 Band image presentation

| Path | State change | Current notify tail |
|------|--------------|---------------------|
| Home band image load (~30687) | Image apply via registry | `notifyImageRefresh('home-band-image-load')` |
| `rHome` final (~30763) | Final image presentation step | `notifyImageRefresh('rHome final')` |
| Rehearsal cue branches | See 3.1 | `notifyImageRefresh(...)` before cue notify |

### 3.4 Full refresh (already reconciled)

**`rHome()` tail (~30771):** `requestHomeReconcile('rHome')` + direct `reconcileHomeLayout('rHome')`. Coalescer skips delegate for `rHome` reason.

### Phase 6 gap (still true)

Listener/cue paths update alert/gig attrs and cue DOM but **do not** invoke layout reconcile until the next `rHome()` when Home is not active, or until `rHome()` tail when Home refresh runs. While Home is active, cue visibility changes can leave pilot layout tokens stale until tab re-entry or full `rHome()`.

---

## 4. Should any path request reconcile in 6e-c?

### Decision

**Yes - one path only, if implementation is approved.** Phase 6e-b proved the delegate path; 6e-c should pilot a **single** notify tail `requestHomeReconcile` seam to close the smallest high-value slice of the coordination gap.

**Do not wire all notify tails in 6e-c.** Multi-path wiring increases storm risk, ordering bugs, and rollback cost.

| Path | Request reconcile in 6e-c? | Rationale |
|------|----------------------------|-----------|
| `renderHomeSongVoteCue` tails | **Yes - recommended pilot** | Alert rail input changes; moderate listener frequency; `syncAlertRailState` already precedes notify; no per-second timer |
| `renderHomeRehearsalCue` tails | Defer to 6e-d | Extra `notifyImageRefresh` ordering; rehearsal image mode coupling |
| `updateCountdown` / gig slot | Defer | Timer-driven (up to 1 Hz); high storm risk even with coalescer |
| `notifyImageRefresh` / band image load | Defer | Image presentation should not change layout tokens (parent plan); weaker reconcile justification |
| Firestore listener bodies directly | **No** | Reconcile must flow through renderer tails + coalescer, not ad-hoc in listeners |
| `rHome` tail | **Unchanged in first 6e-c commit** | Keep dedupe guard + direct tail execute |

### Observational alternative

If `index.html` approval is withheld, **remain observational** (no 6e-c runtime change). Coalescer delegate stays unused on live paths; gap persists until a later approved pilot.

---

## 5. Safest single candidate path (recommended)

### Pilot: `renderHomeSongVoteCue` only

Add one thin guarded call **after** existing `syncAlertRailState` and `notifyCueChange`, on **both** hidden and visible exit tails:

```javascript
try { if (typeof requestHomeReconcile === 'function') requestHomeReconcile('cue:song-vote'); } catch(e){}
```

**Stable reason string:** `cue:song-vote` (same for hidden and visible; coalescer retains first reason in window).

**Why this path first:**

1. Directly addresses alert-rail-driven layout input changes (Phase 6 finding).
2. `syncAlertRailState` already runs **before** notify on both branches (P6-6 ordering preserved if reconcile follows notify).
3. No nested `notifyImageRefresh` on this renderer (simpler than rehearsal cue).
4. Listener frequency is moderate (Firestore snapshots, not a 1 Hz timer).
5. Coalescer + rAF flush already limits duplicate requests to <=1 delegate per window.
6. Behavior on `legacy-overlay` default remains unchanged (layout engine no-ops or minimal path when pilot off).

**Second candidate (only after 6e-c validates):** `renderHomeRehearsalCue` with reason `cue:rehearsal` - separate commit.

**Not recommended for first pilot:** `updateCountdown` (timer storm), image-only paths (weak layout coupling).

### Home-active gate (mandatory before delegate on listener reasons)

6e-b deferred active-tab gating. **6e-c must gate the pilot tail** so reconcile is not requested when Home is not the active tab.

Preferred (minimal `index.html` in pilot block only):

- Reuse an **existing** Home-tab-visible predicate if one is already in scope near the renderer (e.g. current tab id / `#sc-home` active check already used elsewhere).
- Wrap the new call: only invoke `requestHomeReconcile` when Home is the active visible tab.

Do **not** add Home-active DOM checks to `oot_home_controller.js` (integrity forbidden list). Gate at the legacy call site or via a future approved layout-module predicate.

---

## 6. How to avoid reconcile storms

| Mechanism | Role |
|-----------|------|
| Coalescer enqueue | Multiple `requestHomeReconcile` calls in one frame/window collapse to one pending identity |
| rAF / microtask flush | At most one flush scheduled per pending window |
| Single stable reason per pilot path | `cue:song-vote` avoids reason churn splitting coalesce buckets |
| One renderer per commit | Do not add gig timer + both cue renderers in same commit |
| Home-active gate | No reconcile requests when Home tab inactive |
| No direct `reconcileHomeLayout` in renderers | All execution via coalescer delegate (non-`rHome`) or `rHome` tail only |
| `rHome` dedupe guard | Prevents double execute when full refresh and coalescer overlap |
| Defer `updateCountdown` | 1 Hz notify would stress coalescer and diag even if coalesced |

**Integrity target (P6-5 intent):** <=1 coalesced legacy reconcile delegate per coalesced activation window under listener burst while Home active.

---

## 7. Why index.html should not be edited unless unavoidable

| Concern | Explanation |
|---------|-------------|
| Blast radius | `index.html` owns cue HTML, `rHome` ordering, listeners, and legacy CSS - unrelated edits risk visual regressions |
| Single reconcile owner | Ad-hoc reconcile hooks in renderers bypass coalescer design |
| Phase discipline | 6e-a/6e-b intentionally avoided `index.html` to prove controller delegate in isolation |
| Forbidden scope creep | Cue markup, CSS, pill placement, and timer logic must not change in the same edit |
| 6e-c exception | **`index.html` becomes unavoidable for listener reconcile pilot** - but only for **thin** `requestHomeReconcile` lines at an approved tail plus optional Home-active guard in the same block |
| No drive-by edits | Do not reorder `rHome` steps, remove tail reconcile, or edit listener registration in the 6e-c pilot commit |

**Rule:** If the pilot can be validated with zero `index.html` changes, remain observational. Otherwise, limit `index.html` diff to the smallest guarded call(s) on the single approved renderer tail(s).

---

## 8. Allowed files (future 6e-c implementation)

| File | Permitted change |
|------|------------------|
| `index.html` | **Minimal only:** 1-2 guarded `requestHomeReconcile('cue:song-vote')` lines on `renderHomeSongVoteCue` hidden/visible tails; optional Home-active guard in same blocks. No CSS/cue HTML/listener edits. |
| `oot_home_controller.js` | Optional: phase bump (`6e-c-listener-pilot`), home-active deferral if predicate added via approved layout helper (not DOM in controller). Prefer no controller change if pilot is index-only. |
| `oot_compat_home.js` | Only if shim gap found (unlikely) |
| `tests/integrity/home-controller-package.mjs` | Pilot reason string guard; no second reconcile hook in renderers; coalescer delegate still required |
| `tests/integrity/home-layout-engine-package.mjs` | Allowlisted index.html diff lines for pilot hook only |
| `docs/modularization/` | Optional `PHASE_6E_C_MANUAL_VERIFICATION.md` after smoke or blocker note |

---

## 9. Forbidden files / edits

| Forbidden | Reason |
|-----------|--------|
| Home CSS / cue HTML / onclick / pill placement | Out of scope |
| `oot_home_layout_engine.js` / `.css` | No budget tuning |
| `oot_home_band_image.js` | No image layout changes |
| `oot_home_gig_slot.js` | No gig behavior changes |
| `oot_home_alert_rail.js` | Alert sync stays legacy-triggered |
| Second+ renderer wiring in same commit | Storm / rollback risk (`renderHomeRehearsalCue`, `updateCountdown`, image paths) |
| Direct `reconcileHomeLayout(...)` in cue renderers or listeners | Must use coalescer |
| Remove / replace `rHome` tail reconcile without coordinated design | Double-miss or double-execute risk |
| Calendar, Chat, Songs, Setlists, Flyers, Pay | Out of scope |
| Firebase config/rules, OneSignalSDKWorker.js | Out of scope |
| opM/clM modal infrastructure | Out of scope |
| `oot-local-server.ps1` | Local-only; do not commit or debug |
| Default `modular-inflow` | Hard boundary |
| Banned rescue paths | `HomeLayoutContract`, `_homeMaybeLockAlertsFootprint`, `data-home-alerts-reserved`, `data-home-gig-pending`, etc. |
| CDP / temp smoke scripts | See `PHASE_6D_LOCAL_SMOKE_BLOCKER_NOTE.md` |
| Local server debugging loops | One short attempt max |
| `main` merge | Out of scope |

---

## 10. Required integrity gates

All five packages must pass before any 6e-c commit:

```powershell
$node = "C:\Users\rescarcega\AppData\Local\Programs\cursor\resources\app\resources\helpers\node.exe"
Set-Location "C:\Users\rescarcega\Documents\outoftimeband"
& $node tests/integrity/home-layout-engine-package.mjs
& $node tests/integrity/home-diag-package.mjs
& $node tests/integrity/home-alert-rail-package.mjs
& $node tests/integrity/home-gig-slot-package.mjs
& $node tests/integrity/home-controller-package.mjs
```

### Static invariants (add/update for 6e-c)

- Exactly **one** `reconcileHomeLayout('rHome')` hook remains in `index.html`.
- No new direct `reconcileHomeLayout` call sites in renderers or listeners.
- Pilot `requestHomeReconcile` only on approved tail(s) with stable reason `cue:song-vote`.
- `syncAlertRailState` still precedes pilot `requestHomeReconcile` on song-vote branches.
- Coalescer `rHome` dedupe guard preserved.
- Controller does not add DOM coupling (`getElementById`, `querySelector`, `classList`).
- Banned strings absent; protected modules untouched.
- Phase 6d `enterHomeTab('go')` delegate preserved.
- No static `data-home-layout-mode="modular-inflow"` in HTML.

### Manual verification (when smoke available)

Follow `PHASE_6D_LOCAL_SMOKE_BLOCKER_NOTE.md`. Before snippets: `OOT_HOME_LAYOUT_DIAG.disable();`  
Use `getHomeControllerState()` / `getReconcileCoalescerState()`.

When smoke works (pilot session recommended for layout token checks):

- Song vote cue toggle while Home active -> `requestReconcile` + coalescer flush + `reconcileCoalesceExecute` with reason `cue:song-vote`.
- `rHome()` still exactly one tail reconcile; `skippedRHomeExecution` still increments on `rHome` coalescer flush.
- Listener update while Home **inactive** -> no coalescer delegate (Home-active gate).
- <=1 delegate per burst under rapid Firestore updates.

---

## 11. Pass / fail criteria

### Pass

- All five integrity scripts exit 0.
- Single pilot path wired: `renderHomeSongVoteCue` -> `requestHomeReconcile('cue:song-vote')` only.
- Coalescer delegate fires for `cue:song-vote` when Home active; `rHome` dedupe unchanged.
- No reconcile storm; no second ad-hoc reconcile hook in renderers.
- `syncAlertRailState` ordering preserved on pilot path.
- Legacy-overlay default unchanged; pilot opt-in only.
- No forbidden file diffs beyond allowlisted index pilot lines.
- Phase 6d `enterHomeTab` preserved; cue HTML/pills unchanged.

### Fail

- Multiple renderer paths wired in one commit.
- `updateCountdown` or image-only pilot creates timer/image reconcile churn.
- Double reconcile on `rHome()` path.
- Direct `reconcileHomeLayout` added to renderer or listener.
- Reconcile runs when Home tab inactive (missing gate).
- Controller embeds layout math or banned strings.
- Visual/CSS/pill/budget changes smuggled in.
- Local server debugging treated as app failure.

---

## 12. Rollback criteria

Revert 6e-c commit if:

- Any pass criterion fails on integrity or manual smoke (when available).
- Coalescer delegate causes stale layout or visible regression on legacy-overlay default.
- Firestore cue paths regress (onclick, navigation).
- Reconcile storm under song-vote listener burst.

**Action:** `git revert <6e-c-commit>` (or reset to `efd6a6b` if unpushed). No migration.

6e-b delegate remains valid rollback target.

---

## 13. Small commit boundary

**Single commit (6e-c pilot):**

`Wire song-vote cue tail to coalesced Home reconcile (Phase 6e-c)`

Includes:

- `index.html` - guarded `requestHomeReconcile('cue:song-vote')` on **both** `renderHomeSongVoteCue` tails only (+ Home-active guard if needed)
- `tests/integrity/home-controller-package.mjs` and/or `home-layout-engine-package.mjs` - allowlist pilot hooks

Optional follow-up (separate approval):

- `docs/modularization/PHASE_6E_C_MANUAL_VERIFICATION.md`
- Phase 6e-d: `renderHomeRehearsalCue` pilot (`cue:rehearsal`)
- Phase 6e-e: gig slot pilot (only with timer-safe gating design)

**Do not combine with:**

- Rehearsal cue, gig, or image pilots
- `rHome` tail hook removal
- Song Vote pill fix, budget tune, pilot default, `main` merge

---

## 14. Explicit stop point

**This document is planning only.**

- **No Phase 6e-c implementation** in this commit.
- **No code edits.**
- **No local server work.**
- **No CDP automation.**
- **No Phase 7 / pilot promotion.**

Await explicit user approval of the Section 5 pilot boundary (`renderHomeSongVoteCue` + `cue:song-vote`) before any `index.html` change.
