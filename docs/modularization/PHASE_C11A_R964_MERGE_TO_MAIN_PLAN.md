# Phase C11a / r964 — Merge to Main Plan

Date: 2026-07-17

## Status

**Documentation / planning only.** No merge. No push to production `main`. No runtime changes from this document.

This plan covers merging **only** the bounded C11a / r964 Calendar Upcoming Rows Helper stack into production `main`, after Rich’s explicit approval.

**r964 extracts `_calUpcomingRows` only and leaves `_calDisplayRows` inline.**

---

## 1. Current Verified State

| Item | Value |
|------|--------|
| Repo | `C:\Users\rescarcega\Documents\outoftimeband` |
| Source branch | `modularization-home-layout-engine-pilot` |
| Source HEAD | `3d91e4a` |
| `origin/modularization-home-layout-engine-pilot` | `3d91e4a` |
| Target branch | `main` |
| `origin/main` | `c11b9c2` |
| Working tree | Clean of tracked changes; only intentional local-only untracked files remain |
| Build Version | `2026-07-17-r964-calendar-upcoming-rows-helper` |
| Runtime commit | `a4fb1a4` |
| Checkpoint / documentation commit | `3d91e4a` |

### Local-only files — do not touch, stage, commit, or merge

- `docs/modularization/PHASE_6W_A_REHEARSAL_CUE_PARITY_PLAN.md`
- `oot-local-server.ps1`

These files must remain untracked local-only before, during, and after the merge procedure.

---

## 2. Exact C11a / r964 Commit Stack

### 2a. Two existing commits

| SHA | Message |
|-----|---------|
| `a4fb1a4` | Extract Calendar upcoming rows helper |
| `3d91e4a` | Document r964 Calendar upcoming rows helper |

| Role | SHA |
|------|-----|
| Runtime | `a4fb1a4` |
| Checkpoint | `3d91e4a` |

This is the current C11a runtime + checkpoint stack ending at `3d91e4a`.

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

1. `a4fb1a4` — Extract Calendar upcoming rows helper
2. `3d91e4a` — Document r964 Calendar upcoming rows helper
3. **the merge-plan commit created after this document is committed**

The fast-forward target is post-merge-plan HEAD, not `3d91e4a` once the merge-plan commit exists.

`origin/main` must still be **`c11b9c2`** at merge time. Do not include unrelated commits or the local-only untracked files.

---

## 3. Ancestry Confirmation

Expected ancestry after the merge-plan commit exists:

```text
c11b9c2 (origin/main)
  → a4fb1a4   Extract Calendar upcoming rows helper
  → 3d91e4a   Document r964 Calendar upcoming rows helper
  → <merge-plan commit created after this document is committed>  (FF target)
```

Required pre-merge checks:

```powershell
git fetch origin
git rev-parse origin/main
# must print c11b9c2...

$ffTip = git rev-parse modularization-home-layout-engine-pilot
git merge-base --is-ancestor c11b9c2 $ffTip
# exit code 0 required

git log --oneline c11b9c2..$ffTip
# must show exactly a4fb1a4, 3d91e4a, and the post-merge-plan commit
```

**Stop** if `origin/main` has moved from `c11b9c2`, the ancestry check fails, histories diverge, or the range contains unexpected commits.

---

## 4. Production Main Freeze

- Rich’s explicit approval is required before merge or push.
- Do not merge or push `main` based on this document alone.
- Do not force-push.
- Do not rebase or rewrite the C11a / r964 stack.
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
git diff --check c11b9c2..HEAD
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
| `index.html` | Removed inline `_calUpcomingRows`; kept `_calDisplayRows` + `_calUpcomingRows(60)` caller; r964 version/log |
| `js/calendar-date-helpers.js` | Injected upcoming collector, namespace export, legacy alias |
| `tests/integrity/calendar-helpers-package.mjs` | Upcoming-rows wiring/export/behavior coverage |

### Documentation

| File | Role |
|------|------|
| `docs/modularization/PHASE_C11A_R964_CALENDAR_UPCOMING_ROWS_HELPER_CHECKPOINT.md` | Checkpoint |
| `docs/modularization/PHASE_C11A_R964_MERGE_TO_MAIN_PLAN.md` | This merge plan |

The fast-forward diff against `c11b9c2` must contain only the five files above.

**Stop** if any other runtime, test, documentation, or asset file appears.

**Do not include:**

- `docs/modularization/PHASE_6W_A_REHEARSAL_CUE_PARITY_PLAN.md`
- `oot-local-server.ps1`

---

## 7. Build Version

Expected on `main` after merge:

`2026-07-17-r964-calendar-upcoming-rows-helper`

---

## 8. Protected Boundaries

The merge must not change:

- Home band image CSS, layout, assets, or selectors
- Flyer UI
- Firestore listeners or writes
- Calendar grid, drawers, navigation, or proposals
- Important Date lookup / materializer / collector behavior
- Birthday-helper or holiday-helper APIs (upcoming collector only reuses them)
- Inline `_calDisplayRows` (must remain in `index.html`)
- Live Next Up caller shape: `_calRenderStageSummary` → `_calUpcomingRows(60)[0]`
- `Band.png` / `band.png`

C11a / r964 is upcoming-rows-collector-only. Default 14-day window, local-midnight normalization, inclusive bounds, birthday/holiday injection, first-name birthday titles, date-only sort, `+86400000` day stepping, and no-mutation behavior remain unchanged.

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

- `origin/main` is not `c11b9c2`
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
3. Re-run `git diff --check c11b9c2..HEAD`.
4. Confirm Build Version is `2026-07-17-r964-calendar-upcoming-rows-helper`.
5. Confirm `git log --oneline c11b9c2..HEAD` shows only the two existing commits plus the merge-plan commit.
6. Confirm `git diff --name-only c11b9c2..HEAD` matches Section 6 exactly.
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

- [ ] Build Version shows **r964**
- [ ] Calendar opens
- [ ] Month navigation works
- [ ] Next Up card still shows the next upcoming item
- [ ] Upcoming filtering remains correct (including 60-day Next Up path)
- [ ] Birthday injection in upcoming / Next Up remains correct
- [ ] Holiday injection in upcoming / Next Up remains correct
- [ ] Month-boundary and normal dates remain correct
- [ ] Important Dates remain correct
- [ ] Home rehearsal cue works
- [ ] Home band image is unchanged
- [ ] Flyer creation opens

Do not claim production verification until every applicable check passes.

---

## 13. Rollback Reference

| Ref | Value |
|-----|--------|
| Safe rollback tip | `c11b9c2` |
| Meaning | Production state before C11a / r964 |

Rollback requires Rich’s explicit approval and a separate auditable procedure. Prefer restoring `main` to `c11b9c2` over ad-hoc file surgery.

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

Fast-forward only from `origin/main` at `c11b9c2` to the future post-merge-plan tip containing `a4fb1a4`, `3d91e4a`, and one additional merge-plan commit whose SHA must not be invented. r964 extracts `_calUpcomingRows` only and leaves `_calDisplayRows` inline. Validate the four integrity packages, all eight inline scripts, and `git diff --check`; verify the exact five-file merge set; protect both local-only untracked files; use `c11b9c2` as the rollback reference; and obtain Rich’s explicit approval before merge or push.
