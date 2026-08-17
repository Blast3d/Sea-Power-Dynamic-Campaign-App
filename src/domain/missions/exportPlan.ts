import type { EntityId } from "../common";

/**
 * A plan describing what a Sea Power export WOULD write.
 *
 * EXPORT BOUNDARY (CLAUDE.md): the scaffold must not generate real campaign
 * files. This type exists so the validation panel can reason about a future
 * export without any writing capability existing yet. There is deliberately
 * no code path in the scaffold that writes into the game folders.
 *
 * When export is implemented, output must go only under a user/mod-owned
 * path like `Sea Power_Data/StreamingAssets/user/<Mod Name>/campaigns/<campaign>`
 * and never under `original`.
 */
export interface SeaPowerExportPlan {
  id: EntityId;
  campaignId: EntityId;
  /** Mod folder name the export would create/use under StreamingAssets/user. */
  targetModName: string;
  /** Campaign folder name under <mod>/campaigns/. */
  targetCampaignFolder: string;
  /** Mission candidates included in the export. */
  missionCandidateIds: EntityId[];
  /** Resolved absolute output root, when a valid game path is configured. */
  resolvedOutputRoot?: string;
  /**
   * Hard gate: false until real export is implemented AND the user has
   * explicitly asked to test export. The scaffold always keeps this false.
   */
  exportImplemented: false;
}

/** Sea Power-safe file name: letters, digits, underscores, hyphens. */
export function toSafeFileName(name: string): string {
  return name
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^A-Za-z0-9_-]/g, "")
    .slice(0, 80);
}
