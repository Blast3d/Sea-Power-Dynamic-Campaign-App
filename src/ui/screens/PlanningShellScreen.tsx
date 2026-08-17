import { useState } from "react";
import type { CampaignState, DiscoveredCatalogs, GamePathStatus } from "../../domain";
import { WorldMap } from "../components/WorldMap";
import { EconomyPanel } from "../components/EconomyPanel";
import { LogisticsPanel } from "../components/LogisticsPanel";
import { ForceBuilderPanel } from "../components/ForceBuilderPanel";
import { IntelPanel } from "../components/IntelPanel";
import { MissionDrawer } from "../components/MissionDrawer";
import { ValidationPanel } from "../components/ValidationPanel";
import { DiscoveredDataPanel } from "../components/DiscoveredDataPanel";
import { MissionExportPanel } from "../components/MissionExportPanel";

/**
 * Main planning shell: world map center, economy/logistics/force builder on
 * the left, intel and export/validation on the right, mission candidates in
 * a bottom drawer over the map.
 */
export function PlanningShellScreen({
  campaign,
  pathStatus,
  onExitToSetup,
  onCatalogsBuilt,
}: {
  campaign: CampaignState;
  pathStatus: GamePathStatus | null;
  onExitToSetup: () => void;
  onCatalogsBuilt: (catalogs: DiscoveredCatalogs) => void;
}) {
  const [drawerOpen, setDrawerOpen] = useState(true);
  const hasDiscoveredData = campaign.unitCatalog.some(
    (u) => u.provenance.kind === "discovered",
  );
  const playerFaction = campaign.factions.find(
    (f) => f.id === campaign.settings.playerFactionId,
  );
  const enemies = campaign.factions.filter((f) =>
    campaign.settings.opposingFactionIds.includes(f.id),
  );

  return (
    <div className="shell">
      <div className="topbar">
        <span className="title">{campaign.settings.campaignName}</span>
        {hasDiscoveredData ? (
          <span className="badge discovered">DISCOVERED DATA</span>
        ) : (
          <span className="badge seed">SEED DATA</span>
        )}
        <span style={{ color: "var(--text-dim)" }}>
          {playerFaction?.displayName ?? "?"} vs{" "}
          {enemies.map((e) => e.displayName).join(", ") || "?"}
        </span>
        <span className="spacer" />
        <span className="clock">
          {new Date(campaign.strategicTime).toUTCString().replace("GMT", "Z")}
        </span>
        <button disabled title="Strategic simulation arrives in a later milestone">
          Advance Time
        </button>
        <button onClick={() => setDrawerOpen((v) => !v)}>
          {drawerOpen ? "Hide Missions" : "Missions"}
        </button>
        <button onClick={onExitToSetup}>Setup</button>
      </div>

      <div className="sidebar left">
        <EconomyPanel economy={campaign.economy} />
        <LogisticsPanel campaign={campaign} />
        <ForceBuilderPanel campaign={campaign} />
      </div>

      <div className="map-area">
        <WorldMap campaign={campaign} />
        {drawerOpen && (
          <MissionDrawer campaign={campaign} onClose={() => setDrawerOpen(false)} />
        )}
      </div>

      <div className="sidebar right">
        <IntelPanel campaign={campaign} />
        <DiscoveredDataPanel campaign={campaign} onCatalogsBuilt={onCatalogsBuilt} />
        <MissionExportPanel campaign={campaign} />
        <ValidationPanel campaign={campaign} pathStatus={pathStatus} />
      </div>
    </div>
  );
}
