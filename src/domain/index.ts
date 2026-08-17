/**
 * Domain barrel. UI imports domain types from here; domain modules never
 * import from src/ui or src/services.
 */
export * from "./common";
export * from "./campaign/faction";
export * from "./campaign/theater";
export * from "./campaign/taskForce";
export * from "./campaign/landWar";
export * from "./campaign/campaignState";
export * from "./catalog/unitCatalog";
export * from "./catalog/discoveredCatalog";
export * from "./economy/economy";
export * from "./logistics/logistics";
export * from "./map/mapEntity";
export * from "./intel/intelReport";
export * from "./missions/missionCandidate";
export * from "./missions/exportPlan";
export * from "./missions/exportBundle";
export * from "./missions/iniGenerators";
export * from "./missions/missionPlanner";
export * from "./validation/validation";
export * from "./validation/scaffoldValidator";
export * from "./validation/exportValidator";
