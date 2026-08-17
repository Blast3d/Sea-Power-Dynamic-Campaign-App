import type { EntityId, GeoPosition, DataProvenance } from "../common";

/** A strategic theater of operations (e.g. Persian Gulf). */
export interface Theater {
  id: EntityId;
  name: string;
  description: string;
  /** Initial map camera center. */
  center: GeoPosition;
  /** Initial map zoom level for the world map view. */
  initialZoom: number;
  provenance: DataProvenance;
}
