/**
 * Frontend service for the read-only StreamingAssets scanner prototype.
 *
 * The scan runs in the Rust side (`scan_streaming_assets` command). It lists
 * candidate .ini files under known content folders in `original` and `user`
 * without parsing any schemas (first scanner milestone,
 * docs/IMPLEMENTATION_READINESS.md). Missing folders come back as warnings,
 * never fatal errors.
 */

export interface DiscoveredIniFile {
  sourceRoot: "original" | "user";
  contentFolder: string;
  relativePath: string;
  absolutePath: string;
  fileSizeBytes: number;
}

export interface DiscoveredNationValue {
  rawValue: string;
  fileCount: number;
  occurrenceCount: number;
  examplePaths: string[];
}

export interface CountedValue {
  value: string;
  count: number;
}

export interface IniSummary {
  parsedFiles: number;
  parseWarnings: number;
  sectionCount: number;
  keyValueCount: number;
  taskForceCostCount: number;
  filesWithTaskForceCost: number;
  categoryCounts: Record<string, number>;
  topSections: CountedValue[];
  topKeys: CountedValue[];
}

export interface ScanResult {
  streamingAssetsRoot: string;
  files: DiscoveredIniFile[];
  nationValues: DiscoveredNationValue[];
  iniSummary: IniSummary;
  warnings: string[];
  unknownFolders: string[];
}

function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

/**
 * Run a read-only scan. Returns null in browser dev mode (no filesystem).
 * Throws with a message when the path is not a valid StreamingAssets root.
 */
export async function scanStreamingAssets(path: string): Promise<ScanResult | null> {
  if (!isTauri()) return null;
  const { invoke } = await import("@tauri-apps/api/core");
  return invoke<ScanResult>("scan_streaming_assets", { path });
}

/** Group scan results per content folder for display. */
export function summarizeScan(result: ScanResult): Array<{
  sourceRoot: string;
  contentFolder: string;
  fileCount: number;
}> {
  const counts = new Map<string, number>();
  for (const f of result.files) {
    const key = `${f.sourceRoot}::${f.contentFolder}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([key, fileCount]) => {
      const [sourceRoot, contentFolder] = key.split("::");
      return { sourceRoot, contentFolder, fileCount };
    })
    .sort((a, b) =>
      a.sourceRoot === b.sourceRoot
        ? a.contentFolder.localeCompare(b.contentFolder)
        : a.sourceRoot.localeCompare(b.sourceRoot),
    );
}


