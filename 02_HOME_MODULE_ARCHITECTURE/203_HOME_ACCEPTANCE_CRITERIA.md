# Home Acceptance Criteria

## Purpose

Define the Home test-state matrix and diagnostic gates that must pass before promoting any phase — especially before enabling `modular-inflow` layout or merging layout changes to `main`.

**Production baseline for comparison:** commit `8a7ecc6`.

## When criteria apply

| Phase | Required states |
|-------|-----------------|
| Phase 1 (`oot_home_diag.js`) | H0, H8 — diag works; zero visual delta |
| Phase 2 (band image) | H0, H2, H11 — registry outputs unchanged |
| Phase 3 (alert state) | H1, H2, H3 — state attr matches cues |
| Phase 4 (gig slot) | H4, H5, H12 |
| Phase 5 (`HomeLayoutEngine`) | **Full H0–H12** under `modular-inflow` flag |
| Phase 6 (controller) | H8, H9, H10 emphasized |
| Phase 7 (legacy retirement) | **Full H0–H12** on production default |

## Home test-state matrix (H0–H12)

Each state requires: full-frame screenshot, `OOT_HOME_LAYOUT_DIAG.dump()` (once Phase 1 lands), and recorded tab-entry path.

| ID | State | Setup | Pass signals |
|----|-------|-------|--------------|
| **H0** | Sparse baseline | No cues, no birthday | Hero ~318px; band viewport fills remainder; no overlay transforms in sparse state |
| **H1** | Song vote only | Active song suggestion cue | Pills readable; `socialRow.clientHeight` ≥ 96px at ~552px `#sc-home` |
| **H2** | Rehearsal only | Open proposal / rehearsal cue | Same as H1; registry applies correct presentation mode |
| **H3** | Dual cues | Song vote + rehearsal both visible | Two-pill layout deterministic; no overlap |
| **H4** | Next gig | Upcoming gig event in countdown | Gig slot 144px stable; countdown contained in `#sc-home` |
| **H5** | No gigs | No future gigs | `#no-gigs-card` same 144px footprint as H4 |
| **H6** | Birthday today | Member with birthday today (e.g. Rachel) | Banner in-flow; layout stable combined with H1 or H3 |
| **H7** | Birthday upcoming | Member birthday within 14 days | Banner visible; band viewport not crushed |
| **H8** | **Chat → Home** | Open Chat, return to Home | **No** pill misplacement; **no** band squeeze (primary regression) |
| **H9** | Songs → Home | Open Songs, return to Home | Same stability as H8 |
| **H10** | Cold refresh | Full reload while state active | Matches warm navigation result |
| **H11** | Image index 2 + rehearsal | Band image selector + rehearsal cue | Registry mode correct; FB/IG buttons fully visible |
| **H12** | Boot pending gig | Before `_eventsHasInit` completes | No wrong gig/no-gig flash; **no** countdown styling on other tabs |

## Diagnostic gates (all dense states: H1–H7, H11)

When `OOT_HOME_LAYOUT_DIAG` is enabled (Phase 1+):

| Metric | Pass |
|--------|------|
| `socialRow.clientHeight` | ≥ 96px when any cue visible (target 96–140 at ~552px `sc-home`) |
| `alertsRow.clientHeight` | Stable; no 86→144→86 oscillation in diag history |
| `scHome.computedOverflow` | `hidden` |
| `backdrop.clientHeight` | ≈ `socialRow.clientHeight` |
| Snap history | No 301→153→88 sequence at cue render events |

### Overlay vs in-flow note (Phase 5+)

Under production `legacy-overlay` mode, `alertsRow.clientHeight` may be **0** while pills are visually present (zero-height overlay row). Under `modular-inflow`, `alertsRow.clientHeight` should reflect the real in-flow rail height. Acceptance criteria must be evaluated **per layout mode** and documented in the diag snapshot.

## Phase 1 specific criteria (`oot_home_diag.js`)

| Criterion | Required |
|-----------|----------|
| Visual delta vs `8a7ecc6` | **Zero** |
| `OOT_HOME_LAYOUT_DIAG.enable()` / `.dump()` | Functional |
| H8 transition logging | Captures before/after region heights |
| Integrity test | Load order + namespace enforced |
| Production default | Diag off unless explicitly enabled |

## Phase 5 specific criteria (`HomeLayoutEngine`)

Before promoting `modular-inflow` to production default:

1. Full H0–H12 pass on primary test device (S26 or documented equivalent).
2. Side-by-side comparison with `legacy-overlay` screenshots for H1, H3, H6, H8.
3. No item from the banned list present in new CSS/JS.
4. `HOME_IMAGE_PRESENTATION` registry values unchanged.
5. Cue renderer onclick paths unchanged.

## Screenshot capture minimum

| State | Required capture |
|-------|------------------|
| H0 | Full Home frame |
| H1 | Pills vs logo/gig |
| H4 or H5 | Gig slot |
| H6 + H1 or H3 | Birthday + cue dense state |
| H8 | After Chat return (bad-state repro attempt) |
| H11 | Image 2 + rehearsal |

## Failure response

If any gate fails:

1. Do **not** merge to `main`.
2. Do **not** add CSS patches to "fix" the failing state.
3. Record diag dump + screenshot in pilot notes.
4. Return to the owning phase; do not skip ahead.

## Related documents

- `200_ARCHITECTURE_MANDATE.md` — banned list
- `202_HOME_MIGRATION_SEQUENCE.md` — phase gates
- `300_HOME_ROOT_CAUSE_SUMMARY.md` — why H8 is primary
