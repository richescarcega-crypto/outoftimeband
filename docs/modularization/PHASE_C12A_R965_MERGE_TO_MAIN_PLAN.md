# Phase C12a / r965 — Merge to Main Plan

Date: 2026-07-17

## Status

**Documentation / planning only.** No merge. No push to production `main`. No runtime changes from this document.

This plan covers merging **only** the bounded C12a / r965 Calendar Display Rows Helper stack into production `main`, after Rich’s explicit approval.

**r965 extracts `_calDisplayRows` only and leaves `_customEntriesAsRows` and the All Events parallel composition unchanged.**

---

## 1. Current Verified State

| Item | Value |
|------|--------|
| Repo | `C:\Users\rescarcega\Documents\outoftimeband` |
| Source branch | `modularization-home-layout-engine-pilot` |
| Source HEAD | `7c392b2` |
| `origin/modularization-home-layout-engine-pilot` | `7c392b2` |
| Target branch | `main` |
| `origin/main` | `53a5438` |
| Working tree | Clean of tracked changes; only intentional local-only untracked files remain |
| Build Version | `2026-07-17-r965-calendar-display-rows-helper` |
| Runtime commit | `93f326c` |
| Checkpoint / documentation commit | `7c392b2` |

### Local-only files — do not touch, stage, commit, or merge

- `docs/modularization/PHASE_6W_A_REHEARSAL_CUE_PARITY_PLAN.md`
- `oot-local-server.ps1`

These files must remain untracked local-only before, during, and after the merge procedure.

---

## 2. Exact C12a / r965 Commit Stack

### 2a. Two existing commits

| SHA | Message |
|-----|---------|
| `93f326c` | Extract Calendar display rows helper |
| `7c392b2` | Document r965 Calendar display rows helper |

| Role | SHA |
|------|-----|
| Runtime | `93f326c` |
| Checkpoint | `7c392b2` |

This is the current C12a runtime + checkpoint stack ending at `7c392b2`.

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

1. `93f326c` — Extract Calendar display rows helper
2. `7c392b2` — Document r965 Calendar display rows helper
3. **the merge-plan commit created after this document is committed**

The fast-forward target is post-merge-plan HEAD, not `7c392b2` once the merge-plan commit exists.

`origin/main` must still be **`53a5438`** at merge time. Do not include unrelated commits or the local-only untracked files.

---

## 3. Ancestry Confirmation

Expected ancestry after the merge-plan commit exists:

```text
53a5438 (origin/main)
  → 93f326c   Extract Calendar display rows helper
  → 7c392b2   Document r965 Calendar display rows helper
  → <merge-plan commit created after this document is committed>  (FF target)
```

Required pre-merge checks:

```powershell
git fetch origin
git rev-parse origin/main
# must print 53a5438...

$ffTip = git rev-parse modularization-home-layout-engine-pilot
git merge-base --is-ancestor 53a5438 $ffTip
# exit code 0 required

git log --oneline 53a5438..$ffTip
# must show exactly 93f326c, 7c392b2, and the post-merge-plan commit
```

**Stop** if `origin/main` has moved from `53a5438`, the ancestry check fails, histories diverge, or the range contains unexpected commits.

---

## 4. Production Main Freeze

- Rich’s explicit approval is required before merge or push.
- Do not merge or push `main` based on this document alone.
- Do not force-push.
- Do not rebase or rewrite the C12a / r965 stack.
- Do not delete either branch.
- Do not stage, commit, or include the two local-only untracked files.

---

## 5. Pre-Merge Validation (Already Completed)

Already completed on the modularization branch before this plan:

| Check | Result |
|-------|--------|
| `tests/integrity/calendar-helpers-package.mjs` | PASS |
| Inline script syntax | PASS — 8 scripts, 0 failures |
| `git diff --check` | PASS |

Re-run immediately before merge. Any failure is a stop.

```powershell
$node = "C:\Users\rescarcega\AppData\Local\Programs\cursor\resources\app\resources\helpers\node.exe"

& $node tests/integrity/calendar-helpers-package.mjs
& $node tests/integrity/flyer-adapter-package.mjs
& $node tests/integrity/flyer-layer-helpers-package.mjs
& $node tests/integrity/flyer-manifest-package.mjs
git diff --check 53a5438..HEAD
```

Also required:

- All inline script syntax: **PASS — 8 scripts, 0 failures**
- `git diff --check`: **PASS**

Expected result: all four integrity packages, all inline scripts, and `git diff --check` pass.

---

## 6. Expected Files Entering Main

### Runtime scope

| File | Role |
|------|------|
| `index.html` | Removed inline `_calDisplayRows`; kept All Events parallel composition + `_calUpcomingRows(60)` caller; r965 version/log |
| `js/calendar-date-helpers.js` | Injected display-rows composer, namespace export, legacy alias |
| `tests/integrity/calendar-helpers-package.mjs` | Display-rows wiring/export/behavior coverage |

### Documentation

| File | Role |
|------|------|
| `docs/modularization/PHASE_C12A_R965_CALENDAR_DISPLAY_ROWS_HELPER_CHECKPOINT.md` | Checkpoint |
| `docs/modularization/PHASE_C12A_R965_MERGE_TO_MAIN_PLAN.md` | This merge plan |

The fast-forward diff against `53a5438` must contain only the five files above.

**Stop** if any other runtime, test, documentation, or asset file appears.

**Do not include:**

- `docs/modularization/PHASE_6W_A_REHEARSAL_CUE_PARITY_PLAN.md`
- `oot-local-server.ps1`

---

## 7. Build Version

Expected on `main` after merge:

`2026-07-17-r965-calendar-display-rows-helper`

---

## 8. Protected Boundaries

The merge must not change:

- Home band image CSS, layout, assets, or selectors
- Flyer UI
- Firestore listeners or writes
- Calendar grid, drawers, navigation, or proposals
- Important Date lookup / materializer / collector behavior (`_customEntriesAsRows` remains separate)
- Birthday-helper or holiday-helper APIs
- All Events parallel inline composition: `events.slice().concat(_customEntriesAsRows())`
- Live Next Up caller shape: `_calRenderStageSummary` → `_calUpcomingRows(60)[0]`
- `Band.png` / `band.png`

C12a / r965 is display-rows-composer-only. Event-before-custom ordering, shallow event copy, preserved object identity, preserved duplicates, null/empty → `[]`, and no-mutation behavior remain unchanged.

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

- `origin/main` is not `53a5438`
- ancestry checks fail
- histories diverge
- `--ff-only` refuses
- unexpected commits or files appear
- validation fails
- either local-only file was staged or committed

Do not create a merge commit, rebase, or cherry-pick without a revised, explicitly approved plan.

---

## 10. Post-Merge Validation Gates

Before pushing:

1. Re-run all four integrity packages.
2. Re-run all inline-script syntax checks.
3. Re-run `git diff --check 53a5438..HEAD`.
4. Confirm Build Version is `2026-07-17-r965-calendar-display-rows-helper`.
5. Confirm `git log --oneline 53a5438..HEAD` shows only the two existing commits plus the merge-plan commit.
6. Confirm `git diff --name-only 53a5438..HEAD` matches Section 6 exactly.
7. Confirm the two local-only files remain untracked and were not included.

Any failure means do not push.

---

## 11. Production Push Verification

Push only after Rich explicitly approves both merge and push:

```powershell
git push origin main
```

After push, confirm local `main`, `origin/main`, and the modularization branch point to the same post-merge-plan commit. Do not force-push or delete branches. Confirm the two local-only files remain untracked.

---

## 12. Phone / PWA Verification Checklist

After deploy / hard refresh:

- [ ] Build Version shows **r965**
- [ ] Calendar opens
- [ ] Month navigation works
- [ ] Next Up card still shows the next upcoming item
- [ ] Calendar rows and markers remain correct
- [ ] All Events still lists gigs and Important Dates together
- [ ] Important Dates remain correct
- [ ] Birthdays / holidays in upcoming remain correct
- [ ] Home rehearsal cue works
- [ ] Home band image is unchanged
- [ ] Flyer creation opens
- [ ] Rehearsal Proposals still work

Do not claim production verification until every applicable check passes.

---

## 13. Rollback Reference

| Ref | Value |
|-----|--------|
| Safe rollback tip | `53a5438` |
| Meaning | Production state before C12a / r965 |

Rollback requires Rich’s explicit approval and a separate auditable procedure. Prefer restoring `main` to `53a5438` over ad-hoc file surgery.

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
| Touch / stage local-only files | **No** |

---

## Summary

Fast-forward only from `origin/main` at `53a5438` to the future post-merge-plan tip containing `93f326c`, `7c392b2`, and one additional merge-plan commit whose SHA must not be invented. r965 extracts `_calDisplayRows` only and leaves `_customEntriesAsRows` and the All Events parallel composition unchanged. Validate the four integrity packages, all eight inline scripts, and `git diff --check`; verify the exact five-file merge set; protect both local-only untracked files; use `53a5438` as the rollback reference; and obtain Rich’s explicit approval before merge or push.
