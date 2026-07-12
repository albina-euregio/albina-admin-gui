import { FeatureCollection, MultiPolygon } from "geojson";
import { Map as MlMap, MapGeoJSONFeature, MapLayerMouseEvent } from "maplibre-gl";

import type { RegionProperties } from "../providers/regions-service/regions.service";

export interface RegionLayerStyle {
  lineColor?: string;
  lineOpacity?: number;
  lineOpacityStrong?: number;
  lineWeight?: number;
  lineWeightStrong?: number;
  hoverWeight?: number;
  /** zoom at which the "strong" line style kicks in; default 13 */
  strongZoom?: number;
  selectedFillColor?: string;
  selectedFillOpacity?: number;
}

export interface AddRegionLayerOptions {
  /** source/layer id prefix; default "regions" */
  id?: string;
  /** attach click + hover handlers (the selectable overlay) vs. a plain outline; default true */
  interactive?: boolean;
  style?: RegionLayerStyle;
}

export interface RegionLayerHandle {
  readonly sourceId: string;
  /** Replace the selected set (drives the `selected` feature-state). */
  setSelected(regionIds: Iterable<string>): void;
  toggle(regionIds: string[], force?: boolean): void;
  getSelected(): string[];
  clear(): void;
  /** hover -> region name (null on leave), for a RegionNameControl */
  onRegionHover(cb: (name: string | null) => void): void;
  onRegionClick(cb: (regionId: string, ev: MouseEvent) => void): void;
  remove(): void;
}

const DEFAULTS: Required<RegionLayerStyle> = {
  lineColor: "#454545",
  lineOpacity: 0.5,
  lineOpacityStrong: 1,
  lineWeight: 1,
  lineWeightStrong: 2,
  hoverWeight: 3,
  strongZoom: 13,
  selectedFillColor: "#3852A4",
  selectedFillOpacity: 0.2,
};

/**
 * Adds the micro-region overlay (outline + optional selection) to a loaded map.
 * Replaces the `RegionLayer extends GeoJSON` subclass: selection and hover move
 * from mutable `properties.selected` + per-feature `setStyle` to MapLibre
 * feature-state, and the zoom>=strong "strong" style becomes a `step` expression.
 *
 * Must be called after the map's style has loaded.
 */
export function addRegionLayer(
  map: MlMap,
  data: FeatureCollection<MultiPolygon, RegionProperties>,
  opts: AddRegionLayerOptions = {},
): RegionLayerHandle {
  const s = { ...DEFAULTS, ...opts.style };
  const id = opts.id ?? "regions";
  const interactive = opts.interactive ?? true;
  const sourceId = id;
  const fillId = `${id}-fill`;
  const lineId = `${id}-line`;
  const selected = new Set<string>();

  map.addSource(sourceId, { type: "geojson", data, promoteId: "id" });

  map.addLayer({
    id: fillId,
    type: "fill",
    source: sourceId,
    paint: {
      "fill-color": s.selectedFillColor,
      "fill-opacity": ["case", ["boolean", ["feature-state", "selected"], false], s.selectedFillOpacity, 0],
    },
  });

  map.addLayer({
    id: lineId,
    type: "line",
    source: sourceId,
    paint: {
      "line-color": s.lineColor,
      // NB: a "zoom" expression may only be a top-level input to step/interpolate,
      // so the hover override lives in each step output rather than wrapping the step.
      "line-opacity": [
        "step",
        ["zoom"],
        ["case", ["boolean", ["feature-state", "hover"], false], 1, s.lineOpacity],
        s.strongZoom,
        ["case", ["boolean", ["feature-state", "hover"], false], 1, s.lineOpacityStrong],
      ],
      "line-width": [
        "step",
        ["zoom"],
        ["case", ["boolean", ["feature-state", "hover"], false], s.hoverWeight, s.lineWeight],
        s.strongZoom,
        ["case", ["boolean", ["feature-state", "hover"], false], s.hoverWeight, s.lineWeightStrong],
      ],
    },
  });

  const featureId = (f: MapGeoJSONFeature): string => String(f.id ?? f.properties?.["id"]);

  const setSelected = (regionIds: Iterable<string>) => {
    for (const old of selected) map.setFeatureState({ source: sourceId, id: old }, { selected: false });
    selected.clear();
    for (const rid of regionIds) {
      selected.add(rid);
      map.setFeatureState({ source: sourceId, id: rid }, { selected: true });
    }
  };

  // --- interaction ---
  let hoverCb: ((name: string | null) => void) | undefined;
  let clickCb: ((regionId: string, ev: MouseEvent) => void) | undefined;
  let hovered: string | undefined;

  const onMove = (e: MapLayerMouseEvent) => {
    const f = e.features?.[0];
    if (!f) return;
    const rid = featureId(f);
    if (hovered && hovered !== rid) {
      map.setFeatureState({ source: sourceId, id: hovered }, { hover: false });
    }
    hovered = rid;
    map.setFeatureState({ source: sourceId, id: rid }, { hover: true });
    hoverCb?.((f.properties as RegionProperties | undefined)?.name ?? null);
  };
  const onLeave = () => {
    if (hovered) map.setFeatureState({ source: sourceId, id: hovered }, { hover: false });
    hovered = undefined;
    hoverCb?.(null);
  };
  const onClick = (e: MapLayerMouseEvent) => {
    const f = e.features?.[0];
    if (!f) return;
    clickCb?.(featureId(f), e.originalEvent);
  };

  if (interactive) {
    map.on("mousemove", fillId, onMove);
    map.on("mouseleave", fillId, onLeave);
    map.on("click", fillId, onClick);
  }

  return {
    sourceId,
    setSelected,
    toggle(regionIds, force) {
      const next = new Set(selected);
      for (const rid of regionIds) {
        const shouldSelect = force ?? !next.has(rid);
        if (shouldSelect) next.add(rid);
        else next.delete(rid);
      }
      setSelected(next);
    },
    getSelected: () => [...selected],
    clear: () => setSelected([]),
    onRegionHover: (cb) => (hoverCb = cb),
    onRegionClick: (cb) => (clickCb = cb),
    remove() {
      if (interactive) {
        map.off("mousemove", fillId, onMove);
        map.off("mouseleave", fillId, onLeave);
        map.off("click", fillId, onClick);
      }
      if (map.getLayer(lineId)) map.removeLayer(lineId);
      if (map.getLayer(fillId)) map.removeLayer(fillId);
      if (map.getSource(sourceId)) map.removeSource(sourceId);
    },
  };
}
