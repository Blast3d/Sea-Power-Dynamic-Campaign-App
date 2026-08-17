import type { CampaignEconomy } from "../../domain";

function Delta({ value }: { value: number }) {
  if (value === 0) return null;
  return (
    <span className={`delta ${value > 0 ? "pos" : "neg"}`}>
      {value > 0 ? "+" : ""}
      {value}/day
    </span>
  );
}

export function EconomyPanel({ economy }: { economy: CampaignEconomy }) {
  return (
    <div className="panel">
      <h2>Economy</h2>
      <div className="panel-body">
        <div className="stat-row">
          <span className="k">Funds</span>
          <span className="v">
            {economy.funds.toLocaleString()} <Delta value={economy.fundsPerDay} />
          </span>
        </div>
        <div className="stat-row">
          <span className="k">Oil</span>
          <span className="v">
            {economy.oil.toLocaleString()} <Delta value={economy.oilPerDay} />
          </span>
        </div>
        <div className="stat-row">
          <span className="k">Supplies</span>
          <span className="v">
            {economy.supplies.toLocaleString()} <Delta value={economy.suppliesPerDay} />
          </span>
        </div>
        <div className="stat-row">
          <span className="k">Industrial capacity</span>
          <span className="v">{economy.industrialCapacity}</span>
        </div>
        <div className="stat-row">
          <span className="k">Influence / control</span>
          <span className="v">{economy.influence}</span>
        </div>
      </div>
    </div>
  );
}
