# Home Layout Pilot Audit

Purpose: identify and isolate the Home layout/render lifecycle before making more visual changes. The Home screen currently has competing legacy CSS, inline styles, alert-row transforms, fixed gig-slot sizing, and HOME_IMAGE_PRESENTATION inline rendering. The goal is a permanent modular layout system suitable for monetization/white-label use, not another quick CSS patch.
## Known Findings From Production Rescue Detour

Production baseline:
- Current production/main is commit `8a7ecc6` — `Rollback broken Home layout contract`.
- The failed Home layout-contract rescue commits were rolled back from production.
- The catastrophic issue where Next Gig countdown numbers floated across every page is fixed.

Original unresolved bug:
- Home can render correctly.
- Home can become misformatted after tab navigation, especially Chat to Home.
- Repeated refreshes can sometimes restore the correct layout.
- Bad state shows incorrect Home pill placement and the band/social image region squeezed/cropping feet.

Failed hypothesis:
- A local `_onHomeActivated()` timing wrapper was tested and removed.
- Delaying Home image presentation refresh after Home activation did not fix the issue.
- Therefore the root cause is not merely `rHome()` running too early after tab activation.

Current root-cause direction:
- Home is over-constrained by competing layout systems.
- Key competing areas:
  - `.hero.home-hero-with-controls`
  - `#home-alerts-row`
  - `#home-song-vote-cue`
  - `#home-rehearsal-cue`
  - `#next-gig-countdown`
  - `#no-gigs-card`
  - `#home-social-row`
  - `.home-band-backdrop`
  - `HOME_IMAGE_PRESENTATION`
- Old CSS includes alert-row transforms and hero-height compression when alerts are visible.
- Home image presentation also applies inline styles after render.
- The permanent fix should introduce a single Home layout owner, not another CSS patch.



## Proposed Home Module Boundary

The Home pilot should create an ownership boundary before any further visual tuning.

Proposed module/controller responsibilities:

1. `HomeController`
   - Owns Home tab entry/exit behavior.
   - Coordinates Home render order.
   - Calls sub-renderers in a deterministic sequence.
   - Eventually replaces direct `go('home') -> rHome()` coupling.

2. `HomeAlertRail`
   - Owns Song Vote Pending and Rehearsal On Deck pill state.
   - Determines one-pill vs two-pill layout.
   - Removes dependency on scattered `:has(...)` CSS and transform overlays.
   - Should expose a simple state such as `none`, `song`, `rehearsal`, or `both`.

3. `HomeGigSlot`
   - Owns Next Gig and No Gig display.
   - Provides a stable gig/no-gig footprint without leaking countdown styling into other screens.
   - Avoids one-off viewport-specific hard locks unless they are part of a named layout token.

4. `HomeBandImagePresentation`
   - Owns `HOME_IMAGE_PRESENTATION` values and application.
   - Removes or supersedes old scattered `.home-band-backdrop` CSS overrides.
   - Ensures image placement is deterministic across normal and Rehearsal On Deck states.

5. `HomeLayoutContract`
   - Defines named vertical regions instead of layered CSS patches:
     - logo/hero region
     - alert rail
     - gig slot
     - band/social image region
   - Must be responsive and white-label friendly.
   - Must not use hidden transform overlays as the main layout mechanism.

6. `HomeDiagnostics`
   - Captures computed heights and state for the Home regions.
   - Used during development only.
   - Should make it obvious whether Home is in a good or bad layout state.

First implementation rule:
- Do not start by changing visual constants.
- Start by mapping existing CSS/JS ownership and extracting/isolating responsibilities.
- The first code change should create a small safe seam, not rewrite Home layout in one pass.


## Home CSS/JS Ownership Map

Current Home ownership is split across several legacy systems. This is the source of the instability.

### 1. Legacy Home social/image CSS patches

Observed owners:
- r76 through r105-era CSS blocks
- repeated `#home-social-row` rules
- repeated `.home-band-backdrop` rules
- repeated social button sizing and transform rules
- rehearsal-state `:has(...)` overrides

Problem:
- These rules continue to affect the same elements that the later registry also controls.
- Some rules use high specificity and `!important`.
- Some rules target rehearsal visibility directly, even though the current registry mode now returns `normal`.

Target module:
- `HomeBandImagePresentation`

Required direction:
- Inventory all `.home-band-backdrop` and `#home-social-row` CSS blocks.
- Decide which are obsolete.
- Move surviving behavior into one owner: registry values plus one clean renderer.
- Do not add new image-position CSS blocks.

### 2. Home Alert Rail

Observed owners:
- r732 reusable Home alerts row
- r798 alert overlay retry
- r823 alert-to-Next-Gig gap correction
- r824 alert backing fill
- `renderHomeSongVoteCue()`
- `renderHomeRehearsalCue()`

Problem:
- Alert row began as a reusable row, then evolved into a transform/overlay layout.
- r823 comments confirm the pills are painted as a zero-height overlay row pulled upward.
- This makes visual spacing differ from actual layout space.
- This is fragile when the logo, gig slot, and band image all compete for the same viewport.

Target module:
- `HomeAlertRail`

Required direction:
- Replace transform/overlay behavior with an explicit in-flow alert rail.
- Alert state should be computed as `none`, `song`, `rehearsal`, or `both`.
- One active pill should have a deterministic layout.
- Two active pills should have a deterministic layout.
- Do not use hidden transforms as the main spacing mechanism.

### 3. Home Gig Slot

Observed owners:
- `#next-gig-countdown`
- `#no-gigs-card`
- `updateCountdown()`
- `renderNoGigsCard()`
- r777/r778 fixed/shared gig slot behavior

Problem:
- The gig slot was locked to stabilize Next Gig vs No Gig states.
- That lock competes with hero height, alert rail height, and the flexible band/social region.
- The slot itself should be stable, but it should be owned by one layout contract rather than by scattered CSS.

Target module:
- `HomeGigSlot`

Required direction:
- Keep the concept of a stable gig/no-gig footprint.
- Move it into a named layout contract.
- Ensure countdown styling cannot leak outside Home.
- Avoid viewport-specific magic numbers unless represented as named tokens.

### 4. Home Image Presentation Registry

Observed owners:
- `HOME_IMAGE_PRESENTATION`
- `HOME_IMAGE_PRESENTATION_DEFAULTS`
- `_applyHomeImagePresentation()`
- `_refreshHomeImagePresentation()`
- `_scheduleHomeImagePresentationRefresh()`
- legacy CSS blocks that still target `.home-band-backdrop`

Problem:
- The registry exists, but it is not the only source of truth.
- r594 comments indicate inline `!important` styles were needed because older CSS overrode the registry.
- This is a sign that ownership is not clean.

Target module:
- `HomeBandImagePresentation`

Required direction:
- Registry should become the only image placement source of truth.
- CSS should provide the frame/container only.
- JS registry should set image placement.
- Old competing CSS should be removed only after ownership is mapped and tests are defined.

### 5. Home Layout Contract

Observed competing regions:
- logo/hero region
- alert rail
- gig/no-gig slot
- band/social image region
- bottom tab bar

Problem:
- Current Home is a vertical budget problem.
- When both alert pills are visible, the hero + alert row + gig slot consume too much height and the band image region is squeezed.
- Previous quick fixes tried to move individual regions instead of defining the whole vertical layout.

Target module:
- `HomeLayoutContract`

Required direction:
- Define one vertical layout budget for Home.
- Make layout responsive to viewport height.
- Keep white-label/tenant use in mind.
- Do not rely on S26/S22-specific magic numbers.
- Do not use transform overlays as primary layout.


## Architecture Mandate

The Home issue is not to be treated as a cosmetic defect. It is evidence that the monolithic Home implementation no longer has a single owner.

The project goal is a stable, maintainable, monetizable, white-label-capable app. That goal dictates the path forward.

Permanent direction:
- Do not continue patching Home with isolated CSS edits.
- Do not optimize for fastest visible improvement.
- Do not add new magic numbers to make one phone state look correct.
- Do not reintroduce the failed Home layout-contract rescue path.
- Do not make production Home changes until the modular Home ownership model is defined and the test criteria are explicit.

Required architecture before behavior changes:
1. Define Home module boundaries.
2. Map legacy Home CSS and JS ownership.
3. Decide which legacy systems are transitional and which are target-state.
4. Define a migration order that avoids changing all Home behavior at once.
5. Define Home test states before code changes.
6. Only then create the first code seam.

Target-state principle:
- Home must have one layout owner.
- Alert rail, gig slot, and band image presentation must not fight for viewport space through unrelated CSS patches.
- Layout must be driven by named regions/tokens and state, not hidden transforms and accumulated overrides.
- The implementation must support future tenant branding, alternate logos, different image sets, different alert types, and different device sizes.

Decision:
- Continue modularization.
- Home is the pilot module.
- The first phase is architecture and ownership isolation.
- Visual correction comes after ownership is established, not before.

