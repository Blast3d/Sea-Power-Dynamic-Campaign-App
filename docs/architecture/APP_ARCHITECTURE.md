# App Architecture Decision

## Decision

Build the Sea Power Dynamic Campaign App as a local desktop application with a web-based UI shell.

Recommended shape:

```text
Desktop shell: Tauri or Electron
Frontend: React + TypeScript
Map UI: MapLibre GL / Leaflet-style world map layer
Local backend/core: TypeScript or Rust services inside the desktop app
Campaign engine: deterministic local simulation modules
Storage: local project files plus SQLite for campaign state/cache
Export: Sea Power `.ini` files written to user/mod campaign folders
```

This gives the app the interaction quality of a web app while keeping the filesystem access and local game/mod integration of a real application.

## Why Not Browser-Only

A browser-only web app is weaker for this project because it cannot reliably:

- auto-detect the Sea Power install path
- scan `StreamingAssets` and mod folders without repeated user file picker steps
- write generated campaigns directly into Sea Power user/mod folders
- watch mod folders for changes
- run local validators and simulation/export jobs with full filesystem context
- maintain a durable local campaign workspace tied to the user's game install

A hosted web app could still be useful later for sharing campaign templates, docs, or generated planning maps, but it should not be the primary authoring environment.

## Why Not Native-Only

A fully native UI would add friction for the world map, mod browsing, visualization, and rich planning tools. Web UI tooling is better suited for:

- interactive world maps
- drag/drop task force placement
- scenario cards and intel reports
- mod/unit catalog browsing
- timeline views
- validation dashboards
- editable campaign forms

## Desktop-Web Hybrid Benefits

The hybrid app can:

- read Sea Power vanilla and modded data locally
- keep user edits and generated campaign work under local control
- run offline
- simulate campaign state outside the game
- generate Sea Power-compatible `.ini` files
- show a rich world-map UI
- later support import/export packages for sharing campaigns

## Simulation Boundary

The app should simulate the strategic/campaign layer outside Sea Power, not recreate Sea Power's tactical combat engine.

The app owns:

- world-map state
- theater control and wars
- task force locations and movement estimates
- intel reports and contact confidence
- logistics readiness
- enemy theater roster persistence
- mission selection and mission generation
- campaign rewards and unlock planning
- validation of generated files

Sea Power owns:

- tactical combat resolution
- actual unit sensors/weapons behavior
- mission execution
- Task Force Mode persistence once launched in-game
- after-action outcomes saved by the game

## Strategic Game Layer

The scaffold should treat the app as a playable strategic layer. The player chooses a side, receives funds/resources, builds and deploys forces, manages logistics, trades for oil/resources, runs simulated land campaigns, and uses generated Sea Power missions to resolve naval/air flashpoints.

Initial scaffold scenario: USA vs Russian Forces in or around the Persian Gulf.

The strategic layer may include app-only assets such as land force packages, industrial capacity, trade routes, supply depots, and resource nodes. These must remain separate from Sea Power-exportable units unless they correspond to real discovered game units.
## Mission Generation Flow

1. Scan game and mod data.
2. Build a unit/faction/roster catalog.
3. Let player configure campaign, mods, countries, and wars.
4. Place task forces and bases on the world map.
5. Run strategic time/simulation outside the game.
6. Generate intel reports from campaign state.
7. Convert selected intel into a mission plan.
8. Generate Sea Power `.ini` campaign and mission files.
9. Validate files against Task Force Mode, roster, trigger, and mission-quality rules.
10. Export to a user/mod-owned Sea Power folder.
11. Let the player launch/play in Sea Power.
12. Import or reconcile campaign results if/when save/output parsing becomes understood.

## Recommended First Technical Stack

Preferred first choice: **Tauri + React + TypeScript**.

Reasons:

- good local filesystem integration
- smaller desktop footprint than Electron
- strong web UI for the world map
- TypeScript is comfortable for data models, validation, and UI
- Rust side can stay thin at first, mostly filesystem and process-safe operations

Good alternative: **Electron + React + TypeScript**.

Choose Electron if Sea Power integration needs Node ecosystem packages, easier prototyping, or existing local tooling outweighs the larger app footprint.

## Core App Services

- `InstallDetector`: find Sea Power and `StreamingAssets` roots.
- `ModScanner`: detect user/mod folders and enabled content.
- `IniCatalogReader`: parse game/mod `.ini` files.
- `UnitCatalog`: normalize units, variants, squadrons, loadouts, nations, costs.
- `FactionCatalog`: expose only valid discovered factions/countries.
- `CampaignStateStore`: persist world-map state and campaign choices.
- `StrategicSimulator`: move task forces, advance time, generate encounters.
- `IntelEngine`: produce uncertain reports from theater state.
- `MissionPlanner`: turn intel into objectives, forces, spawn zones, and rewards.
- `MissionExporter`: write Sea Power campaign/mission files.
- `Validator`: block broken exports and warn about design issues.

## File Safety

Generated output must go only to user/mod-owned folders. Base game `original` files are read-only examples.

## Open Questions

- Exact Sea Power faction/nation file locations and schema.
- Best way to detect enabled mods versus merely installed mods.
- Whether Task Force Mode results can be imported from save files or after-action files.
- Whether the app should launch Sea Power directly or only export files.
- Which map projection and coordinate conversion best matches Sea Power mission coordinates.

