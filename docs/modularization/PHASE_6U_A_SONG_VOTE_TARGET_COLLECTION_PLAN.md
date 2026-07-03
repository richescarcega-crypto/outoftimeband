# Phase 6u-a — Song Vote Target Collection Plan

## Status

**Planning / inspection only.** No runtime behavior changed. No extraction approved by this document.

Static code inspection at HEAD `ceddba6`. Determines whether Song Vote cue needs a **target collection seam** mirroring pending proposal Phase **6p-a**, and whether Phase **6u-b** runtime work is the right next slice.

---

## Repo Baseline

| Item | Value |
|------|--------|
| Branch | `modularization-home-layout-engine-pilot` |
| HEAD (short) | `ceddba6` — *Document Phase 6t-b Song Vote render orchestration checkpoint* |
| HEAD (full) | `ceddba630356b594512bba9413a89a19c56f4b54` |
| Origin | In sync with HEAD |
| Working tree | Clean except untracked `oot-local-server.ps1` (**do not touch**) |

### Song Vote cue arc (complete through 6t-b)

| Phase | Deliverable |
|-------|-------------|
| **6l-d → 6l-h** | View build, apply seam, `renderSongVoteCue` |
| **6s-a / 6s-b** | `deriveSongVoteCueState` + wrapper/checkpoint |
| **6t-a / 6t-b** | `renderSongVoteCueSurface` + wrapper/checkpoint |

### Pending proposal reference (6p-a)

| Item | Detail |
|------|--------|
| Module API | `collectPendingProposalCueTargets({ document })` |
| Wrapper | `_pendingProposalCueTargets()` |
| Legacy | `_legacyPendingProposalCueTargets()` |
| Target count | **6** keys (calendar tab, home hero, cal section, cal hero, home micro-cue, cal micro-cue) |

---

## Purpose

Phase **6u-a** inspects the current `#home-song-vote-cue` target path, compares it to pending proposal target collection, classifies risk, and recommends either:

1. **Phase 6u-b** — bounded runtime target collection seam, or  
2. **Pause** — broader cue architecture checkpoint / alternate next slice if target collection is too low-value.

---

## Inspection: Current `#home-song-vote-cue` Target Path

### Static markup

```html
<div id="home-alerts-row" aria-label="Home alerts">
  <div id="home-song-vote-cue" style="display:none;"></div>
  <div id="home-rehearsal-cue" style="display:none;"></div>
</div>
```

Location: `#sc-home` → `#home-alerts-row` → `#home-song-vote-cue` (line ~18651 in `index.html`).

### Primary render owner (`renderHomeSongVoteCue`)

```javascript
function renderHomeSongVoteCue(){
  var el = document.getElementById('home-song-vote-cue');
  if(!el) return;
  // … derivation → renderSongVoteCueSurface({ targetEl: el, … }) → tails
}
```

| Property | Value |
|----------|--------|
| Resolution | Single `document.getElementById('home-song-vote-cue')` |
| Missing target | Early return — **no render, no tails** |
| Passed to module | `targetEl: el` on `renderSongVoteCueSurface` input |
| Apply path | `_applyHomeCueView(el, _svView)` when `!_svModuleApplied` |
| Legacy orchestration | `_legacyRenderHomeSongVoteCueSurface(el, _svInput)` receives same `el` |

### Parallel alert-row cue (rehearsal — unchanged)

```javascript
function renderHomeRehearsalCue(){
  var el = document.getElementById('home-rehearsal-cue');
  if(!el) return;
  // … no target collection seam
}
```

Rehearsal uses the **identical single-target pattern**. No modularization of rehearsal targets exists today.

### Module metadata (not DOM collection)

`oot_home_cue_renderer.js`:

```javascript
var CUE_IDS = {
  songVote: 'home-song-vote-cue',
  rehearsal: 'home-rehearsal-cue'
};
```

Used in `buildSongVoteCueView` as `targetId: CUE_IDS.songVote` (descriptor only — **not** DOM lookup).

### Other consumers of `#home-song-vote-cue` (outside render owner)

| Module / area | Usage | Would 6u-b change? |
|---------------|-------|---------------------|
| `oot_home_alert_rail.js` | `document.getElementById('home-song-vote-cue')` for visibility / `data-home-alert-state` | **No** — separate module, own `CUE_IDS.song` |
| `oot_home_diag.js` | `getElementById('home-song-vote-cue')` for layout diagnostics | **No** |
| `index.html` CSS | `:has(#home-song-vote-cue[…])` layout rules | **No** — hard boundaries forbid CSS edits |

These duplicate the id string but are **not** funneled through `renderHomeSongVoteCue()` today. Unifying them is **out of scope** for a 6p-a-style seam.

### External call sites (`renderHomeSongVoteCue()`)

| Location | Context |
|----------|---------|
| ~22452 | Home cue refresh batch |
| ~23061 | r810 fallback listener (suggestions) |
| ~27009 | `rHome()` |
| ~31186 | Home activation tail |

**Four** external call sites + function definition. Target collection would **not** add call sites; only internal resolution changes.

---

## Comparison: Pending Proposal vs Song Vote Targets

| Dimension | Pending proposal (6p-a) | Song Vote (current) |
|-----------|-------------------------|---------------------|
| Target count | 6 DOM nodes across Home + Calendar | **1** static alert-row slot |
| Selector complexity | `getElementById` + `querySelector` | **Single `getElementById`** |
| Multi-surface apply | Yes — badge, micro-cues, calendar strip | No — pill HTML inside one container |
| Justification for seam | Moved 6 inline lookups out of orchestration path | Would move **1** lookup |
| Early exit semantics | Orchestration still runs; apply tolerates null targets | **Entire render aborts** if target missing |
| Module already knows id | Via apply/view builders | Via `CUE_IDS.songVote` constant |

**Conclusion:** Structural parity with 6p-a is possible, but the **functional need is much weaker**. Pending proposal target collection reduced real complexity; Song Vote target collection would primarily complete the modularization ladder.

---

## Does Song Vote Need a Target Collection Seam?

### Yes — for arc parity (weak functional driver)

- Completes Song Vote modularization sequence: **derive (6s) → orchestrate (6t) → targets (6u) → notify (future)**.
- Moves the last inline DOM lookup out of `renderHomeSongVoteCue()` body into module + wrapper.
- Reuses proven 6p-a pattern: module collector + `_legacy*()` + public wrapper.

### No — for behavior or ownership (strong functional driver)

- One `getElementById` is not comparable to six-target pending proposal collection.
- `_legacyRenderHomeSongVoteCueSurface(el, …)` still needs `el`; wrapper must resolve target **before** orchestration — same as today.
- Alert rail / diag modules keep independent lookups regardless.
- Rehearsal cue has no target seam; adding Song Vote-only seam creates **asymmetric** alert-row ownership.

### Assessment

| Question | Answer |
|----------|--------|
| Is a target seam **required** for correctness? | **No** |
| Is it **safely bounded** for runtime? | **Yes** |
| Is it **high value**? | **Low** — ownership reduction is minimal |
| Is it **low risk**? | **Yes** — if limited to one key, one id, wrapper/fallback only |

---

## Risk Classification

| Risk category | Level | Notes |
|---------------|-------|-------|
| Visible behavior / cue text / placement | **Very low** | Same element, same early-return if missing |
| CSS / layout | **None** | No CSS edits in scope |
| Firestore / listeners / push | **None** | Target seam is DOM-read only |
| Pending proposal / rehearsal regression | **Very low** | Isolated to Song Vote wrapper if bounded |
| Scope creep | **Medium** | Temptation to unify alert_rail ids or change `renderSongVoteCueSurface` API — **avoid** |
| Integrity / diff allowlist | **Low** | Mirror 6p-a; smaller surface than 6t-a |
| False confidence | **Medium** | Seam looks like big step but changes ~3 lines of behavior |

**Overall:** Runtime slice is **safe and bounded** but **low marginal value**. Not a candidate for broader architecture checkpoint **unless** combined with rehearsal target parity + HomeController notify in one doc-only pause.

---

## Proposed Phase 6u-b Runtime Slice (If Approved)

### Module API (proposed)

```javascript
OOT.home.cueRenderer.collectSongVoteCueTargets({ document })
```

**Return:**

```javascript
{ songVoteEl: Element | null }
```

**Implementation sketch:**

- Use existing `CUE_IDS.songVote` (`'home-song-vote-cue'`) inside module.
- Missing/invalid `document` → `{ songVoteEl: null }` (no throw), mirroring 6p-a.
- No `querySelector`; no new selectors.

### index.html wrappers (proposed)

| Function | Role |
|----------|------|
| `_legacySongVoteCueTargets()` | `{ songVoteEl: document.getElementById('home-song-vote-cue') }` |
| `_songVoteCueTargets()` | Delegates to module + legacy fallback |

### `renderHomeSongVoteCue()` change (minimal)

```javascript
var _svTargets = _songVoteCueTargets();
var el = _svTargets.songVoteEl;
if(!el) return;
// remainder unchanged — still passes targetEl: el to renderSongVoteCueSurface
```

### Intentionally unchanged in 6u-b

- `renderSongVoteCueSurface` input shape (`targetEl` stays — no `targets` object refactor)
- Derivation, orchestration, legacy build/orchestration fallbacks
- Post-render tails (diag, apply, alert rail, notify, 2× reconcile)
- `oot_home_alert_rail.js`, `oot_home_diag.js`
- Rehearsal cue paths
- Pending proposal paths

### Files that would be edited (6u-b runtime)

| File | Change |
|------|--------|
| `oot_home_cue_renderer.js` | Add `collectSongVoteCueTargets` + export |
| `index.html` | `_legacySongVoteCueTargets`, `_songVoteCueTargets`, 2-line change in `renderHomeSongVoteCue` |
| `tests/integrity/home-controller-package.mjs` | `assertPhase6uBSongVoteTargetCollection` |
| `tests/integrity/home-layout-engine-package.mjs` | Diff allowlist lines |

**No other files** unless integrity gates require marker string updates.

---

## Alternative Next Slices (If Skipping 6u-b)

| Option | Value | Risk | Notes |
|--------|-------|------|-------|
| **6v-a — HomeController Song Vote notify/reconcile** | **Higher** | Low–medium | Mirrors 6q-a; dedupes inline `notifyCueChange` + reconcile wrappers |
| **Rehearsal derivation (6w-a)** | High | Medium | Larger logic surface than target collection |
| **Broader Phase 6 cue architecture checkpoint** | Planning only | None | Useful if pausing before alert-row asymmetry grows |
| **Rehearsal + Song Vote target parity together** | Medium | Low | Slightly broader than 6u-b alone; still bounded |

---

## Recommendation

### Primary recommendation: **Proceed with Phase 6u-b runtime — narrow target collection seam**

**Rationale:**

1. Inspection confirms the seam is **trivially bounded** — one id, one key, one wrapper, proven 6p-a pattern.
2. **Risk is low** and integrity-testable; no CSS, Firestore, listener, or tail changes required.
3. Completes the Song Vote modularization ladder started in 6r-a/6s/6t before moving to higher-value HomeController notify work.
4. **Low value is acceptable** here because diff size matches value — a ~30-line slice, not a broad refactor.

**Do not** expand 6u-b to unify `oot_home_alert_rail.js` / `oot_home_diag.js` lookups or refactor `renderSongVoteCueSurface` to a multi-target API.

### Secondary recommendation (if minimizing slice count): **Skip 6u-b → Phase 6v-a HomeController notify/reconcile parity**

Choose this if the goal is **meaningful** `index.html` ownership reduction per slice. Target collection alone moves one `getElementById`.

### Do not recommend (now)

- **Broader architecture checkpoint only** — not required; 6u-b is bounded enough to proceed without pause.
- **Combined rehearsal + song vote target + notify** in one runtime slice — exceeds “narrow seam” unless split into separate commits.

---

## Behavior Preservation Checklist (6u-b acceptance)

| Contract | Expected |
|----------|----------|
| Target id | `#home-song-vote-cue` unchanged |
| Missing element | `renderHomeSongVoteCue()` returns early — no tails |
| Orchestration | Same `targetEl` passed to `renderSongVoteCueSurface` |
| Visible cue | Unchanged text, placement, onclick |
| Alert rail | `syncAlertRailState('renderHomeSongVoteCue')` unchanged |
| Reconcile | **2×** `requestHomeReconcile('cue:song-vote')` unchanged |
| Pending / rehearsal | Untouched |

---

## Hard Boundaries (Still in Force)

- No CSS, cue text, visual placement, or selector id changes
- No Firestore, listener, push, or data-shape changes
- No pending proposal or rehearsal behavior changes
- No flyer/r106 legacy work
- No main merge
- No `cdp-smoke.mjs` / local-server debugging

---

## Proposed Prompt for Phase 6u-b Runtime (Do Not Execute Yet)

```
We are continuing Out of Time app Home modularization on branch modularization-home-layout-engine-pilot.

Current verified repo state:
- Branch: modularization-home-layout-engine-pilot
- Expected HEAD: ceddba6 (or verify after 6u-a doc commit)
- Working tree clean except untracked oot-local-server.ps1
- Do not edit/stage/delete oot-local-server.ps1

Task: Phase 6u-b — Song Vote cue target collection seam.

Goal:
Mirror pending proposal Phase 6p-a target collection for Song Vote cue only.
Move the single #home-song-vote-cue DOM lookup behind a module helper with index.html wrapper/legacy fallback.

Strict boundaries:
- No CSS changes.
- No cue text or visual placement changes.
- Do not change selector id (home-song-vote-cue).
- Do not change renderSongVoteCueSurface API (keep targetEl: el).
- Do not change derivation, orchestration, or post-render tails.
- Do not touch oot_home_alert_rail.js or oot_home_diag.js.
- Do not touch pending proposal or rehearsal cue paths.
- Do not commit unless explicitly instructed.

Implementation intent:
1. Add collectSongVoteCueTargets({ document }) to oot_home_cue_renderer.js using CUE_IDS.songVote.
2. Return { songVoteEl: Element|null }; safe empty object when document missing.
3. Add _legacySongVoteCueTargets() and _songVoteCueTargets() in index.html.
4. renderHomeSongVoteCue() resolves el via _songVoteCueTargets().songVoteEl; early return if !el.
5. Add assertPhase6uBSongVoteTargetCollection + layout diff allowlist.
6. Run all five standard integrity gates.

After edits, report files changed, behavior preserved, git status — do not commit.
```

---

## Related Docs

- `PHASE_6T_B_SONG_VOTE_RENDER_ORCHESTRATION_CHECKPOINT.md`
- `PHASE_6S_B_SONG_VOTE_DERIVATION_CHECKPOINT.md`
- `PHASE_6P_B_PENDING_PROPOSAL_TARGET_COLLECTION_CHECKPOINT.md` — 6p-a pattern reference
- `PHASE_6R_A_HOME_CUE_OWNERSHIP_NEXT_SEAM_PLAN.md` — original planning inventory
