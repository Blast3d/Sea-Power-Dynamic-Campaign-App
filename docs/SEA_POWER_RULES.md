# Sea Power Rules

## File Safety

- Never edit `Assets/StreamingAssets/original/...`.
- Write generated campaign files under a user/mod-owned root.
- Preserve original examples as read-only references.
- Use safe filenames for generated missions: letters, digits, underscores, and hyphens.

## Task Force Mode Campaign Structure

Recommended structure:

```text
Assets/StreamingAssets/user/<Mod Name>/
  _info.ini
  campaigns/
    <campaign>/
      campaign.ini
      commander_settings.ini
      player_task_force_roster.ini
      unit_roster_descriptions_en.ini
      missions/
      art/
        ribbons/
        medals/
```

Core campaign requirements:

- `[Campaign] Type=Linear`
- `[TaskForceMode] Enabled=True`
- `CommanderSettingsFile=commander_settings.ini`
- `RosterFile=player_task_force_roster.ini`
- at least one difficulty preset listed in `TaskForceDifficultyPresets`
- each listed preset must have a matching `[TaskForceModeDifficulty_<Id>]`

## Task Force Mode Missions

Use `Generated` missions for the first app version:

```ini
TaskForceModeMissionGenerationType=Generated
```

Generated mission requirements:

- mission has `PlayerTaskforce=Taskforce1`
- mission has at least one player vessel
- `[Taskforce1Vessel1]` has `TaskForceModeAnchor=True`
- exactly one anchor exists
- player task force units are placed around the anchor

`Replaced` missions are deferred until later. They use `TaskForceModeReplacedUnitIndex=N` slots and require stricter trigger/section validation.

## Rosters

The campaign roster is the broad purchase pool. Mission-specific allowed roster fields may narrow this list but cannot add units missing from the campaign roster.

Supported roster sections:

```ini
[AllowedVessels]
[AllowedSubmarines]
[AllowedAircraft]
[AllowedHelicopters]
[LoadoutPrices]
```

Roster values use:

```ini
unit_type=VariantOrSquadron1,VariantOrSquadron2|point_cost
```

Ships and submarines use `VariantReference`. Aircraft and helicopters use `SquadronReference`.

## Unit Cost Rules

Every unit available in Task Force Builder needs a point cost.

Unit-file default:

```ini
[TaskForce]
TaskForceCost=27
LoadoutCost_Late=10
```

Campaign roster overrides may replace the base unit cost for a campaign.

## Mission Quality Rules

Every generated mission should have:

- unique display name
- safe file name
- useful non-spoiler description
- valid player side
- at least one playable player group/unit
- clear objective
- intro or briefing message
- completion trigger
- player-facing completion message
- mission exit path

Avoid instant endings after long transit objectives unless the briefing clearly frames the objective as enemy elimination rather than reaching an area.

## Randomness And Intel

- Required player units must not be random.
- Required objective units should usually not be random unless another completion path exists.
- Enemy forces can use percentage chance or Dynamic Unit Generation for intel uncertainty.
- A mission must remain playable and completable if a possible enemy contact does not spawn.

## Travel Time

Use nautical timing as the planning baseline:

```text
hours = distance_nm / speed_kts
```

Sea Power ETA may differ slightly because of rounding, acceleration, formation behavior, or waypoint handling.

## Dynamic Unit Generation

Use Dynamic Unit Generation to translate intel into enemy uncertainty.

Important concepts:

- dynamic slots are anchored in ordinary mission sections
- category follows the anchor category
- generation can use allowed types, formations, freeform counts, point budgets, or spawn zones
- dynamic groups tied to objectives need a `DynamicGenerationGroupIdentifier`
- campaign-persistent enemy rosters should use `DynamicGenerationPersistent=True`

## Formation Safety

- Do not spawn same-domain units stacked on the same point.
- Auto-space units using formation offsets.
- Escort and high-value formations should account for likely threat axis.
- Long-range battlegroup spacing may require tens of nautical miles, not tight visual clusters.

## Trigger Rules

Known useful condition types:

- `Time`
- `Unit destroyed`
- `Unit enters area`
- `No units of given type left`
- `Unit detected`
- `Unit classified`
- `Trigger completed`
- `Trigger failed`

Generated missions should start simple: intro trigger, primary objective trigger, completion message, and delayed exit.

## Common Errors To Catch

- writing under `original`
- missing `[TaskForceMode] Enabled=True`
- missing roster or commander settings file
- missing Task Force cost on modded purchasable units
- mission roster restriction references units outside campaign roster
- duplicate Air Tasking flight keys
- Airbase Prep without a player airbase/airfield land unit
- `JoinTaskForce=True` on invalid section types
- all player/test-side units have random spawn chance

