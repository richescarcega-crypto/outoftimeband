# Phase 6j Plan — HomeController Next Boundary (Planning Only)

**Branch:** `modularization-home-layout-engine-pilot`  
**Baseline:** `64f2d25` — *Document Phase 6i-a verification result*  
**HEAD / origin:** `64f2d25`  
**Scope:** Planning only — **no implementation approved**  
**Production default:** `legacy-overlay` (pilot opt-in only)

Reference docs: `PHASE_6I_A_VERIFICATION_RESULT.md`, `PHASE_6I_GIG_TIMER_SAFE_RECONCILE_PLAN.md`, `PHASE_6H_DECISION_RESULT.md`, `PHASE_6H_HOME_CONTROLLER_NEXT_BOUNDARY_PLAN.md`, `PHASE_6D_LOCAL_SMOKE_BLOCKER_NOTE.md`

**Governing goal:** Build a stable, maintainable, monetizable, white-label-capable app.

---

## 1. Current repo state

| Item | Value |
|------|--------|
| Branch | `modularization-home-layout-engine-pilot` |
| HEAD / origin | `64f2d25` — *Document Phase 6i-a verification result* |
| Remote sync | Expected up to date with `origin/modularization-home-layout-engine-pilot` |
| Working tree | Clean except untracked `oot-local-server.ps1` (local-only; **do not commit**) |
| Latest runtime commit | `fba71aa` — *Wire gig slot reconcile request safely* (Phase 6i-a) |
| Latest verification doc | `64f2d25` — Phase 6i-a verification result |
| Controller phase | `6e-b-reconcile-delegate` + Phase 6i-a gig reconcile pilot |
| Hook rollout | **Paused again** after Phase 6i-a |
| Manual browser smoke | **Not attempted** since Phase 6c era; local server blocked |

**Phase 6i-a status:** Complete and integrity-verified. Recorded at `64f2d25`. No further gig/cue/`rHome` hook work is approved by this document.

---

## 2. Completed HomeController stack through Phase 6i-a

| Phase | Representative commit | Delivered |
|-------|----------------------|-----------|
| **6d** | `2e4ff1a` | Home tab entry orchestration: `go('home')` → `enterHomeTab('go')` → legacy `rHome()` |
| **6e-a** | `4d0c7c8` | Reconcile coalescer scaffold (enqueue, dedupe, rAF flush) |
| **6e-b** | `efd6a6b` | Coalescer flush delegates to legacy reconcile; **`rHome` reason skips delegate** |
| **6e-c** | `6af4398` | `renderHomeSongVoteCue` → `requestHomeReconcile('cue:song-vote')` (Home-active gated, 2 tails) |
| **6g** | `a714c21` | `renderHomeRehearsalCue` → `requestHomeReconcile('cue:rehearsal')` (Home-active gated, 3 tails) |
| **6h** | `9cd0827` / `c5dfdfb` | Stop decision — no runtime hook rollout; gig deferred to timer-safe design |
| **6i plan** | `b97c4f0` | Gig timer-safe reconcile design (Option A — state-change-only) |
| **6i-a** | `fba71aa` | Timer-safe gig slot reconcile via `_maybeRequestHomeGigReconcile`; `updateCountdown()` branch exits only |
| **6i-a verify** | `64f2d25` | Docs-only verification result — five integrity gates PASS |

### Reconcile request hooks wired (current)

| Source | Reason(s) | Count / notes |
|--------|-----------|---------------|
| `renderHomeSongVoteCue` | `cue:song-vote` | 2 tails |
| `renderHomeRehearsalCue` | `cue:rehearsal` | 3 tails |
| `updateCountdown()` (via helper) | `gig:pending`, `gig:no-gigs`, `gig:countdown` | State-change branch exits only; signature `_homeGigSlotReconcileSig` |
| `rHome()` tail | `rHome` | 1 — coalescer skips delegate; tail executes `reconcileHomeLayout('rHome')` directly |

### Still notify-only (no `requestHomeReconcile`)

- Band image load / `notifyImageRefresh` tails (except via cue renderers)
- Firestore listener bodies directly
- Inner countdown `tick()` and `setInterval(tick, 30000)` — DOM text only

---

## 3. Current HomeController ownership

| Responsibility | Owner | Notes |
|----------------|-------|-------|
| Record-only API (`activate`, `notify*`, `requestReconcile`) | HomeController | Journal + coalescer enqueue |
| Home tab entry delegate | HomeController | `enterHomeTab('go')` → legacy `rHome()` (Phase 6d) |
| Reconcile request coalescing | HomeController | Enqueue, dedupe same pending reason, rAF flush |
| Reconcile execution (non-`rHome`) | HomeController orchestrates | Delegates to `window.reconcileHomeLayout` / `OOT.home.layout.reconcile` |
| Reconcile execution (`rHome` full refresh) | Legacy tail | Coalescer **skips** delegate for `rHome` reason |
| Coalescer observability | HomeController | `getReconcileCoalescerState()`, event journal |
| **`requestHomeReconcile` on cue/gig renderers** | Legacy `index.html` tails | Home-active gated at call sites; gig uses `_maybeRequestHomeGigReconcile` helper |
| Layout budget / token math | Layout engine module | **Not** controller |
| DOM, CSS, cue HTML, countdown UI | Legacy `index.html` | **Not** controller |
| Home-active gating at notify tails | Legacy `index.html` | **Not** controller internals |
| Pilot default (opt-in) | Layout engine gate | **Not** controller |

---

## 4. What legacy still owns

| Concern | Owner |
|---------|-------|
| `reconcileHomeLayout` implementation | `oot_home_layout_engine.js` |
| `rHome()` step order + tail hook | `index.html` |
| Cue HTML, onclick, pill placement | `index.html` |
| `syncAlertRailState` / `syncGigSlotState` | Alert rail + gig slot modules |
| Band image registry / presentation | `oot_home_band_image.js` |
| Firestore listeners, renderer bodies | `index.html` |
| Legacy Home CSS | `index.html` |
| Gig countdown timer loop (`tick`, `setInterval`) | `index.html` |
| `_maybeRequestHomeGigReconcile` helper + `_homeGigSlotReconcileSig` | `index.html` |
| Pilot default (opt-in) | Layout engine + storage/query gate |

---

## 5. Why additional hook rollout should pause again after Phase 6i-a

Phase 6i-a closed the **deferred gig/countdown path** that Phase 6h explicitly blocked until a timer-safe design existed. The HomeController reconcile-request pilot now covers:

1. **Alert rail cues** — song vote and rehearsal (layout-affecting alert visibility).
2. **Gig slot state** — pending / no-gigs / countdown transitions (layout-affecting gig reservation).
3. **`rHome` full refresh** — unchanged legacy tail.

Further hooks (image-only, listener bodies, `rHome` coalescer migration, additional cue paths) increase **storm**, **double-execute**, and **rollback** risk without a proven live-session read of coalescer behavior under Firestore churn.

| Reason | Detail |
|--------|--------|
| **Stack completeness** | Highest-value notify→reconcile gaps for Home layout inputs are wired; remaining paths are lower value or higher risk. |
| **No browser confirmation** | Integrity gates passed for 6e-c, 6g, and 6i-a, but no manual smoke since Phase 6c era; coalescer delegate under live toggles is unobserved. |
| **Timer lesson from 6i** | Gig hook required signature gating and branch-exit-only placement; naive expansion would repeat storm risk. |
| **Phase 6h precedent** | Stop-after-pilot pattern worked; 6i was the one approved exception with its own plan. |
| **Product vs modularization** | Visual/pill issues remain pre-existing; hook expansion does not advance white-label/monetization goals directly. |
| **Maintainability** | More tails in `index.html` without extraction or verification increase handoff cost. |

**Decision:** **Pause hook rollout again.** Do not add another `requestHomeReconcile` tail without a new reviewed plan **and** explicit user implementation approval.

---

## 6. Next candidate boundaries

### A. Manual / browser verification (known-good path only)

One short browser session on an **explicitly approved, known-good server path** — not the blocked local Windows loop.

**Scope:** Confirm coalescer delegate fires on cue toggles, gig card transitions, and `rHome` entry without storm; optional `modular-inflow` opt-in spot-check. Record PASS / BLOCKED / PARTIAL in a verification doc.

**Not approved by this plan** — only listed as a candidate for user choice.

### B. Read-only diagnostics enrichment

Extend diag export or controller observability (e.g. coalescer counters, last gig reconcile reason, pending signature readout) **without** new reconcile hooks or layout math changes.

**Scope:** `oot_home_diag.js` / controller read-only fields only if a specific gap is named first.

### C. `rHome` / coalescer migration planning

Plan coordinated move of `rHome` tail `reconcileHomeLayout('rHome')` to coalescer-only execution (remove direct tail call).

**Scope:** Planning doc only; high double-execute / miss risk; **not** next safe implementation.

### D. Home cue renderer extraction planning

Plan moving `renderHomeSongVoteCue` / `renderHomeRehearsalCue` (and related listener glue) out of `index.html` into modules.

**Scope:** Large blast radius; white-label benefit long-term; **not** next small step.

### E. Stop and prepare handoff

Author **`HANDOFF_001`** (or successor) with mandatory New Agent Startup Protocol (substance from Phase 6h Section 17). Branch remains stable at `64f2d25` / `fba71aa` runtime stack; no further modularization work until user redirects.

---

## 7. Risk analysis for each candidate

| Candidate | Risk | Benefit | Verdict |
|-----------|------|---------|---------|
| **A — Manual verification** | Low code risk; medium **process** risk if agent enters local-server debug loop | Validates coalescer + three hook families under live UI; closes confidence gap | **Best next step if user wants confidence before any code** |
| **B — Diagnostics enrichment** | Low–medium — scope creep into controller behavior; must stay read-only | Easier future debugging / white-label support tooling | **Safe secondary** after A or alongside docs-only BLOCKED record |
| **C — rHome/coalescer migration** | **High** — double layout execute or missed refresh on tab entry | Cleaner single reconcile path long-term | **Defer** — planning-only if ever requested |
| **D — Cue renderer extraction** | **High** — listener/regression blast radius in monolith | Maintainability + white-label module boundaries | **Defer** — separate track from hook rollout |
| **E — Stop / handoff** | Low — branch may idle | Preserves stable stack; clear agent onboarding | **Best next step if user wants pause** |

---

## 8. Recommended next boundary and rationale

### Recommended: **Option A — manual/browser verification on known-good path only**

With **Option E — stop and prepare handoff** as the alternative if the user declines any browser work.

**Rationale:**

1. Phase 6i-a completes the planned hook pilot stack (`cue:song-vote`, `cue:rehearsal`, timer-safe `gig:*`).
2. All five integrity gates pass at `fba71aa`, but **coalescer behavior under live Firestore + Home tab** has not been observed since the Phase 6c era.
3. Adding hooks, migrating `rHome`, or extracting renderers **before** one bounded verification pass repeats the Phase 6h mistake of expanding without live signal.
4. If verification is blocked (local smoke policy), record **BLOCKED** in a short result doc and proceed to **Option E** — do not debug the local server loop.

**This recommendation does not approve Option A execution.** User must explicitly choose A, B, C-planning, D-planning, or E.

---

## 9. Explicitly rejected for now

| Rejected | Reason |
|----------|--------|
| **Broad listener rollout** | Multiple paths in one commit; storm and rollback risk |
| **Additional `requestHomeReconcile` hooks** | Pause restated — image-only, listener bodies, third cue paths |
| **Home visual / CSS fixes** | Confounds modularization verification; separate product track |
| **Song Vote / Rehearsal pill visual fix** | Pre-existing; documented since Phase 6c; out of scope |
| **`modular-inflow` default enablement** | Hard boundary — opt-in only |
| **Merge to `main`** | Hard boundary |
| **Local server debugging loop** | `PHASE_6D_LOCAL_SMOKE_BLOCKER_NOTE.md` |
| **CDP smoke scripts / temp smoke files** | Blocked unless user explicitly approves |
| **Layout budget constant tuning** | Frozen boundary |
| **Protected module edits without proven gap** | Alert rail, gig slot, layout engine, band image |
| **Banned rescue paths** | Permanent ban (`HomeLayoutContract`, `_homeMaybeLockAlertsFootprint`, etc.) |

---

## 10. Allowed files (recommended next boundary)

### If user chooses **Option A** (verification — docs-only outcome preferred)

| File | Change |
|------|--------|
| `docs/modularization/PHASE_6J_MANUAL_VERIFICATION_RESULT.md` (or similarly named) | Create PASS / BLOCKED / PARTIAL record |
| `docs/modularization/HANDOFF_001_*.md` | Optional if stopping after verification |

**No runtime files** unless user explicitly approves a fix for a **confirmed** regression found during verification — that would be a **new** phase, not Phase 6j.

### If user chooses **Option B** (diagnostics — future, separate approval)

| File | Change |
|------|--------|
| `oot_home_diag.js` | Read-only export fields only |
| `oot_home_controller.js` | Read-only observability only — no new hooks |
| `tests/integrity/home-diag-package.mjs` | Invariants for new read-only fields |
| Verification result doc | Post-implementation record |

### If user chooses **Option E** (handoff)

| File | Change |
|------|--------|
| `docs/modularization/HANDOFF_001_*.md` | Handoff + New Agent Startup Protocol |

### Phase 6j planning commit (this task)

| File | Change |
|------|--------|
| `docs/modularization/PHASE_6J_HOME_CONTROLLER_NEXT_BOUNDARY_PLAN.md` | This document only |

---

## 11. Forbidden files / edits

| Forbidden | Reason |
|-----------|--------|
| `index.html` (Phase 6j planning commit) | Planning only |
| `oot_home_controller.js` hook/coalescer changes | Not approved |
| `oot_home_layout_engine.js` / `.css` | Protected; no budget tuning |
| `oot_home_band_image.js` | Protected |
| `oot_home_alert_rail.js` | Protected |
| `oot_home_gig_slot.js` | Protected unless diagnostic gap proven |
| Calendar, Songs, Setlists, Chat, Flyers, Pay | Out of scope |
| Firebase config/rules, `OneSignalSDKWorker.js` | Out of scope |
| `oot-local-server.ps1` | Local-only; never commit |
| CDP smoke scripts | Blocked |
| Home CSS / cue HTML / pill placement | Visual scope |
| Enable `modular-inflow` by default | Hard boundary |
| Merge to `main` | Hard boundary |

---

## 12. Required integrity gates (if future implementation is approved)

Run before any future runtime commit or verification record that claims stack health:

```powershell
$node = "C:\Users\rescarcega\AppData\Local\Programs\cursor\resources\app\resources\helpers\node.exe"
Set-Location "C:\Users\rescarcega\Documents\outoftimeband"
& $node tests/integrity/home-layout-engine-package.mjs
& $node tests/integrity/home-diag-package.mjs
& $node tests/integrity/home-alert-rail-package.mjs
& $node tests/integrity/home-gig-slot-package.mjs
& $node tests/integrity/home-controller-package.mjs
```

### Static invariants to preserve (post-6i-a stack)

- Exactly one `reconcileHomeLayout('rHome')` in `index.html`.
- Two `cue:song-vote`, three `cue:rehearsal` hooks unchanged.
- Gig helper `_maybeRequestHomeGigReconcile` — no hooks in `tick()` / `setInterval`; sig updated only after Home-active gate.
- Reason strings: `gig:pending`, `gig:no-gigs`, `gig:countdown`.
- Coalescer `rHome` dedupe skip preserved; Phase 6d `enterHomeTab` preserved.
- No direct `reconcileHomeLayout` in cue/gig renderers (non-`rHome` via coalescer only).
- Banned strings absent; protected modules untouched unless explicit approved exception.

**Phase 6j planning commit:** integrity gates **not required** (docs only).

---

## 13. Manual / browser verification expectations (local smoke blocker rule)

Follow `PHASE_6D_LOCAL_SMOKE_BLOCKER_NOTE.md`.

| Expectation | Phase 6j planning | Option A (if user approves) |
|-------------|-------------------|----------------------------|
| Minimum gate | N/A (docs only) | Five integrity scripts exit 0 on current HEAD |
| Local browser smoke | **Not required** for this planning commit | **One** short attempt on known-good server; then **stop** |
| If local server blocked | N/A | Document **BLOCKED**; do not debug Windows server loop |
| CDP automation | **Forbidden** | **Forbidden** unless user explicitly approves |
| Compact state read | N/A | `getHomeControllerState()` + `getReconcileCoalescerState()` after `OOT_HOME_LAYOUT_DIAG.disable()` |
| Pilot session | N/A | Optional `modular-inflow` opt-in — confirm delegate on cue/gig transitions |
| Gig timer observation | N/A | Confirm **no** coalescer churn from countdown ticks alone (≥90 s idle Home) |
| Do not require | — | Pill placement correctness, flyer/r106 workstreams, full product QA |

---

## 14. Pass / fail criteria (recommended next boundary)

### Pass — Phase 6j planning (this document)

- Doc exists at `docs/modularization/PHASE_6J_HOME_CONTROLLER_NEXT_BOUNDARY_PLAN.md`.
- Hook rollout pause after 6i-a restated.
- Candidates A–E analyzed; recommendation recorded.
- **No runtime files changed.**
- **No implementation approved** by this doc.

### Pass — Option A verification outcome (future, if user approves)

- Five integrity gates PASS on verification baseline commit.
- Manual result doc records PASS, PARTIAL, or BLOCKED with blocker reference.
- No forbidden file edits during verification pass.
- Cue + gig + `rHome` stack preserved unless user approves a regression fix as a new phase.

### Pass — Option E handoff (future, if user approves)

- HANDOFF_001 includes New Agent Startup Protocol (Phase 6h Section 17 substance).
- Indexes branch, HEAD, hook pause, forbidden list, gate commands.

### Fail

- Any integrity gate fails on claimed-verified stack.
- New hooks added without approved plan.
- `requestHomeReconcile` placed in timer callbacks.
- Visual/CSS/pill/budget changes smuggled into modularization commits.
- Local server debugging treated as app failure.
- Merge to `main` or pilot default enablement.
- Agent treats r106/flyer docs as active workstream without user redirect (see Section 16).

---

## 15. Rollback criteria

| Trigger | Action |
|---------|--------|
| Gig reconcile storm or regression | Revert `fba71aa`; re-run five gates |
| Cue pilot regression | Revert `a714c21` / `6af4398` per scope; re-run gates |
| Coalescer double-execute on `rHome` | Revert through coalescer delegate commit if broken; investigate tail overlap |
| Catastrophic Home break | Revert to last known-good runtime: `a714c21` (pre-gig hook) or `6af4398` (cue-only) per user approval |

| Stable target | Commit | Role |
|---------------|--------|------|
| Current docs baseline | `64f2d25` | Phase 6i-a verified + 6j planning anchor |
| Pre-gig runtime | `a714c21` | 6g rehearsal only |
| Pre-6i planning | `b97c4f0` | 6i design doc only |
| Phase 6h stop | `9cd0827` | Hook pause decision |

---

## 16. Recommended small commit boundary

**Phase 6j planning commit (this task):**

```
Document Phase 6j HomeController next boundary plan
```

Includes only:

- `docs/modularization/PHASE_6J_HOME_CONTROLLER_NEXT_BOUNDARY_PLAN.md`

**Do not combine with:**

- Runtime hook additions
- Verification result claiming browser PASS without attempt doc
- Visual fixes
- `main` merge
- Local server scripts

**Future Option A docs-only commit (if user approves):**

```
Document Phase 6j manual verification result (PASS|BLOCKED|PARTIAL)
```

**Future Option E commit (if user approves):**

```
Add HANDOFF_001 Home modularization agent startup protocol
```

---

## 17. Handoff guidance if the next step is to stop

If the user chooses **Option E** or stops after a BLOCKED verification:

1. Author **`HANDOFF_001`** with the **New Agent Startup Protocol** (required substance in Phase 6h Section 17):
   - Read HANDOFF first; state branch, HEAD, phase, next task, hard boundaries.
   - Verify repo in PowerShell; stop if state differs.
   - Read blocker doc + latest verification + this Phase 6j plan.
   - Do not ask user to upload each handoff file individually.
2. Index in HANDOFF:
   - Runtime stack: 6d → 6e-a/b → 6e-c → 6g → 6i-a (`fba71aa`).
   - Verification: `PHASE_6I_A_VERIFICATION_RESULT.md` @ `64f2d25`.
   - **Hook rollout paused** — no new tails without new plan + approval.
   - Forbidden files (short list) + five gate commands.
   - Next candidates: A verification, B diag, C/D planning-only, E stop.
3. **Workstream rule for next agent:** Treat **r106 / flyer** documentation and tasks as **legacy / out of scope** for Home modularization unless the user **explicitly** changes workstreams in the task prompt. Default focus remains HomeController + layout engine pilot on `modularization-home-layout-engine-pilot`.
4. **`oot-local-server.ps1`:** Remains untracked; never commit.

---

## 18. Explicit stop point

**This document is planning only.**

- **Phase 6i-a is complete and verified** at `64f2d25` (runtime `fba71aa`).
- **No Phase 6j implementation** is approved by this commit.
- **No runtime code, `index.html`, tests, or CSS edits** in the planning commit.
- **No local server work.**
- **No CDP automation.**
- **No merge to `main`.**
- **Hook rollout remains paused** until user explicitly chooses and approves a boundary from Section 6.

Await user choice:

- **(A)** Manual/browser verification (known-good path; one attempt; docs outcome)
- **(B)** Diagnostics enrichment (requires separate scoped approval)
- **(C)** `rHome`/coalescer migration **planning only** (new doc)
- **(D)** Cue renderer extraction **planning only** (new doc)
- **(E)** Stop and prepare HANDOFF_001

**No option above is approved by default.**
