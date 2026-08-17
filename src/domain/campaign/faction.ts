import type { DataProvenance, EntityId } from "../common";

/**
 * A selectable side in the campaign.
 *
 * Scaffold factions (USA, Russian Forces/Soviet, Iraq) use friendly labels
 * until mapped to discovered Sea Power nation values. The UI may show
 * `displayName`, but exported files must use exact raw `Nation=` values from
 * `rawNationValues` — never the display label. Raw values are preserved
 * verbatim (e.g. both `Iraq` and `iraq` are observed in base game data) and
 * must not be silently merged at export time.
 */
export interface Faction {
  id: EntityId;
  displayName: string;
  /**
   * Exact raw `Nation=` values this faction maps to in game data, once known.
   * Empty for pure scaffold labels that are not yet mapped.
   */
  rawNationValues: string[];
  /** Whether the scaffold offers this faction as a playable side. */
  playableInScaffold: boolean;
  /** Whether the scaffold offers this faction as an enemy side. */
  enemyOptionInScaffold: boolean;
  provenance: DataProvenance;
  notes?: string;
}
