import { useMemo, useState } from "react";
import type { CampaignState, GamePathStatus } from "../../domain";
import { validateScaffoldCampaign } from "../../domain";
import {
  scanStreamingAssets,
  summarizeScan,
  type ScanResult,
} from "../../services/streamingAssetsScanner";

/**
 * Export & validation panel.
 *
 * Runs the first-milestone validator over the campaign state and always
 * reports the export gate: export is NOT implemented in the scaffold and is
 * blocked until validators are complete and the user explicitly asks for it.
 * Also hosts the read-only scanner prototype trigger.
 */
export function ValidationPanel({
  campaign,
  pathStatus,
}: {
  campaign: CampaignState;
  pathStatus: GamePathStatus | null;
}) {
  const result = useMemo(
    () => validateScaffoldCampaign(campaign, pathStatus),
    [campaign, pathStatus],
  );
  const [scan, setScan] = useState<ScanResult | null>(null);
  const [scanMessage, setScanMessage] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);

  async function runScan() {
    setScanning(true);
    setScanMessage(null);
    try {
      const r = await scanStreamingAssets(campaign.settings.gameInstallPath);
      if (r === null) {
        setScanMessage(
          "Scanner requires the desktop app (Tauri). In browser dev mode there is no filesystem access.",
        );
      } else {
        setScan(r);
      }
    } catch (err) {
      setScanMessage(String(err));
    } finally {
      setScanning(false);
    }
  }

  const errors = result.issues.filter((i) => i.severity === "error");
  const warnings = result.issues.filter((i) => i.severity === "warning");
  const infos = result.issues.filter((i) => i.severity === "info");

  return (
    <div className="panel">
      <h2>Export &amp; Validation</h2>
      <div className="panel-body">
        <div className="item-sub" style={{ marginBottom: 6 }}>
          Export is blocked: {errors.length} error(s), {warnings.length} warning(s).
        </div>
        {[...errors, ...warnings, ...infos].map((i, idx) => (
          <div className="issue" key={`${i.ruleId}-${idx}`}>
            <span className={`badge ${i.severity}`}>{i.severity.toUpperCase()}</span>
            <span className="msg">{i.message}</span>
          </div>
        ))}

        <hr style={{ borderColor: "var(--border)", margin: "10px 0" }} />
        <h3>Read-only data scanner (prototype)</h3>
        <div className="item-sub" style={{ margin: "4px 0 8px" }}>
          Lists candidate .ini files and raw Nation= values under StreamingAssets/original and /user.
          Read-only; no writing.
        </div>
        <button onClick={() => void runScan()} disabled={scanning} style={{ width: "100%" }}>
          {scanning ? "Scanningâ€¦" : "Scan StreamingAssets (read-only)"}
        </button>
        {scanMessage && (
          <div className="item-sub" style={{ marginTop: 6 }}>
            {scanMessage}
          </div>
        )}
        {scan && (
          <div style={{ marginTop: 8 }}>
            <div className="item-sub">
              Root: {scan.streamingAssetsRoot} · {scan.files.length} .ini files found · {scan.iniSummary.parsedFiles} parsed
            </div>
            <div style={{ marginTop: 8 }}>
              <h3>Structured INI summary</h3>
              <div className="stat-row"><span className="k">Sections</span><span className="v">{scan.iniSummary.sectionCount}</span></div>
              <div className="stat-row"><span className="k">Key/value pairs</span><span className="v">{scan.iniSummary.keyValueCount}</span></div>
              <div className="stat-row"><span className="k">TaskForceCost entries</span><span className="v">{scan.iniSummary.taskForceCostCount}</span></div>
              <div className="stat-row"><span className="k">Files with TaskForceCost</span><span className="v">{scan.iniSummary.filesWithTaskForceCost}</span></div>
              {scan.iniSummary.parseWarnings > 0 && (
                <div className="item-sub">{scan.iniSummary.parseWarnings} file(s) could not be opened for parsing.</div>
              )}
            </div>
            {scan.iniSummary.topSections.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <h3>Top sections</h3>
                {scan.iniSummary.topSections.slice(0, 8).map((s) => (
                  <div className="stat-row" key={s.value}>
                    <span className="k">[{s.value}]</span>
                    <span className="v">{s.count}</span>
                  </div>
                ))}
              </div>
            )}
            {scan.nationValues.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <h3>Top discovered Nation= values</h3>
                {scan.nationValues.slice(0, 12).map((n) => (
                  <div className="stat-row" key={n.rawValue} title={n.examplePaths.join("\n")}>
                    <span className="k">{n.rawValue}</span>
                    <span className="v">{n.occurrenceCount}</span>
                  </div>
                ))}
                <div className="item-sub" style={{ marginTop: 3 }}>
                  {scan.nationValues.length} raw nation value(s) found. Exact spellings are preserved for later export validation.
                </div>
              </div>
            )}
            <h3 style={{ marginTop: 8 }}>Candidate .ini files</h3>
            {summarizeScan(scan).map((s) => (
              <div className="stat-row" key={`${s.sourceRoot}-${s.contentFolder}`}>
                <span className="k">
                  {s.sourceRoot}/{s.contentFolder}
                </span>
                <span className="v">{s.fileCount}</span>
              </div>
            ))}
            {scan.unknownFolders.length > 0 && (
              <div className="item-sub" style={{ marginTop: 4 }}>
                Unclassified folders: {scan.unknownFolders.join(", ")}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}


