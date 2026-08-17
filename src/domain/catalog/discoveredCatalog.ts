/**
 * Typed discovered catalogs, mirroring the Rust `build_discovered_catalogs`
 * command payload (src-tauri/src/catalog.rs).
 *
 * Everything here is *discovered* data: exact raw values with preserved
 * source root/mod/path. Promotion helpers turn these records into domain
 * `Faction` and `UnitCatalogEntry` objects with
 * `provenance: { kind: "discovered", ... }` so they are export-eligible,
 * unlike seed data. Raw spellings (e.g. `Iraq` vs `iraq`) are never merged;
 * the UI may group them for display, but each record keeps its exact value.
 */

import type { Faction } from "../campaign/faction";
import type { UnitCatalogEntry, UnitCategory } from "./unitCatalog";

// ---------------------------------------------------------------------------
// Payload types (camelCase mirror of the Rust structs)
// ---------------------------------------------------------------------------

export interface NationsReferenceEntry {
  prefix: string;
  nationName: string;
  sourceRoot: "original" | "user";
  relativePath: string;
}

export interface DiscoveredNation {
  rawValue: string;
  occurrenceCount: number;
  fileCount: number;
  examplePaths: string[];
  referencePrefixes: string[];
  caseInsensitiveReferenceMatch: boolean;
}

export interface DiscoveredLoadoutCost {
  loadout: string;
  rawValue: string;
}

export interface DiscoveredVariant {
  section: string;
  nation?: string | null;
  sourcePath: string;
}

export interface DiscoveredUnit {
  unitType: string;
  category: string;
  sourceRoot: "original" | "user";
  sourceMod?: string | null;
  sourcePaths: string[];
  nations: string[];
  referenceNation?: string | null;
  variants: DiscoveredVariant[];
  squadronSections: string[];
  loadoutSections: string[];
  taskForceCostRaw?: string | null;
  taskForceCostSection?: string | null;
  loadoutCosts: DiscoveredLoadoutCost[];
  displayNameGuess?: string | null;
}

export interface SupportFileRecord {
  fileStem: string;
  contentFolder: "squadrons" | "loadouts";
  sourceRoot: "original" | "user";
  sourceMod?: string | null;
  relativePath: string;
  sections: string[];
}

export interface CatalogStats {
  parsedFiles: number;
  parseWarnings: number;
  unitCount: number;
  unitsWithTaskForceCost: number;
  unitsWithVariants: number;
  nationValueCount: number;
  categoryCounts: Record<string, number>;
}

export interface DiscoveredCatalogs {
  streamingAssetsRoot: string;
  nationsReference: NationsReferenceEntry[];
  nations: DiscoveredNation[];
  units: DiscoveredUnit[];
  squadronFiles: SupportFileRecord[];
  loadoutFiles: SupportFileRecord[];
  stats: CatalogStats;
  warnings: string[];
  heuristicNotes: string[];
}

// ---------------------------------------------------------------------------
// Promotion: discovered nations -> Faction records
// ---------------------------------------------------------------------------

/**
 * Promote each discovered raw nation value to a selectable faction.
 *
 * One faction per exact raw value — `Iraq` and `iraq` become two records
 * whose display grouping is a UI concern. Exported files must use the exact
 * raw value carried on the faction, so merging here would corrupt exports.
 */
export function toDiscoveredFactions(catalogs: DiscoveredCatalogs): Faction[] {
  return catalogs.nations.map((n) => {
    const example = n.examplePaths[0];
    return {
      id: `faction-discovered-${n.rawValue}`,
      displayName: n.rawValue,
      rawNationValues: [n.rawValue],
      playableInScaffold: true,
      enemyOptionInScaffold: true,
      provenance: {
        kind: "discovered",
        sourceRoot: example?.startsWith("user/") ? "user" : "original",
        sourceMod: example?.startsWith("user/") ? example.split("/")[1] : undefined,
        sourcePath: example ?? "",
      },
      notes:
        n.referencePrefixes.length > 0
          ? `nations_reference prefixes: ${n.referencePrefixes.join(", ")}`
          : n.caseInsensitiveReferenceMatch
            ? "Matches a nations_reference name only case-insensitively; exact raw value preserved."
            : undefined,
    };
  });
}

// ---------------------------------------------------------------------------
// Promotion: discovered units -> UnitCatalogEntry records
// ---------------------------------------------------------------------------

const CATEGORY_MAP: Record<string, UnitCategory> = {
  vessels: "vessel",
  submarines: "submarine",
  aircraft: "aircraft",
  helicopters: "helicopter",
  land_units: "landUnit",
};

/** Parse a raw cost string to a number, returning undefined when unparsable. */
export function parseCost(raw: string | null | undefined): number | undefined {
  if (raw === null || raw === undefined) return undefined;
  const n = Number(raw.trim());
  return Number.isFinite(n) ? n : undefined;
}

/**
 * Promote discovered units into the domain unit catalog.
 *
 * - `unitType` is the exact file stem (real Sea Power internal ID).
 * - Display name falls back to the unit type when no DisplayName was seen;
 *   the guess is used but the entry keeps the real ID as the source of truth.
 * - Raw cost strings are parsed defensively; unparsable costs stay undefined
 *   so the validator can warn instead of exporting a wrong number.
 * - Provenance records source root/mod/path, making entries export-eligible.
 */
export function toUnitCatalogEntries(catalogs: DiscoveredCatalogs): UnitCatalogEntry[] {
  return catalogs.units.map((u) => {
    const category = CATEGORY_MAP[u.category] ?? "vessel";
    const loadoutCosts: Record<string, number> = {};
    const loadouts: string[] = [...u.loadoutSections];
    for (const lc of u.loadoutCosts) {
      const parsed = parseCost(lc.rawValue);
      if (parsed !== undefined) loadoutCosts[lc.loadout] = parsed;
      if (!loadouts.includes(lc.loadout)) loadouts.push(lc.loadout);
    }
    return {
      id: `unit-discovered-${u.sourceRoot}-${u.category}-${u.unitType}`,
      unitType: u.unitType,
      displayName: u.displayNameGuess?.trim() || u.unitType,
      category,
      rawNationValues: [...u.nations],
      variants: u.variants.map((v) => v.section),
      squadrons: [...u.squadronSections],
      loadouts,
      taskForceCost: parseCost(u.taskForceCostRaw),
      loadoutCosts,
      provenance: {
        kind: "discovered",
        sourceRoot: u.sourceRoot,
        sourceMod: u.sourceMod ?? undefined,
        sourcePath: u.sourcePaths[0] ?? "",
      },
    };
  });
}

/**
 * Merge discovered entries into an existing (seed) catalog.
 *
 * Discovered data replaces seed data per category: a seed entry survives
 * only while its category has no discovered units at all. Seed entries can
 * never coexist as decoys next to real data of the same category.
 */
export function mergeCatalogs(
  seedEntries: UnitCatalogEntry[],
  discovered: UnitCatalogEntry[],
): UnitCatalogEntry[] {
  const discoveredCategories = new Set(discovered.map((d) => d.category));
  const surviving = seedEntries.filter(
    (s) => s.provenance.kind !== "seed" || !discoveredCategories.has(s.category),
  );
  return [...discovered, ...surviving];
}

/**
 * Merge discovered factions into the scaffold faction list.
 *
 * Scaffold (seed) factions stay listed first for continuity; a discovered
 * faction whose exact raw value is already claimed by a scaffold faction's
 * rawNationValues is skipped to avoid duplicate selectable sides.
 */
export function mergeFactions(seedFactions: Faction[], discovered: Faction[]): Faction[] {
  const claimed = new Set(seedFactions.flatMap((f) => f.rawNationValues));
  return [
    ...seedFactions,
    ...discovered.filter((d) => !d.rawNationValues.some((v) => claimed.has(v))),
  ];
}
