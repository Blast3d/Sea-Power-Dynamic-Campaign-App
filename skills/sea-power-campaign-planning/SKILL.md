---
name: sea-power-campaign-planning
description: Plan, validate, and document Sea Power dynamic campaign tooling, Task Force Mode campaign files, mission generation, mod-aware unit discovery, rosters, factions, intel reports, Dynamic Unit Generation, and Sea Power mission editor rules. Use when Codex works on this repo's Sea Power campaign planner, writes Sea Power `.ini` generation logic, creates validation rules, or updates project docs/skills for Sea Power.
---

# Sea Power Campaign Planning

Use this skill when working on the Sea Power dynamic campaign tracker or any code/docs that generate or validate Sea Power campaign and mission files.

## Core Workflow

1. Read the relevant reference file before changing behavior:
   - Task Force Mode: `references/task-force-mode.md`
   - Mission generation and triggers: `references/mission-generation.md`
   - Units, mods, factions, and rosters: `references/data-and-mods.md`
   - Validation checklist: `references/validation.md`
2. Check `../../docs/REFERENCE_INDEX.md` before doing web research.
3. Prefer discovered game/mod data over hardcoded lists.
4. Treat base game files under `Assets/StreamingAssets/original/...` as read-only.
5. Generate campaign content only in user/mod-owned folders.
6. Validate generated `.ini` files before telling the user they are ready for Sea Power.

## Research Limits

When looking up external reference material, use only Sea Power-specific sources: official/Triassic material, Steam Sea Power guides, PMC Tactical Sea Power pages, and YouTube Sea Power guide/tutorial videos. Use unrelated naval or modding material only if the user explicitly asks for broader design research, and never as file-format authority.

## Implementation Guidance

- Use structured INI parsing/writing instead of ad hoc string concatenation once code implementation begins.
- Preserve comments and ordering when editing existing user-authored files if feasible.
- Track source mod/path for every discovered unit, variant, squadron, loadout, nation, and faction.
- Distinguish game mechanics from display-only fields. Threat profile fields inform the campaign UI but do not spawn enemies.
- Keep random/intel-based missions playable even if uncertain contacts do not appear.

## First-Version Bias

- Prefer Task Force Mode `Generated` missions.
- Defer `Replaced` missions unless the user specifically asks for exact slot replacement.
- Keep triggers simple: intro, objective, completion message, delayed exit.
- Support Dynamic Unit Generation for enemy uncertainty before hand-authoring many fixed enemy variants.


