# Phase C9a / r962 — Merge to Main Plan

Date: 2026-07-16

## Status

**Documentation / planning only.** No merge. No push to production `main`. No runtime changes from this document.

This plan covers merging **only** the bounded C9a / r962 Calendar Important Date Collector stack into production `main`, after Rich’s explicit approval.

---

## 1. Current Verified State

| Item | Value |
|------|--------|
| Repo | `C:\Users\rescarcega\Documents\outoftimeband` |
| Branch | `modularization-home-layout-engine-pilot` |
| HEAD | `b1b00ac` |
| `origin/modularization-home-layout-engine-pilot` | `b1b00ac` |
| `origin/main` | `3904769` |
| Working tree (before this untracked merge-plan doc) | Clean |
| Build Version | `2026-07-16-r962-calendar-important-date-collector` |
| Runtime commit | `26c43e6` |
| Checkpoint commit | `b1b00ac` |

---

## 2. Exact C9a / r962 Commit Stack

### 2a. Two existing commits

| SHA | Message |
|-----|---------|
| `26c43e6` | Extract Calendar important date collector |
| `b1b00ac` | Document r962 Calendar important date collector |

| Role | SHA |
|------|-----|
| Runtime | `26c43e6` |
| Checkpoint | `b1b00ac` |

This is the current C9a runtime + checkpoint stack ending at `b1b00ac`.

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

1. `26c43e6` — Extract Calendar important date collector
2. `b1b00ac` — Document r962 Calendar important date collector
3. **the merge-plan commit created after this document is committed**

The fast-forward target is post-merge-plan HEAD, not `b1b00ac` once the merge-plan commit exists.

`origin/main` must still be **`3904769`** at merge time. Do not include unrelated commits or untracked local files.

---

## 3. Ancestry Confirmation

Expected ancestry after the merge-plan commit exists:

```text
3904769 (origin/main)
  → 26c43e6   Extract Calendar important date collector
  → b1b00ac   Document r962 Calendar important date collector
  → <merge-plan commit created after this document is committed>  (FF target)
```

Required pre-merge checks:

```powershell
git fetch origin
git rev-parse origin/main
# must print 3904769...

$ffTip = git rev-parse modularization-home-layout-engine-pilot
git merge-base --is-ancestor 3904769 $ffTip
# exit code 0 required

git log --oneline 3904769..$ffTip
# must show exactly 26c43e6, b1b00ac, and the post-merge-plan commit
```

**Stop** if `origin/main` has moved from `3904769`, the ancestry check fails, histories diverge, or the range contains unexpected commits.

---

## 4. Production Main Freeze

- Rich’s explicit approval is required before merge or push.
- Do not merge or push `main` based on this document alone.
- Do not force-push.
- Do not rebase or rewrite the C9a / r962 stack.
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
git diff --check 3904769..HEAD
```

Also required:

- All inline script syntax: **PASS — 8 scripts, 0 failures**
- `git diff --check`: **PASS**

Expected result: all four integrity packages, all inline scripts, and `git diff --check` pass.

---

## 6. Expected Files Entering Main

The fast-forward diff against `3904769` must contain only:

| File | Role |
|------|------|
| `index.html` | Removed inline collector; retained four zero-argument calls; r962 version/log |
| `js/calendar-date-helpers.js` | Injected collector, namespace export, legacy alias |
| `tests/integrity/calendar-helpers-package.mjs` | Collector wiring/export/behavior coverage |
| `docs/modularization/PHASE_C9A_R962_CALENDAR_IMPORTANT_DATE_COLLECTOR_CHECKPOINT.md` | Checkpoint |
| `docs/modularization/PHASE_C9A_R962_MERGE_TO_MAIN_PLAN.md` | This merge plan |

Stop if any other runtime, test, documentation, or asset file appears.

---

## 7. Build Version

Expected on `main` after merge:

`2026-07-16-r962-calendar-important-date-collector`

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
- `_calDisplayRows`, `_calRowsInMonth`, or `_calUpcomingRows`
- Calendar rendering, navigation, drawers, or proposals
- Important Date listeners or Firestore writes
- Home cues
- Flyer UI
- `Band.png` / `band.png`

C9a is collector-only. Iteration order, concatenation, one-time/recurring rows, malformed-entry handling, and no-mutation behavior remain unchanged.

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

- `origin/main` is not `3904769`
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
3. Re-run `git diff --check 3904769..HEAD`.
4. Confirm Build Version is `2026-07-16-r962-calendar-important-date-collector`.
5. Confirm `git log --oneline 3904769..HEAD` shows only the two existing commits plus the merge-plan commit.
6. Confirm `git diff --name-only 3904769..HEAD` matches Section 6 exactly.

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

- [ ] Build Version shows **r962**
- [ ] Calendar opens
- [ ] Month navigation works
- [ ] One-time Important Dates display correctly
- [ ] Recurring Important Dates display correctly
- [ ] Important Date ordering remains correct
- [ ] Malformed entries do not break Calendar
- [ ] Normal dates remain normal
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
| Safe rollback tip | `3904769` |
| Meaning | Production state before C9a / r962 |

Rollback requires Rich’s explicit approval and a separate auditable procedure. Prefer restoring `main` to `3904769` over ad-hoc file surgery.

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

Fast-forward only from `origin/main` at `3904769` to the future post-merge-plan tip containing `26c43e6`, `b1b00ac`, and one additional merge-plan commit whose SHA must not be invented. Validate the four integrity packages, all eight inline scripts, and `git diff --check`; verify the exact five-file merge set; preserve protected Calendar/Home/Flyer boundaries; use `3904769` as the rollback reference; and obtain Rich’s explicit approval before merge or push.
