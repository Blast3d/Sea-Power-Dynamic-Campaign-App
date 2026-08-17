import { useEffect, useState } from "react";
import type { CampaignState, GamePathStatus } from "../../domain";
import { createSeedCampaign, seedFactions } from "../../data/seed/seedCampaign";
import { pickGameFolder, validateGamePath } from "../../services/seaPowerPaths";

interface Props {
  onStart: (campaign: CampaignState, pathStatus: GamePathStatus | null) => void;
}

/**
 * Campaign setup screen (first scaffold screen).
 *
 * - Sea Power install path is prefilled with the verified dev default but
 *   always editable; it is validated via the native `validate_game_path`
 *   command when running inside Tauri.
 * - Side selection offers the scaffold factions (USA, Russian Forces/Soviet,
 *   Iraq as enemy option). Once the scanner exists, all discovered nations
 *   will be listed here too.
 */
export function CampaignSetupScreen({ onStart }: Props) {
  const seed = createSeedCampaign();
  const [campaignName, setCampaignName] = useState(seed.settings.campaignName);
  const [commanderName, setCommanderName] = useState(seed.settings.commanderName);
  const [installPath, setInstallPath] = useState(seed.settings.gameInstallPath);
  const [playerFactionId, setPlayerFactionId] = useState(seed.settings.playerFactionId);
  const [enemyFactionIds, setEnemyFactionIds] = useState<string[]>(
    seed.settings.opposingFactionIds,
  );
  const [pathStatus, setPathStatus] = useState<GamePathStatus | null>(null);
  const [checking, setChecking] = useState(false);

  const playableFactions = seedFactions.filter((f) => f.playableInScaffold);
  const enemyOptions = seedFactions.filter((f) => f.enemyOptionInScaffold);

  async function checkPath(path: string) {
    setChecking(true);
    try {
      setPathStatus(await validateGamePath(path));
    } finally {
      setChecking(false);
    }
  }

  useEffect(() => {
    void checkPath(installPath);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggleEnemy(id: string) {
    setEnemyFactionIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function start() {
    const state = createSeedCampaign();
    state.settings.campaignName = campaignName;
    state.settings.commanderName = commanderName;
    state.settings.gameInstallPath = installPath;
    state.settings.playerFactionId = playerFactionId;
    state.settings.opposingFactionIds = enemyFactionIds.filter(
      (id) => id !== playerFactionId,
    );
    onStart(state, pathStatus);
  }

  const pathClass =
    pathStatus === null ? "unknown" : pathStatus.isValid ? "ok" : "bad";

  return (
    <div className="setup-screen">
      <h1>
        Sea Power Dynamic Campaign{" "}
        <span className="badge seed" title="This campaign uses placeholder seed data">
          SEED SCAFFOLD
        </span>
      </h1>
      <p style={{ color: "var(--text-dim)", marginTop: 4 }}>
        Strategic campaign layer for Sea Power Task Force Mode. This scaffold
        uses clearly marked seed data until game-data scanning is implemented.
        Export to the game is disabled.
      </p>

      <div className="field">
        <label>Campaign name</label>
        <input value={campaignName} onChange={(e) => setCampaignName(e.target.value)} />
      </div>

      <div className="row">
        <div className="field">
          <label>Commander</label>
          <input value={commanderName} onChange={(e) => setCommanderName(e.target.value)} />
        </div>
        <div className="field">
          <label>Theater</label>
          <select value="theater-persian-gulf" disabled>
            <option value="theater-persian-gulf">Persian Gulf (seed)</option>
          </select>
        </div>
      </div>

      <div className="field">
        <label>Sea Power install path (editable — dev default prefilled)</label>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={installPath}
            onChange={(e) => setInstallPath(e.target.value)}
            onBlur={() => void checkPath(installPath)}
            spellCheck={false}
          />
          <button
            onClick={async () => {
              const picked = await pickGameFolder();
              if (picked) {
                setInstallPath(picked);
                await checkPath(picked);
              }
            }}
          >
            Browse…
          </button>
          <button onClick={() => void checkPath(installPath)} disabled={checking}>
            {checking ? "Checking…" : "Verify"}
          </button>
        </div>
        <div className={`path-status ${pathClass}`}>
          {pathStatus === null && (
            <>Path not verified. Native check runs inside the desktop app (Tauri); in browser dev mode the path stays unverified.</>
          )}
          {pathStatus?.isValid && (
            <>
              ✓ StreamingAssets found: {pathStatus.streamingAssetsRoot}
              {" — "}original: {pathStatus.hasOriginal ? "yes" : "no"}, user:{" "}
              {pathStatus.hasUser ? "yes" : "no"}
            </>
          )}
          {pathStatus && !pathStatus.isValid && <>✗ {pathStatus.errors[0]}</>}
        </div>
      </div>

      <div className="field">
        <label>Player side (scaffold labels — discovered nations arrive with the scanner)</label>
        <div className="side-cards">
          {playableFactions.map((f) => (
            <button
              key={f.id}
              className={`side-card ${playerFactionId === f.id ? "selected" : ""}`}
              onClick={() => setPlayerFactionId(f.id)}
            >
              <div className="side-name">{f.displayName}</div>
              <div className="side-note">
                Raw nation value(s): {f.rawNationValues.join(", ") || "unmapped"}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <label>Opposing side(s)</label>
        <div className="side-cards">
          {enemyOptions.map((f) => (
            <button
              key={f.id}
              className={`side-card ${enemyFactionIds.includes(f.id) ? "selected" : ""}`}
              onClick={() => toggleEnemy(f.id)}
              disabled={f.id === playerFactionId}
            >
              <div className="side-name">{f.displayName}</div>
              <div className="side-note">{f.notes}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="row">
        <div className="field">
          <label>Difficulty preset</label>
          <select defaultValue="Moderate">
            <option>Easy</option>
            <option>Moderate</option>
            <option>Difficult</option>
          </select>
        </div>
        <div className="field">
          <label>Allowed mods</label>
          <select disabled>
            <option>None (scanner not implemented yet)</option>
          </select>
        </div>
      </div>

      <button className="primary" style={{ width: "100%", padding: 10 }} onClick={start}>
        Start Seed Campaign
      </button>
    </div>
  );
}
