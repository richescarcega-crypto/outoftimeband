# Phase C7a — r960 Calendar Next Up Helpers Checkpoint

Date: 2026-07-16

## Status

**C7a / r960 runtime extraction complete on the modularization branch.** Local validation passed. **Production merge and phone/PWA verification are still pending.**

| Item | Value |
|------|--------|
| Branch | `modularization-home-layout-engine-pilot` |
| HEAD | `9bc4069` |
| `origin/modularization-home-layout-engine-pilot` | `9bc4069` |
| `origin/main` | `5636d74` |
| Build Version | `2026-07-16-r960-calendar-next-up-helpers` |
| Runtime commit | `9bc4069` — `Extract Calendar Next Up helpers` |
| Safe rollback tip (pre-C7a) | `5636d74` |
| Production merge | **Pending** |
| Phone / PWA verification | **Pending** |

---

## Purpose and Bounded Scope

**C7a / r960 — Calendar Next Up Display Helpers Extraction.**

Extract only the Next Up display formatters `_calNextUpCalendarIcon` and `_calNextUpLine` from `index.html` into the existing Calendar helpers module, preserving call sites, render ownership, and Next Up copy/icon behavior. Bounded helpers-only seam: no Next Up render/open handlers, row collectors, drawers, Firestore writes, Important Date / birthday / holiday rework, Home cues, Flyer polish, or band-image work.

---

## Runtime Commit

| Item | Value |
|------|--------|
| Runtime commit | `9bc4069` |
| Message | `Extract Calendar Next Up helpers` |
| Build Version | `2026-07-16-r960-calendar-next-up-helpers` |

---

## Production Merge

**Not merged.** Production `origin/main` remains at `5636d74` (pre-C7a / r959 tip).

Do not merge, rebase, or push to `main` until Rich explicitly approves a separate merge plan and phone/PWA verification passes.

Safe rollback tip (pre-C7a): `5636d74`.

---

## Files Changed (Runtime Commit)

| File | Role |
|------|------|
| `index.html` | Removed inline Next Up formatter defs; r960 Build Version + What's New |
| `js/calendar-date-helpers.js` | Extended with Next Up helpers + namespace keys + legacy aliases |
| `tests/integrity/calendar-helpers-package.mjs` | Extended Calendar helper integrity gate for Next Up exports / no-inline defs |

---

## Functions Extracted

Moved out of `index.html` into `js/calendar-date-helpers.js`:

- `_calNextUpCalendarIcon()`
- `_calNextUpLine(row, gigDetailsMap)`

Original inline `index.html` definitions removed. Existing call sites left unchanged (still `_calNextUpCalendarIcon()` and one-argument `_calNextUpLine(row)` via legacy aliases).

---

## Explicit gigDetailsMap Injection

- Module signature `_calNextUpLine(row, gigDetailsMap)` accepts an explicit gig-details map.
- Callers inject the map; the helper does not own `gigDetails` loading, listeners, or render.

---

## Legacy One-Argument Compatibility Path

- Legacy one-argument path preserved:
  - `window._calNextUpLine(row)` calls the module helper using `window.gigDetails`
- `window._calNextUpCalendarIcon` remains a direct alias of the module helper (no injection needed).
- Existing `index.html` call sites that relied on the prior shapes continue to work unchanged.

---

## Namespace Exports

Extended `window.OOT_CALENDAR_HELPERS` with:

- `nextUpCalendarIcon`
- `nextUpLine`

---

## Legacy Aliases

Preserved so existing `index.html` call sites continue to work:

- `window._calNextUpCalendarIcon` → `OOT_CALENDAR_HELPERS.nextUpCalendarIcon`
- `window._calNextUpLine(row)` → `OOT_CALENDAR_HELPERS.nextUpLine(row, window.gigDetails)`

---

## Behavior Preservation

- **Exact icon markup** preserved (`cal-next-up-icon` / `Calendaricon.png?v=r250`).
- **Empty / null row text** preserved (`No upcoming calendar items`).
- **Escaping behavior** preserved via `_calSafe` for title and time.
- **`gigDetails[id].settime` preference** preserved for gig rows.
- **Fallback** to `row.settime` / `row.time` preserved when details map has no settime.
- **Non-gig behavior** preserved (gigDetails ignored unless `row.type === 'gig'`).
- **No** sorting, date, timezone, locale, row-selection, or rendering-policy changes.

---

## Call Sites and Render Ownership

- Existing `index.html` call sites in `_calRenderStageSummary` remain unchanged in ownership and usage pattern.
- Public Calendar **render** ownership (`_calRenderStageSummary`, `_calOpenNextUp`, drawers, row collectors) remains in `index.html`.
- No render-engine move; helpers only.

---

## Build Version

`2026-07-16-r960-calendar-next-up-helpers`

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

### Phone / PWA — Pending

Phone/PWA verification has **not** been completed for r960.

---

## Protected Boundaries Not Touched

- No Home band image CSS, layout, assets, or selector changes
- No birthday helper / MM-DD behavior changes
- No federal-holiday helper / exact-date holiday behavior changes
- No Important Date helper / listener / collector / write changes
- No Calendar row collectors / rendering engine / navigation changes
- No Next Up open/render handlers moved (`_calRenderStageSummary`, `_calOpenNextUp` remain inline)
- No drawers / proposals / Home cue behavior changes
- No Flyer UI polish
- No Band.png / band.png cleanup
- Preserved `window.OOT_CALENDAR_HELPERS` (extend only)
- Public Calendar render ownership stayed in `index.html`
- No production-`main` force push or unapproved merge

---

## Current Branch State

| Ref | Value |
|-----|--------|
| Branch | `modularization-home-layout-engine-pilot` |
| HEAD | `9bc4069` |
| `origin/modularization-home-layout-engine-pilot` | `9bc4069` |
| `origin/main` | `5636d74` |
| Safe rollback tip (pre-C7a) | `5636d74` |

Runtime extraction is on the modularization branch only. Production `main` remains at the pre-C7a tip until an approved merge and phone verification.

---

## Next Recommended Step

1. Phone/PWA verify r960 (Build Version, Calendar grid, Next Up card copy/icon, Next Up tap open).
2. Only after phone PASS: draft/approve a C7a merge-to-main plan.
3. Keep protected Home / Flyer / proposal / birthday / holiday / Important Date / render boundaries untouched unless a later approved plan says otherwise.
4. If r960 must be reverted before merge: restore the modularization branch to safe rollback tip `5636d74` (separate, auditable procedure; Rich approval required).
