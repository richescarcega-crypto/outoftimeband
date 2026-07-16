# Phase C4a / r957 — Merge to Main Plan

Date: 2026-07-15

## Status

**Documentation / planning only.** No merge. No push to production `main`. No runtime changes from this document.

This plan covers merging **only** the bounded C4a / r957 Calendar US Federal Holiday Helpers stack into production `main`, after Rich’s explicit approval.

**Documentation tip correction (this edit):** The merge-plan document was previously committed as `ab60fac` while still describing a three-commit stack ending at `ae21a2a`. That metadata was stale. This edit corrects documentation only. Runtime scope is unchanged. Rich’s approval gate applies to the production merge, not this documentation repair.

---

## 1. Current Verified Branch State

| Item | Value |
|------|--------|
| Repo | `C:\Users\riche\Documents\outoftimeband` |
| Branch | `modularization-home-layout-engine-pilot` |
| HEAD | `ab60fac` (before this documentation-correction edit) |
| `origin/modularization-home-layout-engine-pilot` | `ab60fac` |
| `origin/main` | `189cf29` |
| Working tree (before this documentation-correction edit) | Clean |
| Build Version | `2026-07-15-r957-calendar-holiday-helpers` |

Once this tip-correction edit is committed, HEAD will move to **the documentation-correction commit created after this edit**. That new tip becomes the fast-forward target. `origin/main` must remain **`189cf29`**.

---

## 2. Exact C4a / r957 Commit Stack

### 2a. Four existing commits (already on the pilot branch)

| SHA | Message |
|-----|---------|
| `24751c4` | Plan Calendar holiday helper extraction |
| `ce84ade` | Extract Calendar holiday helpers |
| `ae21a2a` | Document r957 Calendar holiday helpers |
| `ab60fac` | Plan r957 merge to main |

| Role | SHA |
|------|-----|
| Planning | `24751c4` |
| Runtime | `ce84ade` |
| Checkpoint | `ae21a2a` |
| Merge plan (prior tip) | `ab60fac` |

### 2b. Pending documentation-correction commit (this edit)

After Rich commits this tip-correction edit, the stack gains a fifth commit:

| SHA | Message (expected) |
|-----|---------------------|
| *(documentation-correction commit created after this edit)* | Correct merge-plan tip / stack metadata |

| Role | Ref |
|------|-----|
| Merge-plan tip correction | **HEAD after the merge-plan tip correction is committed** |

### 2c. Final fast-forward set

Merge **only** these five commits onto `main` (fast-forward), in order:

1. `24751c4` — Plan Calendar holiday helper extraction  
2. `ce84ade` — Extract Calendar holiday helpers  
3. `ae21a2a` — Document r957 Calendar holiday helpers  
4. `ab60fac` — Plan r957 merge to main  
5. **the documentation-correction commit created after this edit**

**Fast-forward target:** HEAD after the merge-plan tip correction is committed (not `ab60fac`, and not `ae21a2a`).

Do **not** invent a SHA for the pending correction commit. Resolve it with `git rev-parse HEAD` (or the pilot tip) after the correction is committed.

Do **not** include any other modularization WIP, backup branches, or unrelated commits.

Runtime scope remains unchanged; only documentation metadata is being corrected by this edit.

---

## 3. Ancestry Confirmation

The modularization branch (after the documentation-correction commit) is based **directly** on `origin/main` at `189cf29`.

Expected ancestry (after the tip correction is committed):

```
189cf29 (origin/main)
  → 24751c4
  → ce84ade
  → ae21a2a
  → ab60fac
  → <documentation-correction commit created after this edit>  (FF target / post-correction HEAD)
```

Pre-merge check (must pass before any fast-forward). Run **after** the documentation-correction commit exists:

```powershell
git fetch origin
git rev-parse origin/main
# must print: 189cf29...

$ffTip = git rev-parse HEAD   # or the pilot tip after tip correction is committed
# $ffTip must be the documentation-correction commit created after this edit

git merge-base --is-ancestor 189cf29 $ffTip
# exit code 0 required

git log --oneline 189cf29..$ffTip
# must show exactly the four existing C4a commits plus the documentation-correction commit:
#   24751c4, ce84ade, ae21a2a, ab60fac, and the post-correction tip
```

Equivalent range description: `189cf29..<post-correction HEAD>` (i.e. `189cf29..<documentation-correction commit created after this edit>`).

---

## 4. Production Main Freeze

**`origin/main` must not move until Rich explicitly approves.**

- Do **not** merge to `main`.
- Do **not** push `main`.
- Do **not** force-push anything.
- Do **not** rebase or rewrite the C4a / r957 stack without a new approved plan.

This document does **not** authorize merge or push.

Rich’s approval gate applies to the **production merge**, not this documentation repair.

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

- **All inline scripts syntax** check — PASS (expect 8 scripts, 0 failures), same gate used for r957 local validation.

Expected: all four integrity packages **PASS**, and inline script syntax **PASS**.

---

## 6. Expected Files Introduced or Changed on Main

After a clean fast-forward of the full C4a / r957 stack (four existing commits plus the documentation-correction commit), `main` should introduce or change **only**:

| File | Role |
|------|------|
| `index.html` | Holiday helper defs removed; `_pad` kept; r957 Build Version + What’s New |
| `js/calendar-date-helpers.js` | Holiday helpers + namespace keys + legacy aliases |
| `tests/integrity/calendar-helpers-package.mjs` | Holiday export / no-inline-def integrity |
| `docs/modularization/PHASE_C4_CALENDAR_HOLIDAY_HELPER_SEAM_PLAN.md` | Planning doc |
| `docs/modularization/PHASE_C4A_R957_CALENDAR_HOLIDAY_HELPERS_CHECKPOINT.md` | Checkpoint doc |
| `docs/modularization/PHASE_C4A_R957_MERGE_TO_MAIN_PLAN.md` | This merge plan (including tip-correction metadata) |

No other runtime, asset, or test files should appear in the merge diff vs `189cf29`.

---

## 7. Build Version After Merge

Expected Build Version on `main` after merge:

`2026-07-15-r957-calendar-holiday-helpers`

---

## 8. Protected Boundaries (Must Remain Untouched)

The merge must **not** change:

- Home band image CSS, layout, assets, or selectors
- r956 Home rehearsal proposal opener / `_r535OpenHomeRehearsal`
- Flyer UI polish
- `Band.png` / `band.png` cleanup or case-collision handling
- Birthday helpers / `members` dependents
- Important Date logic, listeners, `_customEntriesAsRows`, `getImportantDatesOn`
- Calendar row collectors, rendering (`rCal`), navigation, or drawers
- Proposals / Home cue behavior
- Firestore reads/writes, gig actions, rehearsal proposal actions
- Inline `_pad` removal from `index.html` (must remain)

C4a is helpers-only: exact-date US federal holiday lookup preserved; no weekend substitution; no observed-holiday behavior.

---

## 9. Merge Method Recommendation

1. **Inspect ancestry first** (Section 3).
2. Confirm `origin/main` is still **`189cf29`**.
3. Confirm post-correction HEAD (the documentation-correction commit created after this edit) is a **direct descendant** of `189cf29` with exactly the four existing C4a commits plus that documentation-correction commit.
4. **Fast-forward only** if both checks pass:

```powershell
git checkout main
$ffTip = git rev-parse modularization-home-layout-engine-pilot
# $ffTip must be HEAD after the merge-plan tip correction is committed
git merge --ff-only $ffTip
```

5. **Stop** if:
   - `origin/main` has moved away from `189cf29`, or
   - histories have diverged, or
   - `--ff-only` refuses, or
   - unexpected files appear in the merge set

Do **not** create a merge commit, rebase onto a moved `main`, or cherry-pick unless Rich approves a revised plan.

---

## 10. Post-Merge Validation Requirements

On `main` at the new tip (expected: **the documentation-correction commit created after this edit** / post-correction HEAD):

1. Re-run the four integrity packages (Section 5).
2. Re-run all inline scripts syntax check.
3. Confirm Build Version string is `2026-07-15-r957-calendar-holiday-helpers`.
4. Confirm `git log --oneline 189cf29..HEAD` shows exactly the four existing C4a commits plus the documentation-correction commit (`24751c4`, `ce84ade`, `ae21a2a`, `ab60fac`, and the post-correction tip).
5. Confirm `git diff --name-only 189cf29..HEAD` matches the expected file list (Section 6).

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
| Local `main` HEAD | the documentation-correction commit created after this edit (post-correction HEAD) |
| `origin/main` | same post-correction tip (was `189cf29` before the approved FF) |
| Build Version on deployed/served app | `2026-07-15-r957-calendar-holiday-helpers` |
| Unexpected files on `main` | None beyond Section 6 |

Do **not** force-push. Do **not** delete `modularization-home-layout-engine-pilot` unless separately approved.

---

## 12. Phone / PWA Verification Checklist

After deploy / hard refresh to r957:

- [ ] Confirm Build Version **r957** (`2026-07-15-r957-calendar-holiday-helpers`)
- [ ] Open Calendar
- [ ] Verify normal date navigation
- [ ] Verify **July 4** holiday display
- [ ] Verify **Thanksgiving** display
- [ ] Verify a normal **non-holiday** date
- [ ] Verify Home rehearsal cue still opens correctly (r956 opener preserved)
- [ ] Verify Home band image is unchanged
- [ ] Verify flyer creation still loads

Do **not** claim production verification until this checklist passes.

---

## 13. Rollback Reference

If r957 must be reverted after merge/push:

| Ref | Value |
|-----|--------|
| Safe rollback tip | `origin/main` @ **`189cf29`** (pre-C4a production) |
| Meaning | State before the C4a / r957 stack (four existing commits + documentation-correction commit) |

Rollback requires Rich’s explicit approval and a separate, auditable procedure. Prefer restoring `main` to `189cf29` over ad-hoc file surgery.

---

## 14. Explicit Approval Gate

**Do not merge or push `main` until Rich approves.**

| Action | Authorized by this doc? |
|--------|-------------------------|
| Create / edit this plan | Yes (docs only) |
| Commit this documentation tip correction | Yes (docs metadata only; not a production-merge approval) |
| Re-run local validation | Yes (read-only / test) |
| Merge to `main` | **No — Rich approval required** |
| Push `origin/main` | **No — Rich approval required** |
| Force-push / rewrite history | **No** |

Rich’s approval gate applies to the **production merge**, not this documentation repair.

---

## Summary

Bounded fast-forward onto `main` at `189cf29` of the four existing C4a commits (`24751c4` → `ce84ade` → `ae21a2a` → `ab60fac`) **plus** the documentation-correction commit created after this edit. Fast-forward target is that post-correction HEAD — not `ab60fac` and not `ae21a2a`. `origin/main` must still be `189cf29` until Rich approves. Runtime scope unchanged; only documentation metadata is corrected here. After integrity/syntax gates pass and Rich approves the production merge: helpers-only holiday extraction; protected Home/Flyer/Calendar/proposal boundaries untouched; rollback tip `189cf29`.
