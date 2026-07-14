import { ExpressionSpecification, Map as MlMap } from "maplibre-gl";

const DEFAULT_PMTILES_URL = "./assets/eaws-regions.pmtiles";
const SOURCE_LAYER = "micro-regions_elevation";

/** Per-region danger-rating fill, split by elevation band. Colors are precomputed by the caller. */
export interface AggregatedRegionStyle {
  colorAbove: string;
  opacityAbove: number;
  colorBelow: string;
  opacityBelow: number;
  /** bulletin elevation (m) for the high-vs-threshold check; -Infinity disables the flip */
  bulletinElevation: number;
}

export interface AggregatedRegionHandle {
  readonly sourceId: string;
  readonly fillLayerId: string;
  /** Style all elevation bands of one region (via feature-state). */
  setRegionStyle(region: string, style: AggregatedRegionStyle): void;
  /** Clear styling for the given regions. */
  resetRegions(regions: string[]): void;
  /** Clear all styling. */
  resetAll(): void;
  /** Currently styled region ids. */
  styledRegions(): string[];
  remove(): void;
}

/** Whether a feature's elevation band counts as "above" (mirrors MapService.updateAggregatedRegionLayer). */
const IS_ABOVE: ExpressionSpecification = [
  "case",
  ["match", ["get", "elevation"], ["high", "low_high"], true, false],
  [
    "case",
    [
      "all",
      ["==", ["get", "elevation"], "high"],
      [">", ["coalesce", ["feature-state", "be"], -1e9], ["coalesce", ["to-number", ["get", "threshold"]], 1e9]],
    ],
    false,
    true,
  ],
  false,
];

const HAS_STYLE: ExpressionSpecification = ["==", ["feature-state", "hs"], true];

/**
 * Adds the aggregated-region vector layer (PMTiles) with danger-rating styling driven by
 * feature-state. The caller precomputes above/below colors per region (the domain logic lives
 * in the map service). Replaces the Leaflet `PmLeafletLayer` canvas symbolizer.
 *
 * Port notes: plain alpha compositing (no `multiply` blend); the `filterFeature` start/end-date
 * validity check becomes a layer filter. Must be called after the map style has loaded.
 */
export function addAggregatedRegionLayer(
  map: MlMap,
  opts: { id?: string; pmtilesUrl?: string } = {},
): AggregatedRegionHandle {
  const sourceId = opts.id ?? "aggregated-regions";
  const url = opts.pmtilesUrl ?? DEFAULT_PMTILES_URL;
  const fillLayerId = `${sourceId}-fill`;
  const styled = new Set<string>();
  const today = new Date().toISOString().slice(0, "2006-01-02".length);

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
    // filterFeature(): valid for `today`
    filter: [
      "all",
      ["any", ["!", ["has", "start_date"]], ["<=", ["get", "start_date"], today]],
      ["any", ["!", ["has", "end_date"]], [">", ["get", "end_date"], today]],
    ],
    paint: {
      "fill-color": [
        "case",
        HAS_STYLE,
        ["case", IS_ABOVE, ["feature-state", "ca"], ["feature-state", "cb"]],
        "rgba(0, 0, 0, 0)",
      ],
      "fill-opacity": ["case", HAS_STYLE, ["case", IS_ABOVE, ["feature-state", "oa"], ["feature-state", "ob"]], 0],
    },
  });

  const setState = (region: string, state: Record<string, unknown>) =>
    map.setFeatureState({ source: sourceId, sourceLayer: SOURCE_LAYER, id: region }, state);

  return {
    sourceId,
    fillLayerId,
    setRegionStyle(region, style) {
      styled.add(region);
      setState(region, {
        hs: true,
        ca: style.colorAbove,
        oa: style.opacityAbove,
        cb: style.colorBelow,
        ob: style.opacityBelow,
        be: style.bulletinElevation,
      });
    },
    resetRegions(regions) {
      for (const region of regions) {
        styled.delete(region);
        setState(region, { hs: false });
      }
    },
    resetAll() {
      for (const region of styled) setState(region, { hs: false });
      styled.clear();
    },
    styledRegions: () => [...styled],
    remove() {
      if (map.getLayer(fillLayerId)) map.removeLayer(fillLayerId);
      if (map.getSource(sourceId)) map.removeSource(sourceId);
    },
  };
}
