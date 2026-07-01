# Phase 6m-a Pending Proposal Cue Inventory

## Status

**Inventory complete / planning-only.** No runtime behavior changed.

Static code inspection at HEAD `2381043`. No browser-observed behavior is claimed. Local browser smoke remains **BLOCKED** on the work computer.

---

## Repo State

| Item | Value |
|------|--------|
| Branch | `modularization-home-layout-engine-pilot` |
| HEAD (short) | `2381043` — *Wrap rehearsal cue render in module* |
| HEAD (full) | `2381043bd187b0ce353916cd21583c1a9ff9e333` |
| Origin | `2381043bd187b0ce353916cd21583c1a9ff9e333` |
| HEAD == origin | **Yes** |
| Working tree | Clean except untracked local-only file |
| Untracked | `oot-local-server.ps1` (**do not commit**) |

Verified via `git fetch --all --prune`, `git branch --show-current`, `git status --short`, `git log -16 --oneline --decorate`, `git rev-parse HEAD`, `git rev-parse origin/modularization-home-layout-engine-pilot`.

**Baseline context:** Song Vote and Rehearsal alert-row cues now route build+apply through `OOT.home.cueRenderer.renderSongVoteCue` / `renderRehearsalCue` (Phases 6l-h/6l-i). `renderPendingProposalCue()` remains legacy-owned in `index.html`.

---

## Purpose

Inventory `renderPendingProposalCue()` and its side effects before any routing or extraction. Produce a precise, bounded plan for the next safe implementation slice.

**No extraction is approved by this inventory.**

---

## Files Inspected

| File | Role |
|------|------|
| `index.html` | `renderPendingProposalCue()`, helpers, all call sites, inline CSS for proposal cues (~14018–14128), Firestore `listenProposals()`, `rHome()`, `rCal()`, proposal vote UX |
| `oot_home_cue_renderer.js` | Alert-row cue module (Song Vote + Rehearsal only; **no** proposal cue API yet) |
| `app_r913.css` | Duplicate r838/r839 proposal cue rules (mirror of inline CSS) |
| `docs/modularization/PHASE_6L_A_HOME_CUE_RENDERER_INVENTORY.md` | Prior cue inventory (line refs shifted since 6l work) |
| `docs/modularization/PHASE_6L_I_REHEARSAL_RENDER_WRAPPER_RESULT.md` | Latest alert-row wrapper result |
| `tests/integrity/home-controller-package.mjs` | Untouched guards for `renderPendingProposalCue` (Phases 6l-f through 6l-i) |

---

## 1. Function Location and Current Responsibilities

| Item | Detail |
|------|--------|
| **Primary function** | `renderPendingProposalCue()` — `index.html` **25862–25928** |
| **Comment anchor** | r838: member-specific in-app cue for pending rehearsal proposal responses |
| **Intent** | **Not** an alerts-row pill. Updates three UI surfaces when the current member has open proposals awaiting their response. |
| **Responsibilities today** | (1) Derive pending IDs via `_pendingProposalIdsForMe()`; (2) sync Calendar tab badge on `#tb-cal`; (3) create/update/hide Home hero micro-cue; (4) create/update/hide Calendar ACTION NEEDED strip; (5) wire click handlers to `_openPendingProposalCue()` |

**Adjacent helpers (same ownership block, not part of render body):**

| Function | Lines | Role |
|----------|-------|------|
| `_pendingProposalIdsForMe()` | 25819–25832 | State derivation: filter global `proposals[]` for open items where `ME` is expected responder and has not responded |
| `_hideCalendarProposalCueWhileWorkspaceOpen()` | 25834–25842 | Hides `#cal-proposal-micro-cue` when `#proposals-list` workspace is visible (used from `_openPendingProposalCue`, not from render) |
| `_openPendingProposalCue()` | 25844–25861 | Navigation UX: go to Calendar, open proposals list, scroll into view |

---

## 2. DOM Targets It Writes

| Target | Selector / ID | Static or dynamic | Write operations |
|--------|---------------|-------------------|------------------|
| Calendar tab button | `#tb-cal` | Static (`index.html` ~18934) | May set `calBtn.style.position = 'relative'`; append/remove child badge |
| Tab badge | `.proposal-tab-badge` on `#tb-cal` | **Dynamic** `createElement('span')` | `textContent`, `title`, `className`, `appendChild` / `removeChild` |
| Home micro-cue | `#home-proposal-micro-cue` | **Dynamic** `createElement('button')` on `#sc-home .hero.home-hero-with-controls` | `id`, `type`, `onclick`, `innerHTML`, `style.display`, `appendChild` |
| Calendar micro-cue | `#cal-proposal-micro-cue` | **Dynamic** `createElement('button')` under `#sc-cal` | Insert after `#calendar-hero` or at `#sc-cal` top; `id`, `type`, `onclick`, `innerHTML`, `style.display` |

**Read-only DOM lookups (no writes unless target exists):**

- `document.getElementById('tb-cal')`
- `document.querySelector('#sc-home .hero.home-hero-with-controls')`
- `document.getElementById('sc-cal')`
- `document.getElementById('calendar-hero')` (insert anchor only)

**Not written by this function:**

- `#home-alerts-row`, `#home-song-vote-cue`, `#home-rehearsal-cue`
- `#sc-home[data-home-alert-state]` (alert rail)
- Any layout CSS variables

---

## 3. Markup / Text / Classes / Handlers Emitted

### Calendar tab badge (`.proposal-tab-badge`)

| When visible | Emitted |
|--------------|---------|
| `count > 0` | Badge text: `count` or `'9+'` if count > 9 |
| | `title`: `"{count} rehearsal proposal(s) waiting"` (singular/plural) |
| Class | `proposal-tab-badge` |
| Handler | None (`pointer-events:none` in CSS) |

### Home micro-cue (`#home-proposal-micro-cue`)

| When visible | Emitted |
|--------------|---------|
| `innerHTML` | `<span class="home-proposal-dot"></span><span>{count} rehearsal response needed</span>` |
| Display | `inline-flex` |
| Handler | `cue.onclick = function(ev){ ev.stopPropagation(); _openPendingProposalCue(); }` |

**Exact visible copy:** `{N} rehearsal response needed` (no singular/plural branch on "response").

### Calendar ACTION NEEDED strip (`#cal-proposal-micro-cue`)

| When visible | Emitted |
|--------------|---------|
| `innerHTML` | `<span class="cal-proposal-kicker">ACTION NEEDED</span><span class="cal-proposal-main">{count} rehearsal proposal waiting for your response</span>` |
| Display | `flex` |
| Handler | Same as Home micro-cue → `_openPendingProposalCue()` |

**Canonical strings to preserve:**

- Kicker: **`ACTION NEEDED`**
- Home line pattern: **`N rehearsal response needed`**
- Calendar main line pattern: **`N rehearsal proposal waiting for your response`**

### Hidden state (`count === 0`)

- Remove tab badge if present
- Set `#home-proposal-micro-cue` `display: none` (element may remain in DOM)
- Set `#cal-proposal-micro-cue` `display: none` (element may remain in DOM)

---

## 4. Data / State Inputs Read

| Input | Source | Used for |
|-------|--------|----------|
| Global `proposals[]` | Firestore `listenProposals()` ordered snapshot (`26819+`) | Filtered by `_pendingProposalIdsForMe()` |
| Global `ME` | Session identity | Responder check |
| Global `members[]` | Member roster | Fallback expected-responder list when proposal lacks `expectedResponderIds` |
| `_proposalExpectedResponderIds(p)` | `index.html` 26967–26972 | Who must respond per proposal |
| Per-proposal fields | `p.status`, `p.responses`, `p.expectedResponderIds` | Open + not-yet-responded filter |

**Derivation logic (`_pendingProposalIdsForMe`, 25819–25832):**

1. Require `proposals` array.
2. Keep proposals where `status` is open (missing or `'open'`).
3. Keep if `ME` ∈ expected responders.
4. Keep if `responses[ME]` is absent.
5. Return array of proposal id strings; `count = ids.length`.

**Does not read:** `suggestions[]`, `events[]`, Home layout mode, alert-rail state, gig slot state.

---

## 5. Side Effects

### DOM writes

| Effect | Details |
|--------|---------|
| Tab badge lifecycle | Create/destroy `.proposal-tab-badge` on `#tb-cal` |
| Tab positioning | Forces `position: relative` on `#tb-cal` when badge path runs |
| Home button lifecycle | Create `#home-proposal-micro-cue` once; toggle `display` + `innerHTML` |
| Calendar button lifecycle | Create `#cal-proposal-micro-cue` once; toggle `display` + `innerHTML`; insert position depends on `#calendar-hero` |
| Event handlers | Assigns fresh `onclick` closures on created buttons each visible render |

### CSS / class / display writes

| Write | Scope |
|-------|--------|
| `style.display` | `'inline-flex'` / `'flex'` / `'none'` on micro-cues |
| `style.position` | `'relative'` on `#tb-cal` only |
| `className` | `'proposal-tab-badge'` on badge span |
| **No** | CSS custom properties, `#sc-home` layout attrs, alert-rail `data-home-alert-state` |

### Badge writes

Calendar tab numeric badge only (see §3). Not the same system as in-app notification bell badges.

### Calendar ACTION NEEDED writes

Owned entirely inside this renderer (Calendar-scoped DOM). CSS rule r840/r841 hides `#cal-proposal-micro-cue` when proposals workspace is open (`#proposals-list` visible) — render does not evaluate that rule; `_hideCalendarProposalCueWhileWorkspaceOpen()` handles runtime hide on navigation.

### Notification / log writes

**None inside `renderPendingProposalCue()`.** Related but separate:

- `listenProposals()` may show `showAppBanner` for new proposals (26831–26841).
- `_checkProposalsAtBoot`, `_runProposalReminderSweep`, proposal reminder timers run after listener tail — not invoked from render function itself.
- `voteOnProposal()` Firestore write triggers re-render in `.then()` (28312) — render is downstream, not a notifier.

### Reconcile / layout calls

**None.** Unlike alert-row cues, this function does **not** call:

- `syncAlertRailState`
- `notifyCueChange`
- `requestHomeReconcile` / `reconcileHomeLayout`
- `_recordHomeCueRenderDiag` / `_homeLayoutDiagSnapshot`
- `_scheduleHomeImagePresentationRefresh` / `notifyImageRefresh`

### Error handling

Whole body wrapped in `try/catch`; logs `[r838 pending proposal cue] render failed` to console on failure.

---

## 6. Caller / Call-Site List

| # | File | Line | Context | Trigger |
|---|------|------|---------|---------|
| 1 | `index.html` | 26848 | `listenProposals()` snapshot tail | Firestore `proposals` ordered listener refresh |
| 2 | `index.html` | 28312 | `voteOnProposal()` → Firestore `.update().then()` | Member casts/changes YES/MAYBE/NO vote |
| 3 | `index.html` | 30649 | `closeRehearsalProposalsWorkspace()` → `setTimeout(..., 40)` | User closes Rehearsal Proposals workspace (r841 restore cue) |
| 4 | `index.html` | 30988 | `rHome()` early block | Every Home refresh (includes `listenEvents()` → `rHome()`) |
| 5 | `index.html` | 31271 | `rCal()` entry | Every Calendar refresh |

**Typical refresh order when proposals change:**

`listenProposals()` → `renderHomeRehearsalCue()` → `renderHomeSongVoteCue()` → **`renderPendingProposalCue()`** (26846–26848).

**`rHome()` order (30982+):** proposal cue **before** song/rehearsal alert-row renderers (30988 vs 31024+).

**Indirect triggers:** Any code path calling `rHome()` or `rCal()` or updating proposals snapshot/vote without listing explicit render call.

---

## 7. Coupling Risks vs Song Vote / Rehearsal Alert-Row Cues

| Dimension | Alert-row cues (6l complete) | `renderPendingProposalCue` |
|-----------|------------------------------|----------------------------|
| DOM model | Single pre-declared shell per cue (`#home-song-vote-cue`, `#home-rehearsal-cue`) | **Three targets**, two created dynamically |
| Placement | `#home-alerts-row` pills | Home **hero overlay** + **tab chrome** + **Calendar panel** |
| Module pattern | `build*CueView` → `applyCueView(targetEl, view)` → `render*Cue(targetEl, input)` | Monolithic function; **no** view/apply split |
| Alert rail | `syncAlertRailState` + `data-home-alert-state` | **Not integrated** |
| Home layout reconcile | `requestHomeReconcile('cue:…')` when `#sc-home.on` | **Not integrated** |
| Cue render diagnostics | `_recordHomeCueRenderDiag` (6l-b) | **Not integrated** |
| Markup style | Large gradient alert pills | Small text micro-cues + tab badge |
| onclick | Inline HTML string handlers | **`_openPendingProposalCue`** function assignment |
| Cross-tab UX | Songs tab navigation (song vote) | **Calendar tab + proposals workspace** navigation |
| CSS coupling | Extensive `:has(#home-rehearsal-cue…)` hero layout | Separate r838/r839/r840 rules; **no** `#home-proposal-micro-cue` in alert-row `:has` chains |
| Firestore | Indirect via global arrays | Direct **`proposals[]`** filter in helper |
| Rehearsal overlap | `_ootNextOpenRehearsalProposal()` shares proposal data for rehearsal **alert** cue | Same `proposals[]` source; **different renderer** — changing proposal render must not break rehearsal derivation |

**High-risk couplings for modularization:**

1. **Multi-target DOM apply** — cannot reuse single-element `applyCueView(targetEl, view)` without extension.
2. **Calendar ownership** — `#cal-proposal-micro-cue` insertion logic and r840 CSS `:has(#proposals-list…)` behavior.
3. **Navigation sidecar** — `_openPendingProposalCue()` must remain callable from migrated handlers with identical UX.
4. **Call order in `rHome()`** — proposal cue runs before alert-row cues today; changing order could cause flicker (keep relative order in plan).
5. **Integrity guards** — multiple Phase 6l tests assert proposal function body stays free of alert-row seam symbols; new tests must replace guards incrementally.

---

## 8. Safe Routing Assessment

### Direct full wrapper in `oot_home_cue_renderer.js`?

**Not recommended as the first slice.**

Reasons:

- Unlike `renderSongVoteCue` / `renderRehearsalCue`, there is **no single `targetEl`**; module would need document-scoped multi-target apply.
- Dynamic `createElement` + insert placement differs from alert-row `innerHTML` on static shells.
- Reusing `applyCueView` as-is would be incorrect abstraction.
- Calendar + tab surfaces expand blast radius beyond Home cue renderer’s current alert-row scope.

### Smaller intermediate seam first?

**Yes — recommended.**

Mirror the 6l ladder, adapted for multi-target proposal cue:

1. **View builder** (strings/metadata only, `rendersDom: false`)
2. **Multi-target apply helper** (DOM writes only, no Firestore)
3. **Module wrapper** (`renderPendingProposalCue(input)` or `renderPendingProposalCue(doc, input)`)
4. **Thin legacy caller** in `index.html` with fallback

Keep **`_pendingProposalIdsForMe()` state derivation in `index.html`** until a later explicitly scoped phase (it reads live Firestore-backed globals and proposal business rules).

Keep **`_openPendingProposalCue()` in `index.html`** for navigation/calendar UX (out of Home cue renderer scope per hard boundaries).

---

## 9. Recommended Next Implementation Slice

### Phase 6m-b — Proposal cue view builder scaffold (recommended next)

**Goal:** Add read-only view packaging in module; no routing of legacy render yet.

| Item | Plan |
|------|------|
| **Allowed files** | `oot_home_cue_renderer.js`, `tests/integrity/home-controller-package.mjs`, optional `home-layout-engine-package.mjs` allowlist, result doc |
| **Module additions** | `buildPendingProposalCueView(input)` returning `{ cueName: 'pendingProposal', visible, count, badgeText, badgeTitle, homeHtml, calHtml, rendersDom: false }` with **exact legacy strings** |
| **Index helper (optional same phase)** | `_buildHomePendingProposalCueInput(pendingIds)` → `{ pendingIds, count, hasTarget: true }` — data only |
| **Do not** | Change `renderPendingProposalCue()` body; wire module render; touch CSS; move `_pendingProposalIdsForMe` |
| **Fallback** | N/A (no runtime path change) |
| **Tests** | Method exists; builder preserves canonical strings/classes in HTML fragments; forbidden calls absent; `renderPendingProposalCue` still untouched in index |
| **Hard boundaries** | Same as 6m-a; no Calendar listener edits; no alert-rail hooks |

### Phase 6m-c — Multi-target apply seam

| Item | Plan |
|------|------|
| **Allowed files** | `oot_home_cue_renderer.js`, `index.html`, integrity tests, result doc |
| **Module additions** | `applyPendingProposalCueView(view)` — encapsulates current DOM block from 25866–25924 (tab badge + home + cal) |
| **Index** | Legacy `renderPendingProposalCue()` calls builder + apply via module on normal path; inline DOM block as fallback |
| **Fallback** | Preserve full inline DOM block when module missing |
| **Tests** | Apply helper exists; no Firestore/reconcile; legacy fallback preserved; three targets still updated |

### Phase 6m-d — Module-owned `renderPendingProposalCue` wrapper

| Item | Plan |
|------|------|
| **Allowed files** | `oot_home_cue_renderer.js`, `index.html`, integrity tests, result doc |
| **Module additions** | `renderPendingProposalCue(input)` → `buildPendingProposalCueView` + `applyPendingProposalCueView` |
| **Index** | Derive `_pendingProposalIdsForMe()` → `_buildHomePendingProposalCueInput(...)` → `cueRenderer.renderPendingProposalCue(input)`; fallback chain like 6l-h/i |
| **Fallback** | build+apply separately, then full inline legacy |
| **Tests** | Wrapper calls build+apply; all five call sites still invoke index `renderPendingProposalCue()`; proposal function body does not reference alert-row wrappers; Song Vote/Rehearsal paths unchanged |
| **Hard boundaries** | Do not move `_openPendingProposalCue`, `listenProposals`, vote handlers, or CSS in this phase |

### Phase 6m-e — Verification / handoff (optional stop point)

Integrity-only result doc; confirm both alert-row wrappers + proposal wrapper coexist; decide whether to route state derivation or stop before `renderPendingProposalCue` navigation helpers.

### Explicit non-goals (until separately approved)

- Alert-rail integration for proposal micro-cue
- `requestHomeReconcile` hooks for proposal cue
- Moving Firestore listeners or `_pendingProposalIdsForMe` into module
- CSS edits or hero placement changes
- Merging proposal cue into Song Vote/Rehearsal `CUE_IDS` / kicker metadata without separate `pendingProposal` namespace
- Routing `_openPendingProposalCue` through cue renderer

---

## Integrity Gates (docs-only baseline)

Run at inventory time (no code changes):

```powershell
$node = "C:\Users\rescarcega\AppData\Local\Programs\cursor\resources\app\resources\helpers\node.exe"
& $node tests/integrity/home-controller-package.mjs
& $node tests/integrity/home-layout-engine-package.mjs
& $node tests/integrity/home-diag-package.mjs
& $node tests/integrity/home-alert-rail-package.mjs
& $node tests/integrity/home-gig-slot-package.mjs
```

| Package | Result |
|---------|--------|
| `home-controller-package.mjs` | **PASS** (Phase 6l-i checks) |
| `home-layout-engine-package.mjs` | **PASS** |
| `home-diag-package.mjs` | **PASS** |
| `home-alert-rail-package.mjs` | **PASS** |
| `home-gig-slot-package.mjs` | **PASS** |

---

## Commit Status

**Not committed** — awaiting review and approval.
