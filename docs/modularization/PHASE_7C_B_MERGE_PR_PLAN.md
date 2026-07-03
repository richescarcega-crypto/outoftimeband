# Phase 7c-b — Home Modularization Merge / PR Plan

## Status

**Planning / documentation only.** No runtime behavior changed. No push. No merge to `main`.

This document records the merge-readiness posture, pre-merge checklist, PR summary draft, test plan draft, and rollback posture for branch `modularization-home-layout-engine-pilot` after Phase **7c-a** close-out inspection and Phase **7a-b** architecture checkpoint.

---

## Repo Baseline

| Item | Value |
|------|--------|
| Branch | `modularization-home-layout-engine-pilot` |
| HEAD | `9694023` — *Document Home alert row cue architecture checkpoint* |
| Merge base (`main`) | `8a7ecc6` — *Rollback broken Home layout contract* |
| Commits since `main` | **90** |
| vs `origin/modularization-home-layout-engine-pilot` | **ahead 9** (unpushed local commits) |
| Tracked working tree | **Clean** |
| Final integrity gates | **PASS** at `9694023` (Phase 7c-a fresh run) |

### Branch diff vs `main` (summary)

| Metric | Value |
|--------|--------|
| Files changed | **76** |
| Insertions | **+24,399** |
| Deletions | **−449** |
| Primary runtime additions | `oot_home_*.js`, `oot_home_layout_engine.{js,css}`, `oot_compat_home.js`, `index.html` delegation |
| Primary test additions | Five integrity gate packages under `tests/integrity/` |
| Docs | Extensive modularization checkpoint series through Phase **7a-b** |

---

## Completed Pilot Scope

### Home layout engine pilot (Phase 5)

- Layout engine scaffold, CSS, budget math, pilot hero/alert-rail ownership fixes
- Integrity gate: `home-layout-engine-package.mjs`

### Extracted Home modules (Phases 1–4)

| Module | Phase | Integrity gate |
|--------|-------|----------------|
| `oot_home_diag.js` | 1 / 6b | `home-diag-package.mjs` |
| `oot_home_alert_rail.js` | 3 | `home-alert-rail-package.mjs` |
| `oot_home_gig_slot.js` | 4 | `home-gig-slot-package.mjs` |
| `oot_home_band_image.js` | — | (covered by layout/diag gates) |

### HomeController scaffold + reconcile coalescing (Phases 6a–6k)

- Record-only notifications, reconcile coalescer, rHome tail adapter routing
- Integrity gate: `home-controller-package.mjs` (expanded through cue phases)

### Home cue renderer + alert-row cue modularization (Phases 6l–6z, 7a-b)

All three alert-row cue families complete the same four-rung ladder:

| Cue | Derive | Orchestrate | Targets | Controller notify/reconcile |
|-----|--------|-------------|---------|----------------------------|
| Pending Proposal | ✓ 6o-b | ✓ 6o-c | ✓ 6p-a | ✓ 6q-a |
| Song Vote | ✓ 6s-a | ✓ 6t-a | ✓ 6u-b | ✓ 6v-b |
| Rehearsal | ✓ 6w-b | ✓ 6x-b | ✓ 6y-b | ✓ 6z-b |

**Architecture checkpoint:** `PHASE_7A_B_HOME_ALERT_ROW_CUE_ARCHITECTURE_CHECKPOINT.md` committed at `9694023`.

**Explicit stop:** No further Home alert-row cue runtime seams unless regression, merge-review blocker, or named deferred slice with approval (per 7a-b).

---

## Merge Readiness Posture

| Aspect | Assessment |
|--------|------------|
| Pilot arc completeness | **Complete** at planned ladder depth |
| Integrity gates | **PASS** at HEAD (re-run required immediately before merge PR) |
| Documentation | **Sufficient** — mandate, per-phase checkpoints, 7a-b architecture checkpoint, this 7c-b plan |
| Runtime risk | **Bounded** — incremental seams, legacy fallbacks, integrity contracts |
| Deferred cleanup | **Documented, not blocking** — see below |
| Merge authorization | **Not granted by this document** — requires explicit approval |
| Push authorization | **Not granted** — 9 local commits unpushed; push only after approval |

**Overall:** Branch is **merge-candidate ready** from an engineering/documentation standpoint. Process gates (push, PR, merge) remain **approval-gated**.

---

## Untracked File Handling

| File | Classification | Action |
|------|----------------|--------|
| `docs/modularization/PHASE_6W_A_REHEARSAL_CUE_PARITY_PLAN.md` | Stale planning doc (baseline `d13bd33`; Rehearsal marked partial). **Superseded** by 6w-c → 7a-b checkpoint series | **Do not include in merge PR** unless separately archived in an optional docs-only commit with explicit approval |
| `oot-local-server.ps1` | Local dev static server (loopback port 18766) | **Never stage, commit, or merge** — local tooling only |

Before opening PR, confirm `git status --short` shows only expected untracked files (or clean tree). Accidental staging of either file is a **merge blocker**.

---

## Deferred Cleanup Items (from Phase 7a-b)

Not merge blockers. Address post-merge or on a fresh branch with dedicated plan + approval:

| Item | Detail |
|------|--------|
| Rehearsal image-refresh tails | `_ensureHomePresentationObserver`, `_scheduleHomeImagePresentationRefresh`, `notifyImageRefresh` inline in `renderHomeRehearsalCue()` |
| Pending proposal notify/reconcile shape | **1×** at function end vs **2×** hidden/visible for Song Vote and Rehearsal |
| Independent module lookups | `oot_home_alert_rail.js`, `oot_home_diag.js`, `oot_home_band_image.js` resolve `#home-*-cue` independently of `collect*CueTargets` |
| Input packaging helpers | `_buildHomeSongVoteCueInput`, `_buildHomeRehearsalCueInput` remain in `index.html` |
| Post-render diag/apply wrappers | `_recordHomeCueRenderDiag`, `_applyHomeCueView` shared across cues |

---

## Pre-Merge Checklist

Execute in order. **Do not skip integrity gates.**

### 1. Re-run compact integrity gates

```powershell
$node = "C:\Users\rescarcega\AppData\Local\Programs\cursor\resources\app\resources\helpers\node.exe"
& $node tests/integrity/home-controller-package.mjs
& $node tests/integrity/home-layout-engine-package.mjs
& $node tests/integrity/home-diag-package.mjs
& $node tests/integrity/home-alert-rail-package.mjs
& $node tests/integrity/home-gig-slot-package.mjs
```

**Expected:** All five **PASS**. Any failure is a merge blocker until resolved.

### 2. Confirm git status excludes local/untracked tooling

```powershell
git status --short
```

**Expected:**

- Tracked tree clean (no `M` / `A` on runtime or test files)
- Untracked files limited to `PHASE_6W_A_REHEARSAL_CUE_PARITY_PLAN.md` and/or `oot-local-server.ps1` only
- **`oot-local-server.ps1` not staged**

### 3. Push pilot branch (approval required)

```powershell
git push -u origin modularization-home-layout-engine-pilot
```

Only after explicit push approval. Resolves **9-commit** local ahead gap vs origin.

### 4. Open PR or merge (approval required)

- Open PR: `modularization-home-layout-engine-pilot` → `main`
- Use PR summary draft below
- Attach test plan draft below
- Merge only after explicit merge approval and successful review

---

## PR Summary Draft

**Title:** Home modularization pilot — layout engine, extracted modules, alert-row cue parity

**Summary:**

This PR merges the Home modularization pilot branch (`modularization-home-layout-engine-pilot`), building on merge base `8a7ecc6` (*Rollback broken Home layout contract*).

**Scope:**

- **Layout engine pilot (Phase 5):** `oot_home_layout_engine.js` / `.css`, hero stack budget fixes, pilot ownership corrections
- **Extracted modules:** diagnostics, alert rail, gig slot, band image presentation, HomeController reconcile coalescing
- **Cue renderer scaffold (Phase 6l+):** `oot_home_cue_renderer.js` with shared apply/input/render paths
- **Alert-row cue modularization (Phases 6o–6z):** Pending Proposal, Song Vote, and Rehearsal each complete derive → orchestrate → targets → controller notify/reconcile ladder; `index.html` retains public wrappers and legacy fallbacks
- **Integrity gates:** Five package tests under `tests/integrity/` enforce seam contracts through Phase 6z-b
- **Documentation:** Full checkpoint series through Phase 7a-b architecture checkpoint and Phase 7c-b merge plan

**Behavior contract:**

- No intentional changes to cue text, cue placement, CSS visuals, Firestore paths, listeners, or push notifications
- Incremental extraction with legacy fallbacks preserved in `index.html`

**Known deferred items (post-merge):**

- Rehearsal image-refresh tails in `index.html`
- Pending proposal 1× vs Song Vote/Rehearsal 2× notify/reconcile branch semantics
- Cross-module independent `#home-*-cue` lookups
- Input packaging and shared apply/diag wrappers in `index.html`

**Excluded from this PR:**

- `oot-local-server.ps1` (local tooling — must not be committed)
- Untracked `PHASE_6W_A_REHEARSAL_CUE_PARITY_PLAN.md` unless separately archived

**Stats:** 90 commits; 76 files; +24,399 / −449 lines vs `main`.

---

## Test Plan Draft

### Automated (required before merge)

| # | Gate | Command | Expected |
|---|------|---------|----------|
| 1 | Home controller | `node tests/integrity/home-controller-package.mjs` | PASS — through 6z-b cue notify/reconcile |
| 2 | Layout engine | `node tests/integrity/home-layout-engine-package.mjs` | PASS |
| 3 | Diagnostics | `node tests/integrity/home-diag-package.mjs` | PASS |
| 4 | Alert rail | `node tests/integrity/home-alert-rail-package.mjs` | PASS |
| 5 | Gig slot | `node tests/integrity/home-gig-slot-package.mjs` | PASS |

### Manual smoke (recommended post-merge or pre-merge if local server available)

| # | Area | Steps | Expected |
|---|------|-------|----------|
| 1 | Home load | Open Home tab (`sc-home.on`) | No console errors; hero + alert row render |
| 2 | Pending proposal cue | Trigger pending proposal state | Cue visible/hidden correctly; text unchanged |
| 3 | Song Vote cue | Trigger song vote state | Cue visible/hidden correctly; text unchanged |
| 4 | Rehearsal cue | Trigger rehearsal on-deck state | Cue visible/hidden correctly; band image presentation correct |
| 5 | Alert rail | Toggle cue visibility | Rail state syncs (`syncAlertRailState` paths) |
| 6 | rHome reconcile | Navigate away and back to Home | No duplicate reconcile storms; Home renders cleanly |

**Note:** Phase 6f/6o-a manual verification docs exist for reference; re-smoke only if merge reviewer requests or automated gates pass but visual regression is suspected.

### Regression focus (high-value manual checks)

- Rehearsal cue + band image presentation timing (deferred image-refresh tails)
- Song Vote hidden vs visible branch cue rendering
- Pending proposal cue when no proposals vs proposals present

---

## Rollback Posture

### If issues appear after merge to `main`

| Scenario | Action |
|----------|--------|
| Integrity gate failure on `main` after merge | Revert merge commit on `main` (or revert PR merge commit SHA) |
| Visual/regression in production | Hotfix on `main` if isolated; otherwise revert merge and reopen pilot branch |
| Partial cue regression | Do **not** ad-hoc patch on `main` without integrity gate update; prefer revert + bounded fix on pilot branch |

### Safe rollback reference

- **Pre-pilot `main`:** `8a7ecc6` — *Rollback broken Home layout contract*
- **Pilot branch tip (documented):** `9694023` — architecture checkpoint + this merge plan

### Revert command (after merge, if authorized)

```powershell
git revert -m 1 <merge-commit-sha>
```

Or reset `main` to `8a7ecc6` only if explicitly authorized (destructive — requires team approval).

### Post-rollback

- Re-run integrity gates on rollback target
- Document failure mode in new modularization phase doc
- Do not re-attempt merge without root-cause fix and fresh gate pass

---

## Hard Boundaries (Still in Force)

| Boundary | Status |
|----------|--------|
| CSS | No new changes in 7c-b |
| Cue text / visuals / placement | No changes |
| Firestore read/write | No changes |
| Listeners | No changes |
| Push notifications | No changes |
| Broad refactor | Not permitted on merge PR without scope approval |
| Merge to `main` | **Requires explicit approval** |
| Push to origin | **Requires explicit approval** |

---

## Explicit Non-Goals

- Do **not** start pending response reminder backend work in this merge
- Do **not** start flyer/r106 legacy work in this merge
- Do **not** unify cross-module `#home-*-cue` lookups without dedicated post-merge plan
- Do **not** commit `oot-local-server.ps1`
- Do **not** merge additional runtime cue seams in the merge PR

---

## Related Docs

- `PHASE_7A_B_HOME_ALERT_ROW_CUE_ARCHITECTURE_CHECKPOINT.md` — architecture checkpoint (immediate predecessor)
- `PHASE_6Z_C_REHEARSAL_CUE_HOMECONTROLLER_NOTIFY_RECONCILE_CHECKPOINT.md` — Rehearsal controller parity
- `PHASE_6V_C_SONG_VOTE_HOMECONTROLLER_NOTIFY_RECONCILE_CHECKPOINT.md` — Song Vote controller parity
- `PHASE_6Q_B_PENDING_PROPOSAL_RECONCILE_NOTIFICATION_CHECKPOINT.md` — Pending proposal controller parity
- `200_ARCHITECTURE_MANDATE.md` — Home modularization mandate
- `PHASE_6W_A_REHEARSAL_CUE_PARITY_PLAN.md` — stale/untracked; superseded (do not merge unless archived separately)
