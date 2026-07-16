# Phase C4a / r957 — Merge to Main Plan

Date: 2026-07-15

## Status

**Documentation / planning only.** No merge. No push to production `main`. No runtime changes from this document.

This plan covers merging **only** the bounded C4a / r957 Calendar US Federal Holiday Helpers stack into production `main`, after Rich’s explicit approval.

---

## 1. Current Verified Branch State

| Item | Value |
|------|--------|
| Repo | `C:\Users\riche\Documents\outoftimeband` |
| Branch | `modularization-home-layout-engine-pilot` |
| HEAD | `ae21a2a` |
| `origin/modularization-home-layout-engine-pilot` | `ae21a2a` |
| `origin/main` | `189cf29` |
| Working tree (before this untracked merge-plan doc) | Clean |
| Build Version | `2026-07-15-r957-calendar-holiday-helpers` |

---

## 2. Exact Three-Commit Stack (C4a / r957 only)

Merge **only** these three commits, in order:

| SHA | Message |
|-----|---------|
| `24751c4` | Plan Calendar holiday helper extraction |
| `ce84ade` | Extract Calendar holiday helpers |
| `ae21a2a` | Document r957 Calendar holiday helpers |

| Role | SHA |
|------|-----|
| Planning | `24751c4` |
| Runtime | `ce84ade` |
| Checkpoint | `ae21a2a` (HEAD) |

Do **not** include any other modularization WIP, backup branches, or unrelated commits.

---

## 3. Ancestry Confirmation

The modularization branch tip `ae21a2a` is based **directly** on `origin/main` at `189cf29`.

Expected ancestry:

```
189cf29 (origin/main) → 24751c4 → ce84ade → ae21a2a (HEAD / origin pilot)
```

Pre-merge check (must pass before any fast-forward):

```powershell
git fetch origin
git rev-parse origin/main
# must print: 189cf29...

git merge-base --is-ancestor 189cf29 ae21a2a
# exit code 0 required

git log --oneline 189cf29..ae21a2a
# must show exactly the three commits above
```

---

## 4. Production Main Freeze

**`origin/main` must not move until Rich explicitly approves.**

- Do **not** merge to `main`.
- Do **not** push `main`.
- Do **not** force-push anything.
- Do **not** rebase or rewrite the three-commit stack without a new approved plan.

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

- **All inline scripts syntax** check — PASS (expect 8 scripts, 0 failures), same gate used for r957 local validation.

Expected: all four integrity packages **PASS**, and inline script syntax **PASS**.

---

## 6. Expected Files Introduced or Changed on Main

After a clean fast-forward of the three-commit stack, `main` should introduce or change **only**:

| File | Role |
|------|------|
| `index.html` | Holiday helper defs removed; `_pad` kept; r957 Build Version + What’s New |
| `js/calendar-date-helpers.js` | Holiday helpers + namespace keys + legacy aliases |
| `tests/integrity/calendar-helpers-package.mjs` | Holiday export / no-inline-def integrity |
| `docs/modularization/PHASE_C4_CALENDAR_HOLIDAY_HELPER_SEAM_PLAN.md` | Planning doc |
| `docs/modularization/PHASE_C4A_R957_CALENDAR_HOLIDAY_HELPERS_CHECKPOINT.md` | Checkpoint doc |
| `docs/modularization/PHASE_C4A_R957_MERGE_TO_MAIN_PLAN.md` | This merge plan |

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
3. Confirm `ae21a2a` is a **direct descendant** of `189cf29` with exactly the three C4a commits.
4. **Fast-forward only** if both checks pass:

```powershell
git checkout main
git merge --ff-only ae21a2a
```

5. **Stop** if:
   - `origin/main` has moved away from `189cf29`, or
   - histories have diverged, or
   - `--ff-only` refuses, or
   - unexpected files appear in the merge set

Do **not** create a merge commit, rebase onto a moved `main`, or cherry-pick unless Rich approves a revised plan.

---

## 10. Post-Merge Validation Requirements

On `main` at the new tip (expected `ae21a2a`):

1. Re-run the four integrity packages (Section 5).
2. Re-run all inline scripts syntax check.
3. Confirm Build Version string is `2026-07-15-r957-calendar-holiday-helpers`.
4. Confirm `git log --oneline 189cf29..HEAD` shows exactly the three C4a commits.
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
| Local `main` HEAD | `ae21a2a` |
| `origin/main` | `ae21a2a` |
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
| Meaning | State before the three-commit C4a / r957 stack |

Rollback requires Rich’s explicit approval and a separate, auditable procedure. Prefer restoring `main` to `189cf29` over ad-hoc file surgery.

---

## 14. Explicit Approval Gate

**Do not merge or push `main` until Rich approves.**

| Action | Authorized by this doc? |
|--------|-------------------------|
| Create / edit this plan | Yes (docs only) |
| Re-run local validation | Yes (read-only / test) |
| Merge to `main` | **No — Rich approval required** |
| Push `origin/main` | **No — Rich approval required** |
| Force-push / rewrite history | **No** |

---

## Summary

Bounded fast-forward of three commits (`24751c4` → `ce84ade` → `ae21a2a`) from `modularization-home-layout-engine-pilot` onto `main` at `189cf29`, after integrity/syntax gates pass and Rich approves. Helpers-only holiday extraction; protected Home/Flyer/Calendar/proposal boundaries untouched; rollback tip `189cf29`.
