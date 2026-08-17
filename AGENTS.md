# Sea Power Dynamic Campaign Tracker

This repo is for planning and building a Sea Power dynamic campaign tool focused on Task Force Mode, mod-aware unit discovery, intel-driven mission generation, and world-map campaign state.

## Project Rules

- Treat Sea Power base game content under `Assets/StreamingAssets/original/...` as read-only.
- Generate or modify campaign content only under user/mod-owned folders.
- Prefer exact game and mod `.ini` data over hardcoded unit, nation, faction, variant, squadron, or loadout lists.
- Keep generated missions playable even when random or intelligence-based enemy contacts do not spawn.
- Start with Task Force Mode `Generated` missions before supporting `Replaced` missions.
- Validate every exported campaign and mission before writing files intended for the game.
- Keep docs and skills concise; move detailed Sea Power field references into `skills/*/references/`.

## Collaboration And Edit Safety

- User edits always win. Do not overwrite, revert, delete, reset, or clean up user changes unless the user explicitly asks.
- Before changing an existing file, inspect it and preserve unrelated edits.
- Keep changes scoped to the current request.
- Treat this documentation and planning work as local-only unless the user asks to commit, push, publish, or open a pull request.
- If another agent has changed files, assume those changes are intentional and work with them.

## Research Rules

- Use the local docs in `docs/` and `skills/sea-power-campaign-planning/references/` first.
- When web research is needed, search only Sea Power game guides, Triassic/official Sea Power material, PMC Tactical Sea Power pages, Steam Sea Power community guides, and YouTube Sea Power guide/tutorial videos.
- Do not use unrelated naval games, real-world doctrine, or generic Unity/modding references as file-format authority.
- Real-world naval doctrine may be used only as optional design inspiration, never as proof of Sea Power `.ini` syntax or mechanics.
- Add every useful source to `docs/REFERENCE_INDEX.md` with what it contributed and whether it is authoritative, community-observed, or tactical/background.

## Current Source Notes

The current plan is based on user-provided Task Force Mode notes, PMC Tactical Sea Power mission editor pages, and Steam community/Triassic guides for Task Force Mode and Dynamic Unit Generation.







## Current Implementation State

- The app now has a runnable Tauri + React + TypeScript scaffold.
- The strategic map is a real offline SVG map using bundled Natural Earth data from `world-atlas` rendered with `d3-geo`; do not revert it to fake hand-drawn geography or remote-only tiles.
- The map supports drag panning, wheel zoom, rotate left/right, reset north, and fit-to-theater controls.
- The read-only scanner validates `StreamingAssets`, lists candidate `.ini` files, extracts raw `Nation=` values, and reports a conservative INI summary.
- Export is implemented (user explicitly requested playtest export) but hard-gated: bundles must pass `validateExportBundle`, and the only write command (`export_campaign_files`) refuses paths outside `StreamingAssets/user/<Mod Name>/`, path traversal, anything touching `original`, and overwrites without an explicit flag.

## Next Agent Priorities

1. Done: typed discovered catalogs exist (`build_discovered_catalogs` in `src-tauri/src/catalog.rs`, promotion in `src/domain/catalog/discoveredCatalog.ts`). Raw values and source paths are preserved; heuristic fields are labeled via `heuristicNotes`.
2. Done: the Discovered Data panel replaces seed force-builder data with discovered records per category; seed survives only in categories with no discovered units.
3. Done: gated playtest export exists — mission planner, .ini generators, export validator, and guarded write command. See `docs/REFERENCE_INDEX.md` "Known Syntax Gaps" for what is still unverified (mission location keys, commander_settings schema).
4. Run the playtest loop: collect what Sea Power accepts/rejects from exported bundles and correct the generators; verify syntax gaps against local official files.
5. Verify heuristic catalog assumptions (section-name prefixes, DisplayName sources) against local game files and parse squadron/loadout field schemas.
6. Add campaign persistence after the discovered catalog layer is stable.
