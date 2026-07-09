# Agent Tooling Decision Rule

**Status:** Permanent governance rule for all future Out of Time agents.  
**Scope:** Documentation only — no runtime behavior change.

---

## Purpose

Future agents must choose the **right tool for the current slice**. Do not default to one tool for every kind of work.

The recurring mistake to prevent: forcing architecture and modularization work through long PowerShell inspection output when Cursor Agent is the better tool for thinking, reading, and planning across the codebase.

---

## Use PowerShell For Compact Mechanical Tasks

PowerShell is the right tool when the slice is small, exact, and mostly operational:

| Task type | Examples |
|-----------|----------|
| Repo state checks | `git status`, branch name, HEAD, origin sync |
| Branch / HEAD / origin verification | Confirm `main` @ expected SHA before a slice |
| Compact status reports | Short PHASE RESULT blocks, diff summaries |
| Exact targeted patches | One-file or known-line edits with bounded scope |
| Validation scripts | Syntax checks, integrity gates, test runners |
| Syntax checks | Node extraction checks, lint where configured |
| Git summaries | `git diff --stat`, `git status --short` |
| Git add / commit / push | After user-approved, bounded diffs only |
| Small documentation updates | New checkpoint docs, short governance appendices |

PowerShell output should stay **compact**. Prefer summaries over dumping large file contents.

---

## Use Cursor Agent For Architecture / Modularization Work

Cursor Agent is the right tool when the slice needs codebase-wide understanding:

| Task type | Examples |
|-----------|----------|
| Codebase-wide inspection | Find all flyer template/config references in `index.html` |
| Multi-file dependency analysis | Trace how a feature spans HTML, docs, tests, functions |
| Identifying extraction seams | Where to split monolith without behavior change |
| Planning module boundaries | What moves first, what stays, what depends on what |
| Larger refactor planning | Phased modularization plans with checkpoints |
| Lifecycle / data flow | How save, load, render, and notify paths connect |
| Comparing implementation options | Tradeoffs before any edit is approved |

For architecture work, Cursor Agent should **usually start read-only**: inspect, document, recommend — then wait for slice approval before broad edits.

---

## Hard Rules

1. **Do not use PowerShell as a substitute for architectural thinking.**  
   Long `Get-Content`, `Select-String`, or scrollback dumps across `index.html` are not a modularization plan.

2. **Do not use Cursor Agent for broad edits until the slice is bounded and approved.**  
   Planning slices are documentation-only unless explicitly authorized.

3. **Do not force architecture work through long PowerShell inspection output when Cursor Agent is the better tool.**

4. **Match tool to slice scope.**  
   If the task is "verify HEAD and commit one doc," use PowerShell.  
   If the task is "find flyer template seams across the monolith," use Cursor Agent read-only.

---

## Mandatory PowerShell Paste-Marker Rule

When an agent needs Rich to paste terminal output into chat, wrap **only** the pasteable section with:

```powershell
Write-Host "START COPY THIS TO CHAT" -ForegroundColor Magenta
# compact output here
Write-Host "END COPY THIS TO CHAT" -ForegroundColor Magenta
```

Rich should paste **only** the marked section — not the whole terminal session.

Keep marked output short: branch, HEAD, origin, status, test result lines, diff stat. Avoid full file dumps inside the markers.

---

## Current Project Direction (2026-07-09)

| Priority | Direction |
|----------|-----------|
| Continue | Modularization / architecture goal |
| Defer | Further flyer UI polish unless Rich reprioritizes it |
| Next intended slice | **F4** — read-only Cursor Agent inspection for flyer template/config modularization |
| Preserve | Current flyer visuals and behavior |
| Do not change | Home band image behavior |

### F4 intent (next slice)

- Inspect and document flyer template/config data shape in the monolithic `index.html`.
- Identify safe extraction seams for future external flyer assets/config.
- Read-only unless Rich approves implementation.
- No new templates yet.

---

## Quick Decision Checklist

| Question | If yes → |
|----------|----------|
| Is this mostly `git` / verify / commit / push? | PowerShell |
| Is this a single known file or small doc edit? | PowerShell |
| Does this need reading many regions of `index.html`? | Cursor Agent (read-only first) |
| Does this need a modularization or architecture plan? | Cursor Agent (read-only first) |
| Is the slice not yet bounded or approved? | Stop at documentation; no broad edits |

---

## Related Docs

- `docs/modularization/PHASE_F3C_R949_FLYER_SAVE_TO_GIG_MENU_CHECKPOINT.md` — latest flyer checkpoint; references this rule
- Future F4 inspection docs should follow this tooling split
