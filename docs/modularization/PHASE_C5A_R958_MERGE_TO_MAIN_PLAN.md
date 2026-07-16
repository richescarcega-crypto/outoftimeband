# Phase C5a / r958 — Merge to Main Plan

Date: 2026-07-15

## Status

**Documentation / planning only.** No merge. No push to production `main`. No runtime changes from this document.

This plan covers merging **only** the bounded C5a / r958 Calendar Birthday MM-DD Helpers stack into production `main`, after Rich’s explicit approval.

---

## 1. Current Verified State

| Item | Value |
|------|--------|
| Repo | `C:\Users\riche\Documents\outoftimeband` |
| Branch | `modularization-home-layout-engine-pilot` |
| HEAD | `8bc1676` |
| `origin/modularization-home-layout-engine-pilot` | `8bc1676` |
| `origin/main` | `d88fd60` |
| Working tree (before this untracked merge-plan doc) | Clean |
| Build Version | `2026-07-15-r958-calendar-birthday-helpers` |
| Runtime commit | `138cf62` |
| Checkpoint commit | `8bc1676` |

---

## 2. Exact C5a / r958 Commit Stack

### 2a. Two existing commits (current runtime + checkpoint stack)

| SHA | Message |
|-----|---------|
| `138cf62` | Extract Calendar birthday helpers |
| `8bc1676` | Document r958 Calendar birthday helpers |

| Role | SHA |
|------|-----|
| Runtime | `138cf62` |
| Checkpoint | `8bc1676` |

This is the **current** C5a runtime + checkpoint stack ending at `8bc1676`.

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

1. `138cf62` — Extract Calendar birthday helpers  
2. `8bc1676` — Document r958 Calendar birthday helpers  
3. **the merge-plan commit created after this document is committed**

**Fast-forward target:** HEAD after the merge-plan document is committed (not `8bc1676` alone, once the merge-plan commit exists).

`origin/main` must still be **`d88fd60`** at merge time.

Do **not** invent a SHA for the pending merge-plan commit. Do **not** include any other modularization WIP, backup branches, or unrelated commits.

---

## 3. Ancestry Confirmation

The modularization branch is a **direct descendant** of `origin/main` at `d88fd60`.

Expected ancestry (after the merge-plan commit exists):

```
d88fd60 (origin/main)
  → 138cf62   Extract Calendar birthday helpers
  → 8bc1676   Document r958 Calendar birthday helpers
  → <merge-plan commit created after this document is committed>  (FF target)
```

Pre-merge check (must pass before any fast-forward). Run **after** the merge-plan commit exists:

```powershell
git fetch origin
git rev-parse origin/main
# must print: d88fd60...

$ffTip = git rev-parse HEAD   # or the pilot tip after merge-plan is committed
# $ffTip must be the merge-plan commit created after this document is committed

git merge-base --is-ancestor d88fd60 $ffTip
# exit code 0 required

git log --oneline d88fd60..$ffTip
# must show exactly the two existing C5a commits plus the merge-plan commit:
#   138cf62, 8bc1676, and the post-merge-plan tip
```

Equivalent range: `d88fd60..<post-merge-plan HEAD>`.

**Stop** if `origin/main` is no longer `d88fd60`, or if ancestry / range checks fail.

---

## 4. Production Main Freeze

**`origin/main` must not move until Rich explicitly approves.**

- Do **not** merge to `main`.
- Do **not** push `main`.
- Do **not** force-push anything.
- Do **not** rebase or rewrite the C5a / r958 stack without a new approved plan.

This document does **not** authorize merge or push.

---

## 5. Pre-Merge Validation Gates

Re-run immediately before merge. Any failure is a **stop**.

```powershell
$node = "C:\Users\riche\AppData\Local\Programs\cursor\resources\app\resources\helpers\node.exe"
# Adjust $node path if this machine differs.

& $node tests/integrity/calendar-helpers-package.mjs
& $node tests/integrity/flyer-adapter-package.mjs
& $node tests/integrity/flyer-layer-helpers-package.mjs
& $node tests/integrity/flyer-manifest-package.mjs
```

Also required:

- **All inline scripts syntax** check — PASS (expect 8 scripts, 0 failures), same gate used for r958 local validation.

Expected: all four integrity packages **PASS**, and inline script syntax **PASS**.

---

## 6. Expected Files Introduced or Changed on Main

After a clean fast-forward of the full C5a / r958 stack (two existing commits plus the merge-plan commit), `main` should introduce or change **only**:

| File | Role |
|------|------|
| `index.html` | Birthday helper defs removed; r958 Build Version |
| `js/calendar-date-helpers.js` | Birthday helpers + namespace keys + legacy aliases |
| `tests/integrity/calendar-helpers-package.mjs` | Birthday export / no-inline-def integrity |
| `docs/modularization/PHASE_C5A_R958_CALENDAR_BIRTHDAY_HELPERS_CHECKPOINT.md` | Checkpoint doc |
| `docs/modularization/PHASE_C5A_R958_MERGE_TO_MAIN_PLAN.md` | This merge plan (present on tip after the merge-plan commit) |

No other runtime, asset, or test files should appear in the merge diff vs `d88fd60`.

---

## 7. Build Version After Merge

Expected Build Version on `main` after merge:

`2026-07-15-r958-calendar-birthday-helpers`

---

## 8. Protected Boundaries (Must Remain Untouched)

The merge must **not** change:

- Home band image CSS, layout, assets, or selectors
- r956 Home rehearsal proposal opener / `_r535OpenHomeRehearsal`
- r957 Calendar holiday helpers / holiday behavior
- Important Dates / Important Date collectors
- Calendar row collectors
- Next Up
- Drawers / navigation
- Proposals / Home cue behavior
- Flyer UI polish
- `Band.png` / `band.png` cleanup or case-collision handling

C5a is helpers-only: birthday matching remains **MM-DD** behavior; no timezone reinterpretation; no render-engine move; public Calendar render ownership (`rCal`, drawers) stays in `index.html`.

---

## 9. Merge Method Recommendation

1. **Inspect ancestry first** (Section 3).
2. Confirm `origin/main` is still **`d88fd60`**.
3. Confirm post-merge-plan HEAD is a **direct descendant** of `d88fd60` with exactly the two existing C5a commits plus that merge-plan commit.
4. **Fast-forward only** if both checks pass:

```powershell
git checkout main
$ffTip = git rev-parse modularization-home-layout-engine-pilot
# $ffTip must be HEAD after the merge-plan document is committed
git merge --ff-only $ffTip
```

5. **Stop** if:
   - `origin/main` has moved away from `d88fd60`, or
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
3. Confirm Build Version string is `2026-07-15-r958-calendar-birthday-helpers`.
4. Confirm `git log --oneline d88fd60..HEAD` shows exactly the two existing C5a commits plus the merge-plan commit (`138cf62`, `8bc1676`, and the post-merge-plan tip).
5. Confirm `git diff --name-only d88fd60..HEAD` matches the expected file list (Section 6).

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
| `origin/main` | same post-merge-plan tip (was `d88fd60` before the approved FF) |
| Build Version on deployed/served app | `2026-07-15-r958-calendar-birthday-helpers` |
| Unexpected files on `main` | None beyond Section 6 |

Do **not** force-push. Do **not** delete `modularization-home-layout-engine-pilot` unless separately approved.

---

## 12. Phone / PWA Verification Checklist

After deploy / hard refresh to r958:

- [ ] Confirm Build Version **r958** (`2026-07-15-r958-calendar-birthday-helpers`)
- [ ] Calendar loads
- [ ] Month navigation works
- [ ] Birthday marker/display works
- [ ] Home birthday banner works if a testable birthday exists
- [ ] Normal non-birthday date behaves normally
- [ ] Home rehearsal cue still works
- [ ] Home band image unchanged
- [ ] Flyer creation loads

Do **not** claim production verification until this checklist passes.

---

## 13. Rollback Reference

If r958 must be reverted after merge/push:

| Ref | Value |
|-----|--------|
| Safe rollback tip | `origin/main` @ **`d88fd60`** (pre-C5a production) |
| Meaning | State before the C5a / r958 stack (two existing commits + merge-plan commit) |

Rollback requires Rich’s explicit approval and a separate, auditable procedure. Prefer restoring `main` to `d88fd60` over ad-hoc file surgery.

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

Bounded fast-forward onto `main` at `d88fd60` of the two existing C5a commits (`138cf62` → `8bc1676`) **plus** the merge-plan commit created after this document is committed. Fast-forward target is that post-merge-plan HEAD — not `8bc1676` alone once the merge-plan commit exists. `origin/main` must still be `d88fd60` until Rich approves. Helpers-only birthday MM-DD extraction; protected Home/Flyer/Calendar/holiday/proposal boundaries untouched; rollback tip `d88fd60`.
