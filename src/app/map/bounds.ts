import { FeatureCollection, Geometry, Position } from "geojson";
import { LngLatBounds, Map as MlMap } from "maplibre-gl";

function extendWithPosition(bounds: LngLatBounds, pos: Position): void {
  bounds.extend([pos[0], pos[1]]);
}

function extendWithCoords(bounds: LngLatBounds, coords: unknown): void {
  if (!Array.isArray(coords)) return;
  if (typeof coords[0] === "number" && typeof coords[1] === "number") {
    extendWithPosition(bounds, coords as Position);
    return;
  }
  for (const c of coords) extendWithCoords(bounds, c);
}

function extendWithGeometry(bounds: LngLatBounds, geometry: Geometry): void {
  if (geometry.type === "GeometryCollection") {
    for (const g of geometry.geometries) extendWithGeometry(bounds, g);
  } else {
    extendWithCoords(bounds, geometry.coordinates);
  }
}

/**
 * Fits the map to the bounding box of a FeatureCollection (e.g. the active regions).
 * Replaces `new GeoJSON(regions).getBounds()` + `map.fitBounds(...)`.
 */
export function fitFeatureCollection(
  map: MlMap,
  regions: FeatureCollection,
  opts: { padding?: number; animate?: boolean } = {},
): void {
  const bounds = new LngLatBounds();
  for (const feature of regions.features) {
    if (feature.geometry) extendWithGeometry(bounds, feature.geometry);
  }
  if (bounds.isEmpty()) return;
  map.fitBounds(bounds, { padding: opts.padding ?? 20, animate: opts.animate ?? false });
}
