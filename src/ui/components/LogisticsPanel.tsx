import type { CampaignState } from "../../domain";

function pct(v: number): string {
  return `${Math.round(v * 100)}%`;
}

export function LogisticsPanel({ campaign }: { campaign: CampaignState }) {
  const nameOf = (id: string): string =>
    campaign.taskForces.find((t) => t.id === id)?.name ??
    campaign.ports.find((p) => p.id === id)?.name ??
    campaign.airbases.find((a) => a.id === id)?.name ??
    id;

  return (
    <div className="panel">
      <h2>Logistics</h2>
      <div className="panel-body">
        {campaign.logistics.map((l) => (
          <div className="list-item" key={l.subjectId}>
            <div className="item-title">{nameOf(l.subjectId)}</div>
            <div className="item-sub">
              Fuel {pct(l.fuelAvailability)} · Supply {pct(l.supplyAvailability)} · Route
              safety {pct(l.routeSafety)}
            </div>
            <div className="item-sub">
              {l.repairCapable ? "Repair ✓" : "No repair"} ·{" "}
              {l.rearmCapable ? "Rearm ✓" : "No rearm"} · {l.distanceFromSupplyNm} nm from
              supply
            </div>
          </div>
        ))}
        {campaign.logistics.length === 0 && (
          <div className="item-sub">No logistics states tracked yet.</div>
        )}
      </div>
    </div>
  );
}
