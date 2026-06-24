# Phase 6h Plan - HomeController Next Boundary (Planning Only)

**Branch:** `modularization-home-layout-engine-pilot`  
**Baseline:** `a714c21` - *Wire rehearsal cue reconcile request*  
**HEAD == origin:** Yes (at time of note)  
**Scope:** Planning only - **no implementation**  
**Production default:** `legacy-overlay` (pilot opt-in only)

Reference docs: `PHASE_6G_NEXT_RECONCILE_ROLLOUT_PLAN.md`, `PHASE_6F_VERIFICATION_RESULT.md`, `PHASE_6E_C_LISTENER_NOTIFY_RECONCILE_PLAN.md`, `PHASE_6D_LOCAL_SMOKE_BLOCKER_NOTE.md`, `PHASE_6B_CALLSITE_INVENTORY.md`

---

## 1. Current safe repo state

| Item | Value |
|------|--------|
| Branch | `modularization-home-layout-engine-pilot` |
| HEAD / origin | `a714c21` |
| Remote sync | Up to date with `origin/modularization-home-layout-engine-pilot` |
| Working tree | Clean except untracked `oot-local-server.ps1` (local-only; do not commit) |
| Controller phase | `6e-b-reconcile-delegate` |
| Latest runtime commits | `6af4398` (6e-c song-vote), `a714c21` (6g rehearsal cue) |
| Phase 6f verification | PASS (integrity only; `0581cf8` result doc) |
| Phase 6g verification | **Not yet recorded** (no `PHASE_6G_VERIFICATION_RESULT.md`) |
| Manual browser smoke | **Not attempted** since Phase 6c era; local server blocked |

**Assessment:** Repo is stable for planning. Cue reconcile hook rollout should **pause** until 6g verification is recorded and a deliberate next-boundary choice is made.

---

## 2. What Phase 6d through 6g completed

| Phase | Commit (representative) | Delivered |
|-------|-------------------------|-----------|
| **6d** | `2e4ff1a` | `go('home')` -> `enterHomeTab('go')` -> legacy `rHome()`; activate dedupe on orchestrated path |
| **6c** | `74514a1` | Record-only `notify*` / `activateHome` / `requestHomeReconcile('rHome')` hooks in `index.html` |
| **6e-a** | `4d0c7c8` | Reconcile coalescer scaffold |
| **6e-b** | `efd6a6b` | Coalescer flush delegate to legacy reconcile; `rHome` dedupe skip |
| **6e-c** | `6af4398` | `renderHomeSongVoteCue` -> `requestHomeReconcile('cue:song-vote')` (Home-active gated) |
| **6f** | `0581cf8` (docs) | Integrity verification PASS; no browser smoke |
| **6g** | `a714c21` | `renderHomeRehearsalCue` -> `requestHomeReconcile('cue:rehearsal')` on three tails (Home-active gated) |

### Reconcile request hooks wired (listener notify tails)

| Renderer | Reason | Tail count |
|----------|--------|------------|
| `renderHomeSongVoteCue` | `cue:song-vote` | 2 |
| `renderHomeRehearsalCue` | `cue:rehearsal` | 3 |
| `rHome()` tail | `rHome` | 1 (coalescer skips delegate; tail executes) |

### Still notify-only (no `requestHomeReconcile`)

- `updateCountdown` / gig slot paths (`notifyGigSlotChange` only)
- Band image load / `notifyImageRefresh` tails (except via cue renderers)
- Firestore listener bodies directly

---

## 3. What HomeController now owns

| Responsibility | Owner |
|----------------|-------|
| Record-only API surface | Controller (`activate`, `notify*`, `requestReconcile` recording) |
| Home tab entry delegate | Controller (`enterHomeTab` -> legacy `rHome`) |
| Reconcile request coalescing | Controller (enqueue, dedupe, rAF flush) |
| Non-`rHome` reconcile execution orchestration | Controller delegates to legacy `reconcileHomeLayout` / layout module |
| Coalescer observability | Controller (`getReconcileCoalescerState`, event journal) |
| Layout budget / token math | **Not** controller |
| DOM, CSS, cue HTML | **Not** controller |
| Home-active gating at notify tails | **Not** controller (legacy `index.html` guard) |
| Full `rHome` refresh reconcile execute | **Not** controller (legacy tail direct call) |

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
| Gig countdown timer loop | `index.html` |
| Pilot default (opt-in) | Layout engine + storage/query gate |

---

## 5. Should another reconcile request hook be added, or stop hook rollout?

### Decision

**Stop hook rollout in Phase 6h.** Do **not** add another `requestHomeReconcile` tail in the next implementation phase.

| Option | Verdict |
|--------|---------|
| Add gig `updateCountdown` reconcile hook next | **Reject for now** - 1 Hz timer path; needs separate timer-safe design (Phase 6i+ planning) |
| Add image-only `notifyImageRefresh` hook | **Reject** - weak layout input justification |
| Add third cue renderer | **N/A** - both cue renderers already wired |
| Migrate `rHome` tail reconcile to coalescer-only | **Reject for now** - coordinated migration; high double-execute/miss risk |
| **Stop hook rollout; verify + handoff prep** | **Recommended Phase 6h** |

**Rationale:** Two cue pilots (6e-c + 6g) close the highest-value alert-rail gap slices. Further hooks increase storm risk and rollback cost before 6g verification is documented. Phase 6f verified through 6e-c only; 6g adds rehearsal coupling to band image presentation - that delta should be gate-verified before any expansion.

---

## 6. Whether the next better boundary is verification, diagnostics, lifecycle, or extraction

| Boundary type | Fit for Phase 6h | Notes |
|---------------|------------------|-------|
| **Manual verification + diagnostics review** | **Best fit (recommended)** | Record 6g integrity PASS; optional one-shot browser checks; no code |
| **Diagnostics enrichment** | Secondary (6h-b or later) | Only if a specific read-only gap is identified (e.g. coalescer fields in diag export) |
| **Lifecycle ownership (rHome/coalescer migration)** | **Defer** | Requires coordinated `index.html` tail change; not next safe step |
| **Extraction (move renderer/listener code out of index.html)** | **Defer** | Large blast radius; out of modularization pilot scope |
| **Another reconcile hook** | **Reject** | See Section 5 |

**Phase 6h primary deliverable:** docs-only **6g verification result** + explicit **stop hook rollout** decision, optional **handoff 001** authoring plan.

---

## 7. Safest single next candidate if implementation continues

If the user approves **any** work after this plan, the safest candidate is **not runtime code**:

### Recommended: Phase 6h-a (docs-only)

**`PHASE_6G_VERIFICATION_RESULT.md`** - mirror `PHASE_6F_VERIFICATION_RESULT.md`:

- Run five integrity gates after `a714c21`
- Record PASS/FAIL
- State no browser smoke attempted (blocked policy)
- Confirm 6g hooks static invariants (three `cue:rehearsal`, two `cue:song-vote`, one `rHome` tail reconcile)
- Declare hook rollout **paused**

### If runtime work is explicitly demanded (not recommended in Phase 6h)

Defer to **Phase 6i planning** for gig slot with **timer-safe reconcile request design** (e.g. coalesce with countdown tick suppression, state-change-only requests). Do not implement in Phase 6h without a new approved plan.

---

## 8. What should explicitly not be done next

| Do not | Reason |
|--------|--------|
| Add gig/image reconcile hooks | Timer storm / weak layout coupling |
| Remove or relocate `rHome` tail `reconcileHomeLayout('rHome')` | Double-execute / miss risk |
| Tune layout budget constants | Frozen boundary |
| Fix Song Vote / Rehearsal pill placement | Visual scope; confounds modularization |
| Edit Home CSS or cue HTML | Out of scope |
| Enable `modular-inflow` by default | Hard boundary |
| Merge to `main` | Out of scope |
| Debug local Windows server loops | `PHASE_6D_LOCAL_SMOKE_BLOCKER_NOTE.md` |
| CDP smoke scripts | Blocked |
| Broad listener rollout (multiple paths one commit) | Rollback / storm risk |
| Reintroduce banned rescue paths | Permanent ban |
| Controller DOM coupling for Home-active checks | Integrity forbidden list |

---

## 9. Why Home visual fixes remain out of scope

| Reason | Detail |
|--------|--------|
| Modularization goal | Orchestration and reconcile **coordination**, not UI polish |
| Confounding regressions | Pill/CSS fixes mask or mimic coalescer/layout regressions |
| Known pre-existing issues | Song Vote Pending and Rehearsal On Deck placement documented since Phase 6c verification |
| Blast radius | Visual fixes touch legacy CSS/HTML forbidden in reconcile phases |
| Verification integrity | Phase 6f/6g pass criteria require **no** visual/CSS/pill changes in reconcile commits |

Visual fixes belong in a **separate product/CSS track**, not HomeController modularization.

---

## 10. Allowed files (later implementation, if approved)

### Phase 6h-a (recommended - docs only)

| File | Change |
|------|--------|
| `docs/modularization/PHASE_6G_VERIFICATION_RESULT.md` | Create verification outcome |
| `docs/modularization/HANDOFF_001_*.md` | Optional handoff with startup protocol (Section 17) |

### Phase 6i+ (future - only with new plan)

| File | Change |
|------|--------|
| `index.html` | Gig pilot hook only with timer-safe design |
| `tests/integrity/home-controller-package.mjs` | Pilot invariants |
| `tests/integrity/home-layout-engine-package.mjs` | Diff allowlist |
| `oot_home_controller.js` | Only if coalescer timer-suppression approved |

**Phase 6h:** no `index.html`, no controller, no module edits.

---

## 11. Forbidden files / edits

Same as Phase 6g forbidden set, plus:

| Forbidden | Reason |
|-----------|--------|
| Any new reconcile hook in Phase 6h | Stop rollout decision |
| `oot-local-server.ps1` | Local-only |
| Calendar, Chat, Songs, Setlists, Flyers, Pay | Out of scope |
| Firebase config/rules, OneSignalSDKWorker.js | Out of scope |
| opM/clM modal infrastructure | Out of scope |
| `main` merge | Hard boundary |

---

## 12. Required integrity gates

Run before recording Phase 6g verification or any future implementation:

```powershell
$node = "C:\Users\rescarcega\AppData\Local\Programs\cursor\resources\app\resources\helpers\node.exe"
Set-Location "C:\Users\rescarcega\Documents\outoftimeband"
& $node tests/integrity/home-layout-engine-package.mjs
& $node tests/integrity/home-diag-package.mjs
& $node tests/integrity/home-alert-rail-package.mjs
& $node tests/integrity/home-gig-slot-package.mjs
& $node tests/integrity/home-controller-package.mjs
```

Static invariants to confirm after 6g:

- One `reconcileHomeLayout('rHome')` in `index.html`
- Two `cue:song-vote`, three `cue:rehearsal` hooks; Home-active gate on all
- No direct `reconcileHomeLayout` in cue renderers
- Coalescer `rHome` dedupe preserved; Phase 6d `enterHomeTab` preserved
- Banned strings absent; protected modules untouched

---

## 13. Manual/browser verification expectations

Follow `PHASE_6D_LOCAL_SMOKE_BLOCKER_NOTE.md`.

| Expectation | Phase 6h |
|-------------|----------|
| Minimum | Five integrity gates PASS |
| Browser smoke | Optional; **one** short attempt on known-good server; then stop |
| If blocked | Document BLOCKED; gates + static review suffice |
| Compact state read | `getHomeControllerState()` after `OOT_HOME_LAYOUT_DIAG.disable()` |
| Pilot session | Optional for `cue:rehearsal` delegate confirmation under `modular-inflow` opt-in |
| Do not require | Gig timer, image-only, or third cue path proof |

---

## 14. Pass / fail criteria

### Pass (Phase 6h planning / verification outcome)

- All five integrity scripts exit 0 on `a714c21` stack
- 6g verification result doc records PASS (or BLOCKED + gates pass)
- Hook rollout explicitly **stopped** with user/handoff acknowledgment
- No forbidden file changes in verification pass
- Song-vote + rehearsal pilots preserved; `rHome` tail unchanged

### Fail

- Any integrity gate fails
- New hooks added without approved plan
- Direct renderer `reconcileHomeLayout` introduced
- Visual/CSS/pill/budget changes smuggled in
- Local server debugging treated as app failure
- Merge to main or pilot default enablement

---

## 15. Rollback criteria

| Trigger | Action |
|---------|--------|
| 6g regression on gates | Revert `a714c21`; re-run gates |
| Coalescer double-execute on `rHome` | Revert through `efd6a6b` if delegate broken; else 6g only |
| Catastrophic cue/listener break | Revert `a714c21` then `6af4398` per user approval |

Stable targets: `6af4398` (6e-c only), `efd6a6b` (pre-cue hooks), `0581cf8` (6f docs baseline).

---

## 16. Recommended small commit boundary

**Commit 1 (Phase 6h-a - recommended):**

`Document Phase 6g verification result and pause hook rollout`

Includes:

- `docs/modularization/PHASE_6G_VERIFICATION_RESULT.md`
- Optional update to this plan cross-reference only if needed (prefer separate commit)

**Commit 2 (optional handoff):**

`Add HANDOFF_001 Home modularization agent startup protocol`

Includes handoff doc with Section 17 protocol (mandatory for next agent).

**Do not combine with:**

- Runtime hook additions
- Visual fixes
- `main` merge
- Local server scripts

---

## 17. Next handoff 001 - mandatory New Agent Startup Protocol

The next **`HANDOFF_001`** file (or successor numbered handoff) **must** include this protocol verbatim in substance. The next agent **must not** ask the user to upload every handoff file individually.

### New Agent Startup Protocol (required content for HANDOFF_001)

1. **Read HANDOFF_001 first** before any code or doc edits.
2. **State back to the user** in the opening response:
   - Active branch
   - HEAD sha and whether it matches `origin`
   - Current modularization phase (e.g. post-6g, hook rollout paused)
   - Next approved task (or explicit stop/handoff)
   - Hard boundaries (no main merge, no pilot default, no local server debug loops, no visual fixes, etc.)
3. **Verify repo state in PowerShell:**
   - `git status`
   - `git log -1 --oneline`
   - `git rev-parse HEAD` and comparison to `origin/<branch>`
4. **Read required docs** (paths listed in HANDOFF_001), including at minimum:
   - `PHASE_6D_LOCAL_SMOKE_BLOCKER_NOTE.md`
   - Latest verification result (`PHASE_6G_VERIFICATION_RESULT.md` when present)
   - Current boundary plan (`PHASE_6H_HOME_CONTROLLER_NEXT_BOUNDARY_PLAN.md`)
5. **Stop and report to the user** if repo state differs from handoff (wrong branch, dirty tree surprises, HEAD drift, missing commits).
6. **Run five integrity gates** before any implementation when task is verify/implement.
7. **Do not** request the user to paste or upload each handoff file one-by-one; use repo paths under `docs/modularization/`.

### HANDOFF_001 should also index

- Branch purpose: Home layout engine + HomeController modularization pilot
- Runtime stack summary (6d-6g)
- Latest verification status
- Explicit **hook rollout paused** decision
- Forbidden files list (short)
- PowerShell gate commands (Section 12)
- Next candidate options: handoff only, 6i gig timer-safe planning, or Phase 7 promotion (none approved by default)

---

## 18. Explicit stop point

**This document is planning only.**

- **No Phase 6h implementation** in this commit.
- **No code or index.html edits.**
- **No local server work.**
- **No CDP automation.**
- **No merge to main.**

Await user choice: **(A)** Phase 6h-a 6g verification docs + pause rollout, **(B)** handoff 001 authoring, **(C)** stop and prepare full handoff, **(D)** explicit request to plan Phase 6i gig timer-safe design (planning only, separate doc).
