import type { CampaignState } from "../../domain";

export function IntelPanel({ campaign }: { campaign: CampaignState }) {
  return (
    <div className="panel">
      <h2>Intel Reports</h2>
      <div className="panel-body">
        {campaign.intelReports.map((r) => (
          <div className="list-item" key={r.id}>
            <div className="item-title">{r.title}</div>
            <div className="item-sub">{r.summary}</div>
            {r.contacts.map((c) => (
              <div className="item-sub" key={c.id}>
                → {c.classification} · confidence {c.confidencePercent}% · ±
                {c.uncertaintyRadiusNm} nm
                {c.estimatedStrength ? ` · ${c.estimatedStrength}` : ""}
              </div>
            ))}
          </div>
        ))}
        {campaign.intelReports.length === 0 && (
          <div className="item-sub">No intel reports.</div>
        )}
      </div>
    </div>
  );
}
