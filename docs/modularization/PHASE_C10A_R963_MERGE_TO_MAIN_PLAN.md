# Phase C10a / r963 — Merge to Main Plan

Date: 2026-07-16

## Status

**Documentation / planning only.** No merge. No push to production `main`. No runtime changes from this document.

This plan covers merging **only** the bounded C10a / r963 Calendar Month Rows Helper stack into production `main`, after Rich’s explicit approval.

---

## 1. Current Verified State

| Item | Value |
|------|--------|
| Repo | `C:\Users\rescarcega\Documents\outoftimeband` |
| Branch | `modularization-home-layout-engine-pilot` |
| HEAD | `784502b` |
| `origin/modularization-home-layout-engine-pilot` | `784502b` |
| `origin/main` | `cdc92a2` |
| Working tree (before this untracked merge-plan doc) | Clean of tracked changes |
| Build Version | `2026-07-16-r963-calendar-month-rows-helper` |
| Runtime commit | `cb9fbfe` |
| Checkpoint commit | `784502b` |

---

## 2. Exact C10a / r963 Commit Stack

### 2a. Two existing commits

| SHA | Message |
|-----|---------|
| `cb9fbfe` | Extract Calendar month rows helper |
| `784502b` | Document r963 Calendar month rows helper |

| Role | SHA |
|------|-----|
| Runtime | `cb9fbfe` |
| Checkpoint | `784502b` |

This is the current C10a runtime + checkpoint stack ending at `784502b`.

### 2b. Pending merge-plan commit

This merge-plan document is currently uncommitted. Committing it on `modularization-home-layout-engine-pilot` will add one additional commit and make that commit the fast-forward tip. **Do not invent its future SHA.** Resolve it after commit with:

```powershell
git rev-parse HEAD
```

| Role | Ref |
|------|-----|
| Merge plan | **HEAD after this merge-plan document is committed** |

### 2c. Final fast-forward set

Merge only these commits onto `main`, in order:

1. `cb9fbfe` — Extract Calendar month rows helper
2. `784502b` — Document r963 Calendar month rows helper
3. **the merge-plan commit created after this document is committed**

The fast-forward target is post-merge-plan HEAD, not `784502b` once the merge-plan commit exists.

`origin/main` must still be **`cdc92a2`** at merge time. Do not include unrelated commits or untracked local files.

---

## 3. Ancestry Confirmation

Expected ancestry after the merge-plan commit exists:

```text
cdc92a2 (origin/main)
  → cb9fbfe   Extract Calendar month rows helper
  → 784502b   Document r963 Calendar month rows helper
  → <merge-plan commit created after this document is committed>  (FF target)
```

Required pre-merge checks:

```powershell
git fetch origin
git rev-parse origin/main
# must print cdc92a2...

$ffTip = git rev-parse modularization-home-layout-engine-pilot
git merge-base --is-ancestor cdc92a2 $ffTip
# exit code 0 required

git log --oneline cdc92a2..$ffTip
# must show exactly cb9fbfe, 784502b, and the post-merge-plan commit
```

**Stop** if `origin/main` has moved from `cdc92a2`, the ancestry check fails, histories diverge, or the range contains unexpected commits.

---

## 4. Production Main Freeze

- Rich’s explicit approval is required before merge or push.
- Do not merge or push `main` based on this document alone.
- Do not force-push.
- Do not rebase or rewrite the C10a / r963 stack.
- Do not delete either branch.

---

## 5. Required Validation

Re-run immediately before merge. Any failure is a stop.

```powershell
$node = "C:\Users\rescarcega\AppData\Local\Programs\cursor\resources\app\resources\helpers\node.exe"

& $node tests/integrity/calendar-helpers-package.mjs
& $node tests/integrity/flyer-adapter-package.mjs
& $node tests/integrity/flyer-layer-helpers-package.mjs
& $node tests/integrity/flyer-manifest-package.mjs
git diff --check cdc92a2..HEAD
```

Also required:

- All inline script syntax: **PASS — 8 scripts, 0 failures**
- `git diff --check`: **PASS**

Expected result: all four integrity packages, all inline scripts, and `git diff --check` pass.

---

## 6. Expected Files Entering Main

The fast-forward diff against `cdc92a2` must contain only:

| File | Role |
|------|------|
| `index.html` | Removed inline `_calRowsInMonth`; r963 version/log |
| `js/calendar-date-helpers.js` | Injected month filter, namespace export, legacy alias |
| `tests/integrity/calendar-helpers-package.mjs` | Month-rows wiring/export/behavior coverage |
| `docs/modularization/PHASE_C10A_R963_CALENDAR_MONTH_ROWS_HELPER_CHECKPOINT.md` | Checkpoint |
| `docs/modularization/PHASE_C10A_R963_MERGE_TO_MAIN_PLAN.md` | This merge plan |

Stop if any other runtime, test, documentation, or asset file appears.

---

## 7. Build Version

Expected on `main` after merge:

`2026-07-16-r963-calendar-month-rows-helper`

---

## 8. Protected Boundaries

The merge must not change:

- Home band image CSS, layout, assets, or selectors
- r956 Home rehearsal proposal opener
- r957 federal-holiday helpers or behavior
- r958 birthday helpers or behavior
- r959 Important Date lookup behavior
- r960 Next Up behavior
- r961 `_calCustomEntryRows` behavior
- r962 `_customEntriesAsRows` behavior
- Inline `_calDisplayRows` or `_calUpcomingRows` (remain in `index.html`)
- Calendar rendering, navigation, drawers, or proposals
- Important Date listeners or Firestore writes
- Home cues
- Flyer UI
- `Band.png` / `band.png`

C10a is month-rows-filter-only. Month start/end bounds, inclusive start and inclusive final-day filtering, original row order, leap-year February behavior, null/undefined → `[]`, and no-mutation behavior remain unchanged.

---

## 9. Fast-Forward-Only Merge Procedure

After Rich approves:

```powershell
git fetch origin
git checkout main
$ffTip = git rev-parse modularization-home-layout-engine-pilot
git merge --ff-only $ffTip
```

`git merge --ff-only` must succeed. Stop if:

- `origin/main` is not `cdc92a2`
- ancestry checks fail
- histories diverge
- `--ff-only` refuses
- unexpected commits or files appear
- validation fails

Do not create a merge commit, rebase, or cherry-pick without a revised, explicitly approved plan.

---

## 10. Post-Merge Validation

Before pushing:

1. Re-run all four integrity packages.
2. Re-run all inline-script syntax checks.
3. Re-run `git diff --check cdc92a2..HEAD`.
4. Confirm Build Version is `2026-07-16-r963-calendar-month-rows-helper`.
5. Confirm `git log --oneline cdc92a2..HEAD` shows only the two existing commits plus the merge-plan commit.
6. Confirm `git diff --name-only cdc92a2..HEAD` matches Section 6 exactly.

Any failure means do not push.

---

## 11. Push Verification

Push only after Rich explicitly approves both merge and push:

```powershell
git push origin main
```

After push, confirm local `main`, `origin/main`, and the modularization branch point to the same post-merge-plan commit. Do not force-push or delete branches.

---

## 12. Phone / PWA Verification Checklist

After deploy / hard refresh:

- [ ] Build Version shows **r963**
- [ ] Calendar opens
- [ ] Month navigation works
- [ ] Current month rows remain correct
- [ ] Month boundary dates behave correctly
- [ ] February and leap-year dates behave correctly
- [ ] Normal dates remain normal
- [ ] Upcoming rows remain correct
- [ ] Important Dates remain correct
- [ ] Next Up remains correct
- [ ] Birthdays remain correct
- [ ] Holidays remain correct
- [ ] Home rehearsal cue works
- [ ] Home band image is unchanged
- [ ] Flyer creation opens

Do not claim production verification until every applicable check passes.

---

## 13. Rollback Reference

| Ref | Value |
|-----|--------|
| Safe rollback tip | `cdc92a2` |
| Meaning | Production state before C10a / r963 |

Rollback requires Rich’s explicit approval and a separate auditable procedure. Prefer restoring `main` to `cdc92a2` over ad-hoc file surgery.

---

## 14. Explicit Approval Gate

| Action | Authorized now? |
|--------|-----------------|
| Create this documentation plan | Yes |
| Commit this plan on the pilot branch | Documentation only; not production authorization |
| Re-run validation | Yes |
| Merge to `main` | **No — Rich approval required** |
| Push `origin/main` | **No — Rich approval required** |
| Force-push / rewrite history | **No** |

---

## Summary

Fast-forward only from `origin/main` at `cdc92a2` to the future post-merge-plan tip containing `cb9fbfe`, `784502b`, and one additional merge-plan commit whose SHA must not be invented. Validate the four integrity packages, all eight inline scripts, and `git diff --check`; verify the exact five-file merge set; preserve protected Calendar/Home/Flyer boundaries; use `cdc92a2` as the rollback reference; and obtain Rich’s explicit approval before merge or push.
