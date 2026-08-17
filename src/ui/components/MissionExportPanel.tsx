import { useMemo, useState } from "react";
import type { CampaignState, ExportBundle, ValidationResult } from "../../domain";
import { planMissionExport, validateExportBundle } from "../../domain";
import {
  scanStreamingAssets,
  type DiscoveredIniFile,
} from "../../services/streamingAssetsScanner";
import {
  exportCampaignFiles,
  readReferenceMission,
  type ExportOutcome,
} from "../../services/missionExport";

/**
 * Mission Export panel — the gated playtest export flow:
 *
 * 1. Pick a mission candidate, mod name, and (recommended) a base-game
 *    reference mission whose [Mission] location/date/environment keys are
 *    copied from real game data.
 * 2. Generate a bundle (campaign.ini, commander_settings.ini, roster,
 *    Generated mission) from DISCOVERED units only.
 * 3. Validate: the Export button stays disabled until zero errors.
 * 4. Export writes only under StreamingAssets/user/<Mod Name>/.
 */
export function MissionExportPanel({ campaign }: { campaign: CampaignState }) {
  const [candidateId, setCandidateId] = useState(campaign.missionCandidates[0]?.id ?? "");
  const [modName, setModName] = useState("SPDC_Campaign");
  const [referencePath, setReferencePath] = useState<string>("");
  const [missionFiles, setMissionFiles] = useState<DiscoveredIniFile[] | null>(null);
  const [bundle, setBundle] = useState<ExportBundle | null>(null);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [problems, setProblems] = useState<string[]>([]);
  const [outcome, setOutcome] = useState<ExportOutcome | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [previewPath, setPreviewPath] = useState<string | null>(null);
  const [overwrite, setOverwrite] = useState(false);

  const enemyNations = useMemo(() => {
    const enemies = campaign.factions.filter((f) =>
      campaign.settings.opposingFactionIds.includes(f.id),
    );
    return enemies.flatMap((f) => f.rawNationValues);
  }, [campaign]);

  const hasDiscovered = campaign.unitCatalog.some((u) => u.provenance.kind === "discovered");

  async function loadMissionList() {
    setBusy(true);
    setMessage(null);
    try {
      const scan = await scanStreamingAssets(campaign.settings.gameInstallPath);
      if (!scan) {
        setMessage("Reference mission list requires the desktop app (Tauri).");
        return;
      }
      setMissionFiles(
        scan.files.filter(
          (f) => f.sourceRoot === "original" && f.contentFolder === "missions",
        ),
      );
    } catch (err) {
      setMessage(String(err));
    } finally {
      setBusy(false);
    }
  }

  async function generate() {
    setBusy(true);
    setMessage(null);
    setOutcome(null);
    try {
      const candidate = campaign.missionCandidates.find((c) => c.id === candidateId);
      if (!candidate) {
        setMessage("Pick a mission candidate first.");
        return;
      }
      let referenceMissionText: string | undefined;
      if (referencePath) {
        const text = await readReferenceMission(
          campaign.settings.gameInstallPath,
          referencePath,
        );
        if (text) referenceMissionText = text;
        else setMessage("Could not read the reference mission (desktop app required).");
      }
      const result = planMissionExport(campaign, candidate, {
        modName,
        enemyNationValues: enemyNations,
        maxEnemyVessels: 2,
        patrolMinutes: 60,
        referenceMissionText,
        referenceMissionPath: referencePath || undefined,
      });
      setProblems(result.problems);
      setBundle(result.bundle);
      setValidation(
        result.bundle ? validateExportBundle(result.bundle, campaign.unitCatalog) : null,
      );
      setPreviewPath(result.bundle?.missionRelativePath ?? null);
    } finally {
      setBusy(false);
    }
  }

  async function runExport() {
    if (!bundle || !validation?.passed) return;
    setBusy(true);
    setMessage(null);
    try {
      const result = await exportCampaignFiles(
        campaign.settings.gameInstallPath,
        bundle,
        overwrite,
      );
      if (!result) {
        setMessage("Export requires the desktop app (Tauri).");
        return;
      }
      setOutcome(result);
    } catch (err) {
      setMessage(String(err));
    } finally {
      setBusy(false);
    }
  }

  const errors = validation?.issues.filter((i) => i.severity === "error") ?? [];
  const warnings = validation?.issues.filter((i) => i.severity === "warning") ?? [];
  const infos = validation?.issues.filter((i) => i.severity === "info") ?? [];
  const previewFile = bundle?.files.find((f) => f.relativePath === previewPath);

  return (
    <div className="panel">
      <h2>Mission Export</h2>
      <div className="panel-body">
        {!hasDiscovered && (
          <div className="item-sub" style={{ marginBottom: 8 }}>
            <span className="badge warning">WARNING</span> Build and apply discovered
            catalogs first — seed units can never be exported.
          </div>
        )}

        <label>Mission candidate</label>
        <select value={candidateId} onChange={(e) => setCandidateId(e.target.value)}>
          {campaign.missionCandidates.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>

        <label style={{ marginTop: 8 }}>Mod folder name (under StreamingAssets/user/)</label>
        <input value={modName} onChange={(e) => setModName(e.target.value)} spellCheck={false} />

        <label style={{ marginTop: 8 }}>
          Reference mission (recommended — provides location/date/environment)
        </label>
        {missionFiles === null ? (
          <button onClick={() => void loadMissionList()} disabled={busy} style={{ width: "100%" }}>
            Load base-game mission list
          </button>
        ) : (
          <select value={referencePath} onChange={(e) => setReferencePath(e.target.value)}>
            <option value="">None (mission gets no location keys)</option>
            {missionFiles.map((f) => (
              <option key={f.relativePath} value={f.relativePath}>
                {f.relativePath.replace("original/missions/", "")}
              </option>
            ))}
          </select>
        )}

        <button
          className="primary"
          style={{ width: "100%", marginTop: 10 }}
          onClick={() => void generate()}
          disabled={busy || campaign.missionCandidates.length === 0}
        >
          {busy ? "Working…" : "Generate & Validate Bundle"}
        </button>

        {message && (
          <div className="item-sub" style={{ marginTop: 6 }}>
            {message}
          </div>
        )}
        {problems.map((p) => (
          <div className="issue" key={p}>
            <span className="badge warning">NOTE</span>
            <span className="msg">{p}</span>
          </div>
        ))}

        {bundle && validation && (
          <div style={{ marginTop: 10 }}>
            <h3>
              Validation: {errors.length} error(s), {warnings.length} warning(s)
            </h3>
            {[...errors, ...warnings, ...infos].map((i, idx) => (
              <div className="issue" key={`${i.ruleId}-${idx}`}>
                <span className={`badge ${i.severity}`}>{i.severity.toUpperCase()}</span>
                <span className="msg">{i.message}</span>
              </div>
            ))}

            <h3 style={{ marginTop: 8 }}>Generated files</h3>
            {bundle.files.map((f) => (
              <div className="stat-row" key={f.relativePath}>
                <span className="k">
                  <button
                    style={{ padding: "1px 6px", fontSize: 11 }}
                    onClick={() =>
                      setPreviewPath(previewPath === f.relativePath ? null : f.relativePath)
                    }
                  >
                    {previewPath === f.relativePath ? "Hide" : "View"}
                  </button>{" "}
                  user/{bundle.modName}/{f.relativePath}
                </span>
                <span className="v">{f.content.length} B</span>
              </div>
            ))}
            {previewFile && (
              <pre
                style={{
                  maxHeight: 220,
                  overflow: "auto",
                  background: "#0d1f35",
                  border: "1px solid var(--border)",
                  borderRadius: 4,
                  padding: 8,
                  fontSize: 11,
                  whiteSpace: "pre-wrap",
                }}
              >
                {previewFile.content}
              </pre>
            )}

            <label style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8 }}>
              <input
                type="checkbox"
                style={{ width: "auto" }}
                checked={overwrite}
                onChange={(e) => setOverwrite(e.target.checked)}
              />
              Overwrite existing files from a previous export
            </label>
            <button
              className="primary"
              style={{ width: "100%", marginTop: 6 }}
              onClick={() => void runExport()}
              disabled={busy || !validation.passed}
              title={
                validation.passed
                  ? "Writes only under StreamingAssets/user/"
                  : "Fix validation errors first"
              }
            >
              {validation.passed
                ? `Export to user/${bundle.modName}/`
                : "Export blocked by validation errors"}
            </button>
          </div>
        )}

        {outcome && (
          <div style={{ marginTop: 8 }}>
            <h3>Export result</h3>
            <div className="item-sub">Mod root: {outcome.modRoot}</div>
            {outcome.written.map((w) => (
              <div className="item-sub" key={w}>
                ✓ {w}
              </div>
            ))}
            {outcome.skippedExisting.length > 0 && (
              <div className="item-sub">
                {outcome.skippedExisting.length} existing file(s) skipped (enable overwrite to
                replace them).
              </div>
            )}
            <div className="item-sub" style={{ marginTop: 4 }}>
              Launch Sea Power and look for the campaign under Task Force Mode. If the game
              rejects anything, note the error so the generators can be corrected.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
