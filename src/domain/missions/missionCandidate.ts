import type { DataProvenance, EntityId, GeoPosition } from "../common";

/** Mission archetypes the strategic layer can generate. */
export type MissionType =
  | "convoyEscort"
  | "carrierStrike"
  | "amphibiousSupport"
  | "portDefense"
  | "aswSweep"
  | "surfaceAction"
  | "airfieldStrike"
  | "reconnaissance"
  | "seaLaneInterdiction"
  | "logisticsRescue"
  | "blockadeEnforcement";

export interface MissionObjective {
  id: EntityId;
  description: string;
  /**
   * True when this objective depends on an uncertain (random / dynamically
   * generated) contact. Missions where ALL required objectives are uncertain
   * must provide a fallback completion path or they fail validation.
   */
  dependsOnUncertainContact: boolean;
  /** Whether completing this objective alone can complete the mission. */
  sufficientForCompletion: boolean;
}

/**
 * A mission the player could choose to fight in Sea Power.
 * Candidates carry strategic context; actual .ini generation is a later
 * milestone and lives behind SeaPowerExportPlan.
 */
export interface MissionCandidate {
  id: EntityId;
  title: string;
  missionType: MissionType;
  theaterId: EntityId;
  location: GeoPosition;
  /** Why the strategic situation produced this mission. */
  strategicReason: string;
  /** Task forces the player could commit. */
  availableTaskForceIds: EntityId[];
  /** Intel report(s) backing the threat picture. */
  intelReportIds: EntityId[];
  objectives: MissionObjective[];
  /** Display-only threat expectations (ship/air/sub/land). */
  expectedThreats: {
    ship: boolean;
    air: boolean;
    sub: boolean;
    land: boolean;
  };
  /** Logistics constraints affecting the generated mission. */
  logisticsNotes: string[];
  /** Campaign rewards on success. */
  rewards: { funds?: number; influence?: number; notes?: string };
  /** Campaign consequences on failure/decline. */
  consequences: string[];
  /** Set once exported: path of the generated Sea Power mission file. */
  exportedMissionPath?: string;
  provenance: DataProvenance;
}
