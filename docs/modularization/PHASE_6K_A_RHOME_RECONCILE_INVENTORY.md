# Phase 6k-a rHome Reconcile Inventory

## Status

**Inventory complete / planning-only.** No runtime behavior changed.

Static code inspection only. No browser-observed behavior is claimed. Phase 6j Candidate A browser smoke was **BLOCKED** on the work computer (`PHASE_6J_CANDIDATE_A_VERIFICATION_RESULT.md`).

---

## Repo State

| Item | Value |
|------|--------|
| Branch | `modularization-home-layout-engine-pilot` |
| HEAD | `f6102320c84385553da02eb54f479fa444d45fbc` (`f610232`) — *Document Phase 6j verification and 6k migration plan* |
| Origin | `f610232` — matches HEAD |
| Working tree | Clean except untracked local-only files |
| Untracked | `oot-local-server.ps1` (local-only; **do not commit**) |

Runtime baseline for inventory: **`fba71aa`** — Phase 6i-a gig reconcile hook (unchanged at `f610232`).

---

## Purpose

This document identifies the **exact `rHome` / reconcile ownership boundary** before any future migration of `rHome` tail reconcile into HomeController/coalescer **execution** ownership.

Per `PHASE_6K_RHOME_COALESCER_MIGRATION_PLAN.md`:

- **`requestHomeReconcile('rHome')`** already records/coalesces through HomeController.
- **`reconcileHomeLayout('rHome')`** at the `rHome()` tail still executes **directly** (legacy-owned).
- Coalescer **skips delegate** when pending reason is `rHome` (Phase 6e-b dedupe guard).

**No migration is approved by this inventory.**

---

## Files Inspected

| File | Role |
|------|------|
| `index.html` | `rHome()` definition, all direct `rHome()` callers, tail reconcile hooks, cue/gig reconcile request tails |
| `oot_home_controller.js` | Coalescer, `requestReconcile`, `enterHomeTab`, `rHome` skip/activate coordination |
| `oot_compat_home.js` | Global shims: `requestHomeReconcile`, `activateHome`, `enterHomeTab`, `reconcileHomeLayout` |
| `oot_home_layout_engine.js` | `reconcileHomeLayout` / `OOT.home.layout.reconcile` implementation |
| `tests/integrity/home-controller-package.mjs` | Static invariants referenced (not modified) |
| `tests/integrity/home-diag-package.mjs` | Tail ordering invariant referenced (not modified) |
| `docs/modularization/PHASE_6K_RHOME_COALESCER_MIGRATION_PLAN.md` | Migration planning baseline |
| `docs/modularization/PHASE_6J_*`, `PHASE_6I_*`, `PHASE_6H_*` | Prior boundary and verification context |

---

## rHome Definition

| Field | Value |
|-------|--------|
| File | `index.html` |
| Line | **30741** |
| Signature | `function rHome()` |
| Summary | Central legacy Home refresh: controller activate/skip header, band backdrop, proposal cue, **`updateCountdown()`**, birthday banner, cue fallback listeners, **`renderHomeSongVoteCue()`**, **`renderHomeRehearsalCue()`**, **`syncAlertRailState('rHome')`**, band image presentation refresh + **`notifyImageRefresh`**, who-am-i widget, diag snapshot, then **tail reconcile** (`requestHomeReconcile('rHome')` + **`reconcileHomeLayout('rHome')`**) |

---

## Direct rHome Call Sites

All direct `rHome(` references in `index.html` (excluding definition):

| File | Line | Caller / context | Call expression | Category | Migration risk |
|------|------|-------------------|-----------------|----------|----------------|
| `index.html` | 21695 | `saveBandImagePref` → `onSaved` after band image preference save | `if(typeof rHome === 'function') rHome();` | Refresh / other | **Medium** — full Home refresh after image pref; tail reconcile runs even if Home tab inactive |
| `index.html` | 24085 | `initApp()` app bootstrap | `rHome();` | App init | **High** — first Home render at load; tail reconcile on cold start |
| `index.html` | 24444 | `go(id, btn)` when `id === 'home'` and `enterHomeTab` missing | `else if (typeof rHome === 'function') rHome();` | Home entry (fallback) | **High** — primary tab entry fallback path |
| `index.html` | 24975 | External-restore lock retry when `ctx.tab === 'home'` | `if(ctx.tab === 'home' && typeof rHome === 'function') rHome();` | Other / refresh | **Medium** — restore path may re-run full tail |
| `index.html` | 25782 | `listenEvents()` Firestore `onSnapshot` after events processing | `rHome();` | Listener-driven | **High** — runs on every events snapshot batch; frequent tail reconcile |
| `index.html` | 38084 | Member rename / roster save (`saveMember` path) | `rHome && rHome();` | Other / refresh | **Medium** |
| `index.html` | 38091 | `deleteMember` | `rHome && rHome();` | Other / refresh | **Medium** |
| `index.html` | 38118 | `adMem` add member | `clM('mm');rBand();rHome();` | Other / refresh | **Medium** |

### Indirect Home entry (calls `rHome` via controller)

| File | Line | Caller / context | Call expression | Category | Migration risk |
|------|------|-------------------|-----------------|----------|----------------|
| `index.html` | 24443 | `go('home')` primary path | `enterHomeTab('go')` | Home entry | **High** — orchestrated path |
| `oot_home_controller.js` | 200 | `enterHomeTab` body | `legacyHomeRefresh.call(window)` → `rHome()` | Home entry | **High** — sets `_skipNextRHomeActivate` so inner `rHome` skips duplicate `activateHome` |

**Not a direct `rHome()` call:** inner countdown `tick()` at line 23955 calls `updateCountdown()` when `diff <= 0`, not `rHome()` directly. That path can still trigger gig `requestHomeReconcile` via `_maybeRequestHomeGigReconcile` on branch exits.

---

## reconcileHomeLayout Call Sites

### Runtime application code

| File | Line | Caller / context | Call expression / reason | Location vs rHome | Migration risk |
|------|------|-------------------|--------------------------|-------------------|----------------|
| `index.html` | 30796 | `rHome()` tail (last step) | `reconcileHomeLayout('rHome')` | **Inside rHome tail** | **Critical target** — sole app invoke site; migration must preserve once-per-`rHome()` semantics |
| `oot_home_controller.js` | 90–91 | `_resolveLegacyReconcileDelegate()` | Resolves `window.reconcileHomeLayout` | Module (delegate resolver) | **High** — coalescer flush uses this for **non-`rHome`** reasons only today |
| `oot_home_controller.js` | 136 | `_flushReconcileCoalescer()` | `delegate.call(window, flushReason)` | Module (coalescer execute) | **High** — **not** invoked for `rHome` reason (skip at lines 126–129) |
| `oot_home_layout_engine.js` | 418 | Module export | `window.reconcileHomeLayout = reconcile` | Module definition | **N/A** — implementation owner; not a call site |
| `oot_compat_home.js` | 114–116 | Compat shim | `window.reconcileHomeLayout = l.reconcile` if missing | Module init | **Low** — restores global if needed |

**Key finding:** `index.html` contains **exactly one** `reconcileHomeLayout(...)` call site (integrity invariant I2). No cue renderer, gig path, or listener calls it directly.

---

## requestHomeReconcile Call Sites

Global shim: `oot_compat_home.js` maps `window.requestHomeReconcile` → `HomeController.requestReconcile` → coalescer enqueue.

### index.html runtime call sites

| File | Line | Caller / context | Reason string | Coalescer-safe? | Notes |
|------|------|-------------------|---------------|-----------------|-------|
| `index.html` | 22686 | `renderHomeRehearsalCue` hidden (no events) | `'cue:rehearsal'` | Yes (non-`rHome` delegate) | Home-active gated (`#sc-home.on`); after `syncAlertRailState` + `notifyCueChange` |
| `index.html` | 22699 | `renderHomeRehearsalCue` hidden (no next rehearsal) | `'cue:rehearsal'` | Yes | Same pattern |
| `index.html` | 22725 | `renderHomeRehearsalCue` visible branch | `'cue:rehearsal'` | Yes | Same pattern |
| `index.html` | 22748 | `renderHomeSongVoteCue` hidden branch | `'cue:song-vote'` | Yes | Home-active gated |
| `index.html` | 22770 | `renderHomeSongVoteCue` visible branch | `'cue:song-vote'` | Yes | Home-active gated |
| `index.html` | 23897 | `_maybeRequestHomeGigReconcile` helper interior | `'gig:' + nextState` (`pending`, `no-gigs`, `countdown`) | Yes | Home-active gated; sig dedupe; **not** in `tick()` |
| `index.html` | 23911 | `updateCountdown` pending branch | via helper → `gig:pending` | Yes | After `notifyGigSlotChange` |
| `index.html` | 23924 | `updateCountdown` no-gigs branch | via helper → `gig:no-gigs` | Yes | After `notifyGigSlotChange` |
| `index.html` | 23973 | `updateCountdown` countdown branch | via helper → `gig:countdown` | Yes | After `notifyGigSlotChange`; stable `gigKey` |
| `index.html` | 30795 | **`rHome()` tail** | `'rHome'` | **Partial** | Enqueues coalescer but flush **skips delegate**; direct `reconcileHomeLayout('rHome')` follows immediately at 30796 |

### Module wiring (not call sites)

| File | Line | Role |
|------|------|------|
| `oot_compat_home.js` | 82–84 | Shim `requestHomeReconcile` → `c.requestReconcile` |
| `oot_home_controller.js` | 166–170 | `requestReconcile` → `_enqueueReconcileCoalesce` |

**Integrity counts:** 1× `requestHomeReconcile('rHome')`; 2× `cue:song-vote`; 3× `cue:rehearsal`; gig reasons only inside `_maybeRequestHomeGigReconcile`.

---

## Current Home Render / Reconcile Order

Observed **static call order** from code inspection only.

### A. Home entry path

```
User: onclick go('home')  [index.html ~18933 toolbar]
  → go('home', btn)  [~24423]
      → activate #sc-home, #tb-home
      → enterHomeTab('go')  [~24443]  (primary)
           OR rHome()  [~24444]  (fallback if enterHomeTab missing)
```

**`enterHomeTab('go')`** (`oot_home_controller.js` ~194–204):

1. `_record('enterHomeTab', 'go')`
2. `_skipNextRHomeActivate = true`
3. `window.rHome()` (legacy full refresh)
4. Clear skip flag in `finally`

### B. rHome body path (before tail)

Order inside `rHome()` (`index.html` 30741–30794):

| Step | Call | Reconcile side effects |
|------|------|------------------------|
| 1 | `consumeHomeRHomeActivateSkip()` **or** `activateHome('rHome')` | Controller journal only |
| 2 | `_ensureHomeBandBackdrop()` | None |
| 3 | `renderPendingProposalCue()` | None |
| 4 | **`updateCountdown()`** | May `syncGigSlotState`, `notifyGigSlotChange`, **`_maybeRequestHomeGigReconcile`** → coalescer delegate for `gig:*` if Home active + state change |
| 5 | Birthday banner DOM | None |
| 6 | `_ensureHomeCueFallbackListeners()` | None |
| 7 | **`renderHomeSongVoteCue()`** | May **`requestHomeReconcile('cue:song-vote')`** if Home active |
| 8 | **`renderHomeRehearsalCue()`** | May **`requestHomeReconcile('cue:rehearsal')`** if Home active |
| 9 | **`syncAlertRailState('rHome')`** | Gig/alert module state |
| 10 | Image presentation + **`notifyImageRefresh('rHome final')`** | Controller record only |
| 11 | Who-am-i widget | None |
| 12 | `_homeLayoutDiagSnapshot('rHome:end')` | Diag only |

### C. rHome tail path (migration focus)

| Step | Call | Owner |
|------|------|-------|
| 13 | **`requestHomeReconcile('rHome')`** | HomeController coalescer enqueue → flush **skips delegate** (`skippedRHomeExecution++`) |
| 14 | **`reconcileHomeLayout('rHome')`** | **Legacy direct execute** (layout engine via global shim) |

**Important static observation:** On a full `rHome()` pass with Home tab active, coalescer may also flush **`cue:*`** / **`gig:*`** requests from steps 4/7/8 **before** step 13–14 complete, depending on rAF timing. Tail `rHome` reconcile is always **synchronous** at end; coalescer flushes are **async** (rAF). Migration must not reorder tail execute relative to render steps without analyzing this race.

### D. Countdown / gig-slot update path (without full rHome)

- **`updateCountdown()`** [`index.html` ~23901]: pending / no-gigs / countdown branches → sync + notify + optional **`gig:*` request** (not tail).
- **`tick()`** [`~23951`]: DOM text only; on rollover calls **`updateCountdown()`** — no direct reconcile execute.
- **`listenEvents` snapshot** [`~25782`]: calls full **`rHome()`** → includes tail.

### E. Cue / listener notification paths (partial, without rHome)

- **`renderHomeSongVoteCue` / `renderHomeRehearsalCue`**: invoked from `rHome()` and from cue fallback listeners (not fully enumerated here); may **`requestHomeReconcile`** when `#sc-home.on`.
- Firestore **`listenEvents`** does not call reconcile directly; it calls **`rHome()`** which runs tail.

### F. Existing HomeController path (coalescer)

```
requestHomeReconcile(reason)
  → requestReconcile [controller]
  → _enqueueReconcileCoalesce
  → rAF _flushReconcileCoalescer
       if reason === 'rHome': SKIP delegate (legacy tail owns execute)
       else: delegate → reconcileHomeLayout(reason)
```

Observability: `getHomeControllerState()`, `getReconcileCoalescerState()` including `skippedRHomeExecution`.

---

## Candidate Tail-Reconcile Migration Target

### Narrowest future migration target

The **two-line tail block** at `index.html` **30795–30796**:

```javascript
try { if (typeof requestHomeReconcile === 'function') requestHomeReconcile('rHome'); } catch(e){}
try { reconcileHomeLayout('rHome'); } catch(e){}
```

| Line | Today | Future candidate ownership |
|------|-------|---------------------------|
| 30795 | `requestHomeReconcile('rHome')` | Already HomeController; may become adapter entry point |
| 30796 | **`reconcileHomeLayout('rHome')` direct** | Route through HomeController adapter / coalescer execute **only after** removing skip + proving no double/miss |

### What should be routed through HomeController later (Phase 6k-c+)

- **Execution** of `reconcileHomeLayout('rHome')` — currently legacy-direct.
- Optionally unify request + execute in one adapter method (e.g. `executeRHomeTailReconcile()`) while preserving **exactly one** layout reconcile per `rHome()` completion.

### What must not move yet

| Must remain legacy-owned for early slices | Reason |
|-------------------------------------------|--------|
| Entire `rHome()` body before tail (steps 1–12) | Render order / DOM / cues / countdown |
| `updateCountdown()` and inner `tick()` | Timer-safe gig rules (Phase 6i-a) |
| Cue renderer HTML/CSS and pill placement | Visual scope; pre-existing placement issue |
| `reconcileHomeLayout` implementation | Layout engine module |
| Coalescer skip for `rHome` | Until coordinated removal in 6k-d with fallback flag |
| `enterHomeTab` → `rHome()` delegation | Phase 6d orchestration |

---

## Risks

| Risk | Detail |
|------|--------|
| **Central legacy path** | `rHome()` invoked from app init, tab entry, Firestore events, roster edits, band image save — tail reconcile frequency is high on active bands |
| **Timing vs layout** | Moving tail execute to coalescer rAF may change when pilot tokens apply relative to legacy overlay CSS |
| **Double execute** | Today: coalescer skips `rHome` delegate but tail still calls `reconcileHomeLayout` — enabling delegate without removing tail → **double pass** |
| **Missed execute** | Removing tail before coalescer path verified → Home tab entry may skip layout refresh |
| **Async interleaving** | `cue:*` / `gig:*` coalescer flushes may interleave with synchronous tail execute during same `rHome()` |
| **Listener-driven storms** | `listenEvents` → `rHome()` on snapshots — not timer loop, but high churn |
| **Pill placement** | Song Vote / Rehearsal pill placement is **pre-existing** — not evidence for or against migration; must not be “fixed” in migration phases |
| **No browser proof** | Candidate A BLOCKED — coalescer `skippedRHomeExecution` / delegate timing not observed live |
| **Timer coupling** | Must not attach tail migration to `tick()` / `setInterval`; gig path already isolated to branch exits |

---

## Non-goals

This inventory and any future Phase 6k migration work must **not**:

- Edit CSS or Home visual layout
- Fix Song Vote / Rehearsal pill placement
- Extract cue renderers from `index.html`
- Change band image framing or module
- Enable `modular-inflow` by default
- Add broad listener `requestHomeReconcile` rollout
- Change Firebase logic or rules
- Change service worker or notification infrastructure
- Debug local server setup on work computer
- Merge to `main`

---

## Recommended Phase 6k-b / 6k-c Next Step

**Recommend Phase 6k-b first:** read-only diagnostics around **`rHome` tail reconcile timing**.

| Rationale | Detail |
|-----------|--------|
| Inventory shows intentional split | Coalescer records `rHome` but skips execute; tail direct call is the migration choke point |
| No browser smoke | Diagnostics enrich static gates without behavior change |
| Lower risk than adapter | Phase 6k-c adapter still touches controller/`index.html` tail wiring |
| Existing hooks | `skippedRHomeExecution`, journal events (`requestReconcile`, `reconcileCoalesceFlush`), `_homeLayoutDiagSnapshot('rHome:end')` — extend export only if approved |

**Phase 6k-c (adapter, no behavior change)** is the **second** safe step after 6k-b — add a passthrough adapter method that still calls the same legacy tail sequence.

**Do not recommend Phase 6k-d (route tail through adapter with fallback removal)** until:

1. Five integrity gates pass on 6k-b/6k-c slices, and  
2. Browser verification on a known-good path **or** explicit user waiver, and  
3. Explicit user approval per slice.

Direct migration is **not trivial** — eight `rHome()` call sites plus `listenEvents` churn and async coalescer interleaving require staged work.

---

## Hard stop

- **This document is inventory only.**
- **No runtime files were changed** to produce this inventory.
- **No migration implementation approved.**

Reference: `PHASE_6K_RHOME_COALESCER_MIGRATION_PLAN.md` Section 7 (Phase 6k-a deliverable).
