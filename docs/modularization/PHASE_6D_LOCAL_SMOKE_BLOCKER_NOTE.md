# Phase 6d Local Smoke Blocker Note

## Status at time of note

Phase 6d was pushed successfully.

Remote state:

* Branch: `modularization-home-layout-engine-pilot`
* HEAD/origin: `2e4ff1ac11a5a9111d146addd18de1e58a4e1fd3`
* Latest commit: `2e4ff1a Add HomeController go('home') entry orchestration (Phase 6d)`
* HEAD == origin: yes
* Working tree: clean except untracked `oot-local-server.ps1`
* Phase 6e not started

## What happened

During Phase 6d post-commit manual smoke, the local browser/server workflow became blocked by local Windows/Cursor environment problems, not by a confirmed app regression.

The attempted local smoke path created repeated friction:

* Cursor attempted a Chrome DevTools Protocol smoke runner.
* The CDP smoke runner hung.
* Temporary file `cdp-smoke.mjs` was checked and confirmed absent afterward.
* Manual local server path used `oot-local-server.ps1`.
* `oot-local-server.ps1` remained untracked and local-only.
* Local server attempts produced repeated listener/socket errors, including:
  * `AcceptTcpClient` listener state issue.
  * Port `18766` already in use.
  * repeated local server failures unrelated to committed Phase 6d app code.
* Chrome/localhost testing became a workflow blocker.
* The decision was made to stop local-server debugging and push the narrow Phase 6d commit based on passed integrity gates, forbidden checks, and approved diff.

## Important conclusion

Do not treat this as a Phase 6d app failure.

Treat it as a local smoke environment blocker.

Phase 6d code status before push:

* Integrity gates passed.
* Forbidden checks passed.
* No Home visual/layout modules were touched.
* No reconcile ownership was moved to the controller.
* `modular-inflow` was not enabled by default.
* Song Vote Pending pill was not fixed and remains a known pre-existing issue.
* `cdp-smoke.mjs` was absent.
* `oot-local-server.ps1` remained untracked and was not committed.

## Future-agent rule

Do not repeat the local-server debugging loop.

For future HomeController / HomeLayoutEngine phases:

1. Verify repo state first.
2. Run integrity tests.
3. Run forbidden string and invariant checks.
4. If browser smoke is needed, use a known-good server path only.
5. If local server fails quickly, stop. Do not debug the local server for more than one short attempt.
6. Do not use Chrome DevTools Protocol smoke runners unless explicitly approved.
7. Do not create or leave temp smoke files.
8. If local smoke is blocked by local environment issues, document the blocker and proceed based on code gates/diff review, or stop for user decision.

## Explicitly avoid

Do not do any of the following unless the user explicitly asks:

* Rebuild `oot-local-server.ps1`.
* Keep retrying port `18766`.
* Kill random processes.
* Create CDP smoke scripts.
* Ask the user to run long console snippets.
* Spend the session debugging local Windows server setup.
* Confuse local smoke failure with app code failure.

## Current preferred decision rule

If integrity gates pass, forbidden checks pass, and the diff remains narrow, a local smoke blocker alone should not derail the branch.

Document the limitation and continue only after user approval.
