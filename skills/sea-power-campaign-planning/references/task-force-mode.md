# Task Force Mode Reference

## Campaign Layout

Recommended user/mod layout:

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
      art/ribbons/
      art/medals/
```

Paths inside INI files are usually relative to the mod root.

## Required Campaign Fields

```ini
[Campaign]
Type=Linear
Length=1

[TaskForceMode]
Enabled=True
DefaultTaskForceName=Task Group 77.3
CommanderSettingsFile=commander_settings.ini
RosterFile=player_task_force_roster.ini
TaskForceDifficultyPresets=Easy|Moderate|Difficult
DefaultTaskForceDifficultyPreset=Moderate
StartingPoints=50
PointCap=50
ShipIncludesAirwing=True
PurchaseLoadouts=True
```

## Difficulty Presets

Each ID in `TaskForceDifficultyPresets` needs a matching section:

```ini
[TaskForceModeDifficulty_Moderate]
Name=Moderate
StartingPoints=50
PointCap=50
ShipIncludesAirwing=True
PurchaseLoadouts=True
InitialUnlockedLoadouts=Default|Early
RepairCostModifier=1
UnitDecommissionPointReturnModifier=0.25
UnitDismissPointReturnModifier=0.5
CrewSkillInitial=Trained
```

The selected preset is saved when the player starts a campaign. Later edits affect new starts, not existing saves.

## Mission Entries

```ini
[Mission1]
MissionFile=campaigns/my-task-force-campaign/missions/01 First Mission.ini
TaskForceModeMissionGenerationType=Generated
IsUnlocked=True
TaskForceModeIncludesTaskForce=True
TaskForceModeIncludesAirwing=False
TaskForceModeIncludesSubmarine=False
TaskForceModeThreatProfileShip=True,3
TaskForceModeThreatProfileAir=True,2
TaskForceModeThreatProfileSub=False
TaskForceModeThreatProfileLand=False
TaskForceModeRearm=True
TaskForceModeRepair=True
TaskForceModeEnableTaskForceBuilder=True
TaskForceModeCompletionPoints=10
TaskForceModeCompletionCapPoints=10
TaskForceModeRibbonAwards=combat_action_ribbon
```

Threat profile fields are display-only.

## Generated Missions

Use for the first implementation:

```ini
[Mission]
PlayerTaskforce=Taskforce1
NumberOfTaskforce1Vessels=1

[Taskforce1Vessel1]
Type=usn_ddg_kidd
VariantReference=Variant3
LoadoutVariant=Default
RelativePositionInNM=0,0,0
Heading=090
Telegraph=3
TaskForceModeAnchor=True
```

The generator uses the anchor's position, heading, speed, and route to place the player's persistent force.

## Replaced Missions

Use later when exact scripted section names and locations matter:

```ini
TaskForceModeMissionGenerationType=Replaced

[Taskforce1Vessel1]
TaskForceModeAnchor=True
TaskForceModeReplacedUnitIndex=1

[Taskforce1Vessel2]
TaskForceModeReplacedUnitIndex=2
```

Slots are filled in index order. The mission keeps section names and positions but replaces the unit details with the player's actual ships.

## Air Tasking

Campaign entry:

```ini
TaskForceModeAirTaskingAvailable=True
TaskForceModeAirTaskingFlight1=CAP|CAP|Fighter|2|AirToAir/AirToAirLongRange
```

Five-part format:

```text
RoleId|DisplayName|AllowedUnitRoles|SlotCount|AllowedLoadouts
```

Mission slots:

```ini
[Taskforce1Aircraft1]
TaskForceModeAirTaskingSlot=1
TaskForceModeAirTaskingRole=CAP
```

Use unique flight keys. Ship-assigned helicopters are not eligible.

## Airbase Prep

```ini
TaskForceModeAirbasePrepAvailable=True
TaskForceModeAirbasePrepReadySlots=2
TaskForceModeAirbasePrepInProgressSlots=4
```

Requires a player land unit whose type contains `airbase` or `airfield`.

## Join Task Force

`JoinTaskForce=True` lets surviving mission units join the persistent force after debrief.

Allowed on normal player vessel, submarine, aircraft, and helicopter sections. Do not use on land units, airbases, weapons, enemy units, or custom sections.

