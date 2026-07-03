# Phase 6v-a — Song Vote HomeController Notify/Reconcile Plan

## Status

**Planning / inspection only.** No runtime behavior changed. No extraction approved by this document.

Static code inspection at HEAD `1a1446d`. Determines whether Song Vote cue should receive **HomeController notify/reconcile parity** mirroring pending proposal Phase **6q-a**, and whether Phase **6v-b** runtime work is the right next slice.

---

## Repo Baseline

| Item | Value |
|------|--------|
| Branch | `modularization-home-layout-engine-pilot` |
| HEAD (short) | `1a1446d` — *Document Phase 6u-c Song Vote target collection checkpoint* |
| Working tree | Clean except untracked `oot-local-server.ps1` (**do not touch**) |

### Song Vote cue arc (complete through 6u-c)

| Phase | Deliverable |
|-------|-------------|
| **6s-a / 6s-b** | `deriveSongVoteCueState` + wrapper/checkpoint |
| **6t-a / 6t-b** | `renderSongVoteCueSurface` + wrapper/checkpoint |
| **6u-a / 6u-b / 6u-c** | `collectSongVoteCueTargets` + wrapper/checkpoint |

### Pending proposal reference (6q-a / 6q-b)

| Item | Detail |
|------|--------|
| Controller | `notifyPendingProposalCueChange`, `requestPendingProposalCueReconcile` |
| index.html wrappers | `_notifyPendingProposalCueChange`, `_requestPendingProposalCueReconcileIfHomeActive` + legacy fallbacks |
| Tail placement | Single tail after render (always runs after render path) |
| Reconcile reason | `cue:pending-proposal` |

---

## Purpose

Phase **6v-a** inspects Song Vote **notify/reconcile timing ownership** in `renderHomeSongVoteCue()` vs pending proposal Phase **6q-a**, classifies risk, and recommends either:

1. **Phase 6v-b** — bounded HomeController parity runtime slice, or  
2. **Pause** — broader cue-controller architecture checkpoint if parity across alert-row cues should be planned together.

---

## Inspection 1: renderHomeSongVoteCue() After Phase 6u-b

### Target + render path (unchanged by notify topic)

```javascript
function renderHomeSongVoteCue(){
  var _svTargets = _songVoteCueTargets();
  var el = _svTargets.songVoteEl;
  if(!el) return;   // early exit — NO post-render tails
  // … derivation → renderSongVoteCueSurface → legacy fallback …
```

### Post-render tail pattern (current — **inline hooks**)

Two exit branches, **identical hook sequence** on each:

| Step | Hidden branch (`!_svView.visible`) | Visible branch |
|------|-----------------------------------|----------------|
| 1 | `_recordHomeCueRenderDiag('songVote', …)` | same |
| 2 | `_applyHomeCueView(el, _svView)` if `!_svModuleApplied` | same |
| 3 | `_homeLayoutDiagSnapshot('renderHomeSongVoteCue:hidden', …)` | `_homeLayoutDiagSnapshot('renderHomeSongVoteCue:visible', …)` |
| 4 | `syncAlertRailState('renderHomeSongVoteCue')` | same |
| 5 | `notifyCueChange('renderHomeSongVoteCue')` | same |
| 6 | Home-active gated `requestHomeReconcile('cue:song-vote')` | same |

Hidden branch **returns immediately** after step 6.

**Exact inline reconcile hook (×2):**

```javascript
try {
  var _hs=document.getElementById('sc-home');
  if(_hs&&_hs.classList.contains('on')&&typeof requestHomeReconcile==='function')
    requestHomeReconcile('cue:song-vote');
} catch(e){}
```

**Exact inline notify hook (×2):**

```javascript
try { if (typeof notifyCueChange === 'function') notifyCueChange('renderHomeSongVoteCue'); } catch(e){}
```

### Integrity-locked properties

| Property | Value |
|----------|--------|
| Reconcile hook count | **Exactly 2** (`assertPhase6eCSongVotePilot`, 6t-a, 6u-b) |
| Hook order | `syncAlertRailState` **before** `requestHomeReconcile('cue:song-vote')` on each branch |
| Home-active gate | On reconcile only (`#sc-home.on`); notify is **not** Home-gated |
| Reconcile reason string | `'cue:song-vote'` (unchanged since Phase 6e-c / 6g) |

### Comparison to rehearsal cue (unchanged sibling)

`renderHomeRehearsalCue()` uses the **same inline pattern**:

- `notifyCueChange('renderHomeRehearsalCue')` ×2  
- Home-active gated `requestHomeReconcile('cue:rehearsal')` ×2  
- Plus rehearsal-only `notifyImageRefresh` / image scheduling (not in song vote path)

Song vote and rehearsal remain **symmetric** for notify/reconcile; pending proposal is **asymmetric** (dedicated controller methods + wrappers).

---

## Inspection 2: HomeController Existing Cue APIs

### Record-only / coalescer surface (`oot_home_controller.js`)

| Method | Role | Song Vote today |
|--------|------|-----------------|
| `notifyCueChange(reason, options)` | Generic record-only | Called inline from `renderHomeSongVoteCue` tails (if global exists) |
| `requestReconcile(reason, options)` | Record + coalesce + delegate flush | Called via `requestHomeReconcile` shim as `'cue:song-vote'` |
| `notifyPendingProposalCueChange` | **Dedicated** pending proposal record | Not used by song vote |
| `requestPendingProposalCueReconcile` | Dedicated notify + `requestReconcile('cue:pending-proposal')` | Not used by song vote |
| `notifyImageRefresh` | Rehearsal/image paths | Not in song vote path |
| `requestRHomeTailReconcile` | `rHome` tail special case | Separate from cue tails |

### Global wiring asymmetry (`oot_compat_home.js`)

| Global | Shimmed from controller? |
|--------|--------------------------|
| `requestHomeReconcile` | **Yes** → `controller.requestReconcile` |
| `notifyCueChange` | **No** — guarded `typeof notifyCueChange === 'function'` in index.html often no-ops unless separately wired |

**Implication:** Song Vote reconcile already flows through HomeController coalescer when compat loads. Song Vote **notify** may not record controller events unless `notifyCueChange` is bound elsewhere — dedicated `notifySongVoteCueChange` would make recording **explicit and testable** on the happy path (mirroring pending proposal).

### Coalescer behavior (unchanged by 6v-b intent)

`requestReconcile('cue:song-vote')` and `requestReconcile('cue:pending-proposal')` share the same `_enqueueReconcileCoalesce` → flush → `reconcileHomeLayout(reason)` delegate path (non-`rHome` reasons). Phase 6v-b must **not** alter coalescer logic.

---

## Inspection 3: Pending Proposal Phase 6q-a Pattern

### HomeController methods

```javascript
function notifyPendingProposalCueChange(reason, options) {
  return _record('notifyPendingProposalCueChange', reason || 'renderPendingProposalCue', …);
}

function requestPendingProposalCueReconcile(options) {
  notifyPendingProposalCueChange('renderPendingProposalCue', payload);
  return requestReconcile('cue:pending-proposal', payload);
}
```

Note: `requestPendingProposalCueReconcile` does **not** Home-gate; gating lives in index.html wrapper.

### index.html wrappers

| Wrapper | Happy path | Legacy fallback |
|---------|------------|-----------------|
| `_notifyPendingProposalCueChange()` | `HomeController.notifyPendingProposalCueChange('renderPendingProposalCue')` | `_legacyNotifyPendingProposalCueChange()` → `notifyCueChange('renderPendingProposalCue')` |
| `_requestPendingProposalCueReconcileIfHomeActive()` | Home-active check → `HomeController.requestPendingProposalCueReconcile({ source: 'renderPendingProposalCue' })` | `_legacyRequestPendingProposalCueReconcileIfHomeActive()` → inline `requestHomeReconcile('cue:pending-proposal')` |

### Tail placement on `renderPendingProposalCue()`

```javascript
try { _notifyPendingProposalCueChange(); } catch(e){}
try { _requestPendingProposalCueReconcileIfHomeActive(); } catch(e){}
```

Single tail after render (not branched hidden/visible).

### Proposed Song Vote parity (6v-b — **not implemented in 6v-a**)

| Pending proposal | Song Vote equivalent |
|------------------|----------------------|
| `notifyPendingProposalCueChange` | `notifySongVoteCueChange` |
| `requestPendingProposalCueReconcile` | `requestSongVoteCueReconcile` |
| `_notifyPendingProposalCueChange` | `_notifySongVoteCueChange` |
| `_requestPendingProposalCueReconcileIfHomeActive` | `_requestSongVoteCueReconcileIfHomeActive` |
| Reason / reconcile key | `'renderHomeSongVoteCue'` / `'cue:song-vote'` |

Replace **4 inline tail lines** in `renderHomeSongVoteCue()` with **2 wrapper calls per branch** (same as replacing 2 notify + 2 reconcile with 2 wrapper invocations each branch).

---

## Should Song Vote Get Dedicated Methods vs Keep Generic Hooks?

| Option | Pros | Cons |
|--------|------|------|
| **A. Dedicated methods (6v-b parity)** | Matches 6q-a; explicit controller event names; testable ownership; legacy fallbacks preserve behavior | Rehearsal still on generic hooks (asymmetry remains across alert-row cues) |
| **B. Keep generic `notifyCueChange` + inline reconcile** | Zero churn; already integrity-tested | No ownership reduction; notify may not hit controller; pending proposal stays special-case |
| **C. Broader refactor — generic cue notify API** | Unified model | Out of scope; violates narrow-seam rule |

**6v-a recommendation:** **Option A** for Song Vote only in **6v-b**. Do not refactor generic `notifyCueChange` or rehearsal in the same slice.

Generic hooks should **remain as legacy fallbacks** inside `_legacyNotifySongVoteCueChange` / `_legacyRequestSongVoteCueReconcileIfHomeActive`, not as the primary happy path — same as pending proposal.

---

## Risk Classification

| Risk category | Level | Notes |
|---------------|-------|-------|
| Visible cue behavior | **Very low** | Notify/reconcile are record/coalesce only; no DOM |
| Reconcile coalescer | **Low** | Same reason string `'cue:song-vote'`; must not change delegate |
| Hook count / order | **Medium** | Integrity tests enforce 2× reconcile and sync-before-reconcile order |
| Home-active gate | **Low** | Must remain on reconcile wrapper only |
| Pending proposal regression | **Very low** | Isolated new methods + song vote wrappers |
| Rehearsal regression | **None** if rehearsal untouched |
| Scope creep | **Medium** | Avoid adding compat shim for `notifyCueChange`, rehearsal parity, or r810 listener changes in same slice |

**Overall:** **6v-b runtime is safely bounded** if it copies 6q-a shape exactly and preserves hidden/visible branch hook order.

---

## Exact Files That Would Be Edited (Phase 6v-b runtime)

| File | Change |
|------|--------|
| `oot_home_controller.js` | Add `notifySongVoteCueChange`, `requestSongVoteCueReconcile`; export on API |
| `index.html` | Add `_legacyNotifySongVoteCueChange`, `_legacyRequestSongVoteCueReconcileIfHomeActive`, `_notifySongVoteCueChange`, `_requestSongVoteCueReconcileIfHomeActive`; replace 4 inline tail calls in `renderHomeSongVoteCue()` |
| `tests/integrity/home-controller-package.mjs` | `assertPhase6vBSongVoteNotifyReconcile`; extend REQUIRED_API_SYMBOLS if needed |
| `tests/integrity/home-layout-engine-package.mjs` | Diff allowlist for wrapper delegation lines |

**Not in 6v-b scope:**

- `oot_home_cue_renderer.js` (derivation/orchestration/targets unchanged)
- `oot_compat_home.js` (no new global shims required — reconcile already shimmed)
- `oot_home_alert_rail.js`, `oot_home_diag.js`
- `renderHomeRehearsalCue()` / pending proposal wrappers
- CSS, Firestore, listeners, push

---

## 6v-b Runtime vs Broader Checkpoint?

| Path | When |
|------|------|
| **6v-b runtime (recommended)** | Single-cue HomeController parity; mirrors proven 6q-a; higher value than 6u-b |
| **Broader cue-controller checkpoint** | Only if planning simultaneous song vote + rehearsal + unified notify API — **not required** now |

**Do not recommend** pausing for a broad checkpoint unless the goal is to defer **all** alert-row HomeController work until rehearsal parity is scoped together.

---

## Recommendation

### Primary: **Proceed with Phase 6v-b runtime — HomeController Song Vote notify/reconcile parity**

**Rationale:**

1. **Higher ownership value than 6u-b** — replaces 4 inline hook blocks with dedicated controller methods + wrappers.  
2. **Proven pattern** — Phase **6q-a** is the direct template; coalescer path already shared.  
3. **Low behavioral risk** — record-only notify + same reconcile reason; Home-active gate preserved in wrapper.  
4. **Integrity-testable** — vm checks on controller methods + wrapper delegation + preserved 2× `cue:song-vote` hooks.  
5. Song Vote modularization ladder (derive → orchestrate → targets) is complete; **timing ownership** is the natural next seam per 6u-c.

**6v-b must preserve:**

- Hidden and visible branch tail order: diag → apply → layout diag → `syncAlertRailState` → notify wrapper → reconcile wrapper  
- Exactly **2** reconcile executions paths (integrity count of `requestHomeReconcile('cue:song-vote')` in `renderHomeSongVoteCue` body may become wrapper calls that still contain that string in legacy fallback — tests may need to count wrapper invocations or allowlist; follow 6q-a integrity style)  
- Early return when `!el` — no notify/reconcile  

**Note on integrity:** 6q-a moved hooks to wrappers; reconcile string may appear in legacy fallback helper rather than inline in render body. Integrity tests for 6v-b should assert wrapper calls in `renderHomeSongVoteCue` and preserve reconcile hook semantics (likely counting occurrences of `'cue:song-vote'` in song render region including legacy helpers, or updating assert to match 6q-a pending pattern).

### Secondary: **Rehearsal HomeController parity (Phase 6w-a)** after 6v-b — only as separate slice; includes image refresh ordering constraints.

### Do not recommend now

- Keeping generic hooks as primary path (no ownership gain)  
- Broad cue-controller architecture doc **instead of** 6v-b (6v-b is bounded enough)  
- Adding `notifyCueChange` to `oot_compat_home.js` in 6v-b (unnecessary for parity)

---

## Behavior Preservation Checklist (6v-b acceptance)

| Contract | Expected |
|----------|----------|
| Cue DOM / text / placement | Unchanged |
| Target collection (6u-b) | Unchanged |
| Derivation / orchestration | Unchanged |
| Tail order | `syncAlertRailState` before reconcile on both branches |
| Home-active gate | Reconcile only when `#sc-home.on` |
| Reconcile reason | `'cue:song-vote'` |
| Notify reason | `'renderHomeSongVoteCue'` (via dedicated method) |
| Pending proposal | Untouched |
| Rehearsal | Untouched |

---

## Proposed Prompt for Phase 6v-b Runtime (Do Not Execute Yet)

```
We are continuing Out of Time app Home modularization on branch modularization-home-layout-engine-pilot.

Current verified repo state:
- Branch: modularization-home-layout-engine-pilot
- Expected HEAD: 1a1446d (or verify after 6v-a doc commit)
- Working tree clean except untracked oot-local-server.ps1
- Do not edit/stage/delete oot-local-server.ps1

Task: Phase 6v-b — HomeController Song Vote notify/reconcile parity.

Goal:
Mirror pending proposal Phase 6q-a for Song Vote cue only.
Add notifySongVoteCueChange / requestSongVoteCueReconcile to HomeController.
Add index.html wrappers with legacy fallbacks.
Replace inline notify/reconcile tails in renderHomeSongVoteCue() with wrapper calls.

Strict boundaries:
- No CSS, cue text, placement, or selector changes.
- No Firestore, listener, push, or data-shape changes.
- Do not change derivation, orchestration, target collection, or apply paths.
- Do not touch renderHomeRehearsalCue or renderPendingProposalCue except integrity guards.
- Preserve hidden/visible branch tail order: syncAlertRailState before reconcile.
- Preserve Home-active gated reconcile.
- Do not commit unless explicitly instructed.

Implementation intent:
1. oot_home_controller.js: notifySongVoteCueChange, requestSongVoteCueReconcile (mirror 6q-a).
2. index.html: _legacyNotifySongVoteCueChange, _legacyRequestSongVoteCueReconcileIfHomeActive,
   _notifySongVoteCueChange, _requestSongVoteCueReconcileIfHomeActive.
3. renderHomeSongVoteCue(): replace inline notify/reconcile with wrappers on BOTH branches.
4. assertPhase6vBSongVoteNotifyReconcile + layout diff allowlist.
5. Run all five standard integrity gates.

After edits, report files changed, behavior preserved, git status — do not commit.
```

---

## Related Docs

- `PHASE_6U_C_SONG_VOTE_TARGET_COLLECTION_CHECKPOINT.md`
- `PHASE_6Q_B_PENDING_PROPOSAL_RECONCILE_NOTIFICATION_CHECKPOINT.md` — 6q-a pattern reference
- `PHASE_6R_A_HOME_CUE_OWNERSHIP_NEXT_SEAM_PLAN.md` — original notify/reconcile gap inventory
- `PHASE_6E_C_LISTENER_NOTIFY_RECONCILE_PLAN.md` — origin of 2× song-vote reconcile hooks
