# r941 manual phone checklist

Use after `npm test` passes (or after reviewing documented integrity failures).

## r941-critical

- [ ] App loads on phone without black screen.
- [ ] Home renders (logo, Next Gig / No Gig card, band image area, tab bar).
- [ ] Home → kebab → **Build Version** opens and shows **r941**.
- [ ] Home → kebab → **Display Mode** opens and behaves correctly (inline r939 path).
- [ ] DevTools → Network: confirm **no** request for `oot_display_r940.js`.

## Short regression pass

- [ ] Name picker works on a fresh install / cleared storage.
- [ ] Tab bar opens each tab once: Home, Calendar, Chat, Songs, Setlists, Mates, Pay.
- [ ] One Firebase-backed read (e.g. Chat messages load).
- [ ] PWA/cache: deployed vs running version check if applicable.

## Notes

- Automated smoke tests stub Firebase and block OneSignal; they do not replace this phone pass.
- If static integrity fails on `oot_version_r941.js` / `oot_compat_r941.js` HTML corruption, fix those module files before treating r941 as a modularization gate.
