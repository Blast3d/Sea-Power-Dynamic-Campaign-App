import { useState } from "react";
import type { CampaignState, DiscoveredCatalogs, GamePathStatus } from "../domain";
import {
  mergeCatalogs,
  mergeFactions,
  toDiscoveredFactions,
  toUnitCatalogEntries,
} from "../domain";
import { CampaignSetupScreen } from "./screens/CampaignSetupScreen";
import { PlanningShellScreen } from "./screens/PlanningShellScreen";

/**
 * Root app: campaign setup → planning shell.
 * Campaign state is in-memory for the scaffold (persistence comes later).
 */
export function App() {
  const [campaign, setCampaign] = useState<CampaignState | null>(null);
  const [pathStatus, setPathStatus] = useState<GamePathStatus | null>(null);

  /**
   * Apply discovered catalogs to the running campaign: discovered units
   * replace seed units per category, and discovered nations become
   * selectable factions. Raw values and source paths stay preserved on
   * every promoted record.
   */
  function applyDiscoveredCatalogs(catalogs: DiscoveredCatalogs) {
    setCampaign((current) => {
      if (!current) return current;
      return {
        ...current,
        unitCatalog: mergeCatalogs(current.unitCatalog, toUnitCatalogEntries(catalogs)),
        factions: mergeFactions(current.factions, toDiscoveredFactions(catalogs)),
      };
    });
  }

  if (!campaign) {
    return (
      <CampaignSetupScreen
        onStart={(state, status) => {
          setCampaign(state);
          setPathStatus(status);
        }}
      />
    );
  }
  return (
    <PlanningShellScreen
      campaign={campaign}
      pathStatus={pathStatus}
      onExitToSetup={() => setCampaign(null)}
      onCatalogsBuilt={applyDiscoveredCatalogs}
    />
  );
}
