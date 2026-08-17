/**
 * SEED CAMPAIGN DATA — PLACEHOLDER ONLY.
 *
 * Everything in this file exists so the UI scaffold can be opened and used
 * before real Sea Power game-data scanning is implemented. Every entity is
 * marked with `provenance: { kind: "seed" }` and the UI labels it as seed
 * data. None of it may ever appear in exported Sea Power files.
 *
 * Faction labels follow docs/SCAFFOLD_SPEC.md: USA, Russian Forces/Soviet,
 * and Iraq as an enemy-side option. Raw nation values come from
 * docs/DISCOVERED_GAME_DATA.md observations (`US`, `Soviet`, `Iraq`/`iraq`)
 * but the mapping stays provisional until the scanner confirms them.
 */

import type {
  Airbase,
  CampaignState,
  Faction,
  IntelReport,
  LandWarRegion,
  LogisticsState,
  MissionCandidate,
  Port,
  ResourceNode,
  TaskForce,
  Theater,
  TradeRoute,
  UnitCatalogEntry,
} from "../../domain";

const SEED = { kind: "seed" } as const;

// ---------------------------------------------------------------------------
// Factions (scaffold labels; see docs/DISCOVERED_GAME_DATA.md)
// ---------------------------------------------------------------------------

export const seedFactions: Faction[] = [
  {
    id: "faction-usa",
    displayName: "USA",
    rawNationValues: ["US"],
    playableInScaffold: true,
    enemyOptionInScaffold: false,
    provenance: SEED,
    notes: "Maps to nations_reference.ini prefixes usn/usaf → US (provisional).",
  },
  {
    id: "faction-soviet",
    displayName: "Russian Forces / Soviet",
    rawNationValues: ["Soviet"],
    playableInScaffold: true,
    enemyOptionInScaffold: true,
    provenance: SEED,
    notes: "Maps to nations_reference.ini prefix wp → Soviet (provisional).",
  },
  {
    id: "faction-iraq",
    displayName: "Iraq",
    // Both spellings are observed in base game data; exact raw value depends
    // on the target file and must never be silently merged at export.
    rawNationValues: ["Iraq", "iraq"],
    playableInScaffold: false,
    enemyOptionInScaffold: true,
    provenance: SEED,
    notes: "Enemy-side option per scaffold spec. Observed as Nation=Iraq and Nation=iraq.",
  },
];

// ---------------------------------------------------------------------------
// Theater
// ---------------------------------------------------------------------------

export const seedTheaters: Theater[] = [
  {
    id: "theater-persian-gulf",
    name: "Persian Gulf",
    description:
      "Persian Gulf and Strait of Hormuz theater. Sea lanes, oil terminals, and " +
      "contested littorals between the Arabian Peninsula, Iraq, and Iran.",
    center: { lat: 26.8, lon: 51.8 },
    initialZoom: 5.4,
    provenance: SEED,
  },
];

// ---------------------------------------------------------------------------
// Ports, airbases, resources, trade routes
// ---------------------------------------------------------------------------

export const seedPorts: Port[] = [
  {
    id: "port-mina-salman",
    kind: "port",
    name: "Mina Salman (Bahrain)",
    side: "player",
    position: { lat: 26.2, lon: 50.61 },
    theaterId: "theater-persian-gulf",
    taskForceCapacity: 3,
    repairCapable: true,
    rearmCapable: true,
    incomePerDay: 120,
    provenance: SEED,
  },
  {
    id: "port-jebel-ali",
    kind: "port",
    name: "Jebel Ali (UAE)",
    side: "player",
    position: { lat: 24.98, lon: 55.03 },
    theaterId: "theater-persian-gulf",
    taskForceCapacity: 2,
    repairCapable: true,
    rearmCapable: false,
    incomePerDay: 150,
    provenance: SEED,
  },
  {
    id: "port-umm-qasr",
    kind: "port",
    name: "Umm Qasr (Iraq)",
    side: "enemy",
    position: { lat: 30.03, lon: 47.93 },
    theaterId: "theater-persian-gulf",
    taskForceCapacity: 2,
    repairCapable: true,
    rearmCapable: true,
    incomePerDay: 90,
    provenance: SEED,
  },
  {
    id: "port-bandar-abbas",
    kind: "port",
    name: "Bandar Abbas",
    side: "neutral",
    position: { lat: 27.15, lon: 56.21 },
    theaterId: "theater-persian-gulf",
    taskForceCapacity: 2,
    repairCapable: false,
    rearmCapable: false,
    incomePerDay: 0,
    provenance: SEED,
  },
];

export const seedAirbases: Airbase[] = [
  {
    id: "airbase-shaikh-isa",
    kind: "airbase",
    name: "Shaikh Isa AB (Bahrain)",
    side: "player",
    position: { lat: 25.92, lon: 50.59 },
    theaterId: "theater-persian-gulf",
    aircraftCapacity: 24,
    operational: true,
    incomePerDay: 0,
    provenance: SEED,
  },
  {
    id: "airbase-shaibah",
    kind: "airbase",
    name: "Shaibah AB (Iraq)",
    side: "enemy",
    position: { lat: 30.42, lon: 47.66 },
    theaterId: "theater-persian-gulf",
    aircraftCapacity: 18,
    operational: true,
    incomePerDay: 0,
    provenance: SEED,
  },
];

export const seedResourceNodes: ResourceNode[] = [
  {
    id: "resource-safaniya",
    kind: "resourceNode",
    name: "Safaniya Oil Field",
    side: "player",
    position: { lat: 28.05, lon: 48.75 },
    theaterId: "theater-persian-gulf",
    resource: "oil",
    outputPerDay: 60,
    provenance: SEED,
  },
  {
    id: "resource-rumaila",
    kind: "resourceNode",
    name: "Rumaila Oil Field",
    side: "enemy",
    position: { lat: 30.28, lon: 47.37 },
    theaterId: "theater-persian-gulf",
    resource: "oil",
    outputPerDay: 55,
    provenance: SEED,
  },
];

export const seedTradeRoutes: TradeRoute[] = [
  {
    id: "route-hormuz",
    kind: "tradeRoute",
    name: "Strait of Hormuz Sea Lane",
    side: "player",
    path: [
      { lat: 25.4, lon: 57.2 },
      { lat: 26.35, lon: 56.4 },
      { lat: 26.6, lon: 55.0 },
      { lat: 26.9, lon: 52.0 },
      { lat: 27.7, lon: 50.4 },
    ],
    theaterId: "theater-persian-gulf",
    incomePerDay: 200,
    threatLevel: 0.35,
    provenance: SEED,
  },
];

// ---------------------------------------------------------------------------
// Placeholder unit catalog — SEED DATA, never exportable
// ---------------------------------------------------------------------------

export const seedUnitCatalog: UnitCatalogEntry[] = [
  {
    id: "unit-seed-usn-destroyer",
    unitType: "seed_usn_destroyer",
    displayName: "[SEED] US Destroyer",
    category: "vessel",
    rawNationValues: ["US"],
    variants: ["SeedVariant"],
    squadrons: [],
    loadouts: ["Default"],
    taskForceCost: 27,
    loadoutCosts: { Default: 0 },
    provenance: SEED,
  },
  {
    id: "unit-seed-usn-frigate",
    unitType: "seed_usn_frigate",
    displayName: "[SEED] US Frigate",
    category: "vessel",
    rawNationValues: ["US"],
    variants: ["SeedVariant"],
    squadrons: [],
    loadouts: ["Default"],
    taskForceCost: 14,
    loadoutCosts: { Default: 0 },
    provenance: SEED,
  },
  {
    id: "unit-seed-usn-ssn",
    unitType: "seed_usn_attack_submarine",
    displayName: "[SEED] US Attack Submarine",
    category: "submarine",
    rawNationValues: ["US"],
    variants: ["SeedVariant"],
    squadrons: [],
    loadouts: ["Default"],
    taskForceCost: 30,
    loadoutCosts: { Default: 0 },
    provenance: SEED,
  },
  {
    id: "unit-seed-usn-asw-helo",
    unitType: "seed_usn_asw_helicopter",
    displayName: "[SEED] US ASW Helicopter",
    category: "helicopter",
    rawNationValues: ["US"],
    variants: [],
    squadrons: ["SeedSquadron"],
    loadouts: ["ASW"],
    taskForceCost: 6,
    loadoutCosts: { ASW: 2 },
    provenance: SEED,
  },
  {
    id: "unit-seed-wp-cruiser",
    unitType: "seed_wp_missile_cruiser",
    displayName: "[SEED] Soviet Missile Cruiser",
    category: "vessel",
    rawNationValues: ["Soviet"],
    variants: ["SeedVariant"],
    squadrons: [],
    loadouts: ["Default"],
    taskForceCost: 32,
    loadoutCosts: { Default: 0 },
    provenance: SEED,
  },
  {
    id: "unit-seed-wp-ssk",
    unitType: "seed_wp_diesel_submarine",
    displayName: "[SEED] Soviet Diesel Submarine",
    category: "submarine",
    rawNationValues: ["Soviet"],
    variants: ["SeedVariant"],
    squadrons: [],
    loadouts: ["Default"],
    taskForceCost: 18,
    loadoutCosts: { Default: 0 },
    provenance: SEED,
  },
  {
    id: "unit-seed-iraq-missile-boat",
    unitType: "seed_iraq_missile_boat",
    displayName: "[SEED] Iraqi Missile Boat",
    category: "vessel",
    rawNationValues: ["Iraq", "iraq"],
    variants: ["SeedVariant"],
    squadrons: [],
    loadouts: ["Default"],
    taskForceCost: 8,
    loadoutCosts: { Default: 0 },
    provenance: SEED,
  },
  {
    id: "unit-seed-iraq-strike-aircraft",
    unitType: "seed_iraq_strike_aircraft",
    displayName: "[SEED] Iraqi Strike Aircraft",
    category: "aircraft",
    rawNationValues: ["Iraq", "iraq"],
    variants: [],
    squadrons: ["SeedSquadron"],
    loadouts: ["AntiShip"],
    taskForceCost: 10,
    loadoutCosts: { AntiShip: 4 },
    provenance: SEED,
  },
];

// ---------------------------------------------------------------------------
// Task forces
// ---------------------------------------------------------------------------

export const seedTaskForces: TaskForce[] = [
  {
    id: "tf-77-3",
    name: "Task Group 77.3",
    side: "player",
    factionId: "faction-usa",
    theaterId: "theater-persian-gulf",
    position: { lat: 26.5, lon: 52.3 },
    route: [],
    speedKts: 16,
    units: [
      {
        catalogEntryId: "unit-seed-usn-destroyer",
        variantOrSquadron: "SeedVariant",
        loadout: "Default",
        condition: 1,
        ammoState: "full",
      },
      {
        catalogEntryId: "unit-seed-usn-frigate",
        variantOrSquadron: "SeedVariant",
        loadout: "Default",
        condition: 1,
        ammoState: "full",
      },
      {
        catalogEntryId: "unit-seed-usn-asw-helo",
        variantOrSquadron: "SeedSquadron",
        loadout: "ASW",
        condition: 1,
        ammoState: "full",
      },
    ],
    pointValue: 47,
    provenance: SEED,
  },
  {
    id: "tf-enemy-basra",
    name: "Basra Flotilla (est.)",
    side: "enemy",
    factionId: "faction-iraq",
    theaterId: "theater-persian-gulf",
    position: { lat: 29.6, lon: 48.8 },
    route: [],
    speedKts: 20,
    units: [
      {
        catalogEntryId: "unit-seed-iraq-missile-boat",
        variantOrSquadron: "SeedVariant",
        loadout: "Default",
        condition: 1,
        ammoState: "full",
      },
    ],
    pointValue: 16,
    provenance: SEED,
  },
];

// ---------------------------------------------------------------------------
// Land war, logistics
// ---------------------------------------------------------------------------

export const seedLandWarRegions: LandWarRegion[] = [
  {
    id: "land-basra-front",
    name: "Basra Front",
    theaterId: "theater-persian-gulf",
    center: { lat: 30.3, lon: 47.8 },
    controllingSide: "enemy",
    playerGroundStrength: 0.3,
    enemyGroundStrength: 0.7,
    playerSupply: 0.5,
    enemySupply: 0.8,
    linkedEntityIds: ["port-umm-qasr", "airbase-shaibah", "resource-rumaila"],
    contested: true,
    provenance: SEED,
  },
];

export const seedLogistics: LogisticsState[] = [
  {
    subjectId: "tf-77-3",
    fuelAvailability: 0.9,
    supplyAvailability: 0.8,
    portCapacityUsed: 0,
    portCapacityTotal: 0,
    airbaseCapacityUsed: 0,
    airbaseCapacityTotal: 0,
    repairCapable: false,
    rearmCapable: false,
    distanceFromSupplyNm: 140,
    routeSafety: 0.75,
  },
  {
    subjectId: "port-mina-salman",
    fuelAvailability: 1,
    supplyAvailability: 0.9,
    portCapacityUsed: 1,
    portCapacityTotal: 3,
    airbaseCapacityUsed: 0,
    airbaseCapacityTotal: 0,
    repairCapable: true,
    rearmCapable: true,
    distanceFromSupplyNm: 0,
    routeSafety: 0.9,
  },
];

// ---------------------------------------------------------------------------
// Intel and mission candidates
// ---------------------------------------------------------------------------

export const seedIntelReports: IntelReport[] = [
  {
    id: "intel-001",
    title: "Possible submarine contact near Hormuz approaches",
    theaterId: "theater-persian-gulf",
    issuedAt: "1984-05-12T06:00:00Z",
    summary:
      "SOSUS-equivalent and maritime patrol fusion suggests a possible diesel " +
      "submarine transiting toward the Strait of Hormuz sea lane. Confidence is " +
      "moderate; the contact may not be present.",
    contacts: [
      {
        id: "contact-sub-01",
        classification: "submarine",
        confidencePercent: 45,
        estimatedPosition: { lat: 26.2, lon: 56.0 },
        uncertaintyRadiusNm: 40,
        estimatedStrength: "1x SSK (est.)",
      },
    ],
    missionCandidateIds: ["mission-escort-hormuz"],
    provenance: SEED,
  },
  {
    id: "intel-002",
    title: "Iraqi missile boats staging out of Umm Qasr",
    theaterId: "theater-persian-gulf",
    issuedAt: "1984-05-12T09:30:00Z",
    summary:
      "Reconnaissance indicates fast attack craft activity in the northern Gulf. " +
      "Raid against coalition shipping is assessed as likely within 48 hours.",
    contacts: [
      {
        id: "contact-fac-01",
        classification: "surfaceGroup",
        confidencePercent: 70,
        estimatedPosition: { lat: 29.4, lon: 48.9 },
        uncertaintyRadiusNm: 25,
        estimatedStrength: "2-4x missile boats (est.)",
      },
    ],
    missionCandidateIds: ["mission-sag-north-gulf"],
    provenance: SEED,
  },
];

export const seedMissionCandidates: MissionCandidate[] = [
  {
    id: "mission-escort-hormuz",
    title: "Convoy Escort: Hormuz Transit",
    missionType: "convoyEscort",
    theaterId: "theater-persian-gulf",
    location: { lat: 26.3, lon: 55.8 },
    strategicReason:
      "The Hormuz sea lane funds the war effort. A possible submarine threatens the next convoy.",
    availableTaskForceIds: ["tf-77-3"],
    intelReportIds: ["intel-001"],
    objectives: [
      {
        id: "obj-escort-transit",
        description: "Escort the convoy through the datum area to the exit point.",
        dependsOnUncertainContact: false,
        sufficientForCompletion: true,
      },
      {
        id: "obj-escort-kill-sub",
        description: "If the submarine contact materializes, destroy it.",
        dependsOnUncertainContact: true,
        sufficientForCompletion: false,
      },
    ],
    expectedThreats: { ship: false, air: false, sub: true, land: false },
    logisticsNotes: ["Rearm available at Mina Salman after mission."],
    rewards: { funds: 250, influence: 5, notes: "Convoy arrival income bonus." },
    consequences: ["Convoy losses reduce trade route income and influence."],
    provenance: SEED,
  },
  {
    id: "mission-sag-north-gulf",
    title: "Surface Action: Northern Gulf Sweep",
    missionType: "surfaceAction",
    theaterId: "theater-persian-gulf",
    location: { lat: 29.1, lon: 49.3 },
    strategicReason:
      "Iraqi fast attack craft threaten shipping in the northern Gulf. A sweep would restore route safety.",
    availableTaskForceIds: ["tf-77-3"],
    intelReportIds: ["intel-002"],
    objectives: [
      {
        id: "obj-sag-patrol",
        description: "Patrol the sweep area for 6 hours or until enemy craft are neutralized.",
        dependsOnUncertainContact: false,
        sufficientForCompletion: true,
      },
      {
        id: "obj-sag-destroy",
        description: "Destroy any missile boats encountered.",
        dependsOnUncertainContact: true,
        sufficientForCompletion: false,
      },
    ],
    expectedThreats: { ship: true, air: true, sub: false, land: false },
    logisticsNotes: ["Extended range from supply source; fuel state matters."],
    rewards: { funds: 300, influence: 8 },
    consequences: ["Route threat level rises if the raid proceeds unopposed."],
    provenance: SEED,
  },
];

// ---------------------------------------------------------------------------
// Assembled seed campaign
// ---------------------------------------------------------------------------

/**
 * Development default install path, verified on the user's machine
 * (CLAUDE.md). Prefilled but always editable — never the only supported path.
 */
export const DEV_DEFAULT_INSTALL_PATH =
  "H:\\SteamLibrary\\steamapps\\common\\Sea Power";

export function createSeedCampaign(): CampaignState {
  // Deep-clone so every campaign gets independent state; the module-level
  // seed constants stay pristine reference data.
  return structuredClone<CampaignState>({
    id: "campaign-seed-persian-gulf",
    settings: {
      campaignName: "Persian Gulf Flashpoint (Seed)",
      playerFactionId: "faction-usa",
      opposingFactionIds: ["faction-soviet", "faction-iraq"],
      theaterId: "theater-persian-gulf",
      startingFunds: 1000,
      startingOil: 500,
      startingSupplies: 400,
      startingIndustrialCapacity: 10,
      startingInfluence: 50,
      allowedMods: [],
      difficultyPreset: "Moderate",
      commanderName: "CDR J. Mercer",
      gameInstallPath: DEV_DEFAULT_INSTALL_PATH,
    },
    strategicTime: "1984-05-12T12:00:00Z",
    factions: seedFactions,
    theaters: seedTheaters,
    economy: {
      funds: 1000,
      oil: 500,
      supplies: 400,
      industrialCapacity: 10,
      influence: 50,
      fundsPerDay: 470,
      oilPerDay: 60,
      suppliesPerDay: -15,
    },
    taskForces: seedTaskForces,
    ports: seedPorts,
    airbases: seedAirbases,
    resourceNodes: seedResourceNodes,
    tradeRoutes: seedTradeRoutes,
    landWarRegions: seedLandWarRegions,
    logistics: seedLogistics,
    intelReports: seedIntelReports,
    missionCandidates: seedMissionCandidates,
    unitCatalog: seedUnitCatalog,
  });
}
