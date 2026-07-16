# Phase C5a — r958 Calendar Birthday Helpers Checkpoint

Date: 2026-07-15

## Status

**C5a / r958 complete.** Fast-forwarded and pushed to production `main` at `264f8dc`. Local validation and phone/PWA verification passed. User confirmed: **"r958 passed"**.

| Item | Value |
|------|--------|
| Branch | `main` |
| HEAD | `264f8dc` |
| `origin/main` | `264f8dc` |
| `origin/modularization-home-layout-engine-pilot` | `264f8dc` |
| Working tree (before this verification update) | Clean |
| Build Version | `2026-07-15-r958-calendar-birthday-helpers` |
| Runtime commit | `138cf62` |
| Production tip (post-FF) | `264f8dc` |
| Safe rollback tip (pre-C5a) | `d88fd60` |

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

## Production Merge

r958 was **fast-forwarded and pushed** to production `main` at `264f8dc`.

After deployment, `main`, `origin/main`, and `origin/modularization-home-layout-engine-pilot` were aligned at `264f8dc`.

Safe rollback tip (pre-C5a production): `d88fd60`.

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

### Phone / PWA — PASS

User confirmed phone verification passed (`"r958 passed"`).

| Check | Result |
|-------|--------|
| Build Version r958 | PASS |
| Calendar opened | PASS |
| Month navigation worked | PASS |
| Birthday display/marker worked | PASS |
| Normal non-birthday behavior worked | PASS |
| Home rehearsal cue remained functional | PASS |
| Home band image remained unchanged | PASS |
| Flyer creation loaded | PASS |

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
| Branch | `main` |
| HEAD | `264f8dc` |
| `origin/main` | `264f8dc` |
| `origin/modularization-home-layout-engine-pilot` | `264f8dc` |
| Safe rollback tip (pre-C5a) | `d88fd60` |

Working tree was clean before this verification documentation update. `main`, `origin/main`, and the modularization branch are aligned at `264f8dc` after the approved fast-forward deploy.

---

## Next Recommended Step

1. Continue Calendar modularization planning for the next safe helpers seam (post-C5a).
2. Keep protected Home / Flyer / proposal / render boundaries untouched unless a later approved plan says otherwise.
3. If r958 must be reverted: restore production `main` to safe rollback tip `d88fd60` (separate, auditable procedure; Rich approval required).
