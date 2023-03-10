// https://stackoverflow.com/q/31790344

import { LatLng, Polygon } from "leaflet";

// https://github.com/substack/point-in-polygon/blob/master/index.js
export function isMarkerInsidePolygon(ll: LatLng, polygon: Polygon): boolean {
  const points = polygon.getLatLngs();
  return polygon.feature?.geometry?.type === "MultiPolygon"
    ? (points as LatLng[][][]).some((ps) => isMarkerInside(ll, ps))
    : isMarkerInside(ll, points as LatLng[][]);
}

function isMarkerInside(ll: LatLng, points: LatLng[][]) {
  let inside = false;
  const { lat: x, lng: y } = ll;
  for (const ring of points) {
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const { lat: xi, lng: yi } = ring[i];
      const { lat: xj, lng: yj } = ring[j];
      const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
      if (intersect) {
        inside = !inside;
      }
    }
  }
  return inside;
}
