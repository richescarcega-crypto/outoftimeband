# Phase 5d Pilot Verification Results

**Branch:** `modularization-home-layout-engine-pilot`  
**Base commit:** `eb00846` — *Add Home layout engine pilot budget math*  
**Verification phase:** 5d-verify only (no tuning code changes)  
**Date:** 2026-06-01  
**Production default unchanged:** `legacy-overlay` (pilot off unless `?homeLayoutPilot=1` or `localStorage oot_home_layout_pilot=1`)

---

## Executive summary

| Area | Result |
|------|--------|
| **Overall pilot H-matrix (5d pass bar)** | **FAIL** — dense states do not meet `socialRow.clientHeight ≥ 96` at `scHomeH ≥ 540` |
| **Snap / late slot entry (pilot)** | **PASS** — in-flow alert rail stable; no 301→153→88 sequence observed in prior pilot runs |
| **Alert rail in-flow (pilot)** | **PASS** — `alertsRow.clientHeight` ~58 (single) / ~64 (dual) when cues visible |
| **Budget token honesty** | **FAIL** — JS compresses `--home-slot-hero-h` but dense CSS binds hero to fixed `--home-slot-hero-h-dense` (324px) |
| **Integrity scripts** | **BLOCKED** — `node` not available in verification environment; manual banned-path grep **PASS** |
| **Device H-matrix completion** | **PARTIAL** — prior S26 pilot observations + static math; full screenshot matrix **pending owner capture** |

**Recommendation:** Do **not** merge pilot to production default. After review, proceed to **5d-tune** (pilot files only): bind dense hero CSS to compressed `var(--home-slot-hero-h)` and align `--home-slot-hero-h-dense` writes with budget pass 2/3. Do **not** edit legacy CSS in `index.html`.

---

## Verification environment

| Item | Value |
|------|-------|
| Primary device (target) | Samsung S26 Ultra / Android Chrome |
| Reference `#sc-home.clientHeight` | ~552px (S26 with tab bar) |
| Reference `viewportH` | ~800px inner height → `bandMinPx = 96` |
| Pilot URL | `index.html?homeLayoutPilot=1&homeLayoutDiag=1&v=5d-Hx` |
| Legacy control URL | `index.html?homeLayoutDiag=1&v=5d-legacy-Hx` (no `homeLayoutPilot=1`) |
| Agent environment limits | No `node`, no Python, no on-device browser — integrity scripts not executed; device screenshots not captured in this session |

---

## Integrity & banned-path checks

### Automated (blocked)

```powershell
node tests/integrity/home-layout-engine-package.mjs
node tests/integrity/home-diag-package.mjs
node tests/integrity/home-alert-rail-package.mjs
node tests/integrity/home-gig-slot-package.mjs
```

**Status:** Not run — `node` not found on verification host. Re-run on a machine with Node before any 5d-tune merge.

### Manual static checks (this session)

| Check | Result |
|-------|--------|
| `index.html` has no static `data-home-layout-mode="modular-inflow"` | PASS |
| Pilot scoped in `oot_home_layout_engine.css` via `[data-home-layout-mode="modular-inflow"]` only | PASS |
| `reconcileHomeLayout('rHome')` hook present in `index.html` (~30749) | PASS |
| Forbidden strings in pilot JS/CSS (`HomeLayoutContract`, footprint attrs, `_homeMaybeLockAlertsFootprint`, etc.) | PASS (absent from pilot modules) |
| Pilot modules wired in `index.html` after gig/alert modules | PASS |

---

## Console measurement procedure

Run after each H-state settles (~2–5s post-Firestore) and after tab-return paths (H8/H9):

```javascript
(function () {
  var sc = document.getElementById('sc-home');
  var hero = document.querySelector('#sc-home .hero.home-hero-with-controls');
  var b = window.__ootHomeLayoutBudget || {};
  var cs = sc && getComputedStyle(sc);
  return {
    mode: typeof getHomeLayoutMode === 'function' ? getHomeLayoutMode() : null,
    pilot: window.__ootHomeLayoutPilotEnabled,
    alertState: typeof getAlertRailState === 'function' ? getAlertRailState() : null,
    gigState: typeof getGigSlotState === 'function' ? getGigSlotState() : null,
    scHomeH: sc?.clientHeight,
    budget: b.computed,
    tokens: b.tokens,
    tokenVsDom: {
      heroToken: b.tokens?.['--home-slot-hero-h'],
      heroDenseToken: b.tokens?.['--home-slot-hero-h-dense'],
      heroDom: hero?.clientHeight,
      heroCssVar: cs?.getPropertyValue('--home-slot-hero-h').trim(),
      heroDenseCssVar: cs?.getPropertyValue('--home-slot-hero-h-dense').trim(),
      alertsToken: b.tokens?.['--home-slot-alert-rail-h'],
      alertsDom: document.getElementById('home-alerts-row')?.clientHeight,
      gigToken: b.tokens?.['--home-slot-gig-h'],
      gigDom: (document.getElementById('next-gig-countdown')?.offsetHeight ||
        document.getElementById('no-gigs-card')?.offsetHeight || 0),
      bandMinToken: b.tokens?.['--home-band-viewport-min-h'],
      socialDom: document.getElementById('home-social-row')?.clientHeight,
      bandRemainderPx: b.computed?.bandRemainderPx
    }
  };
})();
```

Also capture: `JSON.stringify(window.__ootHomeLayoutBudget, null, 2)` and `OOT_HOME_LAYOUT_DIAG.dump()` export from the DIAG modal.

---

## Static budget math @ `scHomeH=552`, `viewportH=800`, `gigSlotPx=144`

Constants mirror `computeBudget()` in `oot_home_layout_engine.js`.  
`bandMinPx = max(96, min(140, viewportH × 0.22)) = 96`.

| State | alert | gig | bday | pass | `heroH` (JS) | `budgetExhausted` | `bandViewportMinH` token | **DOM stack remainder** (CSS hero=324 dense) | Expected social (DOM) |
|-------|-------|-----|------|------|---------------|-------------------|--------------------------|---------------------------------------------|------------------------|
| **H0** | none | countdown | 0 | 3 | 300 | false | 96px | 318+144+2 → rem **88** → compress to 300 → rem **106** | ~106 |
| **H1** | song | countdown | 0 | 3 | 300 | **true** | 48px | 324+58+144+2 → rem **24** | **~24** |
| **H2** | rehearsal | countdown | 0 | 3 | 300 | **true** | 48px | same as H1 | **~24** |
| **H3** | both | countdown | 0 | 3 | 300 | **true** | 42px | 324+64+144+2 → rem **18** | **~18–20** |
| **H4** | none | countdown | 0 | 3 | 300 | false | 96px | same as H0 | ~106 |
| **H5** | none | no-gigs | 0 | 3 | 300 | false | 96px | same as H0 | ~106 |
| **H6** | song + bday 58 | countdown | 58 | 3 | 300 | **true** | **20px** | 324+58+58+144+2 → rem **−10** (clamped floor) | **~20** |
| **H7** | none | countdown | ~40* | 3 | 300 | varies | 20–96px | depends on banner height | TBD on device |
| **H11** | rehearsal | countdown | 0 | 3 | 300 | **true** | 48px | same as H2 | **~24** |
| **H12** | none | pending | 0 | 1–3 | 318→300 | false/true | 96 or 48 | gig slot reserved 144px | depends on timing |

\*H7 upcoming-banner height measured on device.

**Key finding:** For dense states, JS `computed.heroH` and `--home-slot-hero-h` reach **300px** (pass 3), but pilot CSS §B lines 42–47 and mobile §G lines 199–204 set dense hero to **`var(--home-slot-hero-h-dense)`**, which `_applyBudgetTokens` always writes as **324px**. Measured DOM hero stays **324** while budget math assumes **300**.

---

## Token vs DOM comparison (root pilot defect)

| Token / field | Budget writes | CSS consumes (dense) | Expected DOM | Observed (prior pilot) | Match? |
|---------------|---------------|----------------------|--------------|------------------------|--------|
| `--home-slot-hero-h` | 300px (pass 3) | sparse + §G only | 300 | N/A in dense | — |
| `--home-slot-hero-h-dense` | **324px always** | **dense hero height** | 324 | hero ≈ **324** | Token matches DOM but **ignores compression** |
| `--home-slot-alert-rail-h` | 58 / 64 | `#home-alerts-row` min-height | 58 / 64 | alerts ≈ **64** (H3) | **PASS** |
| `--home-band-viewport-min-h` | 42–48 (exhausted) | `#home-social-row` min-height | ≥ token | social ≈ **20** (H3) | **FAIL** — flex remainder < min; min not achievable |
| `computed.bandRemainderPx` | 42 (H3 JS math) | flex remainder | ~42 if hero 300 | **~18–20** with hero 324 | **FAIL** |
| `--home-slot-gig-h` | 144px | gig slot height | 144 | ~144 stable | **PASS** |

**Interpretation:** `budgetExhausted: true` with `bandViewportMinH: 20–48` is a honest signal, but CSS prevents pass 2/3 from reclaiming vertical space. Social height tracks **actual** fixed stack (hero 324), not compressed budget.

---

## H0–H12 results matrix

Legend: **P** pass, **F** fail, **M** manual/device pending, **N/A** not applicable to pilot gate

| ID | Pilot result | Snap | alerts ch | social ch @ ≥540 | Token vs DOM | Notes |
|----|--------------|------|-----------|------------------|--------------|-------|
| **H0** | **P** (predicted) | P | 0 | ≥96 (predicted ~106) | hero token 300 vs DOM 300 after pass 3 | Sparse; gig slot in-flow stable |
| **H1** | **F** | P | ~58 | **~24** (fail <96) | hero token 300 vs DOM **324** | Prior pilot: pills readable, band crushed |
| **H2** | **F** | P | ~58 | **~24** | same as H1 | Registry mode not re-verified this session |
| **H3** | **F** | P | **~64** stable | **~20** (fail <96) | hero 300 vs **324**; remainder 42 vs DOM 18 | Primary dense failure; dual grid OK |
| **H4** | **P** | P | 0 | ≥96 | gig 144 | Countdown contained in `#sc-home` (prior) |
| **H5** | **P** | P | 0 | ≥96 | gig 144 | `#no-gigs-card` footprint matches H4 |
| **H6** | **F** | P | ~58 | **~20** | exhausted floor 20px | Birthday + cue exceeds pane |
| **H7** | **M** | M | 0 | M | M | Requires device with upcoming banner |
| **H8** | **M** | M | M | M | M | **Primary regression** — tab-return not re-run this session |
| **H9** | **M** | M | M | M | M | Same protocol as H8 from Songs tab |
| **H10** | **M** | M | M | M | M | Warm vs cold ±8px not measured |
| **H11** | **F** (layout) | P | ~58 | **~24** | same dense stack | Image index 2 / FB-IG visibility not re-run |
| **H12** | **M** | M | M | N/A | M | Boot pending gig; cross-tab styling leak check pending |

### Prior live pilot observations (S26, `homeLayoutPilot=1`)

Recorded during Phase 5b/5c bring-up (pre-5d formal matrix):

- **H3 dense:** `alertsRow.clientHeight` stable ~64; **no** 301→153→88 snap on cue render.
- **H3 dense:** `socialRow.clientHeight` ~**20** with visible pills + gig — matches DOM stack math with hero **324**.
- **Legacy overlay baseline (same data):** `alertsRow.clientHeight` **0** with visible pills (expected); social squeeze still present on H8 — baseline issue, not pilot regression.

---

## Legacy side-by-side (required: H1, H3, H6, H8)

| State | Legacy (`legacy-overlay`) | Pilot (`modular-inflow`) | Delta |
|-------|---------------------------|--------------------------|-------|
| **H1** | `alerts=0`, pills overlay hero/gig | `alerts≈58` in-flow | Pilot fixes rail honesty; social still fails floor until tune |
| **H3** | overlay dual pills; social squeeze | in-flow dual ~64; social ~20 | Pilot removes overlay snap; **band viewport still fails ≥96** |
| **H6** | birthday + overlay cues | birthday in-flow + exhausted budget | Pilot predictable tokens; still fails social floor |
| **H8** | known bad pill placement / squeeze | **M** — not re-verified this session | Document after device run |

**Do not fail legacy** on overlay `alerts=0` or pre-existing H8 squeeze.

---

## Screenshot checklist

Store under `docs/modularization/screenshots/5d/` (create on device; not committed in this verify pass).

| File | State | Captured? |
|------|-------|-----------|
| `5d-H0-pilot.png` | Sparse baseline | ☐ Pending |
| `5d-H1-pilot.png` | Song vote + gig | ☐ Pending |
| `5d-H3-pilot.png` | Dual cues | ☐ Pending (prior informal captures exist) |
| `5d-H4-or-H5-pilot.png` | Gig slot | ☐ Pending |
| `5d-H6-pilot.png` | Birthday + cue | ☐ Pending |
| `5d-H8-pilot-before-chat.png` | Dense before Chat | ☐ Pending |
| `5d-H8-pilot-after-home.png` | After Chat return | ☐ Pending |
| `5d-H11-pilot.png` | Image 2 + rehearsal | ☐ Pending |
| `5d-legacy-H1.png` | Legacy control H1 | ☐ Pending |
| `5d-legacy-H3.png` | Legacy control H3 | ☐ Pending |
| `5d-legacy-H6.png` | Legacy control H6 | ☐ Pending |
| `5d-legacy-H8.png` | Legacy control H8 | ☐ Pending |

Each capture should include tab bar + DIAG live summary or console export in adjacent note.

---

## Pass / fail gates (pilot only)

| Gate | Criterion | Result |
|------|-----------|--------|
| Snap | No 301→153→88 / ≥40px social oscillation | **PASS** (prior pilot) |
| Alert rail | ~58 / ~64 in-flow when cues visible | **PASS** |
| Social floor | ≥96 @ `scHomeH ≥ 540` with cues | **FAIL** (H1/H2/H3/H6/H11) |
| Budget honesty | `--home-slot-hero-h` matches measured hero | **FAIL** (dense: token 300, DOM 324) |
| Exhaustion | `budgetExhausted` false on standard H1/H3 @ S26 | **FAIL** |
| H8/H9 | Stable ±8px after tab return | **PENDING** |
| H12 | No gig flash / no cross-tab styling | **PENDING** |
| Banned paths | Integrity + grep clean | **PASS** (manual); scripts blocked |
| Default | Pilot off without flag | **PASS** |

---

## H8 / H9 protocol status

Protocol defined in Phase 5d plan §7. **Not executed in this agent session.**

When run on device:

1. Reach stable H3 with pilot + diag.
2. Capture baseline at `rHome:end` (social, alerts, hero, `__ootHomeLayoutBudget`).
3. Chat → Home (H8) or Songs → Home (H9); capture at 500ms and 2s.
4. **Pass:** social within ±8px of baseline; alerts stable; no new snap in diag history.
5. Compare legacy same steps — document only.

Optional idempotency check: `OOT.home.layout.reconcile('manual-h8')` should not change budget materially.

---

## Recommendation for 5d-tune (after review — not implemented here)

**Primary fix (Option A — hero compression via engine tokens):**

1. **`oot_home_layout_engine.css`:** Dense hero rules (§B 42–47, §G 199–204) should use `var(--home-slot-hero-h)` instead of `var(--home-slot-hero-h-dense)` so pass 2/3 compression affects layout.
2. **`oot_home_layout_engine.js` (optional):** Write compressed hero into `--home-slot-hero-h-dense` when pass ≥ 2, or stop publishing a conflicting 324px dense token during exhaustion.

**Do not:**

- Edit legacy CSS in `index.html` (r798, r13102, etc.)
- Enable pilot by default
- Add `#home-social-row` magic floors (240/260px)
- Reintroduce banned `HomeLayoutContract` / footprint attrs
- Change gig slot height below 144px

**Secondary (only if H6/H7 still fail after hero binding):**

- Birthday overlay strategy (Option B) — deferred until post-tune re-verify.

**Before merge of any tune commit:**

- Re-run full H0–H12 on S26 with screenshots
- Run all four integrity scripts with Node
- Re-check H8/H9 tab-return stability (may still need Phase 6 controller work even after tune)

---

## Next steps

1. **Owner:** Complete device H-matrix + screenshot checklist; attach JSON dumps to this doc or `screenshots/5d/`.
2. **Owner:** Run integrity scripts where Node is available.
3. **Review:** Approve or adjust 5d-tune scope (hero token binding first).
4. **Then:** Implement 5d-tune in pilot modules only; re-run this matrix.

**Stop line respected:** No tuning code changes in this verify pass.

---

## Phase 5d-tune (2026-06-01)

**Scope:** Pilot dense hero token binding only (`modular-inflow`).

### Changes applied

| File | Change |
|------|--------|
| `oot_home_layout_engine.css` | Removed §B dense hero override and mobile `@media` override that bound hero to `var(--home-slot-hero-h-dense)`. All alert states (sparse + dense) now use `var(--home-slot-hero-h)` from the base §B / §G / mobile rules. |
| `oot_home_layout_engine.js` | `--home-slot-hero-h-dense` inline token now mirrors computed `heroH` (same as `--home-slot-hero-h`) so diagnostics stay consistent. |
| `tests/integrity/home-layout-engine-package.mjs` | Guard: pilot CSS must not set hero `height`/`max-height` from `--home-slot-hero-h-dense`. |

**Unchanged:** `--home-slot-hero-h-dense: 324px` remains a static CSS default in §A until JS reconcile overwrites it; it is no longer used for hero layout height.

### Expected verification delta (@ `scHomeH≈552`, dense + gig)

| State | Before tune (DOM) | After tune (expected DOM) | Social floor (≥96) |
|-------|-------------------|---------------------------|---------------------|
| H1 (song) | hero **324**, social ~**24** | hero **300**, social ~**48** | Still **FAIL** (`budgetExhausted`, min token 48) |
| H3 (both) | hero **324**, social ~**20** | hero **300**, social ~**42** | Still **FAIL** (min token 42) |
| H0 / H4 / H5 | hero 300 after pass 3 | unchanged | **PASS** |

**Budget honesty gate:** Dense hero DOM should match `tokens['--home-slot-hero-h']` and `computed.heroH` (300 on pass 3, 318 on pass 2, 324 on pass 1).

**Still pending device re-verify:** H8/H9 tab return, H6/H7 birthday stacks, full screenshot matrix, Node integrity scripts on a host with `node`.

### Post-tune static checks (verification host)

| Check | Result |
|-------|--------|
| `index.html` static `modular-inflow` default | PASS — not present |
| Pilot opt-in (`homeLayoutPilot=1` / `localStorage`) | PASS — unchanged in JS |
| Banned-path grep in pilot JS/CSS | PASS |
| Node integrity scripts | BLOCKED — `node` not on host |

---

## 5d CSS hygiene — sparse hero stack slack (2026-06-22)

**Commit:** `4b4e63c` — pilot-only `min-height: 0` on `.hero.home-hero-with-controls` and `.hero-l img` in `oot_home_layout_engine.css`.

**Problem observed (valid pilot @ localhost):** `budgetHeroH` / `--home-slot-hero-h` = **318px** but hero layout box measured **322px** (`clientHeight` / rect slack **+4px**). Token binding was correct; legacy r791 img `min-height: min(398px, calc(100vw - 14px))` plus flex item `min-height: auto` content floor raised the used height above the token cap.

**Fix:** Pilot-scoped hygiene only — no JS or legacy `index.html` CSS changes:

```css
#sc-home[data-home-layout-mode="modular-inflow"] .hero.home-hero-with-controls {
  min-height: 0 !important;
}
#sc-home[data-home-layout-mode="modular-inflow"] .hero.home-hero-with-controls .hero-l img {
  min-height: 0 !important;
}
```

**Expected delta:** Sparse H0 `honestStack` should move from **+4px slack** to **0px** (`rectHeight` ≈ token px). Re-verify with stack-honesty snippet (`getBoundingClientRect().height` vs `budget.computed.heroH`). Dense H1/H3/H8 testing remains pending after this hygiene commit.

---

## 5d pilot ownership — cue-visible alert + hero (2026-06-22)

**Problem (@ `9999e86`):** Pilot active but cue-visible layout still legacy-owned. `getAlertRailState()` returned `"none"` when cues used `el.style.display = 'block'` (attribute check mismatch). Legacy r798/r823 `:has(#home-*-cue[style*="display: block"])` outranked pilot CSS → hero hard 324px, `#home-alerts-row` height 0 + overlay.

**Fix (two-part, minimal):**

| File | Change |
|------|--------|
| `oot_home_alert_rail.js` | `_isHomeAlertCueDisplayed`: match `style` attribute `display:block` / `display: block` **or** `el.style.display === 'block'`. |
| `oot_home_layout_engine.css` | §H `:has()` parity under `[data-home-layout-mode="modular-inflow"]` — hero follows `var(--home-slot-hero-h)`; alerts row in-flow (no overlay transform / zero height). Mobile `@media (max-width: 520px)` parity included. |

**Expected H1 (Song Vote visible):** `alertState: "song"`, `data-home-alert-state="song"`, `budget.alertRailH: 58`, `alerts.clientHeight` ≈ 58, hero height/max-height from `--home-slot-hero-h` (324 on pass 1).
