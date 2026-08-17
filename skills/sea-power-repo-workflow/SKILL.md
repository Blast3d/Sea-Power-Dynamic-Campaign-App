---
name: sea-power-repo-workflow
description: Preserve user edits and follow local-first collaboration rules for the Sea Power Dynamic Campaign App repo. Use when Codex or another agent works in this repository, updates docs, adapts skills, plans implementation, modifies code, manages git, or decides whether to commit/push local changes.
---

# Sea Power Repo Workflow

Use this skill for repository behavior and collaboration rules. Use `sea-power-campaign-planning` for Sea Power domain rules.

## Required Workflow

1. Read `../../AGENTS.md` and `../../README.md` before substantive repo changes.
2. Check `git status --short` when git is available.
3. Preserve user edits. Do not overwrite, revert, reset, delete, or clean up user work unless explicitly requested.
4. Keep current planning artifacts local-only unless the user asks to commit, push, publish, or open a PR.
5. When changing documentation, update `../../docs/REFERENCE_INDEX.md` if new source material was used.
6. When adding Sea Power mechanics or syntax, update the relevant `sea-power-campaign-planning/references/` file.

## Git Rules

- Do not commit or push unless the user asks.
- Do not run destructive git commands unless the user explicitly requests them.
- If local edits conflict with a requested change, preserve them and ask only if the conflict cannot be resolved safely.
- Report untracked or modified files honestly in summaries.

## Research Rules

External research must stay Sea Power-specific unless the user broadens scope. Allowed sources are official/Triassic material, Steam Sea Power guides, PMC Tactical Sea Power pages, and YouTube Sea Power guide/tutorial videos.
