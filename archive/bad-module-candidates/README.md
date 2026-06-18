# Archived stale module candidates

## Purpose

This folder holds superseded `oot_*` module candidates that were moved out of the repo root in commit `59a3da2` ("Archive stale module candidates"). Keeping them here preserves history and rollback context without polluting the active modularization surface.

## Why these files are archived

These files are **not valid runtime modules**. They are saved HTML or transcript artifacts that start with `<!DOCTYPE html>`, not clean JavaScript extracted from the app. Several came from abandoned or failed modularization attempts.

In particular, **`oot_display_r940.js` must not be used with r941 or later builds**. The r940 Display Mode extraction failed phone testing; r941 rolled back to inline Display Mode while keeping Build Version externalized.

Do not wire any file from this folder into `index.html` without rebuilding it as real JS from verified source in `index.html`.

## Contents

| File | Notes |
|------|-------|
| `oot_version_r937.js` | Stale Build Version candidate |
| `oot_version_r938.js` | Stale Build Version candidate |
| `oot_version_r939.js` | Stale Build Version candidate |
| `oot_version_r940.js` | Stale Build Version candidate |
| `oot_compat_r939.js` | Stale compat candidate |
| `oot_compat_r940.js` | Stale compat candidate |
| `oot_display_r940.js` | Failed Display Mode extraction -- **never wire** |

## Rules for agents and contributors

- **Do not** add `<script src="...">` tags in `index.html` pointing to any file in this folder.
- **Do not** move or copy these files back to the repo root and treat them as active modules.
- **Do not** use them as rollback targets without re-extracting and validating fresh JS from `index.html`.
- **Do not** delete them casually; they exist as documented history of what not to reuse.

## Active wired modules (repo root only)

Only these `oot_*` files belong at repo root and may be wired by `index.html`:

- `oot_version_r941.js`
- `oot_compat_r941.js`
- `oot_ui_feedback_r944.js`

Before changing modular wiring, run:

- `tools/audit-modules.mjs` (or `npm run audit:modules`)
- `tests/integrity/r941-package.mjs` (or `npm run test:integrity`)

## Related documentation

See `MODULARIZATION_AUDIT_UNSAFE_JS_FILES.md` at the repo root for the broader audit of unsafe candidate JS files beyond this archive.

