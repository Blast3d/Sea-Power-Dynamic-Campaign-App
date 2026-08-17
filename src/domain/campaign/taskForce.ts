import type { CampaignSide, EntityId, GeoPosition, DataProvenance } from "../common";

/** A unit assigned to a task force (references the unit catalog). */
export interface TaskForceUnitAssignment {
  catalogEntryId: EntityId;
  /** Chosen variant (vessels/subs) or squadron (aircraft/helos), when picked. */
  variantOrSquadron?: string;
  loadout?: string;
  /** 0..1 remaining, strategic-layer abstraction. */
  condition: number;
  ammoState: "full" | "partial" | "depleted";
}

/** A player or enemy task force on the strategic map. */
export interface TaskForce {
  id: EntityId;
  name: string;
  side: CampaignSide;
  factionId: EntityId;
  theaterId: EntityId;
  position: GeoPosition;
  /** Planned movement route on the strategic map. */
  route: GeoPosition[];
  /** Strategic speed in knots for ETA estimates (hours = nm / kts). */
  speedKts: number;
  units: TaskForceUnitAssignment[];
  /** Task Force Mode point total represented by this force. */
  pointValue: number;
  provenance: DataProvenance;
}
