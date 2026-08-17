# Mission Generation Reference

## Minimum Mission Quality

Every generated mission should include:

- unique display name
- safe filename
- non-spoiler description
- valid player side
- at least one playable player group or Task Force Mode anchor
- clear objective
- start/briefing message
- completion trigger
- player-facing completion message
- mission exit path

## Group Data

Model groups with:

- name
- side
- mission type
- chance percent
- formation
- ROE
- nation
- unit category
- unit type
- unit name
- loadout
- unit nation
- speed
- heading
- skill
- stores
- damage
- sensor and equipment toggles
- formation offsets

Known side values: `Blue`, `Red`, `Neutral`.

Known ROE values: `Weapons Tight`, `Weapons Free`, `Weapons Hold`.

Known skill values: `Green`, `Trained`, `Seasoned`, `Veterans`, `Ultra`.

## Formation Safety

Never stack generated same-domain units at the same starting position. Always calculate offsets in nautical miles.

For player starts, default to conservative sensors unless the scenario requires otherwise:

- radars off
- active sonar off
- towed array off
- towed decoy off
- stores full
- damage none

## Triggers

Useful condition types:

- `Time`
- `Unit destroyed`
- `Unit enters area`
- `No units of given type left`
- `Unit detected`
- `Unit classified`
- `Trigger completed`
- `Trigger failed`

Generated v1 trigger pattern:

1. time-based intro message
2. objective trigger
3. completion message
4. delayed mission exit

For reach-area objectives, use a radius large enough for the whole formation.

## Random And Intel-Driven Missions

Enemy uncertainty may use spawn chance or Dynamic Unit Generation, but required mission completion must not depend only on a random unit appearing.

Example:

```text
Intel: possible submarine contact, confidence 45%.
Mission: escort convoy through datum area.
If contact spawns: combat objective activates.
If contact does not spawn: reach-area objective still completes.
```

## Travel Time

Estimate transit with:

```text
hours = distance_nm / speed_kts
```

Use this to prevent missions with long transit objectives from ending abruptly due to unrelated enemy-destroyed triggers.

## Dynamic Unit Generation

Use Dynamic Unit Generation for enemy forces derived from intel reports.

Important fields:

```ini
DynamicGenerationSlot=True
DynamicGenerationRoster=Taskforce2
DynamicGenerationSpawnZone=Zone1_W|Zone1_E
DynamicGenerationGroupIdentifier=RaidGroup
DynamicGenerationPersistent=True
```

Generation can use:

- allowed types
- required or excluded tags
- formations
- min/max unit counts
- point budgets
- allowed nations
- allowed pools
- spawn zones

Dynamic groups tied to objectives should always get a group identifier for trigger integration.

