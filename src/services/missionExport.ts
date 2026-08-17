/**
 * Frontend service for the gated mission export flow.
 *
 * - `readReferenceMission`: read-only fetch of a base-game mission's text so
 *   the generator can copy unverified [Mission] keys from real game data.
 * - `exportCampaignFiles`: writes a validated bundle under
 *   StreamingAssets/user/<Mod Name>/ via the guarded Rust command. The UI
 *   must only call this with bundles that passed `validateExportBundle`.
 *
 * Both return null in browser dev mode (no filesystem).
 */

import type { ExportBundle } from "../domain";

export interface ExportOutcome {
  modRoot: string;
  written: string[];
  skippedExisting: string[];
}

function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

export async function readReferenceMission(
  path: string,
  relativePath: string,
): Promise<string | null> {
  if (!isTauri()) return null;
  const { invoke } = await import("@tauri-apps/api/core");
  return invoke<string>("read_reference_mission", { path, relativePath });
}

export async function exportCampaignFiles(
  path: string,
  bundle: ExportBundle,
  overwrite: boolean,
): Promise<ExportOutcome | null> {
  if (!isTauri()) return null;
  const { invoke } = await import("@tauri-apps/api/core");
  return invoke<ExportOutcome>("export_campaign_files", {
    path,
    modName: bundle.modName,
    files: bundle.files.map((f) => ({
      relativePath: f.relativePath,
      content: f.content,
    })),
    overwrite,
  });
}
