# Phase C6a — r959 Calendar Important Date Helper Checkpoint

Date: 2026-07-16

## Status

**C6a / r959 complete.** Fast-forwarded and pushed to production `main` at `33b21a7`. Local validation and phone/PWA verification passed. User confirmed: **"r959 passed"**.

| Item | Value |
|------|--------|
| Branch | `main` |
| HEAD | `33b21a7` |
| `origin/main` | `33b21a7` |
| `origin/modularization-home-layout-engine-pilot` | `33b21a7` |
| Build Version | `2026-07-15-r959-calendar-important-date-helpers` |
| Runtime commit | `9e6bd75` — `Extract Calendar important date helper` |
| Production tip (post-FF) | `33b21a7` |
| Safe rollback tip (pre-C6a) | `3d2b462` |
| Production merge | **PASS** |
| Phone / PWA verification | **PASS** |

---

## Purpose and Bounded Scope

**C6a / r959 — Calendar Important Date Helper Extraction.**

Extract only `getImportantDatesOn` from `index.html` into the existing Calendar helpers module, preserving call sites, render ownership, and Important Date day-filter behavior. Bounded helpers-only seam: no Important Date UI, listeners, collectors, drawers, Firestore writes, birthday/holiday rework, Home cues, Flyer polish, or band-image work.

---

## Runtime Commit

| Item | Value |
|------|--------|
| Runtime commit | `9e6bd75` |
| Message | `Extract Calendar important date helper` |
| Build Version | `2026-07-15-r959-calendar-important-date-helpers` |

---

## Production Merge

**PASS.** r959 was **fast-forwarded and pushed** to production `main` at `33b21a7`.

After deployment, `main`, `origin/main`, and `origin/modularization-home-layout-engine-pilot` were aligned at `33b21a7`.

Safe rollback tip (pre-C6a production): `3d2b462`.

---

## Files Changed (Runtime Commit)

| File | Role |
|------|------|
| `index.html` | Removed inline `getImportantDatesOn` definition; r959 Build Version + What's New |
| `js/calendar-date-helpers.js` | Extended with Important Date helper + namespace keys + legacy alias |
| `tests/integrity/calendar-helpers-package.mjs` | Extended Calendar helper integrity gate for Important Date exports / no-inline def |

---

## Function Extracted

Moved out of `index.html` into `js/calendar-date-helpers.js`:

- `getImportantDatesOn(ds, importantDatesList)`

Original inline `index.html` definition removed. Existing call sites left unchanged (still one-argument `getImportantDatesOn(ds)` via the legacy alias).

---

## Explicit Important Date List Injection

- Module signature accepts an explicit `importantDatesList` argument.
- Callers inject the Important Date list; the helper does not own loading, listeners, collectors, or render.

---

## `window.importantDates` One-Argument Compatibility Path

- Legacy one-argument path preserved:
  - `window.getImportantDatesOn(ds)` calls the module helper using `window.importantDates`
- Existing `index.html` call sites that relied on the prior one-arg shape continue to work unchanged.

---

## Namespace Exports

Extended `window.OOT_CALENDAR_HELPERS` with:

- `importantDatesOn`
- `getImportantDatesOn`

---

## Legacy Alias

Preserved so existing `index.html` call sites continue to work:

- `window.getImportantDatesOn(ds)` → `OOT_CALENDAR_HELPERS.getImportantDatesOn(ds, window.importantDates)`

---

## Behavior Preservation

- **Exact-date matching** for non-recurring Important Dates preserved.
- **Recurring MM-DD matching** preserved (including recurring stored as `MM-DD` or `YYYY-MM-DD`).
- **Original ordering** preserved (filter order only; no sort).
- **Malformed / missing-value behavior** preserved (empty list for missing/malformed `ds`; skip entries without usable `date`).
- **No mutation** of the supplied Important Date list.
- **No** sorting, timezone, locale, cleanup, or recurrence-policy changes.

---

## Call Sites and Render Ownership

- Existing `index.html` call sites for `getImportantDatesOn(ds)` remain unchanged in ownership and usage pattern.
- Public Calendar **render** ownership (`rCal`, drawers, row collectors, Important Date modal/list) remains in `index.html`.
- No render-engine move; helpers only.

---

## Build Version

`2026-07-15-r959-calendar-important-date-helpers`

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

User confirmed phone verification passed (`"r959 passed"`).

| Check | Result |
|-------|--------|
| Build Version r959 | PASS |
| Calendar opened | PASS |
| Month navigation worked | PASS |
| Important Dates displayed | PASS |
| Recurring Important Dates displayed | PASS |
| Birthday markers remained correct | PASS |
| Holiday markers remained correct | PASS |
| Normal dates behaved normally | PASS |
| Home rehearsal cue worked | PASS |
| Home band image unchanged | PASS |
| Flyer creation opened | PASS |

---

## Protected Boundaries Not Touched

- No Home band image CSS, layout, assets, or selector changes
- No birthday helper / MM-DD behavior changes
- No federal-holiday helper / exact-date holiday behavior changes
- No Important Date listeners, drawers, proposals, or Firestore write changes
- No Calendar row collectors / rendering engine changes
- No Next Up changes
- No Home cue behavior changes
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
| HEAD | `33b21a7` |
| `origin/main` | `33b21a7` |
| `origin/modularization-home-layout-engine-pilot` | `33b21a7` |
| Safe rollback tip (pre-C6a) | `3d2b462` |

`main`, `origin/main`, and the modularization branch are aligned at `33b21a7` after the approved fast-forward deploy.

---

## Next Recommended Step

1. Continue Calendar modularization planning for the next safe helpers seam (post-C6a).
2. Keep protected Home / Flyer / proposal / birthday / holiday / render boundaries untouched unless a later approved plan says otherwise.
3. If r959 must be reverted: restore production `main` to safe rollback tip `3d2b462` (separate, auditable procedure; Rich approval required).
