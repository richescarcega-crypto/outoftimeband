# Flyer Methodology Plan - White Label / Monetization Direction

## Controlling product goal
Build Out of Time into a stable, maintainable, monetizable, white-label-capable app.

Flyer work must be methodology work, not a one-off replacement of the currently uploaded flyer images.

## Current state after r945
- main/origin main: f061e84
- visible Build Version: 2026-07-08-r945-reminder-backend-prep
- Current flyer system has 15 square and 15 story external PNG backgrounds in FLYER_TEMPLATES.
- Current template IDs are style/format pairs such as hollywood-square, hollywood-story, through oot15-square and oot15-story.
- FLYER_ZONES stores editable text overlay positions.
- FLYER_NAMES stores display names.
- Saved flyers store flyerData JPEG plus flyerTemplateKey, flyerFormat, flyerTemplateSrc, flyerTemplateAssetVersion, and editable venue/address/date/time/announcement fields.

## User direction
- User currently has 30 flyer images: 15 square and 15 story.
- Those images are outdated and may be replaced.
- Future loaded set may be smaller, likely 5 or 6 square and 5 or 6 story.
- Do not assume exactly 15 square and 15 story assets.
- Build a methodology.

## Required future flyer composition
Flyer equals:
1. background template image
2. optional band/group image layer
3. optional logo layer
4. editable gig text overlays
5. saved rendered JPEG/output

## Logo requirement
Current Out of Time logo support must not become a hard-coded product limitation.

For monetization and white-label use, the flyer system must allow:
- Out of Time logo ON
- logo OFF
- any replacement logo asset
- future white-label customer logo
- no baked-in requirement that every flyer uses the Out of Time logo

Preferred design:
- logo is a configurable render layer
- logo source is data/config driven
- logo placement is controlled by template config
- logo can be disabled per template or per flyer

## Asset methodology
New flyer assets should be external files, not embedded base64 blobs.

Preferred future paths:
- flyers/square/flyer_square_01.png
- flyers/story/flyer_story_01.png
- flyers/logos/out-of-time-logo.png
- flyers/logos/customer-logo.png

If folders add deployment risk, root-level names are acceptable temporarily:
- flyer_square_01.png
- flyer_story_01.png
- flyer_logo_oot.png

## Template manifest direction
Move toward one manifest-style structure instead of separate maps that can drift apart.

Manifest should include:
- id
- familyId
- name
- format
- width and height
- backgroundSrc
- active flag
- optional band/group image layer config
- optional logo layer config
- textZones

## Selector UX methodology
Selector must render from active configured templates.

It must support:
- 5 square and 5 story
- 6 square and 6 story
- 15 square and 15 story
- future added/removed templates without logic rewrites

The app must not show blank template slots when fewer assets are loaded.

## Backward compatibility
Existing saved flyers reference legacy flyerTemplateKey values.

Migration must preserve:
- old saved flyer rendering where assets still exist
- old flyerData JPEG previews
- flyerTemplateSrc and asset-version stale-render detection, or a cleaner manifest-based replacement
- gig detail saved flyer cards

## Non-goals for immediate next slice
- Do not replace current flyer images yet.
- Do not touch Home band images.
- Do not hard-code Out of Time logo into new render logic.
- Do not delete old templates until new methodology is tested and approved.

## Recommended implementation slices

### Slice F1 - Manifest adapter, no behavior change
Create helper functions that read current FLYER_TEMPLATES, FLYER_ZONES, and FLYER_NAMES through one compatibility adapter.

Goal: no visible behavior change; existing 15 + 15 templates still work; establish one place to later add optional logo/band-image layers.

### Slice F2 - Optional logo layer scaffold
Add config fields for optional logo rendering, but do not change current flyers until assets/config are approved.

Goal: support white-label logo on/off while preserving current flyer visuals unless explicitly enabled.

### Slice F3 - New reduced asset set test
Add a small new flyer set, such as 5 square + 5 story, using the manifest.

Goal: prove variable-count selector, square/story pairing, logo optionality, and saved flyer compatibility.

### Slice F4 - Selector UX upgrade
Apply Home Band Image selector pattern: sticky header, sticky close/X, visible square/story controls, scrolling thumbnails, preview, Dismiss, Select.

## Handoff requirement
Every future handoff package and 001 LOAD FIRST must include this flyer methodology direction:
- build methodology, not one-off image replacement
- variable count support
- square/story formats
- flyer-specific assets separate from Home images
- optional/swap-any-logo support
- editable gig text overlays
- white-label/monetization goal
