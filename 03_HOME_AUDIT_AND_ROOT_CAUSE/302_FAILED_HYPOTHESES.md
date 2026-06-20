# Home Failed Hypotheses

## Purpose

Record approaches that were tried and **must not be reintroduced**. Prevents repeat detours during modularization.

Production baseline: `8a7ecc6`.

---

## 1. `_onHomeActivated()` timing wrapper

| Field | Detail |
|-------|--------|
| Hypothesis | Home misformats because `rHome()` / image refresh runs too early after tab activation |
| Action | Local timing wrapper delayed Home presentation refresh after activation |
| Result | **Did not fix** Chat→Home misformat |
| Conclusion | Root cause is not merely render timing after tab switch |
| Status | **Banned** — do not reintroduce |

---

## 2. Home layout contract v1–v3 rescue stack

| Field | Detail |
|-------|--------|
| Hypothesis | Named flex-column contract with reserved gig + alert footprints would stabilize Home |
| Commits | `33613e9` (v1), `6dd020a` (v2), `d8877a2` (v2.1), `5504a08` (v3) |
| Action | Layered CSS contracts + `_homeMaybeLockAlertsFootprint()` + hero `clamp()` dense compression |
| Result | **Failed production rescue** — band viewport crushed; pills misplaced; cross-page gig countdown leak |
| Rollback | `8a7ecc6` |
| Conclusion | Stacking contract-era in-flow rules on overlay-era CSS creates incompatible models |
| Status | **Banned** — see full list in `200_ARCHITECTURE_MANDATE.md` |

### v2.1 specific failure

- Moved alert rail **in-flow** (64px slot) below birthday banner.
- Set `transform:none` on alert row — disabled r798 overlay and r824 `::before`.
- Pills appeared under birthday instead of over lower logo.

### v3 specific failure

- Subtracted gig, alerts, birthday, gaps, and band target from hero via `clamp()`.
- Birthday remained auto-height in DOM but only as subtract term — not first-class slot.
- `#home-social-row` still collapsed in dense states.

---

## 3. v4 overlay recovery as production patch

| Field | Detail |
|-------|--------|
| Hypothesis | Delete v2.1/v3, restore r798 overlay as "v4 contract" for quick production recovery |
| Context | Proposed on `home-recovery-slot-contract-v4` branch during rescue analysis |
| Result | **Not merged to production**; pilot direction supersedes: build new `HomeLayoutEngine` in-flow model |
| Conclusion | Another overlay/contract patch — even if better than v2.1 — does not establish modular ownership |
| Status | **Not an implementation path** for modularization pilot |

---

## 4. Registry tuning as primary fix

| Field | Detail |
|-------|--------|
| Hypothesis | Band image looks wrong because `HOME_IMAGE_PRESENTATION` yPct/width values need adjustment |
| Evidence | `git diff` pre-contract..rollback shows **zero** registry changes |
| Result | Image framing wrong when `#home-social-row` clientHeight ~20px — container problem |
| Conclusion | Fix vertical budget / layout owner first; registry values are not corrupted |
| Status | Registry changes out of scope until layout acceptance passes |

---

## 5. Isolated CSS patch per symptom

| Field | Detail |
|-------|--------|
| Hypothesis | Per-device magic numbers (hero shrink, social min-height floor, pill nudge) can fix dense states |
| Examples | v3 `--home-band-region-target`; r961 `min-height:340px`; overlay `translateY` tweaks |
| Result | Each patch fights prior patches; tab navigation exposes ordering bugs |
| Conclusion | Named module ownership + acceptance matrix required |
| Status | **Banned** as primary strategy per `200_ARCHITECTURE_MANDATE.md` |

---

## 6. `data-home-alerts-reserved` footprint lock

| Field | Detail |
|-------|--------|
| Hypothesis | Locking 64px alert slot before cue render prevents layout snap |
| Implementation | `_homeMaybeLockAlertsFootprint()` set attrs on `#sc-home` |
| Result | Forced in-flow rail CSS; fought r798 overlay rules |
| Status | **Banned** — removed in rollback; never reintroduce |

---

## What to do instead

| Failed approach | Replacement |
|-----------------|-------------|
| Timing wrapper | `HomeController` lifecycle (Phase 6) |
| Layout contract v1–v3 | New `HomeLayoutEngine` (Phase 5), feature-flagged |
| Overlay recovery patch | Modular in-flow target state |
| Registry yPct tweaks | Fix container height first |
| CSS magic numbers | Named tokens in `HomeLayoutEngine` |
| Footprint lock JS | `HomeGigSlot` + `HomeAlertRail` module ownership |

## Related documents

- `200_ARCHITECTURE_MANDATE.md` — banned list
- `300_HOME_ROOT_CAUSE_SUMMARY.md` — current direction
- `202_HOME_MIGRATION_SEQUENCE.md` — approved path
