import type { CampaignSide, DataProvenance, EntityId, GeoPosition } from "../common";

/** Every kind of entity the strategic map can display. */
export type MapEntityKind =
  | "taskForce"
  | "port"
  | "navalBase"
  | "airbase"
  | "inlandBase"
  | "resourceNode"
  | "tradeRoute"
  | "seaLane"
  | "threatArea"
  | "missionArea"
  | "intelContact"
  | "contestedRegion"
  | "landFront";

/** Base shape shared by all strategic map entities. */
export interface MapEntity {
  id: EntityId;
  kind: MapEntityKind;
  name: string;
  side: CampaignSide;
  /** Point entities use `position`; lines/areas use `path`. */
  position?: GeoPosition;
  path?: GeoPosition[];
  theaterId: EntityId;
  provenance: DataProvenance;
}

/** A port on the strategic map. */
export interface Port extends MapEntity {
  kind: "port";
  /** How many task forces can be based/staged here. */
  taskForceCapacity: number;
  repairCapable: boolean;
  rearmCapable: boolean;
  /** Funds per strategic day while controlled. */
  incomePerDay: number;
}

/** An airbase on the strategic map (naval air station or land airbase). */
export interface Airbase extends MapEntity {
  kind: "airbase";
  aircraftCapacity: number;
  /** Whether land-based aircraft can currently operate from here. */
  operational: boolean;
  incomePerDay: number;
}

/** A strategic resource node (oil field, refinery, industrial site...). */
export interface ResourceNode extends MapEntity {
  kind: "resourceNode";
  resource: "oil" | "supplies" | "industry";
  outputPerDay: number;
}

/** A trade route or sea lane generating income while safe. */
export interface TradeRoute extends MapEntity {
  kind: "tradeRoute";
  incomePerDay: number;
  /** 0..1 — how threatened the route currently is. */
  threatLevel: number;
}
