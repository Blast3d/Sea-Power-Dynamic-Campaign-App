import { useState } from "react";
import type { CampaignState, DiscoveredCatalogs } from "../../domain";
import { buildDiscoveredCatalogs } from "../../services/discoveredCatalogs";

/**
 * Discovered Data panel.
 *
 * Promotes scanner observations into typed catalogs via the read-only
 * `build_discovered_catalogs` command, previews what was found (nations,
 * units, costs, support files), and applies the result to the campaign:
 * discovered units replace seed units per category, and discovered nations
 * become selectable factions. Raw values and source paths are preserved on
 * every record; heuristic fields are labeled as such.
 */
export function DiscoveredDataPanel({
  campaign,
  onCatalogsBuilt,
}: {
  campaign: CampaignState;
  onCatalogsBuilt: (catalogs: DiscoveredCatalogs) => void;
}) {
  const [catalogs, setCatalogs] = useState<DiscoveredCatalogs | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [building, setBuilding] = useState(false);
  const [applied, setApplied] = useState(false);

  const discoveredUnitCount = campaign.unitCatalog.filter(
    (u) => u.provenance.kind === "discovered",
  ).length;

  async function runBuild() {
    setBuilding(true);
    setMessage(null);
    try {
      const result = await buildDiscoveredCatalogs(campaign.settings.gameInstallPath);
      if (result === null) {
        setMessage(
          "Catalog building requires the desktop app (Tauri). In browser dev mode there is no filesystem access.",
        );
      } else {
        setCatalogs(result);
        setApplied(false);
      }
    } catch (err) {
      setMessage(String(err));
    } finally {
      setBuilding(false);
    }
  }

  function apply() {
    if (!catalogs) return;
    onCatalogsBuilt(catalogs);
    setApplied(true);
  }

  return (
    <div className="panel">
      <h2>Discovered Data</h2>
      <div className="panel-body">
        <div className="item-sub" style={{ marginBottom: 8 }}>
          Builds typed catalogs from game/mod .ini data: nations/factions,
          units, variants, squadron/loadout signals, and Task Force costs.
          Read-only; raw values and source paths preserved.
        </div>
        <button onClick={() => void runBuild()} disabled={building} style={{ width: "100%" }}>
          {building ? "Building…" : "Build discovered catalogs (read-only)"}
        </button>
        {message && (
          <div className="item-sub" style={{ marginTop: 6 }}>
            {message}
          </div>
        )}
        {discoveredUnitCount > 0 && (
          <div className="item-sub" style={{ marginTop: 6 }}>
            <span className="badge discovered">DISCOVERED</span>{" "}
            {discoveredUnitCount} discovered unit(s) active in the campaign catalog.
          </div>
        )}

        {catalogs && (
          <div style={{ marginTop: 10 }}>
            <h3>Catalog summary</h3>
            <div className="stat-row">
              <span className="k">Parsed files</span>
              <span className="v">{catalogs.stats.parsedFiles}</span>
            </div>
            <div className="stat-row">
              <span className="k">Units</span>
              <span className="v">{catalogs.stats.unitCount}</span>
            </div>
            <div className="stat-row">
              <span className="k">Units with TaskForceCost</span>
              <span className="v">{catalogs.stats.unitsWithTaskForceCost}</span>
            </div>
            <div className="stat-row">
              <span className="k">Units with variants</span>
              <span className="v">{catalogs.stats.unitsWithVariants}</span>
            </div>
            <div className="stat-row">
              <span className="k">Raw nation values</span>
              <span className="v">{catalogs.stats.nationValueCount}</span>
            </div>
            <div className="stat-row">
              <span className="k">Squadron / loadout files</span>
              <span className="v">
                {catalogs.squadronFiles.length} / {catalogs.loadoutFiles.length}
              </span>
            </div>
            {Object.entries(catalogs.stats.categoryCounts).map(([cat, count]) => (
              <div className="stat-row" key={cat}>
                <span className="k">— {cat}</span>
                <span className="v">{count}</span>
              </div>
            ))}

            {catalogs.nationsReference.length > 0 && (
              <>
                <h3 style={{ marginTop: 8 }}>nations_reference.ini</h3>
                <div className="item-sub">
                  {catalogs.nationsReference.length} prefix mapping(s):{" "}
                  {catalogs.nationsReference
                    .slice(0, 8)
                    .map((e) => `${e.prefix}→${e.nationName}`)
                    .join(", ")}
                  {catalogs.nationsReference.length > 8 ? ", …" : ""}
                </div>
              </>
            )}

            {catalogs.nations.length > 0 && (
              <>
                <h3 style={{ marginTop: 8 }}>Discovered nations (exact raw values)</h3>
                {catalogs.nations.slice(0, 10).map((n) => (
                  <div
                    className="stat-row"
                    key={n.rawValue}
                    title={n.examplePaths.join("\n")}
                  >
                    <span className="k">
                      {n.rawValue}
                      {n.referencePrefixes.length > 0 && (
                        <span style={{ color: "var(--text-dim)" }}>
                          {" "}
                          ({n.referencePrefixes.join(", ")})
                        </span>
                      )}
                    </span>
                    <span className="v">{n.occurrenceCount}</span>
                  </div>
                ))}
                {catalogs.nations.length > 10 && (
                  <div className="item-sub">…and {catalogs.nations.length - 10} more.</div>
                )}
              </>
            )}

            <button
              className="primary"
              style={{ width: "100%", marginTop: 10 }}
              onClick={apply}
              disabled={applied || catalogs.units.length === 0}
            >
              {applied
                ? "Applied to campaign"
                : catalogs.units.length === 0
                  ? "No units discovered to apply"
                  : "Apply to campaign (replace seed data)"}
            </button>

            {catalogs.heuristicNotes.length > 0 && (
              <div className="item-sub" style={{ marginTop: 8 }}>
                Heuristic caveats:
                {catalogs.heuristicNotes.map((note) => (
                  <div key={note}>• {note}</div>
                ))}
              </div>
            )}
            {catalogs.warnings.length > 0 && (
              <div className="item-sub" style={{ marginTop: 6 }}>
                {catalogs.warnings.length} warning(s); first:{" "}
                {catalogs.warnings[0]}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
