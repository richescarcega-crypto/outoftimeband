# Phase 6f Plan - Manual Verification and Diagnostic Review (Planning Only)

**Branch:** `modularization-home-layout-engine-pilot`  
**Baseline:** `6af4398` - *Wire Home notify tail reconcile request*  
**HEAD == origin:** Yes (at time of note)  
**Scope:** Planning only - **no implementation, no smoke execution in this commit**  
**Production default:** `legacy-overlay` (pilot opt-in only)

Reference docs: `PHASE_6E_C_LISTENER_NOTIFY_RECONCILE_PLAN.md`, `PHASE_6E_B_RECONCILE_WIRING_PLAN.md`, `PHASE_6E_HOME_CONTROLLER_RECONCILE_PLAN.md`, `PHASE_6D_LOCAL_SMOKE_BLOCKER_NOTE.md`, `PHASE_6C_MANUAL_VERIFICATION.md`

---

## 1. Current repo state and Phase 6e completed commits

| Item | Value |
|------|--------|
| Branch | `modularization-home-layout-engine-pilot` |
| HEAD / origin | `6af4398` |
| Controller phase | `6e-b-reconcile-delegate` (unchanged by 6e-c index-only pilot) |
| Working tree | Expected clean except untracked `oot-local-server.ps1` (local-only; do not commit) |

### Phase 6e commit stack (runtime + docs)

| Commit | Summary |
|--------|---------|
| `4d0c7c8` | **6e-a** - HomeController reconcile coalescer scaffold (record-only flush) |
| `1361381` | Docs - Phase 6e reconcile coalescing plan |
| `efd6a6b` | **6e-b** - Coalescer flush delegate to legacy reconcile; `rHome` dedupe guard |
| `f5e37a7` | Docs - Phase 6e-b reconcile wiring plan |
| `eea93c1` | Docs - Phase 6e-c listener notify reconcile plan |
| `6af4398` | **6e-c** - Song-vote cue notify tail `requestHomeReconcile('cue:song-vote')` (Home-active gated) |

Prior orchestration still in stack: Phase 6d `enterHomeTab('go')` @ `2e4ff1a`; Phase 6c record-only notify hooks @ `74514a1`.

### Runtime reconcile topology after 6e-c

| Path | Request | Execute |
|------|---------|---------|
| `rHome()` tail | `requestHomeReconcile('rHome')` | `reconcileHomeLayout('rHome')` direct (legacy tail) |
| Coalescer flush (`rHome` reason) | `reconcileCoalesceFlush` record | **Skipped** delegate (`skippedRHomeExecution++`) |
| `renderHomeSongVoteCue` (Home active) | `requestHomeReconcile('cue:song-vote')` | Coalescer delegate -> legacy reconcile (non-`rHome`) |
| Other notify tails | `notify*` only | No reconcile request yet |

---

## 2. What Phase 6e-c changed

**File:** `index.html` only (plus integrity test allowlists).

**Added (two identical hooks):** on `renderHomeSongVoteCue` hidden and visible exit tails, after `syncAlertRailState` and `notifyCueChange`:

```javascript
try { var _hs=document.getElementById('sc-home'); if(_hs&&_hs.classList.contains('on')&&typeof requestHomeReconcile==='function')requestHomeReconcile('cue:song-vote'); } catch(e){}
```

**Not changed:**

- `oot_home_controller.js` (6e-b delegate already handles non-`rHome` reasons)
- `rHome()` tail ordering or direct `reconcileHomeLayout('rHome')` hook
- Cue HTML, CSS, pill placement, budget constants, pilot default
- Rehearsal cue, gig slot, or image notify tails

---

## 3. What must be verified manually

Manual verification is **recommended but not mandatory to proceed on gates alone** per `PHASE_6D_LOCAL_SMOKE_BLOCKER_NOTE.md`. When a known-good server path exists, verify:

| ID | Manual check | Why not integrity-only |
|----|--------------|------------------------|
| M1 | Default session stays `legacy-overlay`; pilot opt-in still works | Runtime localStorage / query behavior |
| M2 | `rHome()` produces exactly **one** layout reconcile (no double execute) | Timing/coalescer + tail interaction |
| M3 | Song-vote cue change **while Home active** triggers coalescer delegate (`cue:song-vote`) | Firestore/listener live path |
| M4 | Song-vote listener update **while Home inactive** does **not** delegate reconcile | Home-active gate at index tail |
| M5 | `go('home')` -> `enterHomeTab('go')` -> `rHome()` unchanged | Tab entry orchestration |
| M6 | No visible Home layout regression on legacy-overlay default | Visual/DOM dimensions |
| M7 | Pilot session (`modular-inflow` opt-in): alert rail / hero tokens update after cue toggle without tab re-entry | Phase 6 gap closure intent |

**Do not require manual proof of:** rehearsal cue, gig countdown, or image-only reconcile paths (not wired yet).

---

## 4. What can be verified by integrity tests only

Run before any manual smoke. These are **sufficient for a narrow Phase 6e merge gate** when local smoke is blocked.

| ID | Integrity-only proof |
|----|----------------------|
| I1 | All five integrity packages exit 0 |
| I2 | Exactly one `reconcileHomeLayout('rHome')` in `index.html` |
| I3 | No `reconcileHomeLayout` inside `renderHomeSongVoteCue` (or other cue renderers) |
| I4 | Exactly two `requestHomeReconcile('cue:song-vote')` hooks with Home-active gate |
| I5 | `syncAlertRailState` precedes pilot hook on both song-vote branches |
| I6 | Controller contains coalescer delegate + `rHome` skip guard; no banned strings |
| I7 | Protected modules untouched (layout engine, band image, alert rail, gig slot, layout CSS) |
| I8 | Phase 6d `enterHomeTab('go')` wiring preserved |
| I9 | No static `modular-inflow` default in HTML |
| I10 | No `requestHomeReconcile('cue:rehearsal')` or gig/image pilot hooks |

---

## 5. HomeController diagnostics / state checks

Use **`getHomeControllerState()`** (compat global) or **`OOT.home.controller.getState()`**.  
Do **not** use `OOT_HOME_CONTROLLER.getSnapshot` - that API does not exist.

Before reading state in browser, suppress diag noise once:

```javascript
OOT_HOME_LAYOUT_DIAG.disable();
```

### After `rHome()` (baseline Home refresh)

| Field | Expected |
|-------|----------|
| `phase` | `6e-b-reconcile-delegate` |
| `lastMethod` | `requestReconcile` (or later tail methods in same refresh) |
| `lastReason` | `rHome` |
| `reconcileCoalescer.skippedRHomeExecution` | Increments vs pre-`rHome` (coalescer flush skipped delegate) |
| `reconcileCoalescer.lastDelegatedReason` | Unchanged by `rHome`-only path (or not `rHome` from delegate) |

### After song-vote cue toggle while Home active (pilot opt-in session for layout token checks)

| Field | Expected |
|-------|----------|
| Recent events include | `requestReconcile` with reason `cue:song-vote` |
| Coalescer flush | `reconcileCoalesceFlush` with reason `cue:song-vote` |
| Delegate | `reconcileCoalesceExecute` with `delegated: true` in options |
| `reconcileCoalescer.lastDelegatedReason` | `cue:song-vote` |
| `duplicateCount` | May be >0 under rapid listener burst; still <=1 delegate per coalesced window |

### Compact state read (single expression)

```javascript
(function(){ OOT_HOME_LAYOUT_DIAG.disable(); var s=getHomeControllerState(); return { phase:s.phase, lastMethod:s.lastMethod, lastReason:s.lastReason, coalescer:s.reconcileCoalescer, tail:s.events.slice(-6) }; })()
```

### Optional diag export (when `homeLayoutDiag=1` enabled)

Confirm snapshot includes read-only controller subset (`phase`, `lastMethod`, `lastReason`, `eventCount`) without controller owning reconcile implementation.

---

## 6. What should not be tested through local Windows server debugging

Follow `PHASE_6D_LOCAL_SMOKE_BLOCKER_NOTE.md` future-agent rules. **Do not:**

| Avoid | Reason |
|-------|--------|
| Rebuild / retry-loop `oot-local-server.ps1` | Environment blocker, not app regression signal |
| Repeated port `18766` / `AcceptTcpClient` debugging | Known local failure mode |
| CDP smoke runners / temp `cdp-smoke.mjs` scripts | Hung in Phase 6d; not approved |
| Long multi-step console snippet chains | Prefer one compact state read (Section 5) |
| Killing random processes to free port | Out of scope |
| Treating local smoke failure as Phase 6e code failure | Gates + diff review suffice when blocked |

**One short attempt** on a known-good server path only; then stop and document PASS/FAIL/BLOCKED.

---

## 7. Verify notify-tail request path without long console snippets

### Minimal manual procedure

1. Run integrity gates (Section 11).
2. Open app on **known-good server** (if available); default session first.
3. `OOT_HOME_LAYOUT_DIAG.disable()`
4. Baseline: navigate Home once; run compact state read (Section 5); note `skippedRHomeExecution`.
5. Opt into pilot if checking layout tokens: `localStorage.setItem('oot_home_layout_pilot','1'); location.reload()`
6. While **Home tab active** (`#sc-home.on`), trigger a song-vote cue visibility change (Firestore-driven or existing test data).
7. Re-run compact state read; confirm `cue:song-vote` in recent events and `reconcileCoalesceExecute` when pilot enabled.
8. Switch to another tab; trigger cue data change if possible; confirm **no** new `reconcileCoalesceExecute` (gate blocks request).
9. Return Home via tab bar; confirm `enterHomeTab` / `rHome` path still works.

### Static proof (no browser)

Integrity tests I2-I10 + git diff review of `6af4398` alone confirm hook placement, ordering, and absence of direct renderer reconcile.

---

## 8. How to confirm no Home visual/layout regression

| Check | Method |
|-------|--------|
| Legacy-overlay default | No pilot flag; Home loads; no new console errors from controller |
| Key dimensions stable | Compare `#sc-home`, hero, `#home-social-row` heights before/after idempotent `rHome()` (see `PHASE_6C_MANUAL_VERIFICATION.md` pattern) |
| Tab return | Chat (or other tab) -> Home; dimensions unchanged on default mode |
| Pilot opt-in | Optional: alert rail in-flow under `modular-inflow`; no new overflow/clipping vs pre-6e-c baseline |
| Song Vote pill placement | **Known pre-existing issue** - do not treat as 6e-c regression unless clearly new breakage |

**Fail visual regression** only on evidence of new layout damage attributable to 6e-c hook (not pre-existing pill placement).

---

## 9. How to confirm rHome legacy tail remains the main Home entry executor

| Invariant | Verification |
|-----------|--------------|
| `go('home')` uses `enterHomeTab('go')` | Integrity I8; manual tab click |
| `enterHomeTab` calls legacy `rHome()` | Controller source unchanged; manual `eventCount` delta on tab entry |
| Tail hook preserved | Exactly one `reconcileHomeLayout('rHome')` in `index.html` (I2) |
| Full refresh reconcile | After `rHome()`, layout reconcile occurs via **tail direct call**, not coalescer delegate |
| Coalescer `rHome` dedupe | `skippedRHomeExecution` increments; no `reconcileCoalesceExecute` with reason `rHome` |

**Main Home entry executor for full refresh:** legacy `rHome()` tail. Controller coalescer is supplemental for listener-driven `cue:song-vote` only.

---

## 10. How to confirm listener paths do not directly call reconcileHomeLayout

| Scope | Integrity | Manual |
|-------|-----------|--------|
| `renderHomeSongVoteCue` | I3 - no `reconcileHomeLayout` in function body | N/A |
| `renderHomeRehearsalCue` | Static scan / no new hooks in 6e-c | N/A |
| `updateCountdown` | No new reconcile hooks | N/A |
| Firestore listener callbacks | No direct reconcile in listener bodies (only renderer tails) | Code review / diff |
| Global call-site count | Still one `reconcileHomeLayout('rHome')` in index | I2 |

**Rule:** listener-driven reconcile must flow `requestHomeReconcile` -> coalescer -> legacy delegate, never direct `reconcileHomeLayout` in renderers.

---

## 11. Required PowerShell integrity gates

Run all five before recording Phase 6f verification outcome:

```powershell
$node = "C:\Users\rescarcega\AppData\Local\Programs\cursor\resources\app\resources\helpers\node.exe"
Set-Location "C:\Users\rescarcega\Documents\outoftimeband"
& $node tests/integrity/home-layout-engine-package.mjs
& $node tests/integrity/home-diag-package.mjs
& $node tests/integrity/home-alert-rail-package.mjs
& $node tests/integrity/home-gig-slot-package.mjs
& $node tests/integrity/home-controller-package.mjs
```

Record: pass count, date, HEAD sha, and whether manual smoke was BLOCKED/PASS/FAIL.

---

## 12. Optional browser/manual checks (known-good server only)

Proceed **only if** a reliable server path is already available. **One short session**; then stop.

| Step | Action |
|------|--------|
| 1 | Integrity gates all pass |
| 2 | Load `/index.html` (not required to debug local server setup) |
| 3 | Default mode checks M1, M5, M6 |
| 4 | Pilot opt-in optional for M7 |
| 5 | Song-vote cue toggle checks M3, M4 |
| 6 | Document outcome in `PHASE_6F_MANUAL_VERIFICATION.md` (future docs-only commit) or note BLOCKED referencing this plan |

If blocked: cite `PHASE_6D_LOCAL_SMOKE_BLOCKER_NOTE.md`; do **not** loop on local server.

---

## 13. Pass / fail criteria

### Pass (Phase 6f verification)

- All five integrity scripts exit 0 (I1-I10 satisfied).
- Manual smoke PASS or **BLOCKED with gates pass** (documented limitation).
- When manual smoke runs: M1-M6 pass; M7 pass if pilot session tested.
- `rHome` tail remains sole full-refresh executor; no double reconcile on `rHome()`.
- Song-vote pilot delegates only when Home active; coalescer records correct reasons.
- No forbidden file regressions; banned strings absent.
- Song Vote pill not "fixed" or blamed as 6e-c regression without evidence.

### Fail

- Any integrity script fails.
- Double `reconcileHomeLayout` on `rHome()` path.
- Direct `reconcileHomeLayout` in cue renderer or listener body.
- Coalescer delegate on `rHome` reason while tail still executes (double layout reconcile).
- Reconcile delegate when Home tab inactive (gate failure).
- New visible layout regression on legacy-overlay default.
- Local server debugging treated as definitive app failure without gate review.

---

## 14. Rollback criteria

| Trigger | Action |
|---------|--------|
| Phase 6f verification FAIL | Revert `6af4398` (6e-c) first; re-run gates |
| Delegate/coalescer regression from 6e-b | Revert `efd6a6b` after 6e-c revert if needed |
| Catastrophic orchestration regression | Revert through Phase 6e stack per user approval |

**Commands (unpushed):** `git revert 6af4398` (6e-c only) or reset to `efd6a6b` / `eea93c1` docs baseline.

No migration. Do not revert Phase 6d/6c unless independently broken.

---

## 15. Next implementation boundary after verification passes

**Do not broaden listener rollout until Phase 6f verification is recorded (PASS or BLOCKED+gates).**

### Recommended next phase (Phase 6e-d)

Single commit, separate approval:

- **Candidate:** `renderHomeRehearsalCue` tails only
- **Reason string:** `cue:rehearsal` (fixed at implementation)
- **Pattern:** same Home-active gate + `requestHomeReconcile` after `syncAlertRailState` / notify tails
- **Not in same commit:** gig `updateCountdown`, image-only paths, `rHome` tail hook removal

### Explicitly deferred

| Item | Phase |
|------|-------|
| Gig slot / countdown reconcile request | 6e-e+ (timer-safe design required) |
| Band image load reconcile request | Later (weak layout coupling) |
| Migrate sole `rHome` reconcile to coalescer | Coordinated change; remove tail hook in same commit as migration design |
| Phase 7 / pilot default promotion | Out of scope |
| Song Vote pill placement fix | Out of scope |

### Docs-only follow-up after verification

Optional commit: `PHASE_6F_MANUAL_VERIFICATION.md` with PASS / BLOCKED outcome (mirror `PHASE_6C_MANUAL_VERIFICATION.md` format).

---

## 16. Explicit stop point

**This document is planning only.**

- **No code edits.**
- **No manual smoke execution required in this commit.**
- **No local server work.**
- **No CDP automation.**

Await Phase 6f verification execution (gates + optional smoke) before approving Phase 6e-d implementation.
