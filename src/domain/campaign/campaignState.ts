import type { EntityId } from "../common";
import type { Faction } from "./faction";
import type { Theater } from "./theater";
import type { TaskForce } from "./taskForce";
import type { LandWarRegion } from "./landWar";
import type { CampaignEconomy } from "../economy/economy";
import type { LogisticsState } from "../logistics/logistics";
import type { Airbase, Port, ResourceNode, TradeRoute } from "../map/mapEntity";
import type { IntelReport } from "../intel/intelReport";
import type { MissionCandidate } from "../missions/missionCandidate";
import type { UnitCatalogEntry } from "../catalog/unitCatalog";

/** Campaign creation settings (docs/SCAFFOLD_SPEC.md "Campaign Start"). */
export interface CampaignSettings {
  campaignName: string;
  playerFactionId: EntityId;
  opposingFactionIds: EntityId[];
  theaterId: EntityId;
  startingFunds: number;
  startingOil: number;
  startingSupplies: number;
  startingIndustrialCapacity: number;
  startingInfluence: number;
  /** Mod names the player allows (scanner milestone will populate options). */
  allowedMods: string[];
  /** Task Force Mode difficulty preset id, e.g. "Moderate". */
  difficultyPreset: string;
  commanderName: string;
  /**
   * Editable Sea Power install/content path. The development default on this
   * machine is prefilled from app settings — never hardcoded as the only
   * supported path.
   */
  gameInstallPath: string;
}

/** Full in-memory campaign state for the scaffold (SQLite comes later). */
export interface CampaignState {
  id: EntityId;
  settings: CampaignSettings;
  /** Strategic clock (ISO date-time in campaign time). */
  strategicTime: string;
  factions: Faction[];
  theaters: Theater[];
  economy: CampaignEconomy;
  taskForces: TaskForce[];
  ports: Port[];
  airbases: Airbase[];
  resourceNodes: ResourceNode[];
  tradeRoutes: TradeRoute[];
  landWarRegions: LandWarRegion[];
  logistics: LogisticsState[];
  intelReports: IntelReport[];
  missionCandidates: MissionCandidate[];
  unitCatalog: UnitCatalogEntry[];
}
