/**
 * Frontend service for the read-only discovered-catalog builder.
 *
 * The heavy lifting runs in the Rust side (`build_discovered_catalogs`
 * command): it parses nations_reference.ini and unit-bearing .ini files into
 * typed records with exact raw values and preserved source paths. In browser
 * dev mode there is no filesystem access, so this returns null and the UI
 * shows an unavailable state.
 */

import type { DiscoveredCatalogs } from "../domain";

function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

/**
 * Build discovered catalogs for the configured game path.
 * Returns null in browser dev mode. Throws with a message when the path is
 * not a valid StreamingAssets root.
 */
export async function buildDiscoveredCatalogs(
  path: string,
): Promise<DiscoveredCatalogs | null> {
  if (!isTauri()) return null;
  const { invoke } = await import("@tauri-apps/api/core");
  return invoke<DiscoveredCatalogs>("build_discovered_catalogs", { path });
}
