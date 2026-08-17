import type { CampaignSide, DataProvenance, EntityId, GeoPosition } from "../common";

/**
 * Abstract land-war region (docs/SCAFFOLD_SPEC.md "Land War Simulation").
 * Sea Power does not resolve land warfare; land battles are strategic-map
 * events only, never tactical Sea Power missions.
 */
export interface LandWarRegion {
  id: EntityId;
  name: string;
  theaterId: EntityId;
  /** Rough polygon or center for display. */
  center: GeoPosition;
  controllingSide: CampaignSide;
  /** 0..1 relative strengths, strategic abstraction. */
  playerGroundStrength: number;
  enemyGroundStrength: number;
  playerSupply: number;
  enemySupply: number;
  /** IDs of ports/airbases/resource nodes whose control follows this region. */
  linkedEntityIds: EntityId[];
  contested: boolean;
  provenance: DataProvenance;
}
