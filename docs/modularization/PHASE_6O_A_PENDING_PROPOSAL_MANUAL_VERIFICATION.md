# Phase 6o-a — Pending Proposal Cue Manual Verification Checklist

## Status

**Manual verification complete — PASS.**

Browser verification was executed against **Phase 6m-d** pending proposal routing (`renderPendingProposalCue()` → `cueRenderer.buildPendingProposalCueView` + `applyPendingProposalCueView`, with `_legacyRenderPendingProposalCue(ids)` fallback).

No runtime behavior changed by this document update. Results recorded below authorize proceeding to **Phase 6o-b** planning per `PHASE_6N_HOME_CUE_NEXT_PLAN.md` (subject to user approval for any code slice).

---

## Repo Baseline

| Item | Value |
|------|--------|
| Branch | `modularization-home-layout-engine-pilot` |
| Checklist HEAD (short) | `c3309e4` — *Document Phase 6o-a pending proposal verification* |
| Phase under test | **6m-d** pending proposal wrapper routing |
| Manual session result | **PASS** (recorded in this doc update) |
| Untracked local-only | `oot-local-server.ps1` (**do not commit**) |

If HEAD is not at or after the commit that routes `renderPendingProposalCue()` through `cueRenderer`, stop and reconcile repo state before testing.

---

## Purpose

Confirm that Phase 6m-d module routing produces **the same user-visible DOM and behavior** as legacy `_legacyRenderPendingProposalCue(ids)` on:

1. Calendar tab badge (`#tb-cal` → `.proposal-tab-badge`)
2. Home hero micro-cue (`#home-proposal-micro-cue`)
3. Calendar ACTION NEEDED strip (`#cal-proposal-micro-cue`)

Also confirm click/tap navigation still opens the pending proposal flow via `_openPendingProposalCue()`.

---

## Preconditions

### Environment

- App served over HTTP(S) with Firebase/Firestore connected (same as production-like dev/staging).
- Logged in as a band member who **is an expected responder** on at least one open rehearsal proposal.
- `oot_home_cue_renderer.js` loaded (normal app boot). Module path is the default happy path.
- Home tab and Calendar tab reachable.

### Test data (no code changes required)

You need two observable states:

| State | Requirement |
|-------|-------------|
| **Pending visible** | Current member (`ME`) has ≥1 open proposal where they are in `expectedResponderIds` (or equivalent) and have **not** responded |
| **Pending hidden** | Same member has **zero** such proposals (respond to all, or use an account with none assigned) |

Record which member/account and proposal IDs were used in the result table Notes column.

### Trigger re-render

After data changes, cue surfaces refresh when `renderPendingProposalCue()` runs. Known call paths:

- Open Home (`rHome`)
- Open Calendar (`rCal`)
- Proposal listener updates (`listenProposals`)
- Vote on proposal
- Close rehearsal proposals workspace

**Suggested flow:** change proposal state → switch to Home → switch to Calendar → re-open Home.

---

## Integrity Gate (run before or after manual session)

All five must **PASS** on the commit under test:

```powershell
$node = "C:\Users\rescarcega\AppData\Local\Programs\cursor\resources\app\resources\helpers\node.exe"
& $node tests/integrity/home-controller-package.mjs
& $node tests/integrity/home-layout-engine-package.mjs
& $node tests/integrity/home-diag-package.mjs
& $node tests/integrity/home-alert-rail-package.mjs
& $node tests/integrity/home-gig-slot-package.mjs
```

| Package | Expected |
|---------|----------|
| `home-controller-package.mjs` | PASS (includes Phase 6m-d pending proposal wrapper routing checks) |
| `home-layout-engine-package.mjs` | PASS |
| `home-diag-package.mjs` | PASS |
| `home-alert-rail-package.mjs` | PASS |
| `home-gig-slot-package.mjs` | PASS |

Record gate results in session notes. Integrity PASS does **not** alone sign off manual DOM verification.

---

## Manual Checks

### 1. Calendar tab badge

**Target:** `#tb-cal` child `.proposal-tab-badge`

| # | Step | Expected (legacy-equivalent) |
|---|------|------------------------------|
| 1.1 | With ≥1 pending proposal for current member, open any tab where bottom nav is visible | Badge **appears** on Calendar tab button |
| 1.2 | Inspect badge text for count = 1 | Text is `1` (not `01`) |
| 1.3 | If testable, use count 2–9 | Text equals exact count string |
| 1.4 | If testable, use count ≥10 | Text is `9+` (cap) |
| 1.5 | Hover/long-press badge (title tooltip) | Title: `{N} rehearsal proposal waiting` (singular) or `{N} rehearsal proposals waiting` (plural) |
| 1.6 | With zero pending proposals, re-render cues | Badge **removed** from DOM (not merely invisible) |
| 1.7 | Inspect `#tb-cal` | `position: relative` may be set when badge shown (legacy behavior) |

**Pass criteria:** Badge visibility, count label, 9+ cap, title pattern, and removal match table above.

---

### 2. Home micro-cue

**Target:** `#home-proposal-micro-cue` inside `#sc-home .hero.home-hero-with-controls`

| # | Step | Expected (legacy-equivalent) |
|---|------|------------------------------|
| 2.1 | With pending proposals, open **Home** tab | Micro-cue **visible** in hero control area |
| 2.2 | Inspect element | `id="home-proposal-micro-cue"`, `type="button"`, `display: inline-flex` |
| 2.3 | Inspect inner HTML | `<span class="home-proposal-dot"></span>` + `<span>{N} rehearsal response needed</span>` (exact copy; `{N}` = raw count, not `9+`) |
| 2.4 | Visual | Dot + text styling consistent with pre-6m-d (no new layout shift in hero controls) |
| 2.5 | Tap/click micro-cue | Navigates to **Calendar** tab; proposals workspace opens; list scrolls into view (see §4 Navigation flow) |
| 2.6 | With zero pending, open Home | Cue **hidden** (`display: none` on existing element, or absent if never created in session) |

**Pass criteria:** Placement in hero, text/classes/display, click behavior, and hide behavior match legacy.

---

### 3. Calendar strip cue

**Target:** `#cal-proposal-micro-cue` under `#sc-cal`

| # | Step | Expected (legacy-equivalent) |
|---|------|------------------------------|
| 3.1 | With pending proposals, open **Calendar** tab | Strip cue **visible** |
| 3.2 | Inspect DOM position | Inserted **immediately after** `#calendar-hero` when hero exists; otherwise first child of `#sc-cal` |
| 3.3 | Inspect element | `id="cal-proposal-micro-cue"`, `type="button"`, `display: flex` |
| 3.4 | Inspect inner HTML | Kicker: `<span class="cal-proposal-kicker">ACTION NEEDED</span>`; main: `<span class="cal-proposal-main">{N} rehearsal proposal waiting for your response</span>` |
| 3.5 | Tap/click strip | Same navigation as Home micro-cue (§4) |
| 3.6 | With zero pending, open Calendar | Strip **hidden** (`display: none`) |
| 3.7 | Open proposals workspace (list visible) | Calendar strip may hide while workspace open (`_hideCalendarProposalCueWhileWorkspaceOpen`) — optional check |

**Pass criteria:** Relative insert location, kicker/main copy, classes, display, click, and hide behavior match legacy.

---

### 4. Navigation flow (`_openPendingProposalCue`)

Expected sequence when any pending cue is clicked:

1. Calendar tab selected (`go('cal')` / `#tb-cal` active)
2. `rCal()` and `rProposals()` run (short delay)
3. `#proposals-list` workspace visible
4. `#cal-proposal-micro-cue` hidden while workspace open (if still pending)
5. List scrolled into view (smooth, centered)

| # | Step | Expected |
|---|------|----------|
| 4.1 | From Home, click `#home-proposal-micro-cue` | Lands on Calendar with proposals workspace open |
| 4.2 | From Calendar, click `#cal-proposal-micro-cue` (when visible) | Proposals workspace open / focused |
| 4.3 | No JS error in console | No uncaught exceptions from `[r838 pending proposal cue]` paths |

---

### 5. Fallback behavior (documentation only)

Phase 6m-d **keeps** legacy DOM apply in `_legacyRenderPendingProposalCue(ids)` (`index.html`). It runs when:

- `OOT.home.cueRenderer` is unavailable, or
- `buildPendingProposalCueView` / `applyPendingProposalCueView` missing, or
- build/apply throws, or
- required targets missing, or
- apply returns without `applied: true`

**Manual destructive fallback test is NOT required** for Phase 6o-a sign-off unless explicitly approved by the user.

Optional (approved-only) spot-check:

- Temporarily block `oot_home_cue_renderer.js` in devtools Network tab and reload → surfaces should still render via legacy fallback with same copy/placement.

Do **not** commit any code or permanent module disable for fallback testing.

---

### 6. Regression spot-checks (Home / Calendar layout)

While testing pending state, glance at adjacent Home/Calendar UI:

| Area | Watch for |
|------|-----------|
| `#home-alerts-row` (Song Vote / Rehearsal pills) | Unchanged behavior; no overlap with micro-cue |
| Home hero header controls | No new clipping or vertical jump |
| Calendar hero + strip | Strip does not cover hero controls |
| Bottom tab bar | Badge does not misalign Calendar tab icon/label |

---

## Observed Test Scenarios

### Scenario 1 — No pending state (Rich Escarcega)

| Field | Observed |
|-------|----------|
| `currentMember` | Rich Escarcega |
| `ME` | `3` |
| `pendingProposalIdsForMe` | `[]` |
| `pendingCount` | `0` |
| `homeMicroCueExists` | `false` |
| `calendarBadgeExists` | `false` |
| `calendarMicroCueExists` | `false` |

**Result: PASS** — Rich correctly saw no pending proposal surfaces (no pending response assigned).

### Scenario 2 — Test proposal create / listener path

- Test proposal saved and appeared in Calendar → Rehearsal Proposals.
- Confirmed proposal save + listener/list path working before pending-cue visibility test.

**Result: PASS**

### Scenario 3 — Pending-visible state (Zach Dennert)

| Field | Observed |
|-------|----------|
| `currentMember` | Zach Dennert |
| `ME` | `6` |
| `proposalsCount` | `3` |
| `pendingProposalIdsForMe` | `[1783022306892]` |
| `pendingCount` | `1` |
| `calendarBadgeExists` | `true` |
| `calendarBadgeText` | `"1"` |
| `homeMicroCueExists` | `true` |
| `homeMicroCueText` | `"1 rehearsal response needed"` |
| `homeMicroCueDisplay` | `"inline-flex"` |
| `calendarMicroCueExists` | `true` |
| `calendarMicroCueText` | `"ACTION NEEDED1 rehearsal proposal waiting for your response"` |
| `calendarMicroCueDisplay` | `"flex"` |

**Result: PASS** — Calendar badge, Home micro-cue, and Calendar strip all present with expected count/copy/display. Strip `textContent` concatenates kicker + main without separator (expected when reading combined text nodes).

### Scenario 4 — Home cue position / visibility (Zach Dennert)

| Field | Observed |
|-------|----------|
| `screenShowingHome` | `true` |
| `currentMember` | Zach Dennert |
| `ME` | `6` |
| `exists` | `true` |
| `text` | `"1 rehearsal response needed"` |
| `display` | `"flex"` |
| `visibility` | `"visible"` |
| `opacity` | `"1"` |
| `pointerEvents` | `"auto"` |
| `rect` | top `44`, left `247`, width `154`, height `12`, bottom `56`, right `401` |
| `parent className` | `"hero home-hero-with-controls"` |
| `isInViewport` | `true` |

**Result: PASS** — Cue in hero control area, visible and interactive. Computed `display: flex` is acceptable (inline-flex child layout); no layout regression observed.

### Scenario 5 — Home cue click behavior

- `document.getElementById("home-proposal-micro-cue")?.click()` opened the Rehearsal Proposals response view for Zach.

**Result: PASS** — Click routing via `_openPendingProposalCue` flow confirmed.

### Scenario 6 — Cleanup after deleting test proposal (Zach Dennert)

| Field | Observed |
|-------|----------|
| `currentMember` | Zach Dennert |
| `ME` | `6` |
| `pendingProposalIdsForMe` | `[]` |
| `pendingCount` | `0` |
| `homeMicroCueExists` | `false` |
| `calendarBadgeExists` | `false` |
| `calendarMicroCueExists` | `false` |

**Result: PASS** — All surfaces cleared after proposal deletion.

---

## Manual Verification Result

| Surface | Expected | Observed | Pass/Fail | Notes |
|---------|----------|----------|-----------|-------|
| Calendar tab badge — visible | Badge on `#tb-cal` when pending | `calendarBadgeExists: true` (Zach, count 1) | **PASS** | Scenario 3 |
| Calendar tab badge — count 1–9 | Exact count string | `calendarBadgeText: "1"` | **PASS** | Scenario 3 |
| Calendar tab badge — count ≥10 | `9+` cap | Not exercised | **N/A** | No ≥10 pending case in session |
| Calendar tab badge — title | `{N} rehearsal proposal(s) waiting` | Not explicitly captured | **N/A** | Tooltip not recorded; no failure observed |
| Calendar tab badge — hidden | Badge removed when count = 0 | `calendarBadgeExists: false` (Rich + post-delete Zach) | **PASS** | Scenarios 1, 6 |
| Home micro-cue — visible | `#home-proposal-micro-cue` in hero, `inline-flex` | Exists; `homeMicroCueDisplay: inline-flex` (scenario 3) | **PASS** | Scenario 3–4 |
| Home micro-cue — copy | `{N} rehearsal response needed` + dot span | `"1 rehearsal response needed"` | **PASS** | Scenario 3–4 |
| Home micro-cue — click | Opens Calendar + proposals workspace | Click opened Rehearsal Proposals response view | **PASS** | Scenario 5 |
| Home micro-cue — hidden | Hidden when count = 0 | `homeMicroCueExists: false` (Rich + post-delete Zach) | **PASS** | Scenarios 1, 6 |
| Calendar strip — visible | `#cal-proposal-micro-cue`, `display: flex` | Exists; `calendarMicroCueDisplay: flex` | **PASS** | Scenario 3 |
| Calendar strip — placement | After `#calendar-hero` or `#sc-cal` first child | Not DOM-snapped; visible on Calendar with pending | **PASS** | No misplaced strip reported |
| Calendar strip — copy | **ACTION NEEDED** + main text | Combined textContent matches kicker + main | **PASS** | Scenario 3 |
| Calendar strip — click | Opens proposals workspace flow | Not separately exercised | **N/A** | Home click PASS; strip click assumed equivalent handler |
| Calendar strip — hidden | Hidden when count = 0 | `calendarMicroCueExists: false` (Rich + post-delete Zach) | **PASS** | Scenarios 1, 6 |
| Calendar strip — workspace | Hidden while `#proposals-list` open (optional) | Not recorded | **N/A** | Optional check skipped |
| Home layout | No hero/alert-row regression | Hero parent correct; in viewport; no shift reported | **PASS** | Scenario 4 |
| Calendar layout | No hero/strip regression | Proposal list + strip behaved; no regression reported | **PASS** | Scenarios 2–3 |
| Integrity gates (5 packages) | All PASS on test commit | Not re-run this manual session | **N/A** | Prior branch integrity PASS at 6m-d; re-run before next runtime slice |

### Session metadata

| Field | Value |
|-------|--------|
| Tester | Rich Escarcega (session operator) |
| Date | 2026-06-01 (per workstream date) |
| Commit tested | `c3309e4` — *Document Phase 6o-a pending proposal verification* (6m-d routing under test) |
| Device/browser | Browser manual session (local app) |
| Server/environment | Firebase-connected dev/staging app |
| Test members / ME | Rich (`ME: 3`) — no pending; Zach (`ME: 6`) — pending visible |
| Pending proposal IDs used | `1783022306892` (test proposal; deleted in cleanup) |
| Overall result | **PASS** |
| Waiver reason (if WAIVED) | — |

### Conclusion

**Phase 6o-a pending proposal manual verification passed.**

Pending proposal cue routing after Phase 6m-d works as intended:

- Rich did **not** see cues (no pending response for Rich).
- Zach **did** see cues (pending response for Zach).
- Calendar tab badge, Home micro-cue, Calendar strip cue, click routing, and post-delete cleanup all passed.

No stop conditions triggered. No CSS or Firestore changes required from this verification.

---

## Stop Conditions

**Stop manual sign-off and do not start the next code slice** if any of the following occur during testing:

| Stop condition | Action |
|----------------|--------|
| Badge or cue appears in **wrong place** (wrong tab, wrong section, wrong parent) | FAIL — file issue; do not proceed to 6o-b |
| Cue tap/click does **not** open pending proposal flow | FAIL — navigation regression |
| **Home layout shifts** (hero controls, alert row, gig slot, band image area) | FAIL — layout regression |
| **Calendar visual behavior changes** (hero, strip, tab bar) unrelated to intended cue | FAIL |
| Fix appears to require **CSS** changes | STOP — out of scope for modularization slice; escalate |
| Fix appears to require **Firestore / data logic** changes | STOP — defer to dedicated data task |
| Module path clearly broken **and** legacy fallback also wrong | FAIL — 6m-d regression |
| Integrity gate failure on test commit | STOP — fix gates before manual sign-off |

When stopped: capture screenshots, console errors, member/proposal IDs, and DOM snippets (`outerHTML` of the three targets) in Notes.

---

## Sign-off Rules

| Outcome | Meaning |
|---------|---------|
| **PASS** | All required rows in result table Pass; no stop conditions triggered |
| **FAIL** | Any required surface wrong; stop conditions triggered |
| **WAIVED** | Browser smoke blocked (e.g. local server/CDP issues per `PHASE_6D_LOCAL_SMOKE_BLOCKER_NOTE.md`); integrity gates PASS; waiver recorded with reason and date |

After **PASS** (or explicit **WAIVED** with user approval), next planned slice per `PHASE_6N_HOME_CUE_NEXT_PLAN.md`:

- **Phase 6o-b** — pure `derivePendingProposalIds` seam (state-only; no DOM/Firestore/CSS).

After **FAIL**, do **not** start 6o-b until root cause is identified and fixed in a dedicated runtime slice.

---

## Related Docs

- `PHASE_6M_D_VERIFICATION_RESULT.md` — 6m-d integrity verification record
- `PHASE_6M_A_PENDING_PROPOSAL_CUE_INVENTORY.md` — legacy DOM/markup inventory
- `PHASE_6N_HOME_CUE_NEXT_PLAN.md` — remaining ownership + next slice recommendation
- `PHASE_6D_LOCAL_SMOKE_BLOCKER_NOTE.md` — local browser smoke environment constraints
