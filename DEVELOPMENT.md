# Development Guide - First Scaffold

The repo now contains the first runnable app scaffold described in `CLAUDE.md`, `docs/SCAFFOLD_SPEC.md`, and `docs/IMPLEMENTATION_READINESS.md`.

## Stack

- Tauri 2 desktop shell
- React 18 + TypeScript
- Vite
- Bundled Natural Earth map data (`world-atlas`) rendered with `d3-geo` for the map surface
- Vitest for domain tests
- Rust native commands for read-only filesystem access

## Prerequisites (Windows Dev Machine)

- Node.js 18+ (`node --version`)
- Rust toolchain via rustup (`cargo --version`)
- Microsoft C++ Build Tools + WebView2 for Tauri

## Commands

```text
npm install          # install dependencies
npm run dev          # browser-only UI at http://localhost:1420
npm run tauri:dev    # full desktop app with native path validation + scanner
npm run typecheck    # TypeScript check
npm test             # domain/validator tests
npm run build        # TypeScript check + Vite production build
npm run tauri:build  # production desktop build
```

Browser dev mode cannot access the filesystem. In that mode, install-path validation and the `StreamingAssets` scanner return unavailable/unverified states by design. Use `npm run tauri:dev` for the full desktop path.

## Implemented

- Campaign setup screen with campaign name, commander, player side, opposing sides, and editable Sea Power path.
- Development default path prefilled from the verified local install: `H:\SteamLibrary\steamapps\common\Sea Power`.
- Side scaffold includes USA, Russian Forces/Soviet, and Iraq as an enemy-side option.
- Planning shell with real offline SVG/Natural Earth map centered on the Persian Gulf, including pan/zoom/rotate controls.
- Seed ports, airbases, resource nodes, task forces, trade route, land-war region, intel reports, and mission candidates.
- Economy, logistics, force builder, intel, mission drawer, and validation panels.
- Domain models under `src/domain/`, separated from UI components.
- Seed data under `src/data/seed/`, marked with `provenance: { kind: "seed" }` and blocked from export.
- Frontend services under `src/services/` for native path validation and scanner commands.
- Rust commands under `src-tauri/src/`:
  - `validate_game_path`: read-only path validation.
  - `scan_streaming_assets`: read-only `.ini` candidate listing under `original` and `user`.
  - `build_discovered_catalogs`: read-only promotion of scanner observations into typed catalogs (nations_reference prefix mappings, discovered nations with exact raw spellings, unit records with variants and raw TaskForceCost/LoadoutCost values, squadron/loadout file inventories), with source root/mod/path preserved on every record and Rust fixture tests.
- Discovered Data panel in the planning shell: builds catalogs, previews nations/units/stats, and applies them to the campaign — discovered units replace seed units per category and discovered nations become selectable factions. Force builder badges entries as SEED or DISCOVERED.
- Mission Export panel (gated playtest export): pick a mission candidate, mod name, and a base-game reference mission (its `[Mission]` location/date/environment keys are copied from real game data); generate a Task Force Mode `Generated` campaign bundle from discovered units; preview every file; export only after validation passes. Files land under `StreamingAssets/user/<Mod Name>/campaigns/<campaign>/`.
- Rust export commands: `read_reference_mission` (read-only) and `export_campaign_files` (the app's only write path — guarded against traversal, `original`, unsafe names, and silent overwrites).
- Scaffold validator under `src/domain/validation/`, including tests.
- Export gate: `export.not-implemented` always blocks export in the scaffold.

## Playtest Workflow

1. `npm run tauri:dev` (rebuild required — new Rust commands).
2. Start a campaign, verify the game path, then in the right sidebar: Discovered Data → Build → Apply.
3. Mission Export panel: pick a mission candidate, keep or change the mod name, load the base-game mission list and pick a reference mission near the target theater (this supplies the mission's location/date/environment keys).
4. Generate & Validate Bundle, review the file previews, then Export.
5. Launch Sea Power → Task Force Mode and look for the campaign. Note anything the game rejects (load errors, missing text, wrong location) — those observations drive the next generator fixes.

## Not Implemented Yet

- Verified mission world-location keys and commander_settings.ini schema (see docs/REFERENCE_INDEX.md "Known Syntax Gaps"; the reference-mission merge covers location keys with real game data in the meantime).
- Verification of heuristic catalog assumptions (Variant/Squadron/Loadout section naming, DisplayName sources) against local game files.
- Squadron and loadout field-schema parsing (currently file/section inventories only).
- Mod enablement/dependency detection.
- SQLite or file-backed campaign persistence.
- Strategic turn/time advancement.
- Economy/logistics simulation beyond seed display state.
- Intel-to-mission-plan generation.
- Mission `.ini`, campaign `.ini`, roster, commander settings, or trigger export.
- Import/reconciliation of battle results from Sea Power.

## Export Boundary

No code path writes into the Sea Power install. `StreamingAssets/original` is read-only reference. Export work starts only when validators are complete enough and the user explicitly asks for it.

Future export target shape:

```text
Sea Power_Data\StreamingAssets\user\<Mod Name>\campaigns\<campaign>
```

## Next Milestones

1. Verify heuristic catalog assumptions against local game files and parse squadron/loadout schemas.
2. Add local campaign persistence.
3. Add strategic time advancement and economy/logistics effects.
4. Generate mission plans from intel and campaign state.
5. Expand validators to Sea Power campaign/roster/mission/trigger rules.
6. Add gated export to user/mod-owned folders only.

