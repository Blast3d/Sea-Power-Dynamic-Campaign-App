/**
 * Campaign economy state (docs/SCAFFOLD_SPEC.md "Economy And Resources").
 * Funds are abstract; oil/supplies/industrial capacity are physical
 * constraints; influence affects diplomacy/access/trade.
 */
export interface CampaignEconomy {
  funds: number;
  oil: number;
  supplies: number;
  industrialCapacity: number;
  influence: number;
  /** Net change per strategic day, for UI display. */
  fundsPerDay: number;
  oilPerDay: number;
  suppliesPerDay: number;
}

export function createEmptyEconomy(): CampaignEconomy {
  return {
    funds: 0,
    oil: 0,
    supplies: 0,
    industrialCapacity: 0,
    influence: 0,
    fundsPerDay: 0,
    oilPerDay: 0,
    suppliesPerDay: 0,
  };
}
