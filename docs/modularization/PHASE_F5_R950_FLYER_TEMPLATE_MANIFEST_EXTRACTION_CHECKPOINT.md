# Phase F5 — r950 Flyer Template Manifest Extraction Checkpoint

Date: 2026-07-09

## Status

**F5 complete and pushed.** Local validation and phone/PWA verification passed.

| Item | Value |
|------|--------|
| Branch | `main` |
| Commit | `89c1b84` |
| Build Version | `2026-07-09-r950-flyer-template-manifest-extraction` |
| Commit message | `Extract flyer template manifest config` |

Companion planning doc: [PHASE_F4_FLYER_TEMPLATE_CONFIG_MODULARIZATION_PLAN.md](./PHASE_F4_FLYER_TEMPLATE_CONFIG_MODULARIZATION_PLAN.md)

---

## Files Changed

| File | Role |
|------|------|
| `index.html` | Removed inline flyer config globals; added manifest script tag; r950 build marker + What's New |
| `js/flyer-template-manifest.js` | External flyer template/config data |
| `tests/integrity/flyer-manifest-package.mjs` | Manifest parity integrity gate |

---

## What Changed

- Moved `FLYER_TEMPLATES`, `FLYER_ZONES`, `FLYER_NAMES`, `FLYER_DIMS`, and `FLYER_FORCE_REFRESH_TEMPLATES` into `js/flyer-template-manifest.js`
- Preserved legacy `FLYER_*` global names for adapter compatibility
- Added `window.OOT_FLYER_MANIFEST` with `schemaVersion: 1` and references to the same data objects
- Added `<script src="js/flyer-template-manifest.js"></script>` before the main inline script block so globals exist before flyer adapter use
- Kept adapters, render pipeline, save/load, and UI in `index.html` unchanged
- Added `tests/integrity/flyer-manifest-package.mjs` to verify 30 keys, 15 square / 15 story, key parity, asset filenames, force-refresh keys, and adapter record shape

---

## Validation Completed

### Local (Node)

| Check | Result |
|-------|--------|
| `node --check js/flyer-template-manifest.js` | PASS |
| `node tests/integrity/flyer-manifest-package.mjs` | PASS |
| Inline script syntax check | PASS |

### Phone / PWA

| Check | Result |
|-------|--------|
| Build Version reports r950 | PASS |
| Square templates load | PASS |
| Story templates load | PASS |
| Template switching and preview | PASS |
| Save to Gig menu action | PASS |
| Saved flyer reopen and render | PASS |

**Deploy note:** GitHub Pages must include both `index.html` and `js/flyer-template-manifest.js`.

---

## Boundaries Preserved

- No new flyer templates
- No flyer render logic changes
- No flyer zone coordinate changes
- No saved flyer Firestore field shape changes
- No Home band image CSS, assets, layout, selector behavior, or placement changes

### Expected untracked files (intentionally untouched)

- `docs/modularization/PHASE_6W_A_REHEARSAL_CUE_PARITY_PLAN.md`
- `oot-local-server.ps1`

---

## Architecture After F5

```
js/flyer-template-manifest.js
  ├─ FLYER_TEMPLATES / FLYER_ZONES / FLYER_NAMES / FLYER_DIMS / FLYER_FORCE_REFRESH_TEMPLATES
  └─ window.OOT_FLYER_MANIFEST

index.html (inline)
  ├─ _flyerCtx
  ├─ _flyerTemplateRecordForKey + adapter helpers
  ├─ _flyerRender + save/load/UI
  └─ reads legacy FLYER_* globals (unchanged call sites)
```

---

## Next Recommended Slice

**F6** — Move flyer adapter/helper functions behind the manifest bridge or into a small external module, but only after adding/confirming integrity gates for adapter behavior.

F6 goals:

- Extract `_flyerTemplateRecordForKey` and related helpers without changing return shapes
- Keep visuals and template count unchanged
- Do not add new templates
- Extend integrity tests to cover adapter extraction before runtime merge

Do not proceed to render modularization before adapter extraction is gated and phone-verified.

---

## Agent Tooling

Follow [AGENT_TOOLING_DECISION_RULE.md](./AGENT_TOOLING_DECISION_RULE.md): use Cursor Agent for F6 planning/inspection; use PowerShell for compact validation and commit/push.
