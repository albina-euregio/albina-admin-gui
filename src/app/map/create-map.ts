import maplibregl, { Map as MlMap, StyleSpecification } from "maplibre-gl";

import { registerPmtilesProtocol } from "./pmtiles";

export interface CreateMapOptions {
  container: HTMLElement | string;
  style: StyleSpecification;
  /** default true */
  interactive?: boolean;
  /** adds a NavigationControl (top-left); default false */
  navigationControl?: boolean;
  /** default true; pass false to omit the attribution control */
  attribution?: boolean;
  /** default 4 */
  minZoom?: number;
  /** default 15 */
  maxZoom?: number;
}

/**
 * Creates a configured MapLibre map. Registers the pmtiles protocol first so any
 * PMTiles source in the style resolves. Replaces the duplicated `new LeafletMap(...)`
 * blocks in `MapService` / `BaseMapService` / `LineaMapService`.
 */
export function createMap(opts: CreateMapOptions): MlMap {
  registerPmtilesProtocol();
  const map = new maplibregl.Map({
    container: opts.container,
    style: opts.style,
    interactive: opts.interactive ?? true,
    minZoom: opts.minZoom ?? 4,
    maxZoom: opts.maxZoom ?? 15,
    attributionControl: opts.attribution === false ? false : undefined,
  });
  if (opts.navigationControl) {
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-left");
  }
  return map;
}
