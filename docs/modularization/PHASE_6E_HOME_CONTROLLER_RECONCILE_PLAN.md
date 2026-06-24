# Phase 6e Plan - HomeController Coalesced Reconcile (Planning Only)

**Branch:** `modularization-home-layout-engine-pilot`  
**Baseline:** `f561135` - *Document Phase 6d local smoke blocker*  
**HEAD == origin:** Yes (at time of note)  
**Scope:** Planning only - **no implementation**  
**Production default:** `legacy-overlay` (pilot opt-in only)

Reference docs: `PHASE_6B_CALLSITE_INVENTORY.md`, `PHASE_6C_MANUAL_VERIFICATION.md`, `PHASE_6D_LOCAL_SMOKE_BLOCKER_NOTE.md`.

---

## 1. Current verified repo state

| Item | Value |
|------|--------|
| Branch | `modularization-home-layout-engine-pilot` |
| HEAD / origin | `f5611355b9c43ed2a4e992cf209fcebf1e0385f4` |
| Latest runtime commit | `2e4ff1a` - *Add HomeController go('home') entry orchestration (Phase 6d)* |
| Working tree | Clean except untracked `oot-local-server.ps1` (local-only; do not commit unless approved) |
| Reconcile executor | **`reconcileHomeLayout('rHome')`** at `rHome()` tail in `index.html` - sole call site |
| Controller phase | `6d-orchestrate-entry` |
| `go('home')` | Delegates via `enterHomeTab('go')` -> legacy `rHome()` |

Recent stack: `f561135` -> `2e4ff1a` -> `fc3ddc9` -> `74514a1` -> ...

---

## 2. What Phase 6a-6d established

| Phase | Delivered |
|-------|-----------|
| **6a** | `OOT.home.controller` record-only API + compat shims |
| **6b** | Diag snapshot enrichment + call-site inventory doc |
| **6c** | Guarded record-only notification hooks in `index.html`; `requestHomeReconcile` records intent only |
| **6d** | `enterHomeTab('go')` delegate; activate dedupe on orchestrated path; **no reconcile routing** |

**Controller still records:** `enterHomeTab`, `activate`, `notifyCueChange`, `notifyGigSlotChange`, `notifyImageRefresh`, `requestReconcile`.

**Controller still does not execute:** `reconcileHomeLayout`, DOM/CSS/storage mutations, cue HTML, budget math.

---

## 3. Key Phase 6 finding (motivation for 6e)

**Layout reconcile is tied to `rHome` completion, not to cue/alert updates.**

- `reconcileHomeLayout('rHome')` runs only at the **`rHome()` tail**.
- Firestore and fallback listener paths call `renderHomeSongVoteCue` / `renderHomeRehearsalCue`, which call **`syncAlertRailState`** (and may schedule image refresh), but they **do not** invoke `reconcileHomeLayout`.
- When Home is **not** the active tab, listeners still update cue DOM and alert state attrs; layout budget/tokens are not re-run until the next `rHome()`.

Phase 6e addresses this **coordination gap** without reintroducing banned rescue paths.

---

## 4. Phase 6e goal

Introduce a **coalesced reconcile path** via `requestReconcile` that:

1. **Records** reconcile intent (already done in 6c).
2. **Coalesces** multiple `requestReconcile` calls within a single activation/frame into **<=1** legacy `reconcileHomeLayout` execution when appropriate.
3. **Preserves** layout engine as the reconcile **executor** - controller orchestrates timing, not budget math.
4. **Does not** change cue HTML, legacy CSS, band image registry, or pilot default.

Phase 6e is **not** tab-entry orchestration (6d done), **not** Song Vote pill placement, **not** budget tuning.

---

## 5. Proposed event sequences (target state)

### 5.1 Cue visibility changes (Firestore / renderHome*Cue)

```
listener or renderHomeSongVoteCue / renderHomeRehearsalCue
  -> cue HTML + display (unchanged bodies)
  -> syncAlertRailState('cue:...')
  -> controller.requestReconcile('cue:visible' | 'cue:hidden')  // debounced/coalesced
       -> reconcileHomeLayout (legacy layout module) at most once per coalesced pass
```

**Rule:** Cue renderers **must not** call `reconcileHomeLayout` directly in Phase 6e target state - only the controller coalescer invokes legacy reconcile.

### 5.2 Band image load / refresh

```
image load / _scheduleHomeImagePresentationRefresh
  -> bandImage.apply (unchanged registry)
  -> controller.requestReconcile('image:refresh')  // after apply completes
       -> layout reconcile only if Home active + inputs changed
```

**Rule:** Image presentation must not change layout tokens; controller ensures reconcile runs **after** apply when Home is active.

### 5.3 Gig slot change (`updateCountdown`, events init)

```
updateCountdown / events listener
  -> gig content update (index.html, unchanged)
  -> syncGigSlotState / applyGigSlotFootprint (gig module)
  -> controller.requestReconcile('gig:...')
       -> coalesced reconcile when Home active
```

### 5.4 Full `rHome()` path (unchanged executor hook)

```
rHome() ... existing steps ...
  -> requestHomeReconcile('rHome')   // record (6c)
  -> reconcileHomeLayout('rHome')    // legacy execute (unchanged hook location until sub-phase approval)
```

Phase 6e may **coalesce** listener-driven `requestReconcile` with the `rHome` tail reconcile when both occur in the same activation window - design detail for implementation approval.

---

## 6. What remains legacy-owned in Phase 6e

| Area | Owner |
|------|--------|
| Cue renderer HTML / onclick / pill placement | `index.html` (Song Vote Pending remains known pre-existing issue) |
| `updateCountdown` DOM | `index.html` |
| Band image registry / apply | `oot_home_band_image.js` |
| Alert/gig attr sync implementations | alert rail + gig slot modules |
| Budget math + token writes | `oot_home_layout_engine.js` |
| `reconcileHomeLayout` implementation | layout engine module |
| Legacy Home CSS | `index.html` |

---

## 7. Safest first implementation boundary (when approved)

**Phase 6e-a (recommended first commit): coalescer scaffold only**

- Add controller-internal debounce/coalesce for `requestReconcile` (e.g. rAF or microtask flush).
- **Do not** add new `reconcileHomeLayout` call sites in cue renderers yet.
- **Do not** remove the `rHome` tail reconcile hook.
- Wire coalescer to execute legacy `reconcileHomeLayout` only from controller flush path in a later sub-phase (**6e-b**) after scaffold integrity passes.

**Phase 6e-b (second commit, if approved): listener/cue notify -> coalesced reconcile**

- After existing `notifyCueChange` / `notifyGigSlotChange` / `notifyImageRefresh` record hooks, call `requestHomeReconcile` (already partially present at `rHome` tail).
- Redirect **only** `requestReconcile` coalesced flush -> legacy `reconcileHomeLayout(reason)` when `#sc-home` is active and pilot/layout preconditions unchanged.
- Still **one logical reconcile owner**; no second ad-hoc hook in cue HTML bodies.

**Do not start with:** removing `rHome` tail hook, cue markup edits, or pilot-default enablement.

---

## 8. Allowed files (future implementation)

| File | Permitted change |
|------|------------------|
| `oot_home_controller.js` | Coalescer state machine; `PHASE` bump; flush -> delegate to legacy reconcile **only when approved** |
| `index.html` | Thin `requestHomeReconcile` wiring at approved notify tails only - **no** CSS/cue HTML |
| `oot_compat_home.js` | Shim updates if needed |
| `tests/integrity/home-controller-package.mjs` | Coalescer + single-executor guards |
| `tests/integrity/home-layout-engine-package.mjs` | Index diff allowance if needed |
| `docs/modularization/` | Verification notes after smoke |

---

## 9. Forbidden files / edits

| Forbidden | Reason |
|-----------|--------|
| `oot_home_layout_engine.js` / `.css` | No budget tuning; layout engine behavior frozen except invoked reconcile |
| `oot_home_band_image.js` | No image layout/framing changes unless explicitly approved |
| `oot_home_gig_slot.js` | No behavior change unless explicitly approved |
| `oot_home_alert_rail.js` | Alert sync stays legacy-triggered |
| Cue HTML / onclick / Song Vote pill fix | Out of scope |
| Default `modular-inflow` | Hard boundary |
| Banned rescue paths | `HomeLayoutContract`, footprint attrs, `_homeMaybeLockAlertsFootprint`, etc. |
| `main` merge | Out of scope |
| CDP / temp smoke scripts | See `PHASE_6D_LOCAL_SMOKE_BLOCKER_NOTE.md` |
| Local server debugging loops | See future-agent rule in blocker note |

---

## 10. Required integrity gates

All five packages must pass before any 6e commit:

```powershell
node tests/integrity/home-layout-engine-package.mjs
node tests/integrity/home-diag-package.mjs
node tests/integrity/home-alert-rail-package.mjs
node tests/integrity/home-gig-slot-package.mjs
node tests/integrity/home-controller-package.mjs
```

Static invariants:

- Controller must not embed budget formulas or banned strings.
- **`reconcileHomeLayout` implementation stays in layout module.**
- No static `data-home-layout-mode="modular-inflow"` in HTML.
- Phase 6d `enterHomeTab('go')` delegate preserved.

Add when implementing:

- **Reconcile storm guard:** <=1 coalesced legacy reconcile per coalesced activation window (P6-5 intent).
- **`syncAlertRailState` before reconcile** ordering preserved in full `rHome` path (P6-6 intent).

---

## 11. Manual verification requirements

Follow `PHASE_6D_LOCAL_SMOKE_BLOCKER_NOTE.md` future-agent rules:

1. Verify repo state + integrity tests first.
2. If browser smoke is needed, use a **known-good server path only**; one short attempt - then stop.
3. Do **not** use CDP smoke runners unless explicitly approved.
4. If local smoke is blocked, document and proceed on gates/diff review or stop for user decision.

When smoke is available, re-check:

- Default `legacy-overlay`; pilot opt-in only.
- Cue/listener update while Home active -> coalesced reconcile count <=1 per frame/window.
- H8/H9 tab return dimensions stable (pilot session if available).
- `reconcileHomeLayout === OOT.home.layout.reconcile`; controller has no reconcile implementation of its own.

Before measurement snippets:

```javascript
OOT_HOME_LAYOUT_DIAG.disable();
```

Use `getHomeControllerState()` (not `OOT_HOME_CONTROLLER.getSnapshot` - that API does not exist).

---

## 12. Pass / fail criteria

**Pass**

- All five integrity scripts exit 0.
- Coalesced `requestReconcile` reduces reconcile storms without stale layout (alerts visible + non-zero rail when cues shown).
- <=1 coalesced legacy reconcile per designed window under listener burst (P6-5).
- `syncAlertRailState` still runs before final reconcile in full `rHome` sequence (P6-6).
- Legacy-overlay default unchanged; pilot opt-in only.
- No cue HTML/CSS/pill/budget/image module diffs beyond approved wiring.
- Phase 6d `enterHomeTab` behavior preserved.

**Fail**

- Missed reconcile (cues visible, layout stale, pilot tokens wrong).
- Reconcile storm (>1 uncoalesced legacy executes per frame).
- Second ad-hoc `reconcileHomeLayout` hook added in cue renderers without coalescer design.
- Controller implements budget math or banned strings.
- Song Vote pill 'fix' smuggled in.
- Local server debugging treated as app failure.

---

## 13. Rollback criteria

Revert Phase 6e commit(s) if:

- Any pass criterion fails on integrity or manual smoke (when available).
- Coalescer causes missed reconcile or visible layout regression on legacy-overlay default.
- Firestore cue paths regress (onclick, navigation).

**Action:** `git revert <6e-commit>` (or reset to `2e4ff1a` / `f561135` docs-only if unpushed). No migration.

---

## 14. Recommended commit boundary

**Commit 1 (6e-a):** `Add HomeController reconcile coalescer scaffold (Phase 6e-a)` - controller coalescer only, **no** new reconcile executions from listener paths.

**Commit 2 (6e-b, if approved):** `Wire coalesced requestHomeReconcile to legacy layout reconcile (Phase 6e-b)` - approved notify tails + single flush to `reconcileHomeLayout`.

Optional **docs-only commit:** `PHASE_6E_MANUAL_VERIFICATION.md` after smoke (or blocker note if smoke unavailable).

**Do not combine with:** Song Vote pill fix, budget tune, pilot default, `main` merge.

---

## 15. Explicit stop point

**This document is planning only.**

- **No Phase 6e implementation** in this commit.
- **No local server work.**
- **No CDP automation.**
- **No Phase 7 / pilot promotion.**

Await explicit user approval of 6e-a scaffold boundary before any code changes.
