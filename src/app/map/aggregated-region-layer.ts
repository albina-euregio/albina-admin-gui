import { ExpressionSpecification, Map as MlMap } from "maplibre-gl";

const DEFAULT_PMTILES_URL = "./assets/eaws-regions.pmtiles";
const SOURCE_LAYER = "micro-regions_elevation";

export interface AddAggregatedRegionLayerOptions {
  /** source id; default "aggregated-regions" */
  id?: string;
  /** default "./assets/eaws-regions.pmtiles" */
  pmtilesUrl?: string;
}

export interface AggregatedRegionHandle {
  readonly sourceId: string;
  readonly fillLayerId: string;
  /**
   * Sets the fill paint. Callers pass data-driven expressions (typically a `match`
   * on `["get","id"]` and `["get","elevation"]`) built from the danger-rating decision
   * logic that lives in the per-feature service — the helper stays free of domain rules.
   */
  setPaint(fillColor: ExpressionSpecification | string, fillOpacity: ExpressionSpecification | number): void;
  /** Clears styling (fully transparent). */
  reset(): void;
  remove(): void;
}

/**
 * Adds the aggregated-region vector layer (PMTiles) to a loaded map.
 *
 * Port note: the Leaflet implementation painted a canvas with
 * `globalCompositeOperation = "multiply"`. MapLibre fill layers have no per-layer
 * blend mode, so this uses plain alpha compositing — revisit only if danger-rating
 * colors read wrong over the basemap. Dynamic per-region coloring is done by rebuilding
 * the fill expressions (via `setPaint`) rather than per-tile canvas redraws.
 *
 * Must be called after the map's style has loaded.
 */
export function addAggregatedRegionLayer(
  map: MlMap,
  opts: AddAggregatedRegionLayerOptions = {},
): AggregatedRegionHandle {
  const sourceId = opts.id ?? "aggregated-regions";
  const url = opts.pmtilesUrl ?? DEFAULT_PMTILES_URL;
  const fillLayerId = `${sourceId}-fill`;

  map.addSource(sourceId, {
    type: "vector",
    url: `pmtiles://${url}`,
    promoteId: { [SOURCE_LAYER]: "id" },
  });

  map.addLayer({
    id: fillLayerId,
    type: "fill",
    source: sourceId,
    "source-layer": SOURCE_LAYER,
    paint: {
      "fill-color": "rgba(0, 0, 0, 0)",
      "fill-opacity": 0,
    },
  });

  return {
    sourceId,
    fillLayerId,
    setPaint(fillColor, fillOpacity) {
      map.setPaintProperty(fillLayerId, "fill-color", fillColor);
      map.setPaintProperty(fillLayerId, "fill-opacity", fillOpacity);
    },
    reset() {
      map.setPaintProperty(fillLayerId, "fill-color", "rgba(0, 0, 0, 0)");
      map.setPaintProperty(fillLayerId, "fill-opacity", 0);
    },
    remove() {
      if (map.getLayer(fillLayerId)) map.removeLayer(fillLayerId);
      if (map.getSource(sourceId)) map.removeSource(sourceId);
    },
  };
}
