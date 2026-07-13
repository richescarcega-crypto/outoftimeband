# Phase F8a — r952 Flyer Layer Helpers Extraction Checkpoint

Date: 2026-07-13

## Status

**F8a complete and pushed.** Local validation and phone/PWA verification passed.

| Item | Value |
|------|--------|
| Branch | `main` |
| Runtime commit | `fb159ee` |
| Build Version | `2026-07-09-r952-flyer-layer-helpers-extraction` |
| Commit message | `Extract flyer layer helpers` |

---

## Files Changed

| File | Role |
|------|------|
| `index.html` | Removed inline r947 layer helpers; added layer helpers script tag; r952 build marker + What's New |
| `js/flyer-layer-helpers.js` | External flyer layer helpers |
| `tests/integrity/flyer-layer-helpers-package.mjs` | Flyer layer helper integrity gate |

---

## What Changed

- Moved r947 flyer layer helpers out of `index.html`
- Created `js/flyer-layer-helpers.js`
- Added `window.OOT_FLYER_LAYER_HELPERS` namespace
- Preserved legacy `_flyerLayer*` aliases
- Preserved async logo-layer image load behavior through `window._flyerRender`
- Kept `_flyerRender` itself in `index.html`
- Kept render/save/menu/template behavior unchanged
- Added flyer layer helper integrity gate

---

## Validation Completed

### Local (Node)

| Check | Result |
|-------|--------|
| `node --check js/flyer-template-manifest.js` | PASS |
| `node --check js/flyer-template-adapter.js` | PASS |
| `node --check js/flyer-layer-helpers.js` | PASS |
| Flyer manifest integrity gate | PASS |
| Flyer adapter integrity gate | PASS |
| Flyer layer helper integrity gate | PASS |
| Inline script syntax check | PASS |

### Phone / PWA

| Check | Result |
|-------|--------|
| r952 running successfully on phone | PASS |
| Make Flyer works | PASS |
| Square and Story templates load | PASS |
| Template changes render | PASS |
| Save to Gig still works | PASS |
| Autosave works | PASS |
| Saved flyer can be changed and remains attached | PASS |

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

## UX Note for Later

User prefers a green save checkmark over autosave/kebab Save to Gig.

**Do not implement now.** Continue modularization first.

---

## Next Recommended Slice

**F9 planning** — Inspect the next safe extraction seam after manifest, adapter, and layer helpers.

- Planning only first
- No UI polish
- No new templates
