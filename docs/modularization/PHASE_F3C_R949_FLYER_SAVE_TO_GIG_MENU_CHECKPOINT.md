# Phase F3c — r949 Flyer Save to Gig Menu Checkpoint

Date: 2026-07-09  
Commit: 3941167  
Build Version: 2026-07-09-r949-flyer-save-to-gig-menu

## Status

F3c is complete and pushed.

Phone verification passed.

## What changed

Added a visible `Save to Gig` action to the Make/Edit Flyer kebab menu.

The action calls the existing `_flyerSaveToGig()` function.

## Files changed

Runtime commit changed only:

- `index.html`

This checkpoint doc is documentation only.

## Why this was done

After r948, Make Flyer worked and saved correctly, but the save behavior was unclear because the menu only showed:

- Share Flyer
- Send to Band Chat
- Download as PNG

Phone testing proved the flyer was already saving to the gig, but the UX did not clearly expose the save action.

## Validation completed

Pre-commit validation:

- `index.html` only modified.
- Diff was small: 10 changed lines.
- Build Version set to `2026-07-09-r949-flyer-save-to-gig-menu`.
- Added r949 What’s New entry.
- Inline script extraction syntax check passed with Node exit code 0.

Post-push:

- Branch: main
- HEAD: 3941167
- Origin main: 3941167
- Commit message: `Add flyer Save to Gig menu action`

Phone/PWA verification:

- User updated phone/PWA to r949.
- Build Version confirmed r949.
- Calendar gig → Make Flyer / Edit Saved Flyer opened.
- Flyer kebab menu showed `Save to Gig`.
- `Save to Gig` worked.
- Flyer remained attached to the gig.

## Current decision

Do not spend more runtime effort on flyer UX/UI polish right now.

User direction:

- Continue the modularization / architecture goal.
- UX/UI revisions can be handled later after the architecture path is stable.

## Current untracked files to preserve

These existed before F3c and were intentionally not touched:

- `docs/modularization/PHASE_6W_A_REHEARSAL_CUE_PARITY_PLAN.md`
- `oot-local-server.ps1`

Do not stage, delete, rename, or edit them unless Rich explicitly approves.

## Next recommended slice

Return to modularization / flyer architecture.

Recommended next slice:

F4 — inspect and plan extraction of flyer template/config data from the monolithic `index.html`.

Goal:

- Understand current flyer template data shape.
- Identify safe seams for future external flyer assets/config.
- Preserve current flyer visuals and behavior.
- Do not add new templates yet.
- Do not change Home band image behavior.
