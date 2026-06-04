# Modularization Audit Note — Unsafe Candidate JS Files

Date: 2026-06-03
Branch: modularization-next-safe-audit

## Finding

A repo audit found many candidate `*.js` files that are not clean JavaScript modules. They start with `<!DOCTYPE html>`, which indicates they are exported/saved HTML pages or transcript artifacts rather than usable extracted app modules.

These files must not be wired into `index.html` without rebuilding them from the real source in `index.html`.

## Currently safe / active modular files

- `oot_version_r941.js`
- `oot_compat_r941.js`
- `OneSignalSDKWorker.js`
- `playwright.config.js`

## Unsafe / do-not-wire candidate files

The following files were detected as starting with `<!DOCTYPE html>`:

- `app_r914.js`
- `band_contacts_resize_r922.js`
- `calendar_drawer_r918.js`
- `calendar_helpers_r928.js`
- `calendar_keyboard_r926.js`
- `calendar_key_r921.js`
- `calendar_layout_r914.js`
- `calendar_layout_r916.js`
- `calendar_lifecycle_r919.js`
- `calendar_today_r920.js`
- `calendar_viewport_r917.js`
- `contact_keyboard_r924.js`
- `flyer_resize_r923.js`
- `notif_log_r935.js`
- `oot_compat_r939.js`
- `oot_compat_r940.js`
- `oot_display_r940.js`
- `oot_version_r937.js`
- `oot_version_r938.js`
- `oot_version_r939.js`
- `oot_version_r940.js`
- `proven_helpers_r930.js`
- `setlist_create_keyboard_r925.js`
- `settings_modals_r934.js`
- `shared_dialogs_r933.js`
- `songs_keyboard_r927.js`
- `ui_helpers_r928.js`
- `version_modal_r932.js`
- `whats_new_r931.js`

## Rule going forward

Do not wire old candidate module files into production. For each next modularization step, extract fresh code directly from the verified source `index.html`, create a clean module, wire only that module, then run integrity and smoke tests.

## Current recommendation

Continue with fresh extraction of one small, low-risk utility boundary after Build Version. Do not touch Display Mode, Calendar, Chat, Songs, Setlists, Flyers, Notifications, Firebase config/rules, Home behavior, or Pay unless explicitly scoped.

## Local verification note - 2026-06-04

On branch modularization-next-safe-audit, direct Node integrity check was run with Cursor's bundled node.exe because system node/npm are not available on this machine. Integrity passed. Playwright smoke test was not run locally because npm is unavailable and node_modules is not installed. App behavior was not edited.
