# Phase F3b — Flyer UX / Data Flow Inspection

Date: 2026-07-09  
Starting HEAD: fc03348  
Build Version: 2026-07-08-r948-flyer-syntax-scope-repair

## Status

Read-only inspection completed after r948 phone verification.

## Current repo state at inspection

- Branch: main
- HEAD: fc03348
- Origin main: fc03348
- Runtime repair r948 is already committed and pushed.
- r948 checkpoint doc is already committed and pushed.

Expected untracked files remain untouched:

- `docs/modularization/PHASE_6W_A_REHEARSAL_CUE_PARITY_PLAN.md`
- `oot-local-server.ps1`

## Phone-observed flyer behavior

From Calendar gig detail:

1. Tap a gig.
2. Tap Make Flyer.
3. Make Flyer page opens.
4. Square flyer templates load.
5. Story flyer templates load.
6. Template selection/change works.
7. Rendered preview at the bottom updates correctly.
8. User can add flyer info.
9. There is no visible Save button.
10. Closing/saving behavior still persists the flyer.
11. Calendar event detail shows the flyer attached to the gig.
12. Tapping attached flyer opens Edit Saved Flyer.

Conclusion: save-to-gig behavior works, but the UX does not clearly tell the user that saving is happening or already completed.

## Current flyer menu behavior

Observed phone menu on Make Flyer:

- Top-right gold kebab menu.
- Menu options:
  - Share Flyer
  - Send to Band Chat
  - Download as PNG

No visible Save / Save to Gig / Done wording appears in that menu.

## Code locations found

Primary modal/header:

- Make Flyer modal header around line 19259
- Top-right flyer kebab button calls `_flyerToggleMore(event)`

Template controls:

- `_flyerSetFormat('square')`
- `_flyerSetFormat('story')`

Core render/save functions found:

- `_flyerRender`
- `_flyerShare`
- `_flyerToggleMore`
- `_flyerRenderMoreOptions`
- `_flyerCommitFlyerData`
- `_flyerCloseModal`
- `_flyerSaveToGig`
- `viewSavedFlyer`

Saved flyer data fields found:

- `flyerData`
- `flyerTemplateKey`
- `flyerTemplateSrc`

Constants / architecture:

- `FLYER_TEMPLATES`
- `FLYER_ZONES`
- `FLYER_NAMES`
- `FLYER_DIMS`
- `_flyerTemplateRecordForKey`
- `_flyerTemplateSrcForKey`

## Important historical clues

The file includes earlier notes indicating that Make Flyer autosave/save-feedback existed:

- r465: Make Flyer save-feedback and announcement persistence.
- r466: Make Flyer feedback hardening, including inline Saving/Saved status near the Announcement field and immediate template-tap feedback.

The current user-visible issue is therefore likely a UX clarity regression or hidden feedback issue, not a missing data model.

## Classification

This is not an r948 blocker.

Classify as:

- Deferred cleanup / current flyer UX clarity
- Safe next coding slice after documentation

## Recommended next coding slice

F3c — Flyer save clarity polish.

Goal:

Make the existing save behavior obvious without changing flyer rendering, template data, or saved flyer storage.

Preferred small options:

1. Add visible text near the header or details area:
   - `Auto-saved to gig`
   - `Saved to gig ✓`

2. Add a `Done` or `Done / Saved` button if existing close behavior already commits flyer data.

3. Add `Save to Gig` to the flyer kebab menu only if it calls the already-existing `_flyerSaveToGig()` and does not duplicate or break autosave.

Boundary:

Do not add new templates yet.  
Do not change Home image behavior.  
Do not change flyer zones or rendering unless specifically required by the save clarity fix.  
Keep the slice small and testable.
