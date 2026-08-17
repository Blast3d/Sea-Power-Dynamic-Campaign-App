import type { CampaignState } from "../../domain";

const threatLabels: Array<[key: "ship" | "air" | "sub" | "land", label: string]> = [
  ["ship", "SHIP"],
  ["air", "AIR"],
  ["sub", "SUB"],
  ["land", "LAND"],
];

/**
 * Mission candidate drawer. Mission export is not implemented in the
 * scaffold; the button is disabled and routes through the validation gate.
 */
export function MissionDrawer({
  campaign,
  onClose,
}: {
  campaign: CampaignState;
  onClose: () => void;
}) {
  return (
    <div className="mission-drawer">
      <div className="drawer-head">
        <h2 style={{ margin: 0 }}>Mission Candidates</h2>
        <span className="spacer" />
        <button onClick={onClose}>Close</button>
      </div>
      <div className="mission-cards">
        {campaign.missionCandidates.map((m) => (
          <div className="mission-card" key={m.id}>
            <div className="item-title">{m.title}</div>
            <div className="item-sub">{m.strategicReason}</div>
            <div className="threats">
              Expected threats:{" "}
              {threatLabels
                .filter(([k]) => m.expectedThreats[k])
                .map(([, label]) => label)
                .join(" · ") || "none assessed"}
            </div>
            <div className="item-sub">
              Objectives:
              {m.objectives.map((o) => (
                <div key={o.id}>
                  • {o.description}
                  {o.dependsOnUncertainContact ? " (uncertain contact)" : ""}
                </div>
              ))}
            </div>
            <div className="item-sub" style={{ marginTop: 4 }}>
              Reward: {m.rewards.funds ?? 0} funds
              {m.rewards.influence ? `, ${m.rewards.influence} influence` : ""}
            </div>
            <button
              disabled
              title="Use the Mission Export panel in the right sidebar: pick this candidate, generate a bundle, pass validation, then export."
              style={{ marginTop: 8, width: "100%" }}
            >
              Export via Mission Export panel →
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
