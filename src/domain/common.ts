/**
 * Shared primitives used across the domain model.
 * Domain modules must not import from src/ui or src/services.
 */

/** Stable in-app identifier. Not a Sea Power ID. */
export type EntityId = string;

/** Geographic position in decimal degrees (WGS84-style, map display). */
export interface GeoPosition {
  lat: number;
  lon: number;
}

/**
 * Marks where a piece of data came from.
 *
 * - `seed`: placeholder data shipped with the app scaffold for UI development.
 *   Seed data must be clearly labeled in the UI and must never be exported
 *   to Sea Power files.
 * - `discovered`: read from the player's actual Sea Power install / mods.
 *   Discovered data preserves its source path and source root.
 */
export type DataProvenance =
  | { kind: "seed" }
  | {
      kind: "discovered";
      /** "original" (base game, read-only) or "user" (user/mod content). */
      sourceRoot: "original" | "user";
      /** Mod name when under user/<Mod Name>/..., undefined for base game. */
      sourceMod?: string;
      /** Path relative to the StreamingAssets root. */
      sourcePath: string;
    };

export function isSeedData(p: DataProvenance): boolean {
  return p.kind === "seed";
}

/** Campaign-side alignment used on the strategic map. */
export type CampaignSide = "player" | "enemy" | "neutral";

/** Known Sea Power mission side values (see docs/SEA_POWER_RULES.md). */
export type SeaPowerMissionSide = "Blue" | "Red" | "Neutral";

/** Known Sea Power crew skill values. */
export type CrewSkill = "Green" | "Trained" | "Seasoned" | "Veterans" | "Ultra";

/** Known Sea Power ROE values. */
export type RulesOfEngagement = "Weapons Tight" | "Weapons Free" | "Weapons Hold";
