# r944 Modularization Manual Checklist

## Current branch

- Branch: modularization-next-safe-audit
- Production reference: r943
- Active workstream: strict modularization only

## Required local checks

Run with normal npm when available:

npm run audit:modules
npm run test:integrity

On this machine, system npm is unavailable. Use Cursor bundled node.exe:

& "C:\Users\rescarcega\AppData\Local\Programs\cursor\resources\app\resources\helpers\node.exe" tools/audit-modules.mjs

& "C:\Users\rescarcega\AppData\Local\Programs\cursor\resources\app\resources\helpers\node.exe" tests/integrity/r941-package.mjs

Expected result:

- Module audit passes.
- Integrity check passes.
- Active modules are:
  - oot_ui_feedback_r944.js
  - oot_version_r941.js
  - oot_compat_r941.js
- No active module contains saved HTML document markup.
- Old unsafe oot candidate files are not wired.

## Manual browser / phone checks

After any modularization change:

1. App loads to Home.
2. Bottom tabs render.
3. Home remains active on initial load.
4. Home menu opens.
5. Build Version opens.
6. Build Version shows current build reference.
7. Build Version copy action works.
8. Build Version modal closes cleanly.
9. No old unsafe candidate module file is loaded.
10. No Flyer, Calendar, Chat, Songs, Setlists, Notifications, Firebase config/rules, Home behavior, Pay, or opM/clM changes unless explicitly scoped.

## Hard stop conditions

Stop and do not continue if:

- module audit fails,
- integrity fails,
- an active module contains HTML document markup,
- old candidate files are wired,
- app does not load to Home,
- Build Version does not open or close cleanly.