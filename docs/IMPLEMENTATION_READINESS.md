# Implementation Readiness

## Status

The first runnable scaffold has been implemented. The project is no longer planning-only.

Current implementation state:

- Tauri + React + TypeScript + Vite scaffold exists.
- Browser dev mode works for UI-only development.
- Tauri desktop mode provides read-only filesystem access.
- Seed Persian Gulf campaign is in memory only.
- Export is intentionally blocked by validation.

This document now tracks what the scaffold covers and what must happen before real Sea Power campaign export.

## Confirmed Decisions

- Build a local desktop app with a web UI shell.
- Use Tauri + React + TypeScript for the first scaffold.
- Keep the Rust/Tauri side thin: filesystem access, path validation, and safe future export operations.
- Keep campaign simulation, validation rules, and UI domain models in TypeScript modules that can be tested outside the UI.
- Start with Task Force Mode `Generated` missions.
- Use Dynamic Unit Generation later for uncertain enemy forces.
- Use discovered game/mod `.ini` data as production source of truth.
- Use seed data only to make the UI scaffold playable before full scanning exists.

## Verified Game Data Root

Development machine path:

```text
H:\SteamLibrary\steamapps\common\Sea Power\Sea Power_Data\StreamingAssets
```

Verified folders:

- `original`: base game content, read-only reference.
- `user`: user/mod-owned content.

The app accepts the Sea Power install path as editable configuration. The verified path is a development default, not the only supported path.

## Completed: First Scaffold

The first scaffold milestone is functionally complete:

- package scripts are present in `package.json`
- campaign setup screen accepts an editable Sea Power install/content path
- native path validation checks install root, `Sea Power_Data`, or `StreamingAssets`
- app can create an in-memory seed campaign
- planning shell is map-centered and uses a real offline SVG/Natural Earth map
- side scaffold includes USA, Russian Forces/Soviet, and Iraq
- economy/resources are displayed
- seed task forces, ports, airbases, resource nodes, trade route, intel reports, and mission candidates are displayed
- export/validation panel clearly blocks real export
- domain models are separated from React components

Caveat: campaign state is not persisted yet.

## Completed: Scanner Prototype

The first data scanner milestone is implemented as a read-only prototype:

- locates `StreamingAssets/original`
- locates `StreamingAssets/user`
- lists candidate `.ini` files under known content folders where those folders exist
- preserves source root, content folder, relative path, absolute path, and file size
- extracts raw `Nation=` values with counts and example paths
- reports conservative INI summary data: parsed files, sections, key/value pairs, top sections/keys, and `TaskForceCost` counts
- reports missing folders and unknown folders as warnings/observations

Next scanner work is promoting these observations into typed discovered catalogs.

## Completed: Validator Prototype

The first validator milestone is implemented with Vitest coverage for scaffold rules:

- selected game path missing
- selected path is invalid or unverified
- defensive block for output under `original`
- empty player side or opposing side
- no player task force
- mission candidate with no objective
- mission candidate whose only completion path depends on uncertain contacts
- seed catalog data notice
- permanent `export.not-implemented` error

Next validator work is full Sea Power campaign, roster, mission, trigger, Task Force Mode, and Dynamic Unit Generation validation.

## Completed: Discovered Catalogs v1

Scanner observations are now promoted into typed discovered catalogs via the read-only `build_discovered_catalogs` command (`src-tauri/src/catalog.rs`):

- parses `nations_reference.ini` from `original/` and each `user/<mod>/` root into prefix→NationName mappings
- builds a discovered nations catalog from raw `Nation=` values across unit-bearing folders, exact spellings preserved (`Iraq` and `iraq` stay distinct) and cross-referenced against nations_reference prefixes
- builds discovered unit records for vessels, submarines, aircraft, helicopters, and land_units: unit type = file stem, `_variants` files folded into their base unit, `Variant*` sections with per-variant `Nation=`, raw `TaskForceCost` + `LoadoutCost_*` values (unparsed strings preserved; TS parses defensively), `DisplayName` as a labeled guess
- records squadron/loadout folder files as file/section inventories only — their field schemas are intentionally not parsed yet
- preserves source root, source mod (first path component under `user/`), and relative path on every record
- carries explicit `heuristicNotes` so prefix-based section detection is never mistaken for verified schema
- covered by Rust fixture tests (`cargo test`) and TS promotion tests (`vitest`)

On the TypeScript side (`src/domain/catalog/discoveredCatalog.ts`), discovered records promote to `Faction` and `UnitCatalogEntry` values with `provenance: { kind: "discovered", ... }`. The Discovered Data panel applies them to the running campaign: discovered units replace seed units per category, discovered nations become selectable factions, and the force builder badges every entry as SEED or DISCOVERED.

Remaining catalog work: verify heuristic section-name assumptions against local game files, parse squadron/loadout schemas, resolve authoritative display names, and detect enabled vs installed mods.

## Completed: Gated Playtest Export v1

The user explicitly requested playtest export. Implemented:

- Mission planner (`src/domain/missions/missionPlanner.ts`): mission candidate + discovered catalog → complete export bundle. Discovered units only; player anchor on `[Taskforce1Vessel1]`; formation offsets so units never stack; enemy vessels selected by raw enemy nation values.
- INI generators (`src/domain/missions/iniGenerators.ts`): campaign.ini ([Campaign]/[TaskForceMode]/difficulty presets/[Mission1]), roster from discovered units (`unit=Variants|cost`), commander_settings placeholder, and a `Generated` mission with verified trigger syntax — timed intro message, completion = patrol timer OR enemy destroyed (mission stays completable if enemies never engage), victory + objective complete, delayed exit via disabled trigger + EnableTriggers/ReactivateTriggers.
- Reference-mission merge: unknown `[Mission]` keys (location/date/environment) are copied verbatim from a user-selected read-only base-game mission instead of being invented (`read_reference_mission` command + `mergeReferenceMissionKeys`).
- Export validator (`src/domain/validation/exportValidator.ts`): campaign/roster/mission rules from the validation skill reference plus path-safety and seed-unit bans. The Export button is disabled until zero errors.
- Guarded write command (`src-tauri/src/export.rs`): writes only under `StreamingAssets/user/<Mod Name>/`; refuses traversal, unsafe names, anything touching `original`, and overwrites without an explicit flag. Rust tests cover every guard.
- Mission Export panel: candidate + mod name + reference mission selection, bundle preview per file, validation display, gated export, written-path report.

Known unverified schema (also in `docs/REFERENCE_INDEX.md` "Known Syntax Gaps"): mission world-location keys and commander_settings.ini content. The playtest loop exists to close these.

## Current Folder Shape

```text
src/
  domain/
    campaign/
    catalog/
    economy/
    intel/
    logistics/
    map/
    missions/
    validation/
  data/
    seed/
  services/
    seaPowerPaths.ts
    streamingAssetsScanner.ts
    discoveredCatalogs.ts
  ui/
    components/
    screens/
src-tauri/
  src/
    sea_power_paths.rs
    scanner.rs
    catalog.rs
```

For Tauri, keep filesystem commands small and explicit. The UI should call high-level commands like `validate_game_path`, `scan_streaming_assets`, and `build_discovered_catalogs`, not arbitrary filesystem access.

## Next Milestones

1. Verify heuristic catalog assumptions (Variant/Squadron/Loadout section naming, DisplayName sources) against local game files and parse squadron/loadout schemas.
2. Add campaign persistence, likely local SQLite plus project files.
3. Implement strategic time advancement and economy/logistics effects.
4. Generate mission plans from intel and campaign state.
5. Expand validators to the full rules in `docs/SEA_POWER_RULES.md`.
6. Implement gated export to `StreamingAssets/user/<Mod Name>/...` only.

## Known Open Questions

- Exact schema variations for factions, nations, variants, squadrons, loadouts, and Task Force costs across vanilla and mods.
- Best reliable method for distinguishing enabled mods from installed-but-disabled mods.
- Whether tactical results can be imported from saves, logs, or after-action files.
- Whether the app should launch Sea Power directly later.
- Which map projection and coordinate conversion best matches generated Sea Power mission coordinates.

## Research Before Deep Parsing

Before implementing schema-specific parsers, inspect local game examples under:

```text
H:\SteamLibrary\steamapps\common\Sea Power\Sea Power_Data\StreamingAssets\original
```

Use the files listed in `docs/REFERENCE_INDEX.md` as the first targets, then add verified local paths and what they contributed back to the reference index.


