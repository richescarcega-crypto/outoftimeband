# Phase F3a — r948 Flyer Syntax / Scope Repair Checkpoint

Date: 2026-07-08  
Commit: 88ce11b  
Build Version: 2026-07-08-r948-flyer-syntax-scope-repair

## Status

F3a is complete and pushed.

## What was fixed

`index.html` had two flyer helper scope issues:

1. `_flyerLoadImage()` was missing its closing `}` after `img.src = src;`.
2. An extra `}` existed before `_flyerRender()`.

The r947 What’s New entry was also in the wrong scope inside `_verifyPendingUpdate()`. It was removed from that location and placed inside `WHATS_NEW_LOG`.

A new r948 What’s New entry was added at the top of `WHATS_NEW_LOG`.

## Files changed

Runtime commit changed only:

- `index.html`

This checkpoint doc is documentation only.

## Validation completed

Pre-commit validation:

- `index.html` only modified.
- Diff was small: 7 changed lines.
- Build Version set to `2026-07-08-r948-flyer-syntax-scope-repair`.
- r947 misplaced What’s New entry before `WHATS_NEW_LOG`: 0.
- Inline script extraction syntax check passed with Node exit code 0.

Post-push:

- Branch: main
- HEAD: 88ce11b
- Origin main: 88ce11b
- Commit message: `Repair flyer syntax scope and r948 changelog`

Phone/PWA verification:

- User manually updated through Home → Build Version → Update.
- Phone reported r948 running.
- Make Flyer opened correctly.
- Square templates loaded.
- Story templates loaded.
- Template selection and rendering worked.
- User created a flyer from a Calendar gig.
- Flyer saved to the gig despite no visible Save button.
- Calendar event detail showed the flyer attached.
- Tapping the attached flyer opened Edit Saved Flyer.

## Important follow-up

The flyer save behavior works, but the UX is unclear because there is no visible Save button.

Classify this as deferred cleanup / flyer UX clarity, not an F3a blocker.

Potential later improvement:

- Add `Saved to gig ✓`
- Add `Auto-saved`
- Add `Done / Save & Close`
- Add `Save to Gig` in the flyer kebab menu

Do not derail the next flyer architecture slice for this unless Rich specifically prioritizes it.

## Current untracked files to preserve

These existed before F3a and were intentionally not touched:

- `docs/modularization/PHASE_6W_A_REHEARSAL_CUE_PARITY_PLAN.md`
- `oot-local-server.ps1`

Do not stage, delete, rename, or edit them unless Rich explicitly approves.

## Next recommended slice

Continue the flyer workstream after this checkpoint.

Recommended next slice:

F3b / F4 planning: inspect current flyer menu/save/autosave behavior and document the intended flyer UX before adding new flyer template assets or manifest/config work.

Keep the Home band image locked. Do not change Home image CSS, placement, assets, or selector behavior.
