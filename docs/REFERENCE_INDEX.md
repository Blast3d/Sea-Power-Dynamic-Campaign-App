# Reference Index

Use this file as the shared source map for all agents. Add sources here as they are pasted, found, or inspected.

## Source Policy

Allowed web sources:

- official Triassic Games / Sea Power material
- Steam guides for Sea Power: Naval Combat in the Missile Age
- PMC Tactical Sea Power pages
- YouTube videos that are clearly Sea Power guides, tutorials, or mission-editor demonstrations

Do not use other games, generic naval doctrine, or general Unity/modding pages as authority for Sea Power file formats.

## Authority Labels

- **Authoritative**: official/Triassic docs, guides, or bundled game examples.
- **Community Guide**: user/community documentation, useful but should be verified against game files when possible.
- **Observed Behavior**: user testing notes or repeatable in-game/editor behavior.
- **Design Inspiration**: tactics or formation advice, not file syntax.

## Ingested Sources

| Source | Label | Notes |
| --- | --- | --- |
| User-pasted Task Force Mode guide excerpts | Authoritative / pending exact source verification | Campaign structure, `campaign.ini`, TFM fields, rosters, difficulty presets, mission generation, rewards, commander settings. |
| User-pasted timing/random spawn notes | Observed Behavior | Travel time examples, random enemy spawn testing, mission pacing concern for reach-area objectives. |
| User-pasted beginner mission guide | Community Guide | Mission naming, descriptions, groups, welcome messages, completion triggers, ending missions. |
| User-pasted first group guide | Community Guide | Group setup, side, mission type, chance, formation, ROE, skill, stores, damage, sensor defaults, formation spacing warning. |
| https://sea-power.pmctactical.org/mission-editor-groups.php | Community Guide | Group schema, chance percent, formations, ROE, unit categories, skill/stores/damage values, save-group caveat. |
| https://sea-power.pmctactical.org/mission-editor-triggers.php | Community Guide | Trigger sections, condition types, messages, victory, exit mission, area triggers. |
| https://steamcommunity.com/sharedfiles/filedetails/?id=3778809391 | Authoritative / Triassic Steam Guide | Dynamic Unit Generation, rosters, spawn zones, formations, persistent enemy theater rosters, trigger group identifiers. |
| https://steamcommunity.com/sharedfiles/filedetails/?id=3756769210 | Authoritative / Triassic Steam Guide | Task Force Mode campaign creation guide. |
| https://steamcommunity.com/app/1286220/guides/ | Index | Sea Power Steam guide index used to find relevant guide material. |
| https://steamcommunity.com/sharedfiles/filedetails/?id=3588041331 | Design Inspiration | Survivability onion and formation spacing. Useful for formation planner heuristics, not `.ini` syntax authority. |
| https://steamcommunity.com/sharedfiles/filedetails/?id=3402185388 | Design Inspiration | Basic submarine tips. Useful for ASW balancing, not file syntax authority. |
| https://steamcommunity.com/sharedfiles/filedetails/?id=3398173171 | Design Inspiration | Formations tutorial index/video pointer. Useful for tactics and spacing. |
| `H:\SteamLibrary\steamapps\common\Sea Power\Sea Power_Data\StreamingAssets` | Authoritative / local game files | Verified local content root. `original` is base game read-only reference; `user` is user/mod-owned content root. |
| `docs/DISCOVERED_GAME_DATA.md` | Authoritative / local game observation | Local snapshot of `nations_reference.ini`, Iraq evidence, and raw gameplay `Nation=` values from the verified install. |
| https://steamcommunity.com/sharedfiles/filedetails/?id=3392721470 | Community Guide | Mission Creation Community Guide: mission `.ini` section structure ([Mission], [Language_en], [TriggerN], [TaskforceNVesselN]), `RelativePositionInNM=x,altFt,z`, Heading/Telegraph/Velocity/Waypoints, formation syntax `Taskforce1_Formation1=units|Name|Type|spacing|OverrideSpawnPositions`, vessel keys (WeaponStatus, RadarsActive, CrewSkill, Stores, Damage), environment actions, `[Language_en]` `Title|Body|Button` message format with rich-text tags. Used by `src/domain/missions/iniGenerators.ts`. |
| https://steamcommunity.com/sharedfiles/filedetails/?id=3756786658 | Community Guide | Triggers and Conditions Guide: `Condition_<Name>_Type`/field keys, condition type list, `ConditionsCompleted` boolean expressions, `Action_*` keys (messages, Victory, EndMission, EnableTriggers/ReactivateTriggers, ObjectivesCompleted, variables), delayed-exit pattern via disabled trigger + Enable+Reactivate. Used by `src/domain/missions/iniGenerators.ts`. |
| https://sea-power.pmctactical.org/mission-editor-beginner-tutorial.php | Community Guide | Mission file storage under `user/missions`, safe-filename rules (no spaces/special characters), mission name/description/player-side requirements. |

## Known Syntax Gaps

- Mission world location/date/environment keys in `[Mission]` are not documented by any ingested source. The mission generator does not invent them: it copies unknown `[Mission]` keys verbatim from a user-selected read-only base-game reference mission (`mergeReferenceMissionKeys` + the `read_reference_mission` command). Inspect `original/missions/Demo/MissionFileInformation.ini` and the pacific-strike-task-force campaign locally to close this gap.
- `commander_settings.ini` schema is unverified; the export writes a commented minimal placeholder and flags it in validation.

## Sources To Revisit

- Steam Contact Markings Explained guide: useful for intel/contact report UI language.
- Sea Power Civilian Traffic Generator guide: useful for neutral/civilian traffic generation.
- Official/local files:
  - `Assets/StreamingAssets/original/campaigns/pacific-strike-task-force/campaign.ini`
  - `Assets/StreamingAssets/original/campaigns/pacific-strike-task-force/player_task_force_roster.ini`
  - `Assets/StreamingAssets/original/campaigns/pacific-strike-task-force/commander_settings.ini`
  - `Assets/StreamingAssets/original/campaigns/pacific-strike-task-force/missions/*.ini`
  - `Assets/StreamingAssets/original/documentation/Mission Editor. Triggers and conditions.docx`
  - `Assets/StreamingAssets/original/missions/Demo/MissionFileInformation.ini`

## Indexing Instructions

When a new source is added:

1. Record URL or local path.
2. Assign an authority label.
3. Summarize only what it contributes to the app.
4. If it contains file syntax, copy concise examples into the relevant skill reference file.
5. If it is tactical advice, add it only as a design heuristic.
6. If it conflicts with local official files, prefer local official files and note the conflict.


