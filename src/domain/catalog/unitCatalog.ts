import type { DataProvenance, EntityId } from "../common";

/** Sea Power unit categories relevant to Task Force Mode rosters. */
export type UnitCategory =
  | "vessel"
  | "submarine"
  | "aircraft"
  | "helicopter"
  | "landUnit";

/**
 * One entry in the unit catalog.
 *
 * Production entries must come from discovered game/mod .ini data
 * (provenance.kind === "discovered") and preserve exact internal IDs.
 * Seed entries exist only so the UI scaffold is usable before scanning is
 * implemented; they are clearly labeled and are never exportable.
 *
 * Roster rules (docs/SEA_POWER_RULES.md): ships/submarines use
 * `VariantReference` values; aircraft/helicopters use `SquadronReference`.
 */
export interface UnitCatalogEntry {
  id: EntityId;
  /** Internal Sea Power unit type ID, e.g. `usn_ddg_kidd`. Seed IDs are prefixed `seed_`. */
  unitType: string;
  displayName: string;
  category: UnitCategory;
  /** Raw `Nation=` value(s) observed for this unit, exact spelling preserved. */
  rawNationValues: string[];
  /** Variant names for vessels/submarines. */
  variants: string[];
  /** Squadron names for aircraft/helicopters. */
  squadrons: string[];
  /** Known loadout names. */
  loadouts: string[];
  /** Task Force Builder point cost. Undefined = unknown (validator warns). */
  taskForceCost?: number;
  /** Per-loadout point costs where known. */
  loadoutCosts: Record<string, number>;
  provenance: DataProvenance;
}

/**
 * True when the entry may appear in exported Sea Power files.
 * Seed/placeholder units must never pass this gate.
 */
export function isExportableUnit(entry: UnitCatalogEntry): boolean {
  return entry.provenance.kind === "discovered";
}
