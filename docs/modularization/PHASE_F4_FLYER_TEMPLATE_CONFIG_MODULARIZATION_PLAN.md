# Phase F4 — Flyer Template/Config Modularization Plan

## Status

**Read-only inspection / documentation only.** No runtime code changed. No `index.html` edits.

| Item | Value |
|------|--------|
| Branch | `main` |
| Inspection baseline | `afadc64` |
| Prior flyer work | r946 adapter, r947 logo layer, r948 syntax repair, r949 Save to Gig menu |
| Governing tooling | [AGENT_TOOLING_DECISION_RULE.md](./AGENT_TOOLING_DECISION_RULE.md) |

---

## Current State Summary

The flyer system is **functionally complete** on phone (Make Flyer, Square/Story, template grid, autosave, JPEG persist, Gig Details preview, Edit Saved Flyer, r949 explicit Save to Gig). Architecturally it remains **monolithic**: ~30 template keys, zone maps, display names, asset filenames, and staleness overrides live inline in `index.html` (~28733–29075), while render/save/UI logic stays in the same file (~29077–30700+).

r946 introduced an **adapter layer** (`_flyerTemplateRecordForKey` and helpers) so runtime reads go through normalized records instead of scattering direct `FLYER_*` map access. r947 added **disabled-by-default logo layer** scaffolding on each template record. **Data is still authored in four parallel globals** — extraction has not happened yet.

Template background assets are **external PNG filenames** (not base64), deployed alongside `index.html` on GitHub Pages. The section comment still says "Embedded base64 templates" — **stale comment**; values are paths like `oot_flyer_square_01_r512.png`.

---

## Exact Code Locations Inspected

| Area | `index.html` lines (approx.) | Notes |
|------|------------------------------|-------|
| Flyer modal HTML | ~19259–19350 | Make/Edit Flyer UI, format pills, template grid, preview |
| `FLYER_TEMPLATES` | 28735–28766 | Key → PNG filename |
| `FLYER_ZONES` | 28770–28940 | Key → text zone + special layout overrides |
| `FLYER_NAMES` | 28943–28974 | Key → display name ("Flyer N") |
| `FLYER_DIMS` | 28977–28980 | `square` / `story` canvas dimensions |
| `_flyerCtx` state | 28983–28994 | Runtime editor state + image cache |
| `FLYER_FORCE_REFRESH_TEMPLATES` | 29000–29014 | Asset version overrides for stale JPEG refresh |
| Adapter helpers | 29015–29075 | Record builder + staleness + preview src |
| `openFlyerForGig` | 29097–29287 | Restore saved fields, staleness, format/template UI |
| `_flyerSetFormat` / grid | 29322–29402 | Square/story split, template picker |
| `_flyerSelectTemplate` / load | 29404–29443 | Selection + image cache by src URL |
| Logo layer scaffold (r947) | 29445–29485 | `_flyerLayerConfigForKey`, `_flyerDrawConfiguredLayers` |
| `_flyerRender` | 29487+ | Canvas draw, zones, text overlay |
| Autosave / commit / close | 30382–30535 | Firestore `gigdetails` field writes |
| `_flyerSaveToGig` (r949) | 30537+ | Explicit menu save path |
| Gig detail preview | ~32620, ~33043, ~33335 | `_flyerPreviewSrcForDetails` |

### Companion docs read

- `docs/modularization/PHASE_F2B_FLYER_R946_R947_ARCHITECTURE_CHECKPOINT.md`
- `docs/modularization/PHASE_F3A_R948_FLYER_SYNTAX_SCOPE_REPAIR_CHECKPOINT.md`
- `docs/modularization/PHASE_F3B_FLYER_UX_DATA_FLOW_INSPECTION.md`
- `docs/modularization/PHASE_F3C_R949_FLYER_SAVE_TO_GIG_MENU_CHECKPOINT.md`
- `docs/modularization/AGENT_TOOLING_DECISION_RULE.md`
- `docs/flyer/FLYER_METHODOLOGY_PLAN.md` (reference)

---

## Current Template Count by Format

| Format | Count | Key pattern | Canvas |
|--------|-------|-------------|--------|
| Square | **15** | `{family}-square` | 1080×1080 |
| Story | **15** | `{family}-story` | 1080×1920 |
| **Total keys** | **30** | Paired 1:1 per family | — |

### Family IDs (15)

`hollywood`, `neon`, `skyline`, `deco`, `disco`, `comic`, `metropolis`, `boardwalk`, `oot09` … `oot15`

### External PNG assets (30 files referenced)

Square filenames mostly `oot_flyer_square_{01–15}_r473.png` except:

- `oot_flyer_square_01_r512.png` (hollywood-square, refreshed)

Story filenames mostly `oot_flyer_story_{01–15}_r464.png` with exceptions:

- `oot_flyer_story_01_r513.png` (hollywood-story)
- `oot_flyer_story_13_r504.png`, `oot_flyer_story_14_r507.png`, `oot_flyer_story_15_r507.png`

Assets load via `img.src = filename` (same-origin relative to deployed `index.html`). **No base64 in current `FLYER_TEMPLATES` values.**

---

## Current Architecture / Data Shape

### Parallel globals (authoring model today)

```
FLYER_TEMPLATES[key]           → backgroundSrc (PNG filename)
FLYER_ZONES[key]               → textZones + optional layout patches
FLYER_NAMES[key]               → human label
FLYER_FORCE_REFRESH_TEMPLATES[key] → assetVersion override (sparse)
FLYER_DIMS[format]             → { w, h }
```

### Normalized record (`_flyerTemplateRecordForKey`)

Built at read time from the globals:

```javascript
{
  id, key,                           // template key e.g. 'neon-story'
  familyId,                         // key with /-(square|story)$/ stripped
  name,                              // from FLYER_NAMES
  format,                            // 'square' | 'story' from endsWith('-story')
  width, height,                     // from FLYER_DIMS[format]
  backgroundSrc,                     // PNG filename
  active: true,
  layers: { logo: { enabled: false, src: '', x_frac, y_frac, w_frac } },
  textZones,                         // from FLYER_ZONES[key]
  assetVersion                     // FLYER_FORCE_REFRESH or fallback to backgroundSrc
}
```

### Firestore saved flyer fields (`gigdetails/{gigId}`)

| Field | Role |
|-------|------|
| `flyerData` | JPEG data URL of rendered canvas |
| `flyerTemplateKey` | Template key string |
| `flyerFormat` | `square` \| `story` |
| `flyerTemplateSrc` | PNG filename at save time |
| `flyerTemplateAssetVersion` | Version token at save time |
| `flyerVenue`, `flyerStreet`, `flyerCity`, `flyerDateOnly`, `flyerTimeOnly`, `flyerAnnouncement` | Editable overlay text |
| `flyerAddress`, `flyerDate` | Legacy combined strings (back-compat) |
| `flyerSavedAt` | Timestamp |

### Make/Edit Flyer behavior (inspected)

1. **Template selection** — `_flyerBuildTemplateGrid` lists `_flyerTemplateKeysForFormat(fmt)`; thumbs use `_flyerTemplateSrcForKey`.
2. **Square/story split** — `_flyerSetFormat` filters by `rec.format`; incompatible saved key falls back to first available in format.
3. **Text-zone lookup** — `_flyerTemplateZonesForKey` → `_flyerRender` overlay pipeline.
4. **Saved flyer staleness** — `_flyerSavedRenderIsStale` compares stored `flyerTemplateSrc` / `flyerTemplateAssetVersion` vs current manifest; stale opens trigger re-render + `_flyerCommitFlyerData`.
5. **Asset versioning** — sparse `FLYER_FORCE_REFRESH_TEMPLATES` (13 keys); others use filename as version.
6. **Logo layer (r947)** — `layers.logo.enabled: false` everywhere; draw path exists but inactive.

---

## Risks and Coupling

### High — must preserve in extraction

| Coupling | Location | Risk if broken |
|----------|----------|----------------|
| Key suffix convention | `endsWith('-story')` in record builder; `indexOf('-story')` in `openFlyerForGig` | Wrong format → wrong dims/zones/grid |
| Parallel map key parity | All four globals must share same 30 keys | Missing zone/name → render gaps or wrong labels |
| `familyId` regex | `/-(square|story)$/` | Template family pairing logic breaks |
| Staleness triple | `flyerTemplateSrc`, `flyerTemplateAssetVersion`, `FLYER_FORCE_REFRESH_TEMPLATES` | Old JPEGs show after asset swap |
| Firestore field names | Save/load paths | Existing gigs lose flyer restore |
| PNG relative paths | `_flyerLoadImage` | Broken thumbs/previews if base path changes |
| Zone special keys | `bottomRuleShift`, `panelExtend`, `tagline`, `hideRule`, premium serif flags | Visual regressions per template |

### Medium

| Coupling | Notes |
|----------|-------|
| Direct `FLYER_NAMES` read | One remaining direct read in `openFlyerForGig` summary bar (~29242); rest routed through adapters |
| Direct `FLYER_DIMS` in `_flyerRender` | Canvas sizing still uses global, not record width/height |
| Direct `FLYER_FORCE_REFRESH_TEMPLATES` in staleness | Should move with manifest, not stay orphaned in `index.html` |
| Variable template count | Adapters already filter `Object.keys(FLYER_TEMPLATES)` — **do not** hardcode 15 in new manifest validator only; allow future shrink/grow |
| Logo layer defaults | New templates must include `layers.logo` disabled unless explicitly enabling |

### Low (out of scope)

- Home band image CSS/assets — **must not change** per project direction
- Flyer modal UX polish — deferred unless Rich reprioritizes

### Integrity gap today

**No flyer integrity tests** in `tests/integrity/` (only Home modularization packages). Extraction should add flyer manifest validation **before** moving runtime data out of `index.html`.

---

## Recommended Extraction Approach

### Target end state (incremental)

Single **flyer manifest** consumed by existing adapters — not a rewrite of render/save/UI.

```
flyer-manifest.js (or flyer-manifest.json + thin loader)
  ├─ formats: { square: {w,h}, story: {w,h} }
  ├─ templates: [ { key, familyId, format, name, backgroundSrc, assetVersion?, textZones, layers } ]
  └─ schemaVersion: 1
```

`index.html` keeps:

- `_flyerCtx`, modal UI, canvas render, Firestore save, autosave, share/download
- Adapter function **names** (stable public API inside the monolith)

### Phase F5 (proposed first runtime slice) — data-only extraction

1. Add `assets/flyer/flyer-manifest.js` (or `config/flyer-manifest.js`) exporting `window.OOT_FLYER_MANIFEST`.
2. Generate manifest from current globals (mechanical copy first — **no zone coordinate edits**).
3. Replace inline `FLYER_*` globals with manifest hydration:

   ```javascript
   // index.html (minimal change)
   var _flyerManifest = window.OOT_FLYER_MANIFEST;
   // adapters read from _flyerManifest.templatesByKey[key]
   ```

4. Keep `_flyerTemplateRecordForKey` signature and return shape **identical**.
5. Bump `WHATS_NEW_VERSION` + phone smoke: one square + one story template, saved flyer reopen, Gig Details thumb.

### What moves first

| Move in F5 | Stay in index.html initially |
|------------|------------------------------|
| `FLYER_TEMPLATES` | `_flyerRender` and text overlay drawing |
| `FLYER_ZONES` | `_flyerCtx`, modal DOM, event handlers |
| `FLYER_NAMES` | Firestore save/load orchestration |
| `FLYER_DIMS` | Share/chat/download menu actions |
| `FLYER_FORCE_REFRESH_TEMPLATES` | Canvas JPEG commit sizing logic |

### Backward compatibility

- **Template keys unchanged** — existing `flyerTemplateKey` in Firestore keeps working.
- **PNG filenames unchanged** — no redeploy asset renames in F5.
- **Adapter layer unchanged** — callers keep using `_flyerTemplateSrcForKey` etc.
- **Staleness logic unchanged** — same `assetVersion` tokens in manifest.
- **Optional:** manifest `schemaVersion` field for future migrations without key renames.

### What NOT to do in F5

- Do not add new templates
- Do not change zone coordinates or colors
- Do not enable logo layers
- Do not split render code into modules yet
- Do not change Home band image behavior

---

## Proposed First Runtime Slice (F5)

**Slice name:** F5 — external flyer manifest data extraction (adapter-preserving)

**Scope:** Move the five `FLYER_*` data globals into one external manifest file; wire adapters to read manifest; zero visual intent change.

**Files (expected):**

| File | Action |
|------|--------|
| `config/flyer-manifest.js` or `assets/flyer/flyer-manifest.js` | **New** — manifest data |
| `index.html` | Remove inline globals; add `<script src="...">` before flyer section; hydrate adapters |
| `tests/integrity/flyer-manifest-package.mjs` | **New** — validation gate |
| `docs/modularization/PHASE_F5_*_CHECKPOINT.md` | Post-merge checkpoint |

**Build Version:** Required if runtime load path changes (e.g. `2026-07-09-r950-flyer-manifest-extraction`).

---

## Required Validation Gates (before / with F5)

Add `tests/integrity/flyer-manifest-package.mjs` (or similar) asserting:

1. **Key parity** — every template has `name`, `backgroundSrc`, `textZones`, `format`, `familyId`.
2. **Format suffix rule** — `format === 'story'` iff `key.endsWith('-story')`; square keys must not end with `-story`.
3. **Family pairing** — optional warn if square/story family pairs are uneven (allow future variable counts).
4. **Dims consistency** — all square templates 1080×1080, all story 1080×1920.
5. **Asset version** — if `assetVersion` present, must be non-empty string; keys in force-refresh set must match manifest entries.
6. **Logo layer default** — `layers.logo.enabled === false` unless explicitly documented exception.
7. **No duplicate keys** — manifest `templatesByKey` is injective.
8. **PNG filename pattern** — `backgroundSrc` matches `/^oot_flyer_(square|story)_\d+_r\d+\.png$/` (guard typos).
9. **Adapter smoke** — extracted test harness calls `_flyerTemplateRecordForKey` for each key and verifies `backgroundSrc` + `textZones` non-null.

**Pre-merge phone gate (human):**

- Make Flyer → Square template 1 → Story template 1 → add text → close → Gig Details shows flyer
- Edit Saved Flyer → change template → Save to Gig (r949) → reopen
- Confirm Build Version matches F5 marker

---

## What Must Not Change

- Current flyer visuals and zone coordinates
- Flyer zone definitions (`FLYER_ZONES` values)
- Template key strings stored in Firestore
- External PNG asset filenames (until deliberate asset refresh slice)
- Home band image CSS, assets, layout, selector behavior, placement
- Flyer autosave / close-to-save semantics
- r949 Save to Gig menu action
- Expected untracked local files (`PHASE_6W_A_*`, `oot-local-server.ps1`)

---

## Explicit Next Step Recommendation

| Step | Owner tool | Action |
|------|------------|--------|
| **Now (complete)** | Cursor Agent read-only | F4 plan doc (this file) |
| **Next** | Cursor Agent bounded slice | **F5** — create `flyer-manifest` external data file + integrity tests + adapter hydration in `index.html` |
| **After F5 phone verify** | PowerShell | Compact commit/push + PHASE RESULT |
| **Later** | Cursor Agent | F6+ — optional render-helper extraction (only after manifest stable) |

Do **not** proceed to render modularization before manifest extraction and integrity gates pass.

---

## Summary Table

| Question | Answer |
|----------|--------|
| Templates external or base64? | **External PNG filenames** (30 assets) |
| Square / story count? | **15 + 15** (30 keys) |
| Adapter layer exists? | **Yes** (r946) — extraction should feed adapters, not bypass them |
| Logo layer active? | **No** (r947 scaffold, disabled) |
| Biggest extraction risk? | Zone map + staleness version parity across moved data |
| Safest first move? | External manifest JSON/JS with identical keys and adapter preservation |
| Integrity tests today? | **None for flyer** — add before F5 runtime move |
