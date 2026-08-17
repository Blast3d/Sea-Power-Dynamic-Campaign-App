# Claude Coding Handoff

The first implementation scaffold for the Sea Power Dynamic Campaign App now exists. Use this file as a coding handoff for the next milestones.

## Start Here

Read these files before coding:

1. `AGENTS.md`
2. `docs/IMPLEMENTATION_READINESS.md`
3. `docs/SCAFFOLD_SPEC.md`
4. `docs/SEA_POWER_RULES.md`
5. `docs/DISCOVERED_GAME_DATA.md`
6. `docs/architecture/APP_ARCHITECTURE.md`

The repo now contains a runnable Tauri + React + TypeScript scaffold. Keep future changes focused on replacing seed data with discovered Sea Power data, strengthening validators, and preserving the export boundary.

## Verified Local Game Install

The user's Sea Power install was verified at:

```text
H:\SteamLibrary\steamapps\common\Sea Power
```

The content root is:

```text
H:\SteamLibrary\steamapps\common\Sea Power\Sea Power_Data\StreamingAssets
```

Important child folders:

- `original`: base game content, read-only reference only.
- `user`: user/mod-owned content, valid place for generated mod/campaign output once export is implemented.

Do not hardcode this path as the only supported path. It is a development default for this machine. The app still needs manual path configuration and later auto-detection.

## Non-Negotiables

- Do not edit anything under the Sea Power install, especially `StreamingAssets/original`.
- Do not write generated files into the game until validators exist and the user explicitly asks to test export.
- Preserve user edits. Do not reset, clean, delete, or revert unrelated files.
- Prefer discovered Sea Power `.ini` data over hardcoded production rosters.
- Seed data is allowed only for the UI scaffold and must be marked as seed data.
- Keep generated missions playable even when uncertain enemy contacts do not spawn.

## Current Scaffold

Implemented scaffold:

- Tauri + React + TypeScript app shell.
- Real offline SVG world map using bundled Natural Earth data (`world-atlas` + `d3-geo`), with pan, wheel zoom, rotate, reset-north, and fit controls.
- A campaign setup screen using the verified install path as a prefilled editable value.
- A main world map/planning shell with economy, logistics, force builder, intel, missions, and validation panels.
- A small seed campaign: USA vs Russian Forces/Soviet with Iraq available as an enemy-side option, Persian Gulf, seed ports/airbases/resources, and clearly marked placeholder units.
- Domain types separated from UI components.
- Read-only filesystem scanner interface that lists candidate `.ini` files under `StreamingAssets/original` and `StreamingAssets/user`, extracts raw `Nation=` values, and reports a conservative structured INI summary: parsed files, sections, key/value pairs, top sections/keys, and `TaskForceCost` signals.
- Typed discovered catalogs via the read-only `build_discovered_catalogs` command: nations_reference prefix mappings, discovered nations with exact raw spellings preserved, unit records (variants, raw TaskForceCost/LoadoutCost values, per-variant nations), squadron/loadout file inventories, and source root/mod/path on every record. The Discovered Data panel applies them to the campaign: discovered units replace seed units per category and discovered nations become selectable factions. Heuristic fields (prefix-based section detection, DisplayName guesses) are labeled via `heuristicNotes` and are not verified schema.

- Gated playtest export (user-requested): mission planner + .ini generators in `src/domain/missions/` produce a Task Force Mode `Generated` campaign bundle (campaign.ini, commander_settings.ini placeholder, roster from discovered units, mission with intro/objective/delayed-exit triggers); `validateExportBundle` gates the Export button; the Rust `export_campaign_files` command writes only under `StreamingAssets/user/<Mod Name>/` with traversal/original/overwrite guards; `read_reference_mission` copies unverified `[Mission]` location/date/environment keys from a read-only base-game mission.

## Next Technical Slices

1. Playtest feedback loop: fix whatever Sea Power rejects in the exported bundle; verify commander_settings and mission location keys against `original/missions/Demo/MissionFileInformation.ini` and the pacific-strike-task-force campaign.
2. Verify heuristic catalog assumptions against local game files; parse squadron/loadout field schemas.
3. Add campaign persistence.
4. Add strategic time/economy/logistics simulation.
5. Richer mission generation: real objective areas, Dynamic Unit Generation for intel uncertainty, spawn chance.

## Export Boundary

Export was explicitly requested by the user for playtesting and is implemented behind hard gates: bundles must pass `validateExportBundle`, and the Rust side refuses any write outside `StreamingAssets/user/<Mod Name>/`.

Write only under a user/mod-owned path like:

```text
Sea Power_Data\StreamingAssets\user\<Mod Name>\campaigns\<campaign>
```

Base game examples under `original` are reference material only.




