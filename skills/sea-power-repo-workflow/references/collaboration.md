# Collaboration Rules

This repo may be touched by the user, Codex, Claude, and other agents. Preserve existing work by default.

## Edit Safety

- Inspect existing files before editing.
- Preserve unrelated user edits.
- Avoid broad rewrites unless the user asks.
- Prefer additive documentation changes while planning is still evolving.
- Do not delete source notes simply because they are messy; move or summarize only when asked.

## Local-Only Mode

The current planning docs and repo-local skills can remain local-only. Do not commit or push them unless instructed.

## Agent Handoff

When preparing work for another agent:

- point them to `README.md`, `AGENTS.md`, and `docs/REFERENCE_INDEX.md`
- tell them which skill applies
- tell them not to use non-Sea-Power sources for file syntax
- tell them to preserve user edits
