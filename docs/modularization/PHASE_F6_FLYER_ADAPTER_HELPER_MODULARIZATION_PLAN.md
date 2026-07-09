# Phase F6 — Flyer Adapter/Helper Modularization Plan

## Status

**Planning / inspection only.** No runtime code changed. No `index.html` edits.

| Item | Value |
|------|--------|
| Branch baseline | `main` @ `506a24e` |
| Prior slice | F5 / r950 — manifest extraction complete and phone-verified |
| Companion | [PHASE_F5_R950_FLYER_TEMPLATE_MANIFEST_EXTRACTION_CHECKPOINT.md](./PHASE_F5_R950_FLYER_TEMPLATE_MANIFEST_EXTRACTION_CHECKPOINT.md) |
| Tooling | [AGENT_TOOLING_DECISION_RULE.md](./AGENT_TOOLING_DECISION_RULE.md) |

---

## Current State After F5

```
js/flyer-template-manifest.js     ← FLYER_* data + OOT_FLYER_MANIFEST
index.html (inline)
  ├─ <script src="js/flyer-template-manifest.js"></script>  (~19368)
  ├─ _flyerCtx
  ├─ 9 adapter/helper functions   (~28752–28812)
  ├─ r947 layer helpers           (~29182–29221) — still inline
  ├─ render / save / UI           (~28832+)
  └─ 3 direct FLYER_* reads outside adapters (see coupling inventory)
tests/integrity/flyer-manifest-package.mjs  ← manifest data gate only
```

F5 moved **data** out. F6 targets **adapter logic** — the normalized read layer between manifest and render/save/UI.

---

## Exact Code Locations Inspected

| Asset | Location | Notes |
|-------|----------|-------|
| Manifest script tag | `index.html` ~19368 | Loads before main inline `<script>` |
| `_flyerCtx` | `index.html` ~28737–28749 | Runtime editor state |
| Adapter block | `index.html` ~28752–28812 | 9 functions, ~61 lines |
| `openFlyerForGig` | `index.html` ~28832+ | Uses `_flyerSavedRenderIsStale`; **direct `FLYER_NAMES` read** ~28979 |
| `_flyerSetFormat` / grid | ~29070–29140 | Adapter call sites |
| `_flyerSelectTemplate` / load | ~29141–29180 | Adapter call sites |
| Layer helpers (r947) | ~29182–29221 | `_flyerLayerConfigForKey` → `_flyerTemplateRecordForKey` |
| `_flyerRender` | ~29187+ | **Direct `FLYER_DIMS`** ~29228; `_flyerTemplateZonesForKey` |
| Save paths | ~30140–30320 | `_flyerTemplateSrcForKey`, `_flyerCurrentAssetVersion` |
| Gig preview thumbs | ~32357, ~32780, ~33072 | `_flyerPreviewSrcForDetails` |
| Manifest data | `js/flyer-template-manifest.js` | 30 keys, `OOT_FLYER_MANIFEST` footer |
| Integrity gate | `tests/integrity/flyer-manifest-package.mjs` | Duplicates `buildTemplateRecord` inline (~48–72) |

---

## Current Adapter/Helper Responsibilities

| Function | Responsibility | Data source today |
|----------|----------------|-------------------|
| `_flyerTemplateRecordForKey(key)` | Build normalized template record (id, familyId, format, dims, backgroundSrc, textZones, assetVersion, disabled logo layer) | All 5 `FLYER_*` globals |
| `_flyerTemplateExists(key)` | Boolean guard | Delegates to record builder |
| `_flyerTemplateKeysForFormat(fmt)` | List active template keys for square/story grid | `Object.keys(FLYER_TEMPLATES)` + record filter |
| `_flyerTemplateNameForKey(key)` | Display name for grid/summary | Record `.name` |
| `_flyerTemplateZonesForKey(key)` | Text overlay zone map for render | Record `.textZones` |
| `_flyerTemplateSrcForKey(key)` | PNG filename for load/thumb/save metadata | Record `.backgroundSrc` |
| `_flyerSavedRenderIsStale(det)` | Detect stale saved JPEG vs current asset/version | `_flyerTemplateSrcForKey` + **direct `FLYER_FORCE_REFRESH_TEMPLATES`** |
| `_flyerPreviewSrcForDetails(det)` | Gig thumb: saved JPEG or template PNG if stale | Staleness + src helper |
| `_flyerCurrentAssetVersion(key)` | Version token written to Firestore on save | Record `.assetVersion` |

### Call-site summary (non-definition)

| Consumer area | Functions used |
|---------------|----------------|
| Open / restore saved flyer | `_flyerSavedRenderIsStale` |
| Format + template grid | `_flyerTemplateKeysForFormat`, `_flyerTemplateSrcForKey`, `_flyerTemplateNameForKey`, `_flyerTemplateExists` |
| Canvas render | `_flyerTemplateRecordForKey`, `_flyerTemplateZonesForKey`, `_flyerTemplateSrcForKey` |
| Autosave / commit / Save to Gig | `_flyerTemplateSrcForKey`, `_flyerCurrentAssetVersion` |
| Gig Details / drawer thumbs | `_flyerPreviewSrcForDetails` |

---

## Direct Global Coupling Inventory

### Inside adapter block (expected — moves with F6)

| Global | Functions |
|--------|-----------|
| `FLYER_TEMPLATES` | `_flyerTemplateRecordForKey`, `_flyerTemplateKeysForFormat` |
| `FLYER_NAMES` | `_flyerTemplateRecordForKey` |
| `FLYER_ZONES` | `_flyerTemplateRecordForKey` |
| `FLYER_DIMS` | `_flyerTemplateRecordForKey` |
| `FLYER_FORCE_REFRESH_TEMPLATES` | `_flyerTemplateRecordForKey`, `_flyerSavedRenderIsStale` |

### Outside adapter block (F6 cleanup targets)

| Location | Read | Safer replacement |
|----------|------|-------------------|
| `openFlyerForGig` ~28979 | `FLYER_NAMES[_flyerCtx.template]` | `_flyerTemplateNameForKey(_flyerCtx.template)` |
| `_flyerRender` ~29228 | `FLYER_DIMS[_flyerCtx.format]` | `rec.width` / `rec.height` from `_flyerTemplateRecordForKey(key)` or new `_flyerDimsForFormat(fmt)` on adapter |
| `_flyerSavedRenderIsStale` ~28800–28801 | `FLYER_FORCE_REFRESH_TEMPLATES[...]` | Compare via `_flyerCurrentAssetVersion(det.flyerTemplateKey)` only (remove duplicate global read) |

After F6 extraction, **zero** `FLYER_*` references should remain in `index.html` except optional backward-compat aliases (discouraged).

### `OOT_FLYER_MANIFEST` usage today

**None in `index.html`.** Manifest bridge exists but adapters still read legacy globals. F6 module should prefer `window.OOT_FLYER_MANIFEST` with fallback to globals for one-release safety, or read globals populated by manifest (current behavior).

---

## Proposed Module Name / Path

**Primary:** `js/flyer-template-adapter.js`

**Load order (F6 runtime):**

```html
<script src="js/flyer-template-manifest.js"></script>
<script src="js/flyer-template-adapter.js"></script>
<script>
  /* inline: _flyerCtx, render, save, UI */
</script>
```

Matches Home modularization pattern (`oot_home_*.js` at repo root). Flyer assets live under `js/` started in F5.

**Alternative considered:** `oot_flyer_template_adapter.js` at root — rejected for F6 to keep flyer config under `js/` namespace.

---

## Proposed Public API (Future Module)

Expose on `window.OOT_FLYER_ADAPTER` **and** preserve underscore global aliases for zero call-site churn in first slice:

```javascript
window.OOT_FLYER_ADAPTER = {
  templateRecordForKey(key),      // → current _flyerTemplateRecordForKey shape
  templateExists(key),
  templateKeysForFormat(fmt),
  templateNameForKey(key),
  templateZonesForKey(key),
  templateSrcForKey(key),
  savedRenderIsStale(det),
  previewSrcForDetails(det),
  currentAssetVersion(key),
  dimsForFormat(fmt),             // NEW thin helper for _flyerRender (optional F6)
};

// Compatibility aliases (F6 — remove in F7+)
window._flyerTemplateRecordForKey = OOT_FLYER_ADAPTER.templateRecordForKey;
// ... same for all 9 existing names
```

**Record shape must not change** — same fields as r946/r947 including `layers.logo.enabled: false`.

Internal implementation should read from:

```javascript
var m = window.OOT_FLYER_MANIFEST || {};
var templates = m.templates || window.FLYER_TEMPLATES;
// etc.
```

---

## What Remains in `index.html` (First Extraction)

| Stays inline | Reason |
|--------------|--------|
| `_flyerCtx` | Mutable runtime session state |
| `_flyerLayerConfigForKey` / `_flyerDrawConfiguredLayers` / `_flyerDrawImageLayer` | Render pipeline; defer to F7 unless trivial to co-locate |
| `_flyerRender` and text overlay helpers | Visual behavior — out of F6 scope |
| `openFlyerForGig`, modal UI, autosave, commit, share, download | Orchestration / DOM |
| Firestore field writes | Save compatibility |
| Gig Details HTML builders | UI |

**Removed from `index.html` in F6 runtime:** adapter function definitions (~28752–28812).

**Updated in F6 runtime (3 call sites, behavior-neutral):**

- `openFlyerForGig` summary name → `_flyerTemplateNameForKey`
- `_flyerRender` dims → adapter record or `dimsForFormat`
- `_flyerSavedRenderIsStale` → eliminate direct `FLYER_FORCE_REFRESH_TEMPLATES` reads inside moved function

---

## Integrity Gates Needed Before Extraction

### Extend existing gate

`tests/integrity/flyer-manifest-package.mjs` — keep as manifest-only; do not overload.

### New gate (required before F6 merge)

**`tests/integrity/flyer-adapter-package.mjs`**

| Check | Detail |
|-------|--------|
| Files exist | `js/flyer-template-adapter.js`, manifest script tag + adapter script tag in `index.html` |
| No inline adapters | `index.html` must not define `function _flyerTemplateRecordForKey` |
| No stray `FLYER_*` in index | Regex scan: no `FLYER_TEMPLATES`, `FLYER_ZONES`, `FLYER_NAMES`, `FLYER_DIMS`, `FLYER_FORCE_REFRESH` references in `index.html` (except comments) |
| Load order | manifest script appears before adapter script before main inline script |
| VM smoke | Load manifest + adapter in Node `vm`; call each public API for sample keys (`hollywood-square`, `neon-story`, `oot09-square`) |
| Record parity | Adapter output must match duplicated `buildTemplateRecord` in manifest test for **all 30 keys** |
| Staleness cases | Unit cases: matching src → not stale; mismatched src → stale; force-refresh version mismatch → stale |
| Preview src | Stale det → template PNG; fresh det → `flyerData` |
| Keys for format | 15 square / 15 story lists |
| Global aliases | `_flyerTemplateRecordForKey` exists on sandbox after adapter load |

### Shared test helper (recommended)

Extract `buildTemplateRecord` + key list into `tests/integrity/flyer-adapter-fixtures.mjs` to avoid drift between manifest and adapter gates.

### Pre-merge commands

```powershell
node --check js/flyer-template-manifest.js
node --check js/flyer-template-adapter.js
node tests/integrity/flyer-manifest-package.mjs
node tests/integrity/flyer-adapter-package.mjs
# inline script syntax check (existing repo convention)
```

### Phone gate (human)

- Build Version r951 (proposed)
- Make Flyer square/story + template switch + preview
- Save to Gig + saved flyer reopen
- Gig Details flyer thumb (staleness path if testable)

---

## Specific Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Script load order regression | High | Integrity gate enforces manifest → adapter → inline |
| Record shape drift | High | 30-key parity test vs fixture |
| Staleness logic change | High | Explicit stale/not-stale cases in adapter gate |
| `FLYER_DIMS` direct read in render | Medium | Replace with adapter dims in same slice |
| `FLYER_NAMES` direct read in openFlyer | Low | One-line replacement |
| Duplicate `buildTemplateRecord` in tests | Medium | Shared fixture module |
| Global alias removal too early | Medium | Keep `_flyer*` aliases through F6; document F7 removal |
| Layer helpers still inline referencing adapter | Low | Aliases preserve behavior |
| GitHub Pages deploy omits new JS file | High | Checkpoint doc + What's New deploy note |

---

## Recommended First Runtime Slice (F6a)

**Name:** F6a — external flyer template adapter extraction

**Scope:**

1. Add `js/flyer-template-adapter.js` with 9 functions + `OOT_FLYER_ADAPTER` + `_flyer*` aliases.
2. Add `<script src="js/flyer-template-adapter.js"></script>` after manifest tag.
3. Remove inline adapter definitions from `index.html`.
4. Fix 3 direct global reads outside adapters (behavior-neutral).
5. Add `tests/integrity/flyer-adapter-package.mjs` (+ optional fixtures).
6. Bump Build Version: `2026-07-09-r951-flyer-template-adapter-extraction`
7. Phone verify; checkpoint doc `PHASE_F6A_R951_*`

**Explicitly not in F6a:**

- `_flyerRender` extraction
- Layer helper extraction
- New templates
- Manifest schema changes
- Home band image changes

---

## What Must Not Change

- Template keys, zone coordinates, PNG filenames
- Adapter record return shape (including `layers.logo`)
- Firestore saved flyer field names and semantics
- Render output and autosave/close-save behavior
- r949 Save to Gig menu
- Home band image system
- Expected untracked local files

---

## Existing Test Coverage vs Gaps

| Area | Covered today | Gap for F6 |
|------|---------------|------------|
| Manifest data parity | `flyer-manifest-package.mjs` | — |
| Adapter logic in index | Duplicated only inside manifest test `buildTemplateRecord` | **No test loads real adapter from `index.html`** |
| Staleness behavior | None automated | **Required in `flyer-adapter-package.mjs`** |
| Inline adapter absence | Not checked | **Required post-extraction** |
| `FLYER_*` leakage in index | Not checked | **Required post-extraction** |
| Render / canvas | None | Defer to F7+ |

---

## Commit Recommendation

| Step | Action | Commit message |
|------|--------|----------------|
| Now (this slice) | Plan doc only | `Document flyer adapter helper modularization plan` |
| Next (F6a runtime) | Adapter module + tests + index wiring + r951 marker | `Extract flyer template adapter helpers` |
| After phone verify | Checkpoint doc | `Document r951 flyer adapter extraction checkpoint` |

---

## Explicit Next Step

1. **Approve F6a runtime slice** after reviewing this plan.
2. Implement adapter module + integrity gate **before** removing inline adapters.
3. Do not start render or layer modularization until F6a is phone-verified.
