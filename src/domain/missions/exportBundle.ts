/**
 * Export bundle types: the concrete set of files a Sea Power export writes.
 *
 * Export is now implemented but remains gated:
 * - only bundles that pass `validateExportBundle` may be written
 * - the Rust `export_campaign_files` command refuses any target outside
 *   `StreamingAssets/user/<Mod Name>/` and anything under `original`
 * - seed units can never appear in generated files
 */

import type { EntityId } from "../common";

/** One generated file, path relative to the mod root under user/. */
export interface GeneratedFile {
  /** e.g. `campaigns/persian_gulf_flashpoint/campaign.ini` */
  relativePath: string;
  content: string;
}

/** Everything needed to preview, validate, and write one export. */
export interface ExportBundle {
  /** Mod folder name under StreamingAssets/user/. Safe-filename rules apply. */
  modName: string;
  /** Campaign folder name under <mod>/campaigns/. Safe-filename rules apply. */
  campaignFolder: string;
  missionCandidateId: EntityId;
  /** Relative path (under the mod root) of the generated mission file. */
  missionRelativePath: string;
  files: GeneratedFile[];
  /**
   * Relative path (under StreamingAssets) of the base-game mission used as a
   * read-only reference for unverified [Mission] keys (location, date,
   * environment). Undefined = no reference used; validator warns.
   */
  referenceMissionPath?: string;
  /** Unit types included, for validation against the discovered catalog. */
  usedUnitTypes: string[];
}
