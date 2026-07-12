import type { Feature, FeatureCollection, Point } from "geojson";
import maplibregl, { GeoJSONSource, Map as MlMap, MapLayerMouseEvent, Popup } from "maplibre-gl";

export interface StationPoint {
  id: string;
  lng: number;
  lat: number;
  radius: number;
  fillColor: string;
  strokeColor: string;
  /** hover tooltip text */
  tooltip?: string;
}

export interface StationLayerHandle {
  /** Replace the full set of stations (rebuilds the source). */
  setStations(stations: StationPoint[]): void;
  onStationClick(cb: (id: string) => void): void;
  remove(): void;
}

const EMPTY: FeatureCollection = { type: "FeatureCollection", features: [] };

/**
 * Adds a circle-marker station layer to a loaded map. Styling is data-driven from
 * each station's properties, so the caller re-renders (via `setStations`) on selection
 * or filter changes. Replaces the Leaflet `CircleMarker` + `LayerGroup` station rendering.
 */
export function addStationLayer(map: MlMap, opts: { id?: string; tooltip?: boolean } = {}): StationLayerHandle {
  const sourceId = opts.id ?? "stations";
  const layerId = `${sourceId}-circles`;
  const withTooltip = opts.tooltip !== false;

  map.addSource(sourceId, { type: "geojson", data: EMPTY, promoteId: "id" });
  map.addLayer({
    id: layerId,
    type: "circle",
    source: sourceId,
    paint: {
      "circle-radius": ["get", "radius"],
      "circle-color": ["get", "fillColor"],
      "circle-stroke-color": ["get", "strokeColor"],
      "circle-stroke-width": 1,
    },
  });

  const popup = withTooltip ? (new maplibregl.Popup({ closeButton: false, closeOnClick: false }) as Popup) : undefined;
  let clickCb: ((id: string) => void) | undefined;

  const onEnter = (e: MapLayerMouseEvent) => {
    map.getCanvas().style.cursor = "pointer";
    const f = e.features?.[0];
    const tooltip = f?.properties?.["tooltip"];
    if (popup && f && tooltip) {
      popup
        .setLngLat((f.geometry as Point).coordinates as [number, number])
        .setHTML(String(tooltip))
        .addTo(map);
    }
  };
  const onLeave = () => {
    map.getCanvas().style.cursor = "";
    popup?.remove();
  };
  const onClick = (e: MapLayerMouseEvent) => {
    const f = e.features?.[0];
    if (f) clickCb?.(String(f.id ?? f.properties?.["id"]));
  };

  map.on("mouseenter", layerId, onEnter);
  map.on("mouseleave", layerId, onLeave);
  map.on("click", layerId, onClick);

  return {
    setStations(stations) {
      const source = map.getSource(sourceId) as GeoJSONSource | undefined;
      if (!source) return;
      const features: Feature[] = stations.map((s) => ({
        type: "Feature",
        properties: {
          id: s.id,
          radius: s.radius,
          fillColor: s.fillColor,
          strokeColor: s.strokeColor,
          tooltip: s.tooltip ?? "",
        },
        geometry: { type: "Point", coordinates: [s.lng, s.lat] },
      }));
      source.setData({ type: "FeatureCollection", features });
    },
    onStationClick(cb) {
      clickCb = cb;
    },
    remove() {
      map.off("mouseenter", layerId, onEnter);
      map.off("mouseleave", layerId, onLeave);
      map.off("click", layerId, onClick);
      popup?.remove();
      if (map.getLayer(layerId)) map.removeLayer(layerId);
      if (map.getSource(sourceId)) map.removeSource(sourceId);
    },
  };
}
