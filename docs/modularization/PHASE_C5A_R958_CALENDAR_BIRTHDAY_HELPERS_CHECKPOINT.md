# Phase C5a — r958 Calendar Birthday Helpers Checkpoint

Date: 2026-07-15

## Status

**C5a / r958 runtime complete on modularization branch.** Local integrity validation PASS. Phone/PWA verification **PENDING**. Not merged to production `main`.

| Item | Value |
|------|--------|
| Branch | `modularization-home-layout-engine-pilot` |
| HEAD | `138cf62` |
| `origin/modularization-home-layout-engine-pilot` | `138cf62` |
| `origin/main` | `d88fd60` |
| Working tree (before this untracked doc) | Clean |
| Build Version | `2026-07-15-r958-calendar-birthday-helpers` |
| Runtime commit | `138cf62` |

---

## Purpose and Approved Scope

**C5a / r958 — Calendar Birthday MM-DD Helpers Extraction.**

Extract pure birthday MM-DD helpers from `index.html` into the existing Calendar helpers module, preserving call sites, render ownership, and MM-DD birthday behavior. Bounded helpers-only seam: no drawers, Firestore, holiday rework, Important Date collectors, Home cues, Flyer polish, or band-image work.

---

## Runtime Commit

| Item | Value |
|------|--------|
| Runtime commit | `138cf62` |
| Build Version | `2026-07-15-r958-calendar-birthday-helpers` |

---

## Files Changed

| File | Role |
|------|------|
| `index.html` | Removed birthday helper defs; r958 Build Version |
| `js/calendar-date-helpers.js` | Extended with birthday helpers + namespace keys + legacy aliases |
| `tests/integrity/calendar-helpers-package.mjs` | Extended Calendar helper integrity gate for birthday exports / no-inline defs |

---

## Functions Extracted

Moved out of `index.html` into `js/calendar-date-helpers.js`:

- `isBirthdayToday`
- `isBirthdayOnDate`
- `getMembersBornOn`

---

## MM-DD Behavior Preservation

- Birthday matching remains **MM-DD** behavior only (month/day, year-agnostic).
- No timezone reinterpretation or full-date equality changes.
- Pre-C5a MM-DD semantics preserved for today / on-date / members-born-on paths.

---

## Explicit Members-List Injection

- `getMembersBornOn(ds, membersList)` takes an explicit `membersList` argument.
- Callers inject the members list; the helper does not own member loading or render.

---

## `window.members` One-Argument Compatibility Path

- One-argument call path remains compatible via `window.members` when a members list is not passed explicitly.
- Existing call sites that relied on the prior one-arg shape continue to work.

---

## Namespace Exports

Extended `window.OOT_CALENDAR_HELPERS` with:

- `birthdayToday` / `isBirthdayToday`
- `birthdayOnDate` / `isBirthdayOnDate`
- `membersBornOn` / `getMembersBornOn`

---

## Legacy Aliases

Preserved so existing `index.html` call sites continue to work:

- `window.isBirthdayToday` (alias alongside namespace `birthdayToday` / `isBirthdayToday`)
- `window.isBirthdayOnDate` (alias alongside namespace `birthdayOnDate` / `isBirthdayOnDate`)
- `window.getMembersBornOn` (alias alongside namespace `membersBornOn` / `getMembersBornOn`)

---

## Call Sites and Render Ownership

- Existing `index.html` call sites for birthday helpers remain unchanged in ownership and usage pattern.
- Public Calendar **render** ownership (`rCal`, drawers, row collectors) remains in `index.html`.
- No render-engine move; helpers only.

---

## Build Version

`2026-07-15-r958-calendar-birthday-helpers`

---

## Validation Completed

### Local (Node) — PASS

| Check | Result |
|-------|--------|
| `tests/integrity/calendar-helpers-package.mjs` | PASS |
| `tests/integrity/flyer-adapter-package.mjs` | PASS |
| `tests/integrity/flyer-layer-helpers-package.mjs` | PASS |
| `tests/integrity/flyer-manifest-package.mjs` | PASS |
| Inline script syntax check | PASS — 8 scripts, 0 failures |

### Phone / PWA — PENDING

Do **not** claim production verification. Phone/PWA checks remain outstanding before any production merge approval.

---

## Protected Boundaries Not Touched

- No Home band image CSS, layout, assets, or selector changes
- No r956 opener / `_r535OpenHomeRehearsal` changes
- No r957 holiday helper rework
- No Important Dates / Important Date collectors changes
- No row collectors changes
- No Next Up changes
- No drawers / nav changes
- No proposals / Home cue behavior changes
- No Flyer UI polish
- No Band.png / band.png cleanup
- Preserved `window.OOT_CALENDAR_HELPERS` (extend only)
- Public Calendar render ownership (`rCal`, drawers) stayed in `index.html`
- No production-`main` force push or unapproved merge

---

## Current Branch State

| Ref | Value |
|-----|--------|
| Branch | `modularization-home-layout-engine-pilot` |
| HEAD | `138cf62` |
| `origin/modularization-home-layout-engine-pilot` | `138cf62` |
| `origin/main` | `d88fd60` |

Working tree was clean before this untracked checkpoint document. Modularization branch and its origin tip are aligned at `138cf62`. Production `origin/main` remains at `d88fd60` (r958 not merged).

---

## Next Recommended Step

1. Commit and push this checkpoint document on `modularization-home-layout-engine-pilot`.
2. Plan a bounded fast-forward merge only after phone/PWA verification and Rich approval.
3. Do **not** merge or push production `main` without Rich approval.
