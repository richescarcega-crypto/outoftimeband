# Phase F2b — Flyer Architecture Checkpoint After r946/r947

Date: 2026-07-08
Current branch: main
Current HEAD / origin main: 9ef41eb
Current visible Build Version: 2026-07-08-r947-flyer-optional-logo-layer

## Purpose

This checkpoint records the completed flyer architecture slices r946 and r947 before continuing into the next flyer manifest/config work.

This is a documentation-only checkpoint. No runtime code, CSS, Firebase, service worker, template assets, or app behavior is changed by this file.

## Governing objective

Build Out of Time into a stable, maintain, monetizable, white-label-capable app.

Flyer work must support that objective by moving away from hardcoded one-off assumptions and toward configurable template/layer methodology.

## Current verified state

- Branch: main
- HEAD: 9ef41eb
- origin/main: 9ef41eb
- Latest merged commit: 9ef41eb Add optional flyer logo layer scaffold
- Visible Build Version: 2026-07-08-r947-flyer-optional-logo-layer
- Expected untracked files remain:
  - docs/modularization/PHASE_6W_A_REHEARSAL_CUE_PARITY_PLAN.md
  - oot-local-server.ps1

## Completed slice r946 — Flyer template manifest adapter

Commit: 5e47f31 Add flyer template manifest adapter

Purpose:

- Route flyer template reads through helper/adapter functions.
- Prepare the flyer system for variable template counts.
- Reduce direct assumptions that the template system will always be fixed-size or hardcoded in one shape.
- Preserve current visual behavior.

Key helpers added:

- _flyerTemplateRecordForKey
- _flyerTemplateExists
- _flyerTemplateKeysForFormat
- _flyerTemplateNameForKey
- _flyerTemplateZonesForKey
- _flyerTemplateSrcForKey

## Completed slice r947 — Optional flyer logo layer scaffold

Commit: 9ef41eb Add optional flyer logo layer scaffold

Purpose:

- Add disabled-by-default optional flyer logo-layer plumbing.
- Prepare future flyer templates to support logo on, logo off, alternate/customer logo, and white-label customer logo.
- Preserve current visual behavior by keeping the legacy optional logo layer disabled by default.

Key helpers added:

- _flyerLayerConfigForKey
- _flyerLayerImageCache
- _flyerDrawImageLayer
- _flyerDrawConfiguredLayers

## Flyer methodology carried forward

The current 30-image idea is not the final target. Future flyer sets may be smaller, for example 5 or 6 square and 5 or 6 story templates.

Do not hardcode the methodology around exactly 15 square and 15 story assets.

Future flyer composition should support:

- background/template image
- optional band/group image layer
- optional logo layer
- editable gig text overlays
- saved rendered output

Venue/date/time/announcement text must remain editable app overlay text. Do not bake event-specific gig information into template image assets.

Existing templates should not be deleted until new templates are tested and approved.

## Current non-goals

Do not change the Home band image system as part of flyer work.

Do not change Home band image CSS, layout, placement, assets, or selector behavior unless the user explicitly asks.

Do not perform a large flyer rewrite in the next slice. Continue with bounded manifest/config structure work.

## Recommended next slice — F3

F3 should continue toward a configurable flyer manifest/config structure.

Recommended F3 goals:

- Define a clear flyer manifest/config record shape.
- Support variable template counts by format.
- Keep current templates working.
- Preserve editable gig text overlays.
- Prepare optional logo and optional image-layer configuration.
- Avoid deleting legacy templates.
- Bump Build Version if runtime/app behavior or configuration-read behavior changes.

Likely next Build Version if F3 runtime work is merged:

2026-07-08-r948-flyer-manifest-config

## Process notes

PowerShell command outputs that need to be pasted back must include START COPY THIS TO CHAT and END COPY THIS TO CHAT markers printed in Magenta.

If PowerShell enters >> continuation mode, stop immediately, press Ctrl+C, and restart with one compact recovery command.

Build Version bumps are required for runtime work that should be reflected in the app, including architecture work. Pure docs-only checkpoints are exempt.
