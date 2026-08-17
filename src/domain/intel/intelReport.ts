import type { DataProvenance, EntityId, GeoPosition } from "../common";

/** Confidence in an intel contact, driving Dynamic Unit Generation later. */
export type IntelConfidence = "low" | "medium" | "high" | "confirmed";

export interface IntelContact {
  id: EntityId;
  /** What the contact is believed to be. */
  classification:
    | "surfaceGroup"
    | "submarine"
    | "airRaid"
    | "convoy"
    | "unknown";
  /** 0..100 spawn-chance style confidence percentage. */
  confidencePercent: number;
  estimatedPosition: GeoPosition;
  /** Radius of position uncertainty in nautical miles. */
  uncertaintyRadiusNm: number;
  estimatedStrength?: string;
}

/**
 * An intel report generated from campaign state.
 *
 * Rule (docs/SEA_POWER_RULES.md): missions derived from intel must remain
 * playable and completable even if uncertain contacts never spawn.
 */
export interface IntelReport {
  id: EntityId;
  title: string;
  theaterId: EntityId;
  /** Strategic-time timestamp (ISO string in campaign time). */
  issuedAt: string;
  summary: string;
  contacts: IntelContact[];
  /** Mission candidates spawned from this report, if any. */
  missionCandidateIds: EntityId[];
  provenance: DataProvenance;
}
