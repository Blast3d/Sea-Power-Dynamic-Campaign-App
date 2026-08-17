# Validation Reference

## Campaign Errors

- output path is under `Assets/StreamingAssets/original`
- missing `campaign.ini`
- missing `[Campaign]`
- missing `[TaskForceMode] Enabled=True`
- missing `CommanderSettingsFile`
- missing `RosterFile`
- referenced commander settings file does not exist
- referenced roster file does not exist
- listed difficulty preset has no matching section
- mission entry references missing mission file

## Roster Errors

- roster unit does not exist in enabled vanilla/mod data
- listed variant or squadron does not exist
- mission-specific roster restriction references a unit outside the campaign roster
- duplicate unit entries conflict without an explicit override rule

## Roster Warnings

- modded Task Force Builder unit has no `TaskForceCost`
- cost defaults to zero
- loadout price references unknown loadout

## Generated Mission Errors

- missing `PlayerTaskforce=Taskforce1`
- no player units
- missing `TaskForceModeAnchor=True`
- more than one anchor
- anchor is not on `[Taskforce1Vessel1]` for Generated mission
- no completion trigger
- no mission exit path
- all playable player-side units have random spawn chance
- dynamic enemy objective has no stable completion fallback

## Dynamic Generation Errors

- dynamic slot references missing roster
- generated type is outside configured roster
- formation cannot meet `MinStations`
- dynamic group used by trigger has no `DynamicGenerationGroupIdentifier`
- spawn zone reference is missing

## Air Tasking Errors

- duplicate `TaskForceModeAirTaskingFlightN` key
- mission slot role does not match a campaign flight role
- loadout reference does not exist
- ship-assigned helicopter is used for Air Tasking

## Airbase Prep Errors

- Airbase Prep enabled but no player land unit type contains `airbase` or `airfield`

## Join Task Force Errors

- `JoinTaskForce=True` appears on land unit, airbase, weapon, enemy unit, biologic, or custom section
- joinable unit is missing a stable campaign tag

## Design Warnings

- mission description spoils exact enemy composition despite uncertain intel
- long transit mission exits immediately after enemy destruction
- reach-area trigger radius is too small for the formation
- player formation has stacked units
- mission has no intro/briefing message
- mission has no completion message

