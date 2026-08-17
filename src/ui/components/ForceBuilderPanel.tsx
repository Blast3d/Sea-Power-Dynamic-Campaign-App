import type { CampaignState } from "../../domain";
import { isSeedData } from "../../domain";

/**
 * Force builder panel (scaffold).
 *
 * Lists the player's task forces and the available unit catalog. Every seed
 * unit is clearly badged. Purchase/assignment flows arrive with the economy
 * simulation milestone; the catalog will be replaced by discovered Sea Power
 * units once scanning exists.
 */
export function ForceBuilderPanel({ campaign }: { campaign: CampaignState }) {
  const playerForces = campaign.taskForces.filter((tf) => tf.side === "player");

  return (
    <div className="panel">
      <h2>Force Builder</h2>
      <div className="panel-body">
        <h3>Player task forces</h3>
        {playerForces.map((tf) => (
          <div className="list-item" key={tf.id}>
            <div className="item-title">
              {tf.name}{" "}
              {isSeedData(tf.provenance) && <span className="badge seed">SEED</span>}
            </div>
            <div className="item-sub">
              {tf.units.length} units · {tf.pointValue} pts · {tf.speedKts} kts
            </div>
            <div className="item-sub">
              {tf.units
                .map(
                  (u) =>
                    campaign.unitCatalog.find((c) => c.id === u.catalogEntryId)
                      ?.displayName ?? u.catalogEntryId,
                )
                .join(", ")}
            </div>
          </div>
        ))}

        <h3 style={{ marginTop: 10 }}>Unit catalog ({campaign.unitCatalog.length})</h3>
        {campaign.unitCatalog.slice(0, 60).map((u) => (
          <div
            className="list-item"
            key={u.id}
            title={
              u.provenance.kind === "discovered"
                ? `${u.provenance.sourcePath}${u.provenance.sourceMod ? ` (mod: ${u.provenance.sourceMod})` : ""}`
                : "Placeholder seed data"
            }
          >
            <div className="item-title">
              {u.displayName}{" "}
              {isSeedData(u.provenance) ? (
                <span className="badge seed">SEED</span>
              ) : (
                <span className="badge discovered">DISCOVERED</span>
              )}
            </div>
            <div className="item-sub">
              {u.category} · {u.taskForceCost ?? "?"} pts · Nation:{" "}
              {u.rawNationValues.join("/") || "?"}
              {u.variants.length > 0 && ` · ${u.variants.length} variant(s)`}
            </div>
          </div>
        ))}
        {campaign.unitCatalog.length > 60 && (
          <div className="item-sub">
            …and {campaign.unitCatalog.length - 60} more (full browsing UI comes with
            the roster builder milestone).
          </div>
        )}
        <div className="item-sub" style={{ marginTop: 6 }}>
          Seed units are placeholders and can never be exported. Use the
          Discovered Data panel to replace them with real Sea Power units.
        </div>
      </div>
    </div>
  );
}
