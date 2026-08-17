# Scaffold-Ready App Spec

## Product Shape

The Sea Power Dynamic Campaign App is a local desktop application with a web-style map UI. The player uses the app as the strategic campaign layer, then exports playable Sea Power Task Force Mode missions when battles occur.

The app is not only a mission generator. It is also the player's campaign headquarters: map, logistics board, economy tracker, intel desk, force builder, and mission export tool.

## First Playable Loop

1. Player creates a new campaign.
2. App scans Sea Power game/mod data or uses a temporary seed catalog while scaffolding.
3. Player chooses a side/faction.
4. Initial scaffold sides: USA, Russian Forces/Soviet, and Iraq as an enemy-side option, with labels mapped to discovered Sea Power nation values once available.
5. Player receives starting funds and resource stockpiles.
6. Player buys or assigns an initial fleet using Task Force Mode-style points and discovered units.
7. Player places forces on the world map.
8. Strategic time advances outside Sea Power.
9. Logistics, resources, bases, ports, airfields, and land control affect what the player can deploy or build.
10. Intel reports generate possible missions and threats.
11. Player chooses a mission or responds to a crisis.
12. App exports a playable Sea Power Task Force Mode mission/campaign update.
13. Player resolves tactical battle in Sea Power.
14. App later reconciles results manually or through parsed game output when available.

## Scaffold Factions

Start with these scaffold side options:

- USA
- Russian Forces / Soviet
- Iraq, initially as an enemy-side option

Once the scanner exists, also expose every discovered Sea Power nation/faction from vanilla and enabled mod data.

Rules:

- These names are scaffold labels until mapped to Sea Power's actual faction/nation keys. Iraq is already observed in base game data as both `Iraq` and `iraq` in different files.
- The UI may show friendly labels, but exported files must use real Sea Power faction/nation IDs.
- The app should be built so all discovered factions/nations can be selected from game/mod data, including minor and regional nations.
- The first scaffold can use fixed seed factions, but production behavior must be data-driven.

## Campaign Start

At campaign creation, the player configures:

- campaign name
- player side
- opposing side
- starting theater, such as Persian Gulf
- starting funds
- starting resource stockpiles
- allowed mods
- starting task force difficulty preset
- initial commander/nation settings

The first scaffold should provide defaults so the app can be opened and played without a complete game-data scanner.

## Strategic Map

The main screen is a world map with operational overlays.

Map entities:

- task forces
- ports
- naval bases
- airbases
- inland strategic bases
- resource nodes
- trade routes
- sea lanes
- threat areas
- mission areas
- active intel contacts
- contested regions
- land-war fronts

Player actions:

- deploy task forces
- plot movement routes
- assign aircraft transfers
- stage logistics ships
- reinforce ports and bases
- choose objectives
- launch land operations
- respond to intel reports
- open generated mission plans
- export Sea Power missions

## Economy And Resources

The app should support both abstract funds and physical/resource constraints.

Initial economic model:

- funds: used to buy units, repairs, upgrades, and operations
- oil: supports fleet movement, sortie tempo, and trade income
- supplies: supports repairs, land operations, base construction, and rearming
- industrial capacity: limits ship/aircraft/base construction over time
- influence/control: affects diplomacy, access, and trade

Income sources:

- controlled ports
- controlled inland bases
- trade routes
- oil/resource exports
- mission rewards
- successful land campaigns
- convoy arrivals

Costs:

- ship and aircraft purchase
- repairs and rearming
- movement and deployment
- maintaining overseas task forces
- airbase and port upgrades
- land operations
- convoy protection failures

## Logistics Layer

Logistics should determine what is possible on the map and in generated missions.

Track:

- fuel availability
- supply availability
- port capacity
- airbase capacity
- repair capability
- rearm capability
- distance from supply source
- convoy/trade route safety
- replenishment ships and tenders

Mission effects:

- no nearby logistics may disable or restrict `TaskForceModeRearm`
- poor repair access may disable or raise cost for `TaskForceModeRepair`
- airbase control may unlock Airbase Prep or land-based aircraft
- port control may unlock additional task force deployment zones
- supply convoy survival may change campaign variables and future mission availability

## Land War Simulation

The app simulates land campaigns abstractly to support the naval campaign. Sea Power does not resolve land warfare directly, so land battles are strategic-map events, not tactical Sea Power battles.

Land war objects:

- inland bases
- ports
- airfields
- resource sites
- supply depots
- front lines
- ground force strength
- readiness and supply

Land battle outputs:

- region control changes
- port/airbase access
- income changes
- logistics bonuses or penalties
- mission generation opportunities
- resource capture or disruption

Example Persian Gulf loop:

1. War breaks out in the Persian Gulf.
2. Player must move ships and aircraft toward the theater.
3. Player secures sea lanes and ports.
4. Simulated land operations attempt to capture inland bases and oil infrastructure.
5. Captured ports and bases increase income and deployment options.
6. Enemy naval/air/sub threats generate Sea Power missions.
7. Mission results affect logistics, trade, and campaign momentum.

## Ship And Asset Building

The app can model construction separately from Sea Power's Task Force Builder.

Buildable assets:

- ships used in Sea Power missions
- submarines used in Sea Power missions
- aircraft and helicopters used in Sea Power missions
- logistics ships
- port facilities
- airbase facilities
- supply depots
- land force packages
- reconnaissance assets

Rules:

- Sea Power units must come from discovered vanilla/mod data.
- App-only assets may exist for strategic simulation, but they must be clearly marked as not directly exportable to Sea Power missions.
- Construction should require funds, resources, industrial capacity, and time.

## Mission Generation From Strategy

Strategic events create mission candidates:

- convoy escort
- carrier strike
- amphibious support
- port defense
- ASW sweep
- surface action
- airfield strike
- reconnaissance
- sea-lane interdiction
- logistics rescue or recovery
- blockade enforcement

Each mission candidate should contain:

- theater/location
- strategic reason
- player task force availability
- enemy intel confidence
- expected threat profile
- logistics constraints
- possible rewards
- campaign consequences
- generated Sea Power mission file path when exported

## First Scaffold Screens

Build these first:

1. Campaign setup screen.
2. Faction selection screen: USA vs Russian Forces.
3. Main world map screen.
4. Force builder panel.
5. Economy/resources panel.
6. Logistics/status panel.
7. Intel reports panel.
8. Mission candidate drawer.
9. Export/validation panel.

## First Scaffold Data

Use seed data only where real Sea Power discovery is not yet implemented.

Seed data should include:

- USA side
- Russian Forces side
- Persian Gulf theater
- a few ports
- a few airbases
- simple resource nodes
- simple starting funds/resources
- placeholder unit catalog entries clearly marked as seed data

Replace seed units with discovered Sea Power units as soon as scanning is implemented.

## Technical Scaffold Recommendation

Use:

```text
Tauri + React + TypeScript
MapLibre GL or Leaflet-compatible world map
SQLite for campaign state/cache
TypeScript domain modules for simulation and validation
Rust/Tauri commands for filesystem access and safe export
```

Keep the domain model separate from UI components so future mission generation and simulation can be tested without the desktop shell.

## Initial Domain Models

- `Faction`
- `Theater`
- `MapEntity`
- `Port`
- `Airbase`
- `ResourceNode`
- `TradeRoute`
- `TaskForce`
- `UnitCatalogEntry`
- `CampaignEconomy`
- `LogisticsState`
- `LandWarRegion`
- `IntelReport`
- `MissionCandidate`
- `SeaPowerExportPlan`
- `ValidationResult`

## Non-Negotiable Constraints

- Preserve user edits.
- Keep planning files local-only unless told otherwise.
- Do not edit Sea Power base game files.
- Do not hardcode production unit/faction data once game-data scanning exists.
- Do not generate missions that can become unplayable because random enemies failed to spawn.
- Do not let app-only strategic assets masquerade as Sea Power-exportable units.

