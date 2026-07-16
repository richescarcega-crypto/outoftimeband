# Phase C7a / r960 — Merge to Main Plan

Date: 2026-07-16

## Status

**Documentation / planning only.** No merge. No push to production `main`. No runtime changes from this document.

This plan covers merging **only** the bounded C7a / r960 Calendar Next Up Helpers stack into production `main`, after Rich’s explicit approval.

---

## 1. Current Verified State

| Item | Value |
|------|--------|
| Repo | `C:\Users\rescarcega\Documents\outoftimeband` |
| Branch | `modularization-home-layout-engine-pilot` |
| HEAD | `936b98b` |
| `origin/modularization-home-layout-engine-pilot` | `936b98b` |
| `origin/main` | `5636d74` |
| Working tree (before this untracked merge-plan doc) | Clean |
| Build Version | `2026-07-16-r960-calendar-next-up-helpers` |
| Runtime commit | `9bc4069` |
| Checkpoint commit | `936b98b` |

---

## 2. Exact C7a / r960 Commit Stack

### 2a. Two existing commits (current runtime + checkpoint stack)

| SHA | Message |
|-----|---------|
| `9bc4069` | Extract Calendar Next Up helpers |
| `936b98b` | Document r960 Calendar Next Up helpers |

| Role | SHA |
|------|-----|
| Runtime | `9bc4069` |
| Checkpoint | `936b98b` |

This is the **current** C7a runtime + checkpoint stack ending at `936b98b`.

### 2b. Pending merge-plan commit (this document)

This merge-plan file is currently untracked. Once Rich commits it on `modularization-home-layout-engine-pilot`, the fast-forward tip becomes **that new merge-plan commit** (do **not** invent a SHA here). Resolve it after commit with:

```powershell
git rev-parse HEAD
```

| Role | Ref |
|------|-----|
| Merge plan | **HEAD after this merge-plan document is committed** |

### 2c. Final fast-forward set

Merge **only** these commits onto `main` (fast-forward), in order:

1. `9bc4069` — Extract Calendar Next Up helpers  
2. `936b98b` — Document r960 Calendar Next Up helpers  
3. **the merge-plan commit created after this document is committed**

**Fast-forward target:** HEAD after the merge-plan document is committed (not `936b98b` alone, once the merge-plan commit exists).

`origin/main` must still be **`5636d74`** at merge time.

Do **not** invent a SHA for the pending merge-plan commit. Do **not** include any other modularization WIP, backup branches, or unrelated commits.

---

## 3. Ancestry Confirmation

The modularization branch is a **direct descendant** of `origin/main` at `5636d74`.

Expected ancestry (after the merge-plan commit exists):

```
5636d74 (origin/main)
  → 9bc4069   Extract Calendar Next Up helpers
  → 936b98b   Document r960 Calendar Next Up helpers
  → <merge-plan commit created after this document is committed>  (FF target)
```

Pre-merge check (must pass before any fast-forward). Run **after** the merge-plan commit exists:

```powershell
git fetch origin
git rev-parse origin/main
# must print: 5636d74...

$ffTip = git rev-parse HEAD   # or the pilot tip after merge-plan is committed
# $ffTip must be the merge-plan commit created after this document is committed

git merge-base --is-ancestor 5636d74 $ffTip
# exit code 0 required

git log --oneline 5636d74..$ffTip
# must show exactly the two existing C7a commits plus the merge-plan commit:
#   9bc4069, 936b98b, and the post-merge-plan tip
```

Equivalent range: `5636d74..<post-merge-plan HEAD>`.

**Stop** if `origin/main` is no longer `5636d74`, or if ancestry / range checks fail.

---

## 4. Production Main Freeze

**`origin/main` must not move until Rich explicitly approves.**

- Do **not** merge to `main`.
- Do **not** push `main`.
- Do **not** force-push anything.
- Do **not** rebase or rewrite the C7a / r960 stack without a new approved plan.

This document does **not** authorize merge or push.

---

## 5. Pre-Merge Validation Gates

Re-run immediately before merge. Any failure is a **stop**.

```powershell
$node = "C:\Users\rescarcega\AppData\Local\Programs\cursor\resources\app\resources\helpers\node.exe"
# Adjust $node path if this machine differs.

& $node tests/integrity/calendar-helpers-package.mjs
& $node tests/integrity/flyer-adapter-package.mjs
& $node tests/integrity/flyer-layer-helpers-package.mjs
& $node tests/integrity/flyer-manifest-package.mjs
```

Also required:

- **All inline scripts syntax** check — PASS (expect 8 scripts, 0 failures), same gate used for r960 local validation.

Expected: all four integrity packages **PASS**, and inline script syntax **PASS**.

---

## 6. Expected Files Introduced or Changed on Main

After a clean fast-forward of the full C7a / r960 stack (two existing commits plus the merge-plan commit), `main` should introduce or change **only**:

| File | Role |
|------|------|
| `index.html` | Inline Next Up formatter defs removed; r960 Build Version |
| `js/calendar-date-helpers.js` | Next Up helpers + namespace keys + legacy aliases |
| `tests/integrity/calendar-helpers-package.mjs` | Next Up export / no-inline-def integrity |
| `docs/modularization/PHASE_C7A_R960_CALENDAR_NEXT_UP_HELPERS_CHECKPOINT.md` | Checkpoint doc |
| `docs/modularization/PHASE_C7A_R960_MERGE_TO_MAIN_PLAN.md` | This merge plan (present on tip after the merge-plan commit) |

No other runtime, asset, or test files should appear in the merge diff vs `5636d74`.

---

## 7. Build Version After Merge

Expected Build Version on `main` after merge:

`2026-07-16-r960-calendar-next-up-helpers`

---

## 8. Protected Boundaries (Must Remain Untouched)

The merge must **not** change:

- Home band image CSS, layout, assets, or selectors
- r956 Home rehearsal proposal opener / `_r535OpenHomeRehearsal`
- r957 Calendar holiday helpers / holiday behavior
- r958 birthday helpers / MM-DD birthday behavior
- r959 Important Date helpers / exact-date + recurring MM-DD matching
- Important Date listeners, collectors, drawers, proposals, or Firestore writes
- Calendar row collectors
- Next Up open/render handlers ownership (`_calRenderStageSummary`, `_calOpenNextUp` remain inline)
- Drawers / navigation
- Proposals / Home cue behavior
- Flyer UI polish
- `Band.png` / `band.png` cleanup or case-collision handling

C7a is helpers-only: Next Up icon markup and line formatting remain unchanged; `gigDetails[id].settime` preference and `row.settime` / `row.time` fallback preserved; non-gig behavior unchanged; no sorting, date, timezone, locale, row-selection, or rendering-policy change; no render-engine move; public Calendar render ownership stays in `index.html`.

---

## 9. Merge Method Recommendation

1. **Inspect ancestry first** (Section 3).
2. Confirm `origin/main` is still **`5636d74`**.
3. Confirm post-merge-plan HEAD is a **direct descendant** of `5636d74` with exactly the two existing C7a commits plus that merge-plan commit.
4. **Fast-forward only** if both checks pass:

```powershell
git checkout main
$ffTip = git rev-parse modularization-home-layout-engine-pilot
# $ffTip must be HEAD after the merge-plan document is committed
git merge --ff-only $ffTip
```

5. **Stop** if:
   - `origin/main` has moved away from `5636d74`, or
   - histories have diverged, or
   - ancestry checks fail, or
   - `--ff-only` refuses, or
   - unexpected files appear in the merge set

Do **not** create a merge commit, rebase onto a moved `main`, or cherry-pick unless Rich approves a revised plan.

---

## 10. Post-Merge Validation Requirements

On `main` at the new tip (expected: **the merge-plan commit created after this document is committed** / post-merge-plan HEAD):

1. Re-run the four integrity packages (Section 5).
2. Re-run all inline scripts syntax check.
3. Confirm Build Version string is `2026-07-16-r960-calendar-next-up-helpers`.
4. Confirm `git log --oneline 5636d74..HEAD` shows exactly the two existing C7a commits plus the merge-plan commit (`9bc4069`, `936b98b`, and the post-merge-plan tip).
5. Confirm `git diff --name-only 5636d74..HEAD` matches the expected file list (Section 6).

Any failure → **do not push**; diagnose and stop for Rich.

---

## 11. Push Verification Requirements

Push **only after Rich explicitly approves** merge **and** push.

```powershell
git push origin main
```

After push:

| Check | Expected |
|-------|----------|
| Local `main` HEAD | the merge-plan commit created after this document is committed (post-merge-plan HEAD) |
| `origin/main` | same post-merge-plan tip (was `5636d74` before the approved FF) |
| Build Version on deployed/served app | `2026-07-16-r960-calendar-next-up-helpers` |
| Unexpected files on `main` | None beyond Section 6 |

Do **not** force-push. Do **not** delete `modularization-home-layout-engine-pilot` unless separately approved.

---

## 12. Phone / PWA Verification Checklist

After deploy / hard refresh to r960:

- [ ] Confirm Build Version **r960** (`2026-07-16-r960-calendar-next-up-helpers`)
- [ ] Calendar opens
- [ ] Month navigation works
- [ ] Empty Next Up card still displays correctly
- [ ] Populated Next Up card still displays correctly
- [ ] Gig set time still appears correctly
- [ ] Non-gig Next Up line still behaves correctly
- [ ] Important Dates remain correct
- [ ] Birthdays remain correct
- [ ] Holidays remain correct
- [ ] Home rehearsal cue works
- [ ] Home band image unchanged
- [ ] Flyer creation opens

Do **not** claim production verification until this checklist passes.

---

## 13. Rollback Reference

If r960 must be reverted after merge/push:

| Ref | Value |
|-----|--------|
| Safe rollback tip | `origin/main` @ **`5636d74`** (pre-C7a production) |
| Meaning | State before the C7a / r960 stack (two existing commits + merge-plan commit) |

Rollback requires Rich’s explicit approval and a separate, auditable procedure. Prefer restoring `main` to `5636d74` over ad-hoc file surgery.

---

## 14. Explicit Approval Gate

**Do not merge or push `main` until Rich approves.**

| Action | Authorized by this doc? |
|--------|-------------------------|
| Create / edit this plan | Yes (docs only) |
| Commit this merge-plan document on the pilot branch | Yes (docs only; not a production-merge approval) |
| Re-run local validation | Yes (read-only / test) |
| Merge to `main` | **No — Rich approval required** |
| Push `origin/main` | **No — Rich approval required** |
| Force-push / rewrite history | **No** |

Rich’s approval gate applies to the **production merge**, not committing this documentation plan.

---

## Summary

Bounded fast-forward onto `main` at `5636d74` of the two existing C7a commits (`9bc4069` → `936b98b`) **plus** the merge-plan commit created after this document is committed. Fast-forward target is that post-merge-plan HEAD — not `936b98b` alone once the merge-plan commit exists. `origin/main` must still be `5636d74` until Rich approves. Helpers-only Next Up formatter extraction (exact icon markup, empty/null row text, escaping, `gigDetails[id].settime` preference, `row.settime` / `row.time` fallback, non-gig behavior); protected Home/Flyer/Calendar/holiday/birthday/Important Date/proposal boundaries untouched; rollback tip `5636d74`.
