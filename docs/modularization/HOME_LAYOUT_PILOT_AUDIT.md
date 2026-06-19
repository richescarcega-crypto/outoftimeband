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

