import { useMemo, useRef, useState, type PointerEvent, type WheelEvent } from "react";
import { feature } from "topojson-client";
import { geoGraticule10, geoMercator, geoPath } from "d3-geo";
import landAtlas from "world-atlas/land-50m.json";
import countriesAtlas from "world-atlas/countries-50m.json";
import type { CampaignState } from "../../domain";

interface Props {
  campaign: CampaignState;
}

type TopologyWithObjects = {
  objects: Record<string, unknown>;
};

function atlasFeatureCollection(
  topology: TopologyWithObjects,
  objectName: string,
): GeoJSON.FeatureCollection {
  const converted = feature(topology as never, topology.objects[objectName] as never);
  return converted as GeoJSON.FeatureCollection;
}

const land = atlasFeatureCollection(landAtlas as TopologyWithObjects, "land");
const countries = atlasFeatureCollection(countriesAtlas as TopologyWithObjects, "countries");
const graticule = geoGraticule10();
const WIDTH = 1000;
const HEIGHT = 640;

/**
 * Real offline SVG world map.
 *
 * Uses bundled Natural Earth data from `world-atlas`, rendered with d3-geo.
 * This avoids WebGL/tile-provider problems in the Tauri WebView while still
 * showing real geography. Campaign entities are projected onto the same map.
 */
export function WorldMap({ campaign }: Props) {
  const theater = campaign.theaters.find((t) => t.id === campaign.settings.theaterId);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);
  const dragRef = useRef<{ pointerId: number; x: number; y: number; panX: number; panY: number } | null>(null);

  const projection = useMemo(() => {
    const p = geoMercator()
      .center(theater ? [theater.center.lon, theater.center.lat] : [52, 27])
      .scale(2600)
      .translate([WIDTH / 2, HEIGHT / 2]);
    return p;
  }, [theater]);

  const path = useMemo(() => geoPath(projection), [projection]);
  const landPath = useMemo(() => path(land) ?? "", [path]);
  const countryPaths = useMemo(
    () => countries.features.map((f, index) => ({ id: index, d: path(f) ?? "" })).filter((f) => f.d),
    [path],
  );
  const graticulePath = useMemo(() => path(graticule) ?? "", [path]);

  const transform = `translate(${pan.x} ${pan.y}) rotate(${rotation} ${WIDTH / 2} ${HEIGHT / 2}) scale(${zoom} ${zoom})`;

  function projectPoint(lon: number, lat: number): [number, number] {
    return projection([lon, lat]) ?? [0, 0];
  }

  function fitTheater() {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setRotation(0);
  }

  function zoomBy(delta: number) {
    setZoom((current) => Math.min(4, Math.max(0.55, current * delta)));
  }

  function rotateBy(degrees: number) {
    setRotation((current) => current + degrees);
  }

  function onWheel(event: WheelEvent<SVGSVGElement>) {
    event.preventDefault();
    zoomBy(event.deltaY < 0 ? 1.12 : 0.89);
  }

  function onPointerDown(event: PointerEvent<SVGSVGElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, panX: pan.x, panY: pan.y };
  }

  function onPointerMove(event: PointerEvent<SVGSVGElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    setPan({ x: drag.panX + event.clientX - drag.x, y: drag.panY + event.clientY - drag.y });
  }

  function onPointerUp(event: PointerEvent<SVGSVGElement>) {
    if (dragRef.current?.pointerId === event.pointerId) dragRef.current = null;
  }

  const routePaths = campaign.tradeRoutes
    .filter((r) => r.path && r.path.length > 1)
    .map((r) => {
      const points = r.path!.map((p) => projectPoint(p.lon, p.lat));
      return { id: r.id, d: points.map(([x, y], idx) => `${idx === 0 ? "M" : "L"}${x},${y}`).join(" ") };
    });

  return (
    <>
      <svg
        className="svg-map"
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label="Real offline world map centered on the Persian Gulf"
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <rect width={WIDTH} height={HEIGHT} className="map-ocean" fill="#0a2138" />
        <g transform={transform}>
          <path className="map-graticule" d={graticulePath} fill="none" stroke="#42698e" strokeWidth={0.8} opacity={0.45} />
          <path className="map-land" d={landPath} fill="#2d4a31" stroke="#b9c7b4" strokeWidth={1.1} />
          {countryPaths.map((country) => (
            <path key={country.id} className="map-country" d={country.d} fill="none" stroke="#8ea189" strokeWidth={0.55} opacity={0.9} />
          ))}
          {routePaths.map((route) => (
            <path key={route.id} className="map-route" d={route.d} fill="none" stroke="#58a6ff" strokeWidth={2.4} strokeDasharray="7 7" />
          ))}
          {campaign.ports.map((p) => {
            if (!p.position) return null;
            const [x, y] = projectPoint(p.position.lon, p.position.lat);
            return <MapPoint key={p.id} x={x} y={y} side={p.side} label={p.name} kind="port" />;
          })}
          {campaign.airbases.map((a) => {
            if (!a.position) return null;
            const [x, y] = projectPoint(a.position.lon, a.position.lat);
            return <MapPoint key={a.id} x={x} y={y} side={a.side} label={a.name} kind="airbase" />;
          })}
          {campaign.resourceNodes.map((r) => {
            if (!r.position) return null;
            const [x, y] = projectPoint(r.position.lon, r.position.lat);
            return <MapPoint key={r.id} x={x} y={y} side={r.side} label={r.name} kind="resource" />;
          })}
          {campaign.taskForces.map((tf) => {
            const [x, y] = projectPoint(tf.position.lon, tf.position.lat);
            return <MapPoint key={tf.id} x={x} y={y} side={tf.side} label={tf.name} kind="tf" />;
          })}
        </g>
      </svg>
      <div className="map-label">Persian Gulf Theater</div>
      <div className="map-controls" aria-label="Map controls">
        <button title="Zoom in" onClick={() => zoomBy(1.18)}>+</button>
        <button title="Zoom out" onClick={() => zoomBy(0.85)}>-</button>
        <button title="Rotate left" onClick={() => rotateBy(-15)}>L</button>
        <button title="Rotate right" onClick={() => rotateBy(15)}>R</button>
        <button title="Reset north" onClick={() => setRotation(0)}>N</button>
        <button title="Fit theater" onClick={fitTheater}>Fit</button>
      </div>
      <div className="map-legend">
        <div>
          <span className="dot" style={{ background: "var(--player)" }} /> Player{" "}
          <span className="dot" style={{ background: "var(--enemy)", marginLeft: 8 }} /> Enemy{" "}
          <span className="dot" style={{ background: "var(--neutral)", marginLeft: 8 }} /> Neutral
        </div>
        <div style={{ color: "var(--text-dim)", marginTop: 2 }}>
          Natural Earth offline map · drag = pan · wheel = zoom · controls rotate and refit
        </div>
      </div>
    </>
  );
}

function MapPoint({
  x,
  y,
  side,
  label,
  kind,
}: {
  x: number;
  y: number;
  side: string;
  label: string;
  kind: "port" | "airbase" | "resource" | "tf";
}) {
  const className = `svg-point ${side} ${kind}`;
  const showLabel = kind === "tf" || kind === "port" || kind === "airbase";
  if (kind === "tf") {
    return (
      <g className="svg-marker">
        <rect className={className} x={x - 6} y={y - 6} width="12" height="12" transform={`rotate(45 ${x} ${y})`} />
        {showLabel && <text x={x + 10} y={y - 8}>{label}</text>}
      </g>
    );
  }
  if (kind === "airbase") {
    return (
      <g className="svg-marker">
        <path className={className} d={`M${x},${y - 8} L${x + 7},${y + 6} L${x - 7},${y + 6} Z`} />
        {showLabel && <text x={x + 10} y={y - 8}>{label}</text>}
      </g>
    );
  }
  return (
    <g className="svg-marker">
      <circle className={className} cx={x} cy={y} r={kind === "resource" ? 5 : 6} />
      {showLabel && <text x={x + 10} y={y - 8}>{label}</text>}
    </g>
  );
}

