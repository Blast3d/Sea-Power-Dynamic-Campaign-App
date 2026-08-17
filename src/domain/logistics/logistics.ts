import type { EntityId } from "../common";

/**
 * Logistics readiness for one location or task force
 * (docs/SCAFFOLD_SPEC.md "Logistics Layer").
 *
 * Mission effects (later milestones): poor supply may disable
 * `TaskForceModeRearm`; poor repair access may disable or raise the cost of
 * `TaskForceModeRepair`; airbase/port control unlocks deployment options.
 */
export interface LogisticsState {
  /** The map entity or task force this state describes. */
  subjectId: EntityId;
  /** 0..1 availability values. */
  fuelAvailability: number;
  supplyAvailability: number;
  portCapacityUsed: number;
  portCapacityTotal: number;
  airbaseCapacityUsed: number;
  airbaseCapacityTotal: number;
  repairCapable: boolean;
  rearmCapable: boolean;
  /** Nautical miles from the nearest friendly supply source. */
  distanceFromSupplyNm: number;
  /** 0..1 — how safe the connecting convoy/trade routes currently are. */
  routeSafety: number;
}
