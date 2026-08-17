# Data And Mods Reference

## Discovery Rules

- Detect the Sea Power install path when possible.
- Allow manual path configuration.
- Scan vanilla and enabled mod `StreamingAssets` trees.
- Preserve source path and source mod for every discovered item.
- Never hardcode units, nations, factions, variants, squadrons, or loadouts when they can be read from game/mod data.

## Unit Catalog

Track at least:

- internal unit type ID
- display name
- category
- nation/faction
- variants
- squadrons
- loadouts
- Task Force cost
- loadout costs
- source mod
- source file path

## Rosters

Task Force Builder roster sections:

```ini
[AllowedVessels]
[AllowedSubmarines]
[AllowedAircraft]
[AllowedHelicopters]
[LoadoutPrices]
```

Format:

```ini
unit_type=VariantOrSquadron1,VariantOrSquadron2|point_cost
```

Ships/submarines use variants. Aircraft/helicopters use squadrons.

## Mod Compatibility

Campaign state should remember which mods were enabled when content was generated. On load/export:

- warn if a required mod is missing
- warn if a unit ID moved or disappeared
- prevent export if required variants/squadrons/loadouts no longer exist
- show the source mod for duplicate or conflicting IDs

## Factions And Countries

Only expose countries/factions that exist in discovered Sea Power data. War selection and mission sides must validate against actual in-game faction/nation definitions.

Until exact faction docs are available, keep faction handling conservative and data-driven.

