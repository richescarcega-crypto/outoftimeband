# Phase 6b Home Lifecycle Call-Site Inventory

**Branch:** `modularization-home-layout-engine-pilot`  
**Remote baseline:** `6d2f8d2` — *Enrich Home diagnostics for Phase 6b*  
**Parent milestones:**

| Commit | Summary |
|--------|---------|
| `c49b51d` | Phase 6a — `HomeController` scaffold (`oot_home_controller.js`, compat shims, integrity guards) |
| `d55ae06` | Phase 5d — pilot ownership fixes (alert rail in-flow, cue-visible hero, §H CSS) |

**Document purpose:** Preserve the Phase 6b Home lifecycle call-site inventory and diagnostic plan in the repo **before Phase 6c begins**.  
**Production default unchanged:** `legacy-overlay` (pilot off unless `?homeLayoutPilot=1` or `localStorage oot_home_layout_pilot=1`).

---

## Module load order (index.html tail)

```
oot_home_band_image.js
oot_home_alert_rail.js
oot_home_gig_slot.js
oot_home_layout_engine.js + oot_home_layout_engine.css
oot_home_diag.js
oot_home_controller.js   ← Phase 6a scaffold only; not invoked from index.html yet
oot_compat_home.js
```

---

## 1. Current Home lifecycle call-site inventory

Line numbers refer to `index.html` at baseline `6d2f8d2`.

### `go('home', …)` — tab activation entry

| Location | Context |
|----------|---------|
| ~18933 | Home toolbar button `onclick="go('home',this)"` |
| ~21707 | `saveBandImagePref` close-and-home path |
| ~24358 | `_forceHomeDefaultView` — lifecycle default lands on Home |
| ~24406 | **`go(id, btn)` body** — when `id === 'home'`, calls `rHome()` |

`go()` (~24388) switches `.sc`/`.tb` active classes, then dispatches tab renderers. Home is the only tab whose renderer is `rHome()`.

### `rHome()` — full Home refresh

**Definition:** ~30700–30750.

**Direct callers (no `go` wrapper):**

| Line | Context |
|------|---------|
| ~21695 | `saveBandImagePref` onSaved (band image picker save) |
| ~24050 | `initApp()` bootstrap (before Firestore listeners attach) |
| ~24935 | `_reapplyLastExternalReturnContext` — already on Home tab, re-render only |
| ~25742 | `listenEvents()` first snapshot / events update |
| ~38037 | `saveMember` roster update |
| ~38044 | `deleteMember` roster removal |
| ~38071 | member modal close path (`clM('mm'); rBand(); rHome()`) |

**Indirect callers:** any `go('home', …)` path (~24406).

### `reconcileHomeLayout(reason)`

| Location | Context |
|----------|---------|
| **`index.html` ~30749** | **`rHome()` tail only** — `reconcileHomeLayout('rHome')` |
| `oot_home_layout_engine.js` | Module defines `window.reconcileHomeLayout`; pilot budget + token writes when mode is `modular-inflow` |
| `oot_compat_home.js` | Restores global from `OOT.home.layout.reconcile` if missing |

**Key finding (Phase 6):** `reconcileHomeLayout` is invoked from **`index.html` exactly once**, at the end of `rHome()`. No Firestore listener, cue renderer, or image refresh path calls it directly.

### `syncAlertRailState(reason)`

Implemented in `oot_home_alert_rail.js`; sets `#sc-home[data-home-alert-state]` from cue DOM visibility.

| Line | Caller | Reason string |
|------|--------|---------------|
| ~22737 | `renderHomeSongVoteCue` (hidden) | `'renderHomeSongVoteCue'` |
| ~22757 | `renderHomeSongVoteCue` (visible) | `'renderHomeSongVoteCue'` |
| ~22683, ~22693, ~22716 | `renderHomeRehearsalCue` (each branch) | `'renderHomeRehearsalCue'` |
| ~30740 | `rHome()` | `'rHome'` |

Cue render paths sync alert state **without** calling `reconcileHomeLayout`.

### `renderHomeSongVoteCue()`

| Line | Context |
|------|---------|
| ~22719 | Function definition (DOM cue row + `syncAlertRailState` + diag snapshot) |
| ~22452 | `listenSuggestions()` Firestore ordered snapshot tail |
| ~22788 | `_ensureHomeCueFallbackListeners()` unordered suggestions fallback |
| ~26610 | `listenProposals()` snapshot tail |
| ~30738 | `rHome()` |

### `renderHomeRehearsalCue()`

| Line | Context |
|------|---------|
| ~22673 | Function definition |
| ~22453 | `listenSuggestions()` snapshot tail (paired with song vote cue) |
| ~22806 | `_ensureHomeCueFallbackListeners()` unordered proposals fallback |
| ~23326 | `listenAgendas()` snapshot |
| ~26609 | `listenProposals()` snapshot tail |
| ~30739 | `rHome()` |

Each visible/hidden branch also calls `_scheduleHomeImagePresentationRefresh(…)` and `_homeLayoutDiagSnapshot(…)` where rehearsal cue affects band image mode.

### `_scheduleHomeImagePresentationRefresh(reason)`

Defined in `oot_home_band_image.js`; debounces `_applyHomeImagePresentation` via registry.

| Source | Reason examples |
|--------|-----------------|
| `index.html` ~30670 | `home-band-image-load` (backdrop `onload`) |
| `index.html` cue renderers | `rehearsal-cue hidden no events`, `rehearsal-cue visible`, etc. |
| `index.html` ~30741 | `rHome final` |
| `oot_home_band_image.js` | `home-rehearsal-cue mutation` (MutationObserver) |

Does **not** call `reconcileHomeLayout`.

### `updateCountdown()`

| Line | Context |
|------|---------|
| ~23875 | Function definition — gig card DOM, `renderNoGigsCard`, interval timer |
| ~23925 | Self-recursive when countdown reaches zero |
| ~30704 | `rHome()` (after `renderPendingProposalCue`) |

Side effects via gig slot module: `reserveGigSlotPending()`, `syncGigSlotState('updateCountdown:…')` (~23894, ~23939). Still **legacy-owned** countdown HTML; module only mirrors footprint/state attrs.

### Home activation / tab-return helpers

| Helper | Role |
|--------|------|
| `_forceHomeDefaultView(reason)` (~24339) | Resets transient UI, `go('home', hb)`, scroll Home to top |
| `_scheduleForceHomeDefault(reason)` (~24374) | Debounced timers → `_forceHomeDefaultView` |
| `_resetTransientUIForHomeDefault(reason)` (~24189) | Closes modals/overlays before forcing Home |
| `_handleLifecycleReturn` / `_handleLifecycleLeaving` (~41559–41606) | `visibilitychange`, `focus`, `blur`, `pagehide`, `pageshow` — external-return restore **or** force Home |
| `initApp` setTimeout (~24078–24085) | External return on boot, else `_scheduleForceHomeDefault('init')` |
| `_reapplyLastExternalReturnContext` (~24925–24935) | Restores tab context; calls `rHome()` when already on Home |
| `_ensureHomeCueFallbackListeners()` (~22767) | Lazy Firestore unordered listeners; re-render cues only |

---

## 2. Current `rHome()` internal order

Canonical sequence at ~30700–30749:

1. `_ensureHomeBandBackdrop()` — band backdrop img, registry apply, image tap binding
2. `renderPendingProposalCue()` — proposal micro-cue + Calendar tab badge
3. `updateCountdown()` — next-gig card / no-gigs / gig slot state sync
4. **Birthday banner** — `#birthday-banner` inline render from `members`
5. `_ensureHomeCueFallbackListeners()` — one-time unordered Firestore fallbacks
6. `renderHomeSongVoteCue()`
7. `renderHomeRehearsalCue()`
8. `syncAlertRailState('rHome')`
9. `_ensureHomePresentationObserver()` + `_scheduleHomeImagePresentationRefresh('rHome final')`
10. **Who-am-i** — `#who-am-i` innerHTML from `myName` / `gM(ME)`
11. `_homeLayoutDiagSnapshot('rHome:end', {})`
12. **`reconcileHomeLayout('rHome')`** — last step

---

## 3. Already module-owned responsibilities

| Module | Owns |
|--------|------|
| `oot_home_band_image.js` | `HOME_IMAGE_PRESENTATION` registry, `_applyHomeImagePresentation`, `_scheduleHomeImagePresentationRefresh`, presentation MutationObserver |
| `oot_home_alert_rail.js` | `getAlertRailState`, `syncAlertRailState`, `data-home-alert-state` on `#sc-home` |
| `oot_home_gig_slot.js` | `getGigSlotState`, `syncGigSlotState`, `reserveGigSlotPending`, `applyGigSlotFootprint`, `--home-gig-slot-h`, `data-home-gig-slot-state` |
| `oot_home_layout_engine.js` | Pilot gate, `data-home-layout-mode`, budget math, pilot CSS variable writes, `reconcileHomeLayout` implementation, ResizeObserver coalescing (pilot only) |
| `oot_home_layout_engine.css` | Pilot-scoped in-flow layout (`[data-home-layout-mode="modular-inflow"]` only) |
| `oot_home_diag.js` | Read-only snapshots, export UI, `OOT_HOME_LAYOUT_DIAG` API; Phase 6b enriched fields (`layoutMode`, `alertState`, `gigState`, `layoutBudget`, `controller`) |
| `oot_home_controller.js` | **Scaffold only** — `OOT.home.controller` record-only API; no callers in `index.html` yet |
| `oot_compat_home.js` | Legacy global shims when missing |

---

## 4. Still legacy / index.html-owned responsibilities

| Area | Notes |
|------|-------|
| `rHome()` orchestration | Full ordering and all steps above remain inline in `index.html` |
| `go()` tab router | Home activation still `if (id === 'home') rHome()` |
| Cue renderers | `renderHomeSongVoteCue`, `renderHomeRehearsalCue`, `renderPendingProposalCue` — DOM, onclick, Firestore-driven refresh |
| Countdown content | `updateCountdown`, `renderNoGigsCard`, gig card HTML |
| Birthday banner | Inline HTML in `rHome` |
| Band backdrop shell | `_ensureHomeBandBackdrop` creates/updates DOM; delegates presentation vars to module |
| Firestore listeners | `listenSuggestions`, `listenProposals`, `listenAgendas`, `listenEvents` — trigger cue/countdown/rHome without controller |
| Lifecycle Home default | `_forceHomeDefaultView`, visibility/focus/pageshow handlers |
| Home layout reconcile hook | Single call site: `reconcileHomeLayout('rHome')` at `rHome` tail |
| Legacy Home CSS | Bulk of `#sc-home` rules in `index.html` (non-pilot path) |

---

## 5. Safe future controller notification points

Phase 6c may add **record-only** calls (no DOM, no reconcile) at these boundaries:

| Event | Suggested API | When |
|-------|---------------|------|
| Home tab shown | `activateHome(reason)` | `go('home')` / `_forceHomeDefaultView` success path (future) |
| Full Home refresh completed | `activateHome('rHome')` or dedicated tail hook | After `rHome` steps, **before** reconcile (future) |
| Cue DOM changed | `notifyCueChange(reason)` | Tails of `renderHomeSongVoteCue` / `renderHomeRehearsalCue` / listener paths |
| Image presentation scheduled | `notifyImageRefresh(reason)` | After `_scheduleHomeImagePresentationRefresh` |
| Gig slot / countdown state | `notifyGigSlotChange(reason)` | After `syncGigSlotState` in `updateCountdown` |
| Layout reconcile requested | `requestReconcile(reason)` | Future coalesced path — **not** at every cue sync today |

Diag already reads controller state read-only via `OOT.home.controller.getState()` in snapshots (`6d2f8d2`).

---

## 6. Must-not-touch-yet boundaries

Do **not** change in Phase 6c without separate approval:

- **`rHome()` ordering** — especially `reconcileHomeLayout('rHome')` remaining **last**
- **`go('home')` wiring** — no redirect through controller yet
- **Pilot default** — remain opt-in; no static `data-home-layout-mode="modular-inflow"` in HTML
- **Budget constants** in `oot_home_layout_engine.js` — no tuning pass
- **Legacy Home CSS** in `index.html` — no edits except approved script tags (6a already added controller tag)
- **Banned forever** — `HomeLayoutContract` v1–v3, `_homeMaybeLockAlertsFootprint`, `data-home-alerts-reserved`, `data-home-gig-pending`, etc.
- **Cue renderer HTML/behavior** — notification hooks only; no markup rewrites
- **Adding second `reconcileHomeLayout` call sites** without coalescing design (Phase 6e)

---

## 7. Key Phase 6 finding

**Layout reconcile is tied to `rHome` completion, not to cue/alert updates.**

- `reconcileHomeLayout('rHome')` runs only at the **`rHome()` tail** (~30749).
- Firestore and fallback listener paths call `renderHomeSongVoteCue` / `renderHomeRehearsalCue`, which call **`syncAlertRailState`** and may refresh band image presentation, but they **do not** invoke `reconcileHomeLayout`.
- When Home is **not** the active tab, listeners still update cue DOM and alert state attrs; layout budget/tokens are not re-run until the next `rHome()` (tab return, events snapshot, roster change, etc.).

This gap is the primary motivation for later **Phase 6e** coalesced `requestReconcile` — not for Phase 6c.

---

## 8. Diagnostic plan (Phase 6b complete → 6c next)

### Phase 6b (committed @ `6d2f8d2`)

`oot_home_diag.js` snapshot records now include read-only:

- `layoutMode` — from `getHomeLayoutMode()`
- `alertState` — from `getAlertRailState()`
- `gigState` — from `getGigSlotState()`
- `layoutBudget` — subset of `__ootHomeLayoutBudget.computed`
- `controller` — subset of `OOT.home.controller.getState()` (phase, lastMethod, lastReason, eventCount)

No runtime wiring; no new `index.html` hooks.

### Phase 6c (recommended next boundary)

**Controller diagnostic bridge only:**

- Optional thin calls from legacy tails → `activateHome` / `notifyCueChange` / `notifyImageRefresh` / `notifyGigSlotChange` / `requestReconcile` (**record-only**)
- Still **no** `rHome`/`go` rewiring, **no** controller-driven reconcile, **no** DOM/CSS/storage writes from controller

Use enriched diag export to verify notification ordering before any Phase 6d–6e orchestration.

### Manual verification (unchanged from 5d)

- Pilot: `?homeLayoutPilot=1&homeLayoutDiag=1`
- Disable observer noise: `OOT_HOME_LAYOUT_DIAG.disable()` before measurement
- Reference viewport ~415×915; confirm alert rail in-flow and hero token honesty under pilot

---

## 9. Stop line

**This document is documentation only.** Baseline behavior at `6d2f8d2` is unchanged by this file.

- No runtime behavior change
- No Phase 6c implementation in this commit
- Do not merge pilot to production default
- Do not push orchestration changes without explicit phase approval

---

## Quick reference — reconcile vs alert sync

```
Firestore listener / cue renderer
  → renderHome*Cue()
  → syncAlertRailState('renderHome…')     ✓ runs
  → reconcileHomeLayout()                 ✗ does not run

rHome() full path
  → … cues, syncAlertRailState('rHome'), image refresh, diag …
  → reconcileHomeLayout('rHome')          ✓ only canonical reconcile entry
```
