/**
 * Frontend service for Sea Power install path validation.
 *
 * The real check runs in the Rust side (`validate_game_path` command), which
 * is the only component with filesystem access. In a plain browser (vite dev
 * without Tauri) the native check is unavailable and we return null so the
 * UI can show an "unverified" state instead of pretending.
 */

import type { GamePathStatus } from "../domain";

interface RawPathValidation {
  isValid: boolean;
  streamingAssetsRoot: string | null;
  hasOriginal: boolean;
  hasUser: boolean;
  errors: string[];
  warnings: string[];
}

function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

export async function validateGamePath(path: string): Promise<GamePathStatus | null> {
  if (!isTauri()) {
    return null; // Browser dev mode: no filesystem access, path unverified.
  }
  const { invoke } = await import("@tauri-apps/api/core");
  const raw = await invoke<RawPathValidation>("validate_game_path", { path });
  return {
    isValid: raw.isValid,
    streamingAssetsRoot: raw.streamingAssetsRoot ?? undefined,
    hasOriginal: raw.hasOriginal,
    hasUser: raw.hasUser,
    errors: raw.errors,
    warnings: raw.warnings,
  };
}

/** Open a native folder picker (Tauri only). Returns null in browser dev. */
export async function pickGameFolder(): Promise<string | null> {
  if (!isTauri()) return null;
  const { open } = await import("@tauri-apps/plugin-dialog");
  const selected = await open({ directory: true, multiple: false, title: "Select Sea Power folder" });
  return typeof selected === "string" ? selected : null;
}
