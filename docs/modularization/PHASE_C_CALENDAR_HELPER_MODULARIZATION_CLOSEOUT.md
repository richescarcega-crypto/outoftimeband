# Calendar Helper Modularization — Closeout (Stop at r965)

Date: 2026-07-17

## Decision

**STOP.** The Calendar helper modularization series ends at **r965**.

No **r966** Calendar helper slice is approved.

---

## Verified Baseline

| Item | Value |
|------|--------|
| Branch | `modularization-home-layout-engine-pilot` |
| HEAD | `5785ab4` |
| `main` | `5785ab4` |
| `origin/main` | `5785ab4` |
| `origin/modularization-home-layout-engine-pilot` | `5785ab4` |
| Build Version | `2026-07-17-r965-calendar-display-rows-helper` |
| r965 production + phone/PWA | **PASS** |

---

## Why Stop

- The extracted **pure Calendar domain seam** (date/status helpers, holidays, birthdays, Important Date materialization/collection, display/upcoming/month row composition) is **sufficient for the current project phase**.
- Remaining Calendar code in `index.html` is primarily **DOM rendering**, **orchestration**, **Firestore ownership**, **CRUD**, **drawers**, and **rehearsal-proposal UI**.
- Further low-value helper extractions and inline deduplication do **not** justify additional build → merge → phone-verification cycles.
- The governing objective remains a **stable, maintainable, monetizable, white-label-capable** app — not indefinite helper mining.

---

## Acknowledged Non-Blockers

- **All Events** still uses a parallel `events.slice().concat(_customEntriesAsRows())` composition instead of `_calDisplayRows` / `displayRows`. Inconsistency acknowledged; **not a blocker**.
- **Rehearsal proposals** remain a **separate product workstream**, not Calendar-helper debt.

---

## When to Resume

Resume Calendar modularization **only** under an **explicitly approved Calendar render/data engine program** tied to a real:

- stability,
- scalability,
- multi-tenant, or
- white-label

requirement.

Do **not** resume merely because more Calendar code remains inline.

---

## Series Endpoint

| Endpoint | Value |
|----------|--------|
| Final helper build | r965 — `2026-07-17-r965-calendar-display-rows-helper` |
| Final extracted composer | `_calDisplayRows` → `OOT_CALENDAR_HELPERS.displayRows` |
| Helper module | `js/calendar-date-helpers.js` |
| Integrity gate | `tests/integrity/calendar-helpers-package.mjs` |

---

## Local-Only Files (Untouched)

- `docs/modularization/PHASE_6W_A_REHEARSAL_CUE_PARITY_PLAN.md`
- `oot-local-server.ps1`
