# Discovered Sea Power Game Data

This file records local read-only observations from the verified Sea Power install. Use it to guide implementation, but keep the app scanner data-driven so modded installs can differ.

## Source Root

```text
H:\SteamLibrary\steamapps\common\Sea Power\Sea Power_Data\StreamingAssets\original
```

Observed on 2026-08-16 from the user's local install.

## Nation Reference File

`original/nations_reference.ini` exists and currently lists 17 nation-prefix mappings:

| Prefix | NationName |
| --- | --- |
| `usn` | `US` |
| `wp` | `Soviet` |
| `civ` | `Civilian` |
| `ir` | `Iran` |
| `usaf` | `US` |
| `raan` | `Australia` |
| `raaf` | `Australia` |
| `rn` | `UK` |
| `raf` | `UK` |
| `rcaf` | `Canada` |
| `rcn` | `Canada` |
| `jmsdf` | `Japan` |
| `jsdaf` | `Japan` |
| `plan` | `China` |
| `plaf` | `China` |
| `ins` | `Israel` |
| `iaf` | `Israel` |

This file is useful, but it is not the complete list of `Nation=` values used by gameplay files.

## Iraq Evidence

Iraq appears in base game data and should be available as an enemy-side scaffold option when relevant units or mission entities are discovered.

Observed examples:

- `original/missions/Other/Operation Morvarid.ini` uses `Nation=iraq` on mission entities.
- `original/campaigns/cities.ini` uses `Nation=Iraq`.
- `original/campaigns/persian_gulf_ports.ini` uses `Nation=Iraq`.
- `original/vessels/wp_pt_p6_variants.ini` has multiple Iraqi variants with `Nation=Iraq`.

## Raw Gameplay Nation Values

The following raw values were extracted from `Nation=` lines in these gameplay-bearing folders:

- `aircraft`
- `vessels`
- `land_units`
- `campaigns`
- `missions`
- `biologic`

Do not treat this as a hand-authored production list. Treat it as a local snapshot and scanner test fixture guidance.

```text
Algeria
Argentina
Australia
Bahrain
Belarus
Belgium
Brasil
Brazil
Bulgaria
Cambodia
Canada
Chile
China
Croatia
Cuba
Cyprus
Czech
DDR
Denamrk
Denmark
East Timor
ecuador
Egypt
Fiji
Finland
France
GDR
Germany
Ghana
greece
grenada
Hungary
Iceland
india
indonesia
Iran
Iraq
Ireland
Israel
Italy
Japan
Jordan
Kenya
Kiribati
Kuwait
Liberia
Libya
Lithuania
Madagascar
Malaysia
Mali
Malta
Mexico
Morocco
Mozambique
Myanmar
Netherlands
New Guinea
New Zealand
NewZealand
North Korea
North_Korea
Norway
Oman
Pakistan
Panama
philippines
Poland
Portugal
Qatar
RoC
Romania
Samoa
Saudi
Saudi Arabia
Singapore
Solomon Islands
Somalia
South Africa
South Korea
south_africa
South_Korea
South_Vietnam
South_Yemen
Soviet
Spain
Sri_Lanka
Sudan
Sweden
Switzerland
Syria
Taiwan
Tanzania
Terrorists
Thailand
Tunisia
Turkey
UK
Unknown
US
Vanuatu
Vietnam
```

## Implementation Notes

- Store both raw `Nation=` values and normalized display labels.
- Do not silently merge variants during export. For example, `South Korea`, `South_Korea`, and case variants may need exact raw values depending on the target file.
- The UI can group obvious aliases for display, but generated `.ini` files must preserve the exact discovered value required by the unit, mission entity, or campaign object.
- The first scanner should discover nations from all relevant `.ini` roots, not only `nations_reference.ini`.
- The first scaffold should include Iraq as a predefined enemy-side option, then replace predefined options with discovered nations once scanning is available.
