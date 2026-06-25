# Phase 6i Plan — Gig / Countdown Timer-Safe HomeController Reconcile Design

**Branch:** `modularization-home-layout-engine-pilot`  
**Baseline:** `9cd0827` — *Document Phase 6h stop decision*  
**HEAD / origin:** `9cd0827`  
**Scope:** Planning only — **no implementation**  
**Production default:** `legacy-overlay` (pilot opt-in only)

Reference docs: `PHASE_6H_DECISION_RESULT.md`, `PHASE_6H_HOME_CONTROLLER_NEXT_BOUNDARY_PLAN.md`, `PHASE_6F_VERIFICATION_RESULT.md`, `PHASE_6D_LOCAL_SMOKE_BLOCKER_NOTE.md`, `PHASE_6G_NEXT_RECONCILE_ROLLOUT_PLAN.md`, `PHASE_6B_CALLSITE_INVENTORY.md`

---

## 1. Current repo state and governing goal

| Item | Value |
|------|--------|
| Branch | `modularization-home-layout-engine-pilot` |
| HEAD / origin | `9cd0827` |
| Working tree | Clean (except possible untracked `oot-local-server.ps1` — local-only; do not commit) |
| Controller phase | `6e-b-reconcile-delegate` |
| Latest runtime commits | `6af4398` (6e-c song-vote hook), `a714c21` (6g rehearsal hook) |
| Latest decision doc | `9cd0827` (Phase 6h stop) |
| Hook rollout | **Paused** |
| Manual browser smoke | Not attempted since Phase 6c era; local server blocked |

### Governing goal

Continue Home modularization by letting **HomeController** orchestrate reconcile **requests** without moving layout math, DOM, CSS, or cue HTML ownership. Each new hook must:

- Preserve production default `legacy-overlay` (pilot opt-in unchanged).
- Avoid reconcile **storms** (high-frequency timer paths flooding coalescer / layout engine).
- Keep rollback boundaries small and integrity-gated.
- Not conflate modularization with Home visual fixes.

Phase 6i addresses the **deferred gig/countdown path** called out when Phase 6h stopped hook rollout.

---

## 2. Why Phase 6h stopped

Phase 6h reviewed the next HomeController boundary and **chose to stop** rather than improvise. Recorded in `PHASE_6H_DECISION_RESULT.md`:

1. **No single clearly approved next implementation boundary** beyond the planning doc.
2. **Hook rollout should not continue blindly** — cue pilots (`cue:song-vote`, `cue:rehearsal`) are wired; gig/image/`rHome` migration remain deferred.
3. **Gig `updateCountdown` was explicitly rejected** for naive hook rollout because it sits on a timer-driven path that needs a **timer-safe design** (this Phase 6i doc).
4. Phase 6h deliverable was **docs-only** (stop decision + handoff protocol), not runtime code.

---

## 3. Hook rollout pause (explicit)

**Further `requestHomeReconcile` hook rollout is paused** until:

1. This Phase 6i plan is **reviewed and approved** by the user, and  
2. A separate **implementation approval** is given for Phase 6i-a (or successor).

Do **not** add gig, image-only, or additional cue hooks, and do **not** migrate the `rHome` tail reconcile to coalescer-only execution without a new approved plan.

---

## 4. Current HomeController ownership (after Phase 6g / Phase 6h stop)

| Responsibility | Owner | Notes |
|----------------|-------|-------|
| Record-only API (`activate`, `notify*`, `requestReconcile`) | HomeController | Journal + coalescer enqueue |
| Home tab entry delegate | HomeController | `enterHomeTab('go')` → legacy `rHome()` (Phase 6d) |
| Reconcile request coalescing | HomeController | Enqueue, dedupe same pending reason, rAF flush |
| Reconcile execution (non-`rHome`) | HomeController orchestrates | Delegates to `window.reconcileHomeLayout` / `OOT.home.layout.reconcile` |
| Reconcile execution (`rHome` full refresh) | Legacy tail | Coalescer **skips** delegate for `rHome` reason |
| Coalescer observability | HomeController | `getReconcileCoalescerState()`, event journal |
| **`requestHomeReconcile` on cue renderers** | Legacy `index.html` tails | 2× `cue:song-vote`, 3× `cue:rehearsal`; Home-active gated |
| Layout budget / token math | Layout engine module | **Not** controller |
| DOM, CSS, cue HTML, countdown UI | Legacy `index.html` | **Not** controller |
| Home-active gating at notify tails | Legacy `index.html` | **Not** controller internals |
| Pilot default (opt-in) | Layout engine gate | **Not** controller |

---

## 5. Legacy-owned gig / countdown / timer responsibilities

| Concern | Owner | Location / notes |
|---------|-------|------------------|
| `updateCountdown()` body and step order | Legacy | `index.html` ~23888 |
| Inner countdown `tick()` + `setInterval(tick, 30000)` | Legacy | `index.html` ~23936–23952; **DOM text only** (days/hrs/min); no `syncGigSlotState` / `notifyGigSlotChange` |
| `countdownInterval` lifecycle | Legacy | Cleared/restarted on countdown branch entry |
| `renderNoGigsCard()` | Legacy | Called from `updateCountdown` no-gigs branch |
| `syncGigSlotState(...)` | Gig slot module | Invoked from `updateCountdown` on **pending**, **no-gigs**, **countdown** exit paths only |
| `notifyGigSlotChange(...)` | Controller records only | Three tails today: `updateCountdown:pending`, `:no-gigs`, `:countdown` — **no** `requestHomeReconcile` |
| `reserveGigSlotPending()` | Gig slot module | Pre-events-init loading gap |
| `getGigSlotState()` / `data-home-gig-slot-state` | Gig slot module | `oot_home_gig_slot.js` |
| Gig slot height token `--home-gig-slot-h: 144px` | Gig slot module | Applied at module load |
| Layout engine gig input | Layout engine | Reads `getGigSlotState()` for budget pass (`pending` / `countdown` / `no-gigs` → gig slot reserved) |
| Firestore events driving countdown refresh | Legacy listeners + `rHome` | `updateCountdown()` also called from `rHome()` tail (~30730) |

### Timer frequency (accurate repo behavior)

- **Not 1 Hz today:** inner `tick()` runs on a **30 s** interval and updates `#ngc-days`, `#ngc-hrs`, `#ngc-min` text only.
- **`updateCountdown()`** runs on: `rHome()`, events snapshot changes, gig-day rollover (`tick` calls `updateCountdown()` when `diff <= 0`), and countdown branch setup — each run may call `syncGigSlotState` + `notifyGigSlotChange` once on exit.
- **Risk category:** hooking **`tick()`** or any future sub-second timer would create periodic reconcile pressure; hooking **`updateCountdown()` unconditionally** fires on every countdown refresh even when gig **slot state** is unchanged.

---

## 6. Risk analysis — adding `requestHomeReconcile` to timer-driven paths

| Risk | Severity | Detail |
|------|----------|--------|
| **Reconcile storm** | High | Naive hook on `tick()` → ~2 requests/min per active Home tab (30 s interval); sub-second interval would be worse. Coalescer dedupes **same reason** within one flush but still schedules rAF work and journal churn. |
| **Redundant layout work** | Medium | `reconcileHomeLayout` reads `getGigSlotState()`; digit-only ticks do **not** change gig slot state or layout tokens. Reconcile on tick is wasted work. |
| **Double execution with `rHome`** | Medium | `rHome()` already calls `updateCountdown()` then `reconcileHomeLayout('rHome')` at tail. Gig hook must not cause duplicate full layout passes on tab entry without coalescer/`rHome` dedupe awareness. |
| **False coupling to countdown text** | Medium | Layout budget uses **slot state** (`pending` / `countdown` / `no-gigs`), not countdown digits. Timer hooks confuse diagnostics (coalescer events imply layout change when none occurred). |
| **Integrity regression** | High | `home-controller-package.mjs` forbids controller DOM coupling; gig hooks must stay in `index.html` with same Home-active gate pattern as cue pilots. |
| **Protected module drift** | Medium | Gig slot module is protected; detection gaps (cf. Phase 5d alert rail) could cause budget/state skew if reconcile fires but `getGigSlotState()` reads wrong — fix belongs in gig module only if proven, not assumed in Phase 6i. |
| **Pilot vs legacy** | Low–Med | Reconcile runs for both modes; must not enable `modular-inflow` by default. |

**Conclusion:** Any approved gig reconcile hook must **not** attach to inner `tick()` or other high-frequency timers. It must fire only when **gig slot state** or **card visibility** meaningfully changes.

---

## 7. Countdown ticks vs meaningful layout-affecting gig state changes

| Event | Layout-affecting? | Budget / DOM signal | Should request reconcile? |
|-------|-------------------|---------------------|---------------------------|
| Inner `tick()` updates days/hrs/min text | **No** | `getGigSlotState()` unchanged; `--home-slot-gig-h` already 144px when slot active | **No** |
| `pending` → `countdown` (card `display:block`) | **Yes** | `data-home-gig-slot-state` → `countdown`; budget gig reservation applied | **Yes** (candidate) |
| `countdown` → `no-gigs` | **Yes** | State → `no-gigs`; different card visible | **Yes** (candidate) |
| `no-gigs` → `countdown` | **Yes** | Reverse transition | **Yes** (candidate) |
| `pending` hold (pre-events-init) | **Edge** | `pending` attr set; card hidden | **Maybe once** on first pending; avoid repeat while still pending |
| `rHome()` + unchanged gig state | **No** (for gig hook) | Tail already runs `reconcileHomeLayout('rHome')` | Gig hook should **not** duplicate |
| Firestore events refresh calling `updateCountdown()` with same visible card | **No** | State unchanged | **No** |

**Distinction rule for Phase 6i implementation:** reconcile requests belong on **`getGigSlotState()` transitions** (or equivalent card visibility flip), not on countdown digit updates.

---

## 8. Proposed timer-safe design options

### Option A — State-change-only request (recommended baseline)

Before/after `syncGigSlotState`, compare previous vs new gig slot state (local variable or `data-home-gig-slot-state` read). Call `requestHomeReconcile('gig:<state>')` **only when state changes**, with Home-active gate matching cue pilots.

**Pros:** Minimal storm risk; aligns with layout engine inputs; clear diagnostics.  
**Cons:** Requires careful placement so `syncGigSlotState` runs before compare; must handle `pending` idempotency.

### Option B — Visibility-change-only request

Detect transitions on `#next-gig-countdown` / `#no-gigs-card` `display` block/none (mirrors legacy CSS `:has()` style). Request reconcile only when card visibility flips.

**Pros:** Close to DOM truth for slot footprint.  
**Cons:** Duplicates gig module state logic; `pending` hides both cards — easy to mis-fire; overlaps Option A.

### Option C — Debounced / coalesced request

Add controller-side debounce (e.g. 100–250 ms) or gig-reason bucket in coalescer so bursts collapse to one delegate.

**Pros:** Safety net if call site is noisy.  
**Cons:** Extra controller complexity; masks mis-placed hooks; coalescer already dedupes **identical pending reason** within one rAF flush — does not help if reasons differ (`gig:countdown` vs `gig:countdown` duplicate OK, but `updateCountdown` called 3× with same state still enqueues if reason string identical — actually duplicateCount increments, single flush). Still does not fix **unnecessary** flushes from repeated `updateCountdown()` with same state unless hook is state-gated.

### Option D — No hook / diagnostics only

Keep `notifyGigSlotChange` record-only. Rely on `rHome` tail + cue hooks for reconcile; document gig gap.

**Pros:** Zero storm risk; no code change.  
**Cons:** Pilot `modular-inflow` may miss gig-driven budget refresh when user stays on Home across events snapshot / gig state change without full `rHome` (if that path exists). Diagnostics-only Phase 6i-b could expose coalescer + gig state in diag export for future decision.

---

## 9. Recommended option and rationale

**Recommend Option A — state-change-only `requestHomeReconcile`**, with:

- Home-active gate identical to Phase 6e-c / 6g cue hooks.
- Hook placed on **`updateCountdown()` exit branches only** — never on inner `tick()`.
- Reason strings such as `gig:pending`, `gig:countdown`, `gig:no-gigs` (exact strings fixed at implementation time).
- **`syncGigSlotState` before `requestHomeReconcile`** (mirror cue pilot ordering).
- **Skip request when state unchanged** (including repeated `updateCountdown()` from events refresh).
- **No controller debounce** in first implementation slice unless verification proves residual noise.

**Why not B alone:** Visibility detection duplicates gig module and mishandles `pending`.  
**Why not C first:** Coalescer already provides rAF coalescing; debounce hides hook placement bugs.  
**Why not D:** Phase 6h explicitly deferred gig path for timer-safe design — Option D is the fallback if Option A fails verification gates.

Option A satisfies layout engine coupling: `computeBudget()` already reads `getGigSlotState()` for gig slot height reservation; reconcile on state transition refreshes tokens when Home stays open across gig card changes.

---

## 10. Allowed files (future implementation, if approved)

Phase 6i-a runtime slice (single small commit — **not part of this planning commit**):

| File | Allowed change |
|------|----------------|
| `index.html` | `updateCountdown()` only — state-change-gated `requestHomeReconcile('gig:…')` tails; Home-active gate; **no** edits to inner `tick()` |
| `tests/integrity/home-controller-package.mjs` | Static invariants: hook count, forbidden tick placement, reason strings, ordering vs `syncGigSlotState` |
| `tests/integrity/home-layout-engine-package.mjs` | Diff allowlist / protected-module exception if needed |
| `docs/modularization/PHASE_6I_VERIFICATION_RESULT.md` | Post-implementation verification record |

**Conditionally allowed (only if verification proves need — separate approval):**

| File | Condition |
|------|-----------|
| `oot_home_controller.js` | Gig-reason dedupe bucket or storm guard — **not** in first slice unless Option A fails coalescer bounds |
| `oot_home_gig_slot.js` | Only if read-only diagnostic gap proven (e.g. display detection mismatch akin to Phase 5d alert rail) |

---

## 11. Forbidden files / edits

| Forbidden | Reason |
|-----------|--------|
| `index.html` legacy Home CSS blocks | Out of scope |
| Inner `tick()` / `setInterval` bodies for reconcile hooks | Timer storm |
| `rHome` tail `reconcileHomeLayout('rHome')` removal/relocation | Phase 6h defer — double-execute / miss risk |
| `oot_home_layout_engine.js` / `.css` | Protected; no budget constant tuning |
| `oot_home_band_image.js` | Protected |
| `oot_home_alert_rail.js` | Protected |
| `oot_home_gig_slot.js` | Protected unless diagnostic gap proven |
| Calendar, Songs, Setlists, Chat, Flyers, Pay | Out of scope |
| Firebase config/rules, `OneSignalSDKWorker.js` | Out of scope |
| `oot-local-server.ps1` | Local-only |
| CDP smoke scripts / temp smoke files | `PHASE_6D_LOCAL_SMOKE_BLOCKER_NOTE.md` |
| Enable `modular-inflow` by default | Hard boundary |
| Merge to `main` | Hard boundary |
| Banned rescue paths (`HomeLayoutContract`, `_homeMaybeLockAlertsFootprint`, `data-home-alerts-reserved`, `data-home-gig-pending`, etc.) | Permanent ban |
| Home visual / pill / CSS fixes | Confounds modularization verification |
| Broad multi-path hook rollout in one commit | Rollback risk |

---

## 12. Required integrity gates

Run before recording Phase 6i-a verification or any implementation:

```powershell
$node = "C:\Users\riche\Documents\outoftimeband\AppData\Local\Programs\cursor\resources\app\resources\helpers\node.exe"
Set-Location "C:\Users\riche\Documents\outoftimeband"
& $node tests/integrity/home-layout-engine-package.mjs
& $node tests/integrity/home-diag-package.mjs
& $node tests/integrity/home-alert-rail-package.mjs
& $node tests/integrity/home-gig-slot-package.mjs
& $node tests/integrity/home-controller-package.mjs
```

(Adjust `$node` path to local Node if bundled helper unavailable.)

### Static invariants to preserve after 6i-a

- Exactly one `reconcileHomeLayout('rHome')` in `index.html`.
- Two `cue:song-vote`, three `cue:rehearsal` hooks unchanged.
- Cue hooks remain Home-active gated; `syncAlertRailState` before `requestHomeReconcile` on cue paths.
- Coalescer `rHome` dedupe skip preserved; Phase 6d `enterHomeTab` preserved.
- No direct `reconcileHomeLayout` inside cue/gig renderers (delegate via coalescer only for non-`rHome` requests).
- Banned strings absent; protected modules untouched unless explicit approved exception.

---

## 13. Static invariants / tests — prove no timer storm

Future Phase 6i-a should add or extend integrity checks to enforce:

| Invariant | Verification method |
|-----------|---------------------|
| **Zero** `requestHomeReconcile` inside `tick()` or any `setInterval` callback in `updateCountdown` | AST-free grep / line-scoped scan in `home-controller-package.mjs` |
| **Bounded** gig hook count (e.g. ≤3 `requestHomeReconcile('gig:` in `index.html`, one per `updateCountdown` branch max) | Count in integrity package |
| Gig hooks use Home-active gate pattern | String match same as cue pilots |
| `syncGigSlotState` appears before `requestHomeReconcile` on each gig branch | Ordering check (mirror 6g rehearsal) |
| No new `requestHomeReconcile` in `renderNoGigsCard` unless explicitly planned | Forbidden expansion |
| Controller remains record-only + coalescer — no `updateCountdown` in `oot_home_controller.js` | Existing forbidden behavior scan |
| Coalescer scaffold markers unchanged unless separate approval | Existing scaffold checks |

### Runtime diagnostic expectation (manual / future smoke)

After implementation, with Home tab active and countdown running **≥90 s**:

- `getReconcileCoalescerState().coalescedRequestCount` should **not** increase from tick-driven activity alone.
- `getHomeControllerState().events` should show `requestReconcile` for gig reasons **only** on card/state transitions, not on minute rollovers within same state.

---

## 14. Manual / browser verification expectations (local-smoke blocker rule)

Follow `PHASE_6D_LOCAL_SMOKE_BLOCKER_NOTE.md`.

| Expectation | Phase 6i planning | Phase 6i-a (future) |
|-------------|---------------------|---------------------|
| Minimum gate | N/A (docs only) | All five integrity scripts exit 0 |
| Local browser smoke | **Not required** for planning commit | Optional **one** short attempt on known-good server; then **stop** |
| If local server blocked | Document BLOCKED; proceed only with user approval | Integrity + static invariants suffice; do not debug Windows server loop |
| CDP automation | **Forbidden** | **Forbidden** unless user explicitly approves |
| Compact state read | N/A | `getHomeControllerState()` + `getReconcileCoalescerState()` after `OOT_HOME_LAYOUT_DIAG.disable()` |
| Pilot session | N/A | Optional `modular-inflow` opt-in to confirm gig token refresh on state change |
| Do not require | — | Proof that countdown digits animate correctly (product QA, not modularization) |

**Planning commit (6i):** no server, no browser, no CDP.

---

## 15. Pass / fail criteria

### Pass — Phase 6i planning (this document)

- Doc exists at `docs/modularization/PHASE_6I_GIG_TIMER_SAFE_RECONCILE_PLAN.md`.
- Hook rollout pause restated.
- Timer vs state-change distinction documented.
- Design options + recommendation + boundaries complete.
- **No runtime files changed.**

### Pass — Phase 6i-a implementation (future, if approved)

- All five integrity gates PASS.
- Static storm invariants PASS (Section 13).
- Gig reconcile hooks fire on state change only; none on `tick()`.
- Cue pilots + `rHome` tail unchanged.
- No forbidden file edits; no pilot default enablement.
- Verification result doc recorded (PASS or BLOCKED + gates pass).

### Fail

- Any integrity gate fails.
- `requestHomeReconcile` added to timer callback.
- Coalescer delegate executes unbounded gig requests during countdown tick observation window.
- Direct `reconcileHomeLayout` in `updateCountdown` bypassing coalescer.
- Protected modules edited without proven gap + approval.
- Visual/CSS/budget constant changes smuggled in.
- Local server debugging treated as app failure.
- Merge to `main` or pilot default enablement.

---

## 16. Rollback criteria

| Trigger | Action |
|---------|--------|
| Integrity gate fails after 6i-a | Revert 6i-a commit; re-run five gates |
| Coalescer storm (gig requests climbing during idle countdown) | Revert 6i-a; restore notify-only gig tails |
| Double layout execute on `rHome` entry | Revert 6i-a; investigate overlap with tail reconcile |
| Gig state / budget desync | Revert 6i-a; open diagnostic gap ticket for gig module (do not patch layout constants) |
| Catastrophic Home break | Revert through last known-good: `a714c21` (6g, cue-only hooks) |

Stable rollback targets: `9cd0827` (post-6h stop), `a714c21` (6g), `6af4398` (6e-c only).

---

## 17. Recommended small future commit boundary

**Phase 6i planning commit (this task):**

```
Document Phase 6i gig timer-safe reconcile plan
```

Includes only:

- `docs/modularization/PHASE_6I_GIG_TIMER_SAFE_RECONCILE_PLAN.md`

**Phase 6i-a implementation commit (future — requires explicit approval):**

```
Wire gig slot state-change reconcile request (timer-safe)
```

Includes only:

- `index.html` — `updateCountdown()` state-change-gated hooks
- `tests/integrity/home-controller-package.mjs` — storm + hook invariants
- `docs/modularization/PHASE_6I_VERIFICATION_RESULT.md`

**Do not combine with:**

- Cue hook changes
- `rHome` tail migration
- Controller coalescer redesign
- Gig module detection fixes (unless spun out as approved 6i-b)
- Visual fixes or `main` merge

---

## 18. Explicit stop point

**This document is planning only.**

- **No Phase 6i implementation** in the planning commit.
- **No runtime code, `index.html`, or CSS edits.**
- **No local server work.**
- **No CDP automation.**
- **No merge to `main`.**
- **Hook rollout remains paused** until user reviews this plan and explicitly approves Phase 6i-a.

Await user choice: **(A)** approve Phase 6i-a implementation per Section 9, **(B)** request diagnostics-only Phase 6i-b (Option D), **(C)** stop and handoff, **(D)** revise plan before any runtime work.
