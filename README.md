# Sea Power Dynamic Campaign App

A local desktop campaign layer and Task Force Mode mission-planning scaffold for **Sea Power: Naval Combat in the Missile Age**.

The app is intended to read vanilla and modded Sea Power data, track a strategic world-map campaign state, generate intel-driven mission candidates, and eventually export Sea Power-compatible Task Force Mode campaign and mission `.ini` files into user/mod-owned folders.

## Current Status

The first runnable scaffold is in place.

Implemented now:

- Tauri 2 + React + TypeScript + Vite application shell.
- Campaign setup screen with editable Sea Power install/content path.
- Verified development default path: `H:\SteamLibrary\steamapps\common\Sea Power`.
- Native read-only path validation that accepts a Sea Power install root, `Sea Power_Data`, or `StreamingAssets`.
- Native read-only `StreamingAssets` scanner prototype that lists candidate `.ini` files in `original` and `user` content roots.
- In-memory Persian Gulf seed campaign with USA, Russian Forces/Soviet, and Iraq as scaffold side options.
- MapLibre planning shell with seed task forces, ports, airbases, resource nodes, trade route, intel reports, mission candidates, economy, logistics, force builder, and validation panels.
- TypeScript domain model layer separated from React UI components.
- Scaffold validator with tests for path, side, task-force, mission-objective, uncertain-contact, seed-data, and export-gate checks.
- Export is deliberately blocked. No code path writes generated content into the Sea Power install.

Still to do:

- Parse discovered `.ini` files into real unit, faction/nation, variant, squadron, loadout, and Task Force cost catalogs.
- Replace seed units and seed side mappings with discovered vanilla/mod data.
- Persist campaign state instead of keeping it in memory only.
- Implement strategic time advance, economy/logistics simulation, and land-war effects.
- Convert intel reports into concrete Sea Power mission plans.
- Expand validation to full campaign, roster, commander, mission, trigger, and Dynamic Unit Generation rules.
- Implement export only after validators are strong enough, and only to `StreamingAssets/user/<Mod Name>/...`.

## Quick Start

Prerequisites:

- Node.js 18+
- Rust toolchain via rustup
- Tauri Windows prerequisites: Microsoft C++ Build Tools and WebView2

Commands:

```text
npm install
npm run dev          # browser UI only; no filesystem access
npm run tauri:dev    # full desktop app with native path validation/scanner
npm run typecheck
npm test
npm run build
```

In browser-only dev mode, native filesystem features report as unavailable. Use `npm run tauri:dev` for the real path validator and scanner.

## Project Vision

The app should become a campaign headquarters for Sea Power, not a separate tactical ruleset. It should discover the player's installed game content, respect enabled mods, and generate missions using actual Sea Power units, factions, rosters, variants, squadrons, loadouts, and Task Force Mode mechanics.

Core goals:

- Detect Sea Power installs and user/mod content folders.
- Index vanilla and modded units without hardcoding the playable roster.
- Let players choose installed mods and valid in-game factions/nations.
- Let players deploy task forces, aircraft, submarines, bases, and support assets on a world map.
- Generate intel reports with uncertainty, confidence levels, and theater context.
- Convert intel reports into playable Sea Power missions.
- Support Task Force Mode persistence for ships, aircraft, ammo, damage, commander records, awards, repairs, and rearming.
- Validate generated campaign files before they are used in-game.

## Important Files

- `AGENTS.md`: rules for Codex/Claude/other agents working in this repo.
- `CLAUDE.md`: coding handoff and current implementation boundary.
- `DEVELOPMENT.md`: scaffold architecture, commands, implemented features, and next milestones.
- `docs/IMPLEMENTATION_READINESS.md`: scaffold/checklist status and remaining milestone definitions.
- `docs/PROJECT_PLAN.md`: app goals, scope, workflow, and proposed modules.
- `docs/SCAFFOLD_SPEC.md`: product spec for the first playable planning shell.
- `docs/SEA_POWER_RULES.md`: Sea Power and Task Force Mode rules gathered so far.
- `docs/DISCOVERED_GAME_DATA.md`: local read-only observations from the verified Sea Power install.
- `docs/REFERENCE_INDEX.md`: source map and research policy.
- `src/`: React UI, TypeScript domain models, seed data, services, and validator tests.
- `src-tauri/`: thin native shell with read-only path validation and scanner commands.
- `skills/`: repo-local Codex skills and references for future agents.

## File Safety

Base game content under `StreamingAssets/original` is read-only reference material. Generated content must eventually target only user/mod-owned folders under `StreamingAssets/user`.

The current scaffold has no export write commands. Export remains blocked by validation until explicitly implemented later.

## Research Policy

Use local docs and local game files first. When web research is needed, stay within Sea Power-specific material:

- official/Triassic Sea Power material
- Steam Sea Power guides
- PMC Tactical Sea Power pages
- YouTube Sea Power guide/tutorial videos

Do not use other naval games, generic modding references, or real-world doctrine as authority for Sea Power file syntax. Tactical references can inspire design, but game files and Sea Power-specific guides define what the app exports.
