# Project Plan

## Goal

Build an app for Sea Power that acts as a dynamic campaign tracker and mission generator. The app should provide a world map, detect vanilla and modded game data, let the player choose installed mods and factions, deploy task forces by theater/country, generate intel reports, and export Sea Power-compatible Task Force Mode campaign and mission `.ini` files.

## Implementation Status

The first runnable scaffold is implemented:

- Tauri + React + TypeScript app shell.
- Campaign setup and in-memory Persian Gulf seed campaign.
- USA, Russian Forces/Soviet, and Iraq scaffold side options.
- MapLibre planning shell with seed economy, logistics, forces, intel, missions, and validation panels.
- Read-only native path validator and `StreamingAssets` scanner prototype.
- Scaffold validator and Vitest tests.
- Export is not implemented and remains blocked.

The plan below remains the target direction. The next major phase is replacing seed data with parsed vanilla/mod game data.
## Primary User Flow

1. Detect the Sea Power install and `StreamingAssets` roots.
2. Scan vanilla and enabled mod folders for units, factions, nations, variants, squadrons, loadouts, and Task Force costs.
3. Let the player create or load a campaign.
4. Let the player choose allowed commander nations, factions, mods, and campaign difficulty presets.
5. Show a world map where task forces, bases, ports, airfields, routes, and threat areas can be placed.
6. Generate intel reports from campaign state and theater rosters.
7. Convert intel reports into mission plans with objectives, spawn zones, threat profiles, logistics rules, and rewards.
8. Export Task Force Mode campaign files and mission files into a user/mod-owned folder.
9. Validate exported content against Sea Power rules before launch.

## Architecture Decision

Build this as a local desktop application with a web-based UI shell. See `docs/architecture/APP_ARCHITECTURE.md`.

The app should simulate the strategic campaign layer outside Sea Power, then export playable Sea Power Task Force Mode missions and campaign files for tactical play inside the game.

## Scaffold MVP

The first scaffold should open into a playable planning shell: campaign setup, USA/Russian Forces/Soviet plus Iraq enemy-side selection, discovered-faction expansion, a world map, starting funds/resources, a basic force builder, logistics/economy panels, intel reports, mission candidates, and an export/validation panel.

See `docs/SCAFFOLD_SPEC.md` for the scaffold-ready product spec.

See `docs/IMPLEMENTATION_READINESS.md` and `CLAUDE.md` for the coding handoff and first milestone definitions of done.

## Verified Development Data Root

The user's local Sea Power install was verified at:

```text
H:\SteamLibrary\steamapps\common\Sea Power
```

The verified content root is:

```text
H:\SteamLibrary\steamapps\common\Sea Power\Sea Power_Data\StreamingAssets
```

Use this as an editable development default, not a permanent hardcoded path. Treat `StreamingAssets/original` as read-only and `StreamingAssets/user` as the user/mod-owned root for future generated output.

## Initial Scope

- Read-only scanning of vanilla and mod data, including nation/faction discovery from `nations_reference.ini` and raw `Nation=` values in gameplay files.
- Manual Sea Power install path configuration if auto-detect fails.
- Task Force Mode campaign generation using `Generated` missions.
- Campaign roster generation for vessels, submarines, aircraft, and helicopters.
- Basic commander settings, ranks, ribbons, and awards.
- Simple mission generation with anchor-based player task force placement.
- Basic trigger generation: intro message, objective trigger, completion message, delayed mission exit.
- Dynamic Unit Generation support for enemy uncertainty and persistent enemy rosters.

## Deferred Scope

- Full `Replaced` mission generation.
- Advanced trigger chaining.
- Advanced campaign variables.
- Air Tasking and Airbase Prep authoring UI.
- Civilian traffic generation.
- Multiplayer-specific mission packaging.
- Full tactical AI behavior tuning.

## Proposed Modules

- `SeaPowerInstallDetector`
- `StreamingAssetsScanner`
- `ModRegistry`
- `IniParserWriter`
- `UnitCatalog`
- `FactionNationCatalog`
- `TaskForceRosterBuilder`
- `CommanderSettingsBuilder`
- `WorldMapCampaignState`
- `StrategicSimulator`
- `EconomySimulator`
- `LogisticsPlanner`
- `LandWarSimulator`
- `FormationPlanner`
- `IntelReportGenerator`
- `DynamicUnitGenerationPlanner`
- `MissionIniGenerator`
- `TaskForceCampaignValidator`

## Data Principles

- Internal data should preserve the source path and source mod for every discovered unit or config entry.
- Display names can be friendly, but exported mission files must use internal Sea Power IDs.
- Missing or disabled mod dependencies should produce warnings before campaign load/export.
- The app should not silently invent units, variants, squadrons, loadouts, nations, or factions.

## Validation Philosophy

Validation should catch broken campaigns before Sea Power does. Treat hard game requirements as errors and design-quality issues as warnings.











