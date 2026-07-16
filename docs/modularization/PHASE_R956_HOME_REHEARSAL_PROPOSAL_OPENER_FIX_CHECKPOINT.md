# Phase r956 — Home Rehearsal Proposal Opener Fix Checkpoint

Date: 2026-07-15

## Status

**r956 complete, pushed, and phone verified.**

| Item | Value |
|------|--------|
| Branch / destination | `main` (`origin/main`) |
| Runtime commit | `678c3e3` |
| Build Version | `2026-07-13-r956-home-rehearsal-proposal-open-fix` |
| Commit message | `Fix Home rehearsal proposal opener` |
| Phone verification | PASS (Jim — create proposal, Home “Rehearsal on Deck” opens correctly) |

---

## Production Bug Fixed

Home **Rehearsal on Deck** could show an open rehearsal proposal (r809 cue fallback) but tapping the pill toasted **Rehearsal not found** instead of opening the proposal.

---

## Root Cause

`renderHomeRehearsalCue` / `_r535NextUpcomingRehearsal` can bind a **proposal** id from `_ootNextOpenRehearsalProposal` when no confirmed rehearsal event exists.

`_r535OpenHomeRehearsal(eid)` previously searched **`events` only**. Proposal ids live in Firestore **`proposals`**, not `events`, so the opener failed with **Rehearsal not found**.

Calendar → Rehearsal Proposals / Member Activity deep-links already worked via `_gotoProposalFromMemberActivity`.

---

## Files Changed (runtime fix `678c3e3`)

| File | Role |
|------|------|
| `index.html` | Proposal fallback in `_r535OpenHomeRehearsal`; Build Version + What’s New r956 |
| `tests/integrity/home-rehearsal-cue-open-package.mjs` | Focused integrity gate for opener proposal fallback |

---

## What Changed

- Preserved confirmed rehearsal **event** open path (lookup in `events`, day drawer / Event Details).
- If no matching event: look up id in `proposals`.
- If matching **open** / non-cancelled / non-confirmed proposal: open via `_gotoProposalFromMemberActivity` (working Calendar Rehearsal Proposals deep-link).
- Toast **Rehearsal not found** only after both event and proposal lookups fail.

---

## What Intentionally Did Not Change

- Proposal Yes / No / Maybe voting
- Confirm / cancel flows
- Calendar grid marker logic (no proposal grid icon added)
- Blackout behavior
- HomeController / modularization plumbing
- Flyer / Calendar helper extractions modules (except validation still green)

---

## Validation Completed

### Local (Node)

| Check | Result |
|-------|--------|
| Inline script syntax check | PASS |
| `tests/integrity/home-rehearsal-cue-open-package.mjs` | PASS |
| Calendar helpers gate | PASS |
| Flyer manifest gate | PASS |
| Flyer adapter gate | PASS |
| Flyer layer helper gate | PASS |

### Phone / PWA

| Check | Result |
|-------|--------|
| Build Version r956 on phone | PASS |
| Signed in as Jim; create another rehearsal proposal | PASS |
| Home **Rehearsal on Deck** tap opens proposal (no **Rehearsal not found**) | PASS |

---

## Known Workspace Note (unrelated — not committed)

The temporary r956 worktree (`outoftimeband-r956-main`) can show **`Band.png` / `band.png` Windows case-collision noise**.

- Git tracks both path casings with different blobs; NTFS can hold only one file.
- This is **unrelated** to r956.
- Runtime commit `678c3e3` did **not** include `Band.png` or `band.png`.
- Do not stage, restore, delete, rename, or otherwise “fix” those image paths as part of r956 follow-up.

---

## Next Recommended Step

1. Clean up / close the temporary r956 worktree safely (without touching image files or modularization WIP).
2. Return to the primary modularization workspace (`C:\Users\riche\Documents\outoftimeband` on `modularization-home-layout-engine-pilot`).
3. Decide whether to preserve or continue the Phase 6i-a WIP there.
