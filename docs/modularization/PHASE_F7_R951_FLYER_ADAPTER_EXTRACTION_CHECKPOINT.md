# Phase F7 — r951 Flyer Adapter Extraction Checkpoint

Date: 2026-07-13

## Status

**F7 complete and pushed.** Local validation and phone/PWA verification passed.

| Item | Value |
|------|--------|
| Branch | `main` |
| Runtime commit | `4dbe770` |
| Build Version | `2026-07-09-r951-flyer-template-adapter-extraction` |
| Commit message | `Extract flyer template adapter helpers` |

---

## Files Changed

| File | Role |
|------|------|
| `index.html` | Removed inline flyer adapter/helper functions; added adapter script tag; r951 build marker + What's New |
| `js/flyer-template-adapter.js` | External flyer template adapter/helper functions |
| `tests/integrity/flyer-adapter-package.mjs` | Flyer adapter integrity gate |

---

## What Changed

- Moved flyer template adapter/helper functions out of `index.html`
- Created `js/flyer-template-adapter.js`
- Preserved legacy `_flyer*` global aliases
- Added `window.OOT_FLYER_ADAPTER` bridge
- Kept render/save/UI code in `index.html`
- Kept manifest data in `js/flyer-template-manifest.js`
- Added flyer adapter integrity gate

---

## Validation Completed

### Local (Node)

| Check | Result |
|-------|--------|
| `node --check js/flyer-template-manifest.js` | PASS |
| `node --check js/flyer-template-adapter.js` | PASS |
| `node tests/integrity/flyer-manifest-package.mjs` | PASS |
| `node tests/integrity/flyer-adapter-package.mjs` | PASS |
| Inline script syntax check | PASS |

### Phone / PWA

| Check | Result |
|-------|--------|
| r951 running successfully on phone | PASS |
| Make Flyer works | PASS |
| Square/Story templates load | PASS |
| Preview renders | PASS |
| Save to Gig remains available/working | PASS |
| Saved flyer reopen works | PASS |

---

## Boundaries Preserved

- No new templates
- No flyer visual/render changes
- No zone changes
- No saved flyer Firestore shape changes
- No Home image changes

### Expected untracked files (intentionally untouched)

- `docs/modularization/PHASE_6W_A_REHEARSAL_CUE_PARITY_PLAN.md`
- `oot-local-server.ps1`

---

## Next Recommended Slice

**F8 planning** — Inspect the next safe flyer render/helper extraction seam.

- Planning only first
- No UI polish
- No new templates
