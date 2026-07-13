# Phase F8 — Flyer Render/Helper Extraction Plan

## Status

**Planning / inspection only.** No runtime code changed. No `index.html` edits. Build Version unchanged.

| Item | Value |
|------|--------|
| Branch baseline | `main` @ `cf35f31` |
| Prior slice | F7 / r951 — adapter extraction complete and phone-verified |
| Companion | [PHASE_F7_R951_FLYER_ADAPTER_EXTRACTION_CHECKPOINT.md](./PHASE_F7_R951_FLYER_ADAPTER_EXTRACTION_CHECKPOINT.md) |
| Prior plan pattern | [PHASE_F6_FLYER_ADAPTER_HELPER_MODULARIZATION_PLAN.md](./PHASE_F6_FLYER_ADAPTER_HELPER_MODULARIZATION_PLAN.md) |
| Tooling | [AGENT_TOOLING_DECISION_RULE.md](./AGENT_TOOLING_DECISION_RULE.md) |

---

## Current State After F7

```
js/flyer-template-manifest.js     ← FLYER_* data + OOT_FLYER_MANIFEST (F5/r950)
js/flyer-template-adapter.js       ← 9 adapter helpers + OOT_FLYER_ADAPTER (F7/r951)
tests/integrity/flyer-manifest-package.mjs
tests/integrity/flyer-adapter-package.mjs

index.html (inline flyer generator ~28737+)
  ├─ _flyerCtx + openFlyerForGig / modal UI
  ├─ format / template grid / select
  ├─ _flyerLoadImage
  ├─ r947 layer helpers (_flyerLayer*)
  ├─ _flyerRender (canvas text overlays — large)
  ├─ zone art helpers (panelExtend / bottomRuleShift / detailRuleRelayout)
  ├─ export / share / download / more-menu
  ├─ preview fit / hint fade
  └─ autosave / commit / Save to Gig / close
```

Load order (confirmed):

```html
<script src="js/flyer-template-manifest.js"></script>
<script src="js/flyer-template-adapter.js"></script>
<script> /* inline app incl. flyer render/UI/save */ </script>
```

Build Version remains `2026-07-09-r951-flyer-template-adapter-extraction`.

---

## Exact Code Locations Inspected

| Asset | Location | Notes |
|-------|----------|-------|
| Manifest script tag | `index.html` ~19369 | Before adapter |
| Adapter script tag | `index.html` ~19370 | Before inline `"use strict"` |
| Flyer section header | `index.html` ~28737–28739 | Comments point at manifest + adapter |
| `_flyerCtx` | ~28741–28752 | Mutable editor session state |
| `openFlyerForGig` | ~28774–28964 | Modal open / restore; uses adapter stale helpers |
| `_flyerApplySavedStaticFit` | ~28966–28991 | DOM preview sizing for saved-static mode |
| `_flyerSetFormat` / grid / select | ~28999–29103 | UI + `_flyerAutoSaveCheap` |
| `_flyerLoadImage` | ~29106–29120 | Template PNG cache on `_flyerCtx` |
| r947 layer helpers | ~29122–29162 | Config + cache + draw configured layers |
| `_flyerRender` | ~29164–29574 | Canvas pipeline; **direct `FLYER_DIMS` read** ~29168 |
| Zone art helpers | ~29577–29749 | `_flyerApplyDetailRuleRelayout`, `_flyerApplyBottomRuleShift`, `_flyerApplyPanelExtension` |
| Export / share / download | ~29752–29805 | Canvas blob + OS share/download |
| More menu | ~29807–29928 | Includes r949 Save to Gig entry |
| Preview expand / hint | ~29930–29958 | Overlay UI |
| Autosave / commit / close / Save to Gig | ~29960–30417 | Firestore write paths |
| Delete / send to chat | ~30418+ | Secondary actions |
| Adapter module | `js/flyer-template-adapter.js` | 9 functions + aliases |
| Manifest module | `js/flyer-template-manifest.js` | 30 keys + zones/names/dims |
| Integrity gates | `tests/integrity/flyer-*-package.mjs` | Manifest + adapter only |
| Checkpoints | F5 r950, F7 r951, F2b r946/r947 | Architecture lineage |

### Residual `FLYER_*` coupling in `index.html`

| Location | Read | Notes |
|----------|------|-------|
| `_flyerRender` ~29168 | `FLYER_DIMS[_flyerCtx.format]` | Only live `FLYER_*` code reference left in `index.html` (comments exempt) |

F6 planned to replace this during adapter extraction; it remains after F7. Include a behavior-neutral swap in the first F8 runtime slice (use adapter record `width`/`height` or a thin `dimsForFormat` helper).

---

## Candidate Extraction Seams

### A. r947 layer helpers (recommended first)

| Function | Lines (approx) | Role |
|----------|----------------|------|
| `_flyerLayerConfigForKey` | ~29122–29126 | Read `rec.layers[layerName]` via adapter |
| `_flyerLayerImageCache` | ~29127–29130 | Lazy `_flyerCtx.layerImages` |
| `_flyerDrawImageLayer` | ~29131–29158 | Load/draw optional image layer; re-calls `_flyerRender` on load |
| `_flyerDrawConfiguredLayers` | ~29159–29162 | Logo layer entry point |

**Pros:** Small (~40 lines). Already a named architecture seam from r947. Logo defaults `enabled: false`, so current pixels do not depend on draw success. Depends only on adapter + `_flyerCtx` + `_flyerRender` callback.

**Cons:** `_flyerDrawImageLayer` mutates `_flyerCtx` and re-enters `_flyerRender` — needs global alias or injected refresh callback when moved.

### B. Template image load helper

| Function | Lines | Role |
|----------|-------|------|
| `_flyerLoadImage` | ~29106–29120 | Cache template `Image` on `_flyerCtx` |

**Pros:** Tiny; natural sibling of layer helpers.

**Cons:** Still couples to `_flyerCtx`; alone is thin. Prefer bundling with A, not a standalone release.

### C. Zone art / canvas pre-text helpers

| Function | Lines | Role |
|----------|-------|------|
| `_flyerApplyDetailRuleRelayout` | ~29577–29630 | Cover/redraw baked detail rule |
| `_flyerApplyBottomRuleShift` | ~29633–29685 | Cover/redraw bottom rule |
| `_flyerApplyPanelExtension` | ~29687–29749 | Extend panel + border ornament |

**Pros:** Mostly pure canvas math (`ctx`, `img`, `dims`, `cfg`). No Firestore. Clear call sites only from `_flyerRender`.

**Cons:** **Visual-critical.** Any extraction slip changes Story/Square composites on templates that use these zone keys. Better as F8b after layer helpers are gated and phone-verified.

### D. Full `_flyerRender` text pipeline

| Function | Lines | Role |
|----------|-------|------|
| `_flyerRender` | ~29164–29574 | Dims, load image, layers, zone art, venue/address/date/announce text |

**Pros:** Biggest monolith reduction.

**Cons:** ~410 lines; premium venue gradients, tracking, tagline, announcement placement. Highest visual risk. Defer until A–C are external and integrity-gated.

### E. Preview / layout helpers

| Function | Role |
|----------|------|
| `_flyerApplySavedStaticFit` | Modal preview height fit |
| `_flyerExpandPreview` / `_flyerScheduleHintFade` | Overlay UX |

**Pros:** DOM-only; does not touch pixels in the JPEG.

**Cons:** Low modularization value for white-label; not the render seam. Defer.

### F. Menu / share / export helpers

| Function | Role |
|----------|------|
| `_flyerExport` / `_flyerShare` / `_flyerDownload` / `_flyerDownloadBlob` | Blob export + share sheet |
| `_flyerToggleMore` / `_flyerCloseMore` / `_flyerRenderMoreOptions` | Kebab menu (includes Save to Gig) |

**Pros:** Separable from canvas draw.

**Cons:** DOM + `navigator.share` + toast + r949 menu contract. Not the next architecture priority. Defer.

### G. Save / autosave helpers

| Function | Role |
|----------|------|
| `_flyerScheduleAutoSave` / `_flyerAutoSaveCheap` | Cheap field autosave |
| `_flyerCommitFlyerData` / `_flyerFlushPendingSaves` | JPEG + Firestore |
| `_flyerSaveToGig` / `_flyerCloseModal` | Explicit save + close drain |

**Pros:** Would shrink monolith.

**Cons:** Highest data-compat risk. Hard boundary for F8: **do not move yet.**

---

## Recommended Next Seam

**F8a runtime (after this plan is approved):** extract **seam A (r947 layer helpers)** into an external module, optionally co-locate **seam B (`_flyerLoadImage`)**, and clear the leftover `FLYER_DIMS` read in `_flyerRender`.

Proposed module path: `js/flyer-layer-helpers.js`

Proposed load order:

```html
<script src="js/flyer-template-manifest.js"></script>
<script src="js/flyer-template-adapter.js"></script>
<script src="js/flyer-layer-helpers.js"></script>
<script> /* inline: _flyerCtx, _flyerRender, UI, save */ </script>
```

Public bridge sketch:

```javascript
window.OOT_FLYER_LAYERS = {
  layerConfigForKey: _flyerLayerConfigForKey,
  layerImageCache: _flyerLayerImageCache,
  drawImageLayer: _flyerDrawImageLayer,
  drawConfiguredLayers: _flyerDrawConfiguredLayers,
  // optional if co-located:
  // loadImage: _flyerLoadImage
};
// Preserve window._flyer* aliases for zero call-site churn
```

**Why this seam first**

1. Matches F6/F7 deferral notes and F2b r947 architecture checkpoint.
2. Smallest behavior-preserving extraction with an integrity story.
3. Current templates keep logo disabled — phone verification stays practical.
4. Unblocks later zone-art and `_flyerRender` moves without bundling too much risk in one slice.

**Immediate follow-on (F8b, separate approval):** seam C zone art helpers → `js/flyer-zone-art-helpers.js` (or similar), only after F8a phone pass.

---

## What Should Not Be Moved Yet

| Keep in `index.html` | Reason |
|----------------------|--------|
| `_flyerCtx` | Mutable session state |
| `openFlyerForGig` + format/grid/select UI | Modal orchestration |
| Full `_flyerRender` text overlay body | Visual risk; wait for F8a/F8b |
| Zone art helpers (until F8b) | Visual-critical second slice |
| Preview fit / expand / hints | UX layout, not config architecture |
| Export / share / more menu | DOM + OS; includes r949 Save to Gig |
| Autosave / commit / Save to Gig / flush / close | Firestore shape and timing |
| Delete / send to chat | Secondary actions |
| Manifest / adapter modules | Already extracted; do not reshape |

---

## Required Integrity Gates Before Runtime Extraction

Do **not** remove inline layer helpers until a new gate exists and passes.

### New gate (required)

**`tests/integrity/flyer-layer-package.mjs`**

| Check | Detail |
|-------|--------|
| Files exist | `js/flyer-layer-helpers.js` (+ manifest/adapter present) |
| Load order | manifest → adapter → layer helpers → inline in `index.html` |
| No inline defs | `index.html` must not define `function _flyerLayerConfigForKey` / `function _flyerDrawConfiguredLayers` (and peers once moved) |
| API + aliases | `window.OOT_FLYER_LAYERS` + `_flyerLayer*` aliases |
| Disabled logo | For all 30 keys, `layers.logo.enabled === false` via adapter record + layerConfig returns that object |
| Draw no-op when disabled | Calling `drawConfiguredLayers` with a mock ctx must not call `drawImage` when logo disabled |
| Optional loadImage | If co-moved: cache hit/miss behavior against a fake `_flyerCtx` |
| Residual `FLYER_*` | Prefer: no live `FLYER_DIMS` (etc.) in `index.html` after dims cleanup |

### Keep existing gates

```powershell
node --check js/flyer-template-manifest.js
node --check js/flyer-template-adapter.js
node --check js/flyer-layer-helpers.js
node tests/integrity/flyer-manifest-package.mjs
node tests/integrity/flyer-adapter-package.mjs
node tests/integrity/flyer-layer-package.mjs
# inline script syntax check (repo convention)
```

### Phone gate (human, after F8a runtime)

- Build Version reports proposed r952
- Make Flyer opens; Square/Story templates load
- Preview render unchanged
- Save to Gig + saved flyer reopen
- Confirm no console errors on template switch

---

## Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Script load order regression | High | Integrity gate enforces manifest → adapter → layers → inline |
| `_flyerDrawImageLayer` → `_flyerRender` re-entry breaks after move | High | Keep `_flyerRender` global alias or inject `onLayerLoaded` callback; gate with vm smoke |
| Accidental enable of logo layer | High | Assert `enabled: false` for all 30 keys; do not change adapter record shape |
| Visual drift if zone art moved too early | High | Keep seam C out of F8a |
| Leftover `FLYER_DIMS` dims mismatch | Medium | Use adapter record width/height in same F8a slice |
| Co-moving `_flyerLoadImage` without ctx fixture | Medium | Either keep loadImage inline for F8a, or provide sandbox `_flyerCtx` in gate |
| GitHub Pages omits new JS file | High | Checkpoint + What's New deploy note: upload layer helper JS with `index.html` |
| Save/menu churn in same PR | High | Explicitly out of scope |

---

## Proposed Build Version (runtime later)

`2026-07-13-r952-flyer-layer-helper-extraction`

Do **not** bump Build Version during this planning-only slice.

---

## Recommended First Runtime Slice (F8a)

**Name:** F8a — flyer layer helper extraction

**Scope:**

1. Add integrity gate `tests/integrity/flyer-layer-package.mjs` (before or with module).
2. Add `js/flyer-layer-helpers.js` with the four r947 functions + `OOT_FLYER_LAYERS` + `_flyer*` aliases.
3. Optionally move `_flyerLoadImage` in the same module if the gate covers it; otherwise leave loadImage inline for F8a.
4. Add `<script src="js/flyer-layer-helpers.js"></script>` after the adapter tag.
5. Remove matching inline definitions from `index.html`.
6. Replace `_flyerRender`'s `FLYER_DIMS[_flyerCtx.format]` with adapter record dims (behavior-neutral).
7. Bump Build Version to `2026-07-13-r952-flyer-layer-helper-extraction` + What's New entry.
8. Phone verify; write checkpoint doc.

**Explicitly not in F8a:**

- Zone art helper extraction (F8b)
- Full `_flyerRender` extraction
- Preview / menu / share extraction
- Autosave / Save to Gig / Firestore field moves
- New templates / zone edits / logo enablement
- Home band image changes

---

## What Must Not Change

- Flyer visuals and render output for current templates
- Template keys, zone coordinates, PNG filenames, force-refresh versions
- Adapter record shape (including `layers.logo` defaults)
- Saved flyer Firestore field names and semantics
- Autosave / close-save / Save to Gig behavior
- Home band image system
- Expected untracked local files:
  - `docs/modularization/PHASE_6W_A_REHEARSAL_CUE_PARITY_PLAN.md`
  - `oot-local-server.ps1`

---

## Commit Recommendation

| Step | Action | Commit message |
|------|--------|----------------|
| Now (this slice) | Plan doc only | `Document flyer render helper extraction plan` |
| Next (F8a runtime) | Layer module + gate + index wiring + r952 marker | `Extract flyer layer helpers` |
| After phone verify | Checkpoint doc | `Document r952 flyer layer helper extraction checkpoint` |

---

## Explicit Next Step

1. Review and approve this F8 plan.
2. Implement **F8a** only after integrity gate strategy is accepted.
3. Do **not** start full `_flyerRender` or save modularization until F8a is phone-verified.
4. Planning-only for F8b zone-art seam until F8a lands.
