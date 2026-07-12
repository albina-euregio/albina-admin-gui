import {
  RasterLayerSpecification,
  RasterSourceSpecification,
  SourceSpecification,
  StyleSpecification,
} from "maplibre-gl";

/** A named base layer: its source + layer spec, ready to compose into a style. */
export interface MapBaseLayer {
  /** unique id, used as both the source key and the layer id */
  id: string;
  /** human-readable name, e.g. for a base-layer switcher */
  name: string;
  source: SourceSpecification;
  layer: RasterLayerSpecification;
}

/** Options common to base-layer builders. `minZoom`/`maxZoom` bound layer visibility. */
export interface BaseLayerOptions {
  id?: string;
  minZoom?: number;
  maxZoom?: number;
  /** default true; set false to start hidden (e.g. an alternative base layer) */
  visible?: boolean;
}

function applyLayerOptions(layer: RasterLayerSpecification, opts: BaseLayerOptions): void {
  if (opts.minZoom !== undefined) layer.minzoom = opts.minZoom;
  if (opts.maxZoom !== undefined) layer.maxzoom = opts.maxZoom;
  if (opts.visible === false) layer.layout = { visibility: "none" };
}

/** Albina PMTiles base map. */
export function albinaBasemapLayer(opts: BaseLayerOptions = {}): MapBaseLayer {
  const id = opts.id ?? "albina-basemap";
  const source: RasterSourceSpecification = {
    type: "raster",
    url: "pmtiles://https://static.avalanche.report/albina-basemap.pmtiles",
    tileSize: 256,
    attribution:
      "© <a href='https://sonny.4lima.de/'>Sonny</a>, CC BY 4.0 | © <a href='https://www.eea.europa.eu/en/datahub/datahubitem-view/d08852bc-7b5f-4835-a776-08362e2fbf4b'>EU-DEM</a>, CC BY 4.0 | © avalanche.report, CC BY 4.0",
  };
  const layer: RasterLayerSpecification = { id, type: "raster", source: id };
  applyLayerOptions(layer, opts);
  return { id, name: "Albina", source, layer };
}

/** OpenTopoMap raster. */
export function opentopoLayer(opts: BaseLayerOptions = {}): MapBaseLayer {
  const id = opts.id ?? "opentopo";
  const source: RasterSourceSpecification = {
    type: "raster",
    tiles: ["https://tile.opentopomap.org/{z}/{x}/{y}.png"],
    tileSize: 256,
    attribution: "map data: © OpenStreetMap contributors, SRTM | map style: © OpenTopoMap (CC-BY-SA)",
  };
  const layer: RasterLayerSpecification = { id, type: "raster", source: id };
  applyLayerOptions(layer, opts);
  return { id, name: "OpenTopoMap", source, layer };
}

/** basemap.at terrain (grey), Austria only, data up to zoom 17. */
export function basemapAtTerrainLayer(opts: BaseLayerOptions = {}): MapBaseLayer {
  const id = opts.id ?? "basemap";
  const source: RasterSourceSpecification = {
    type: "raster",
    tiles: ["https://mapsneu.wien.gv.at/basemap/bmapgelaende/grau/google3857/{z}/{y}/{x}.jpeg"],
    tileSize: 256,
    maxzoom: 17,
    bounds: [8.782379, 46.35877, 17.189532, 49.037872],
    attribution: 'Datenquelle: <a href="https://www.basemap.at">basemap.at</a>',
  };
  const layer: RasterLayerSpecification = { id, type: "raster", source: id };
  applyLayerOptions(layer, opts);
  return { id, name: "basemap.at Gelände", source, layer };
}

/** Composes an ordered list of base layers into a MapLibre style. */
export function composeStyle(layers: MapBaseLayer[]): StyleSpecification {
  const sources: StyleSpecification["sources"] = {};
  for (const l of layers) sources[l.id] = l.source;
  return {
    version: 8,
    sources,
    layers: layers.map((l) => l.layer),
  };
}

/**
 * Builds the standard region base style: Albina PMTiles raster below `crossoverZoom`,
 * OpenTopoMap raster at/above it. The crossover is declarative via layer min/maxzoom,
 * replacing the manual add/remove-on-zoomend swap of the Leaflet `MapService`.
 */
export function buildBaseStyle(opts: { crossoverZoom?: number } = {}): StyleSpecification {
  const crossover = opts.crossoverZoom ?? 13;
  return composeStyle([albinaBasemapLayer({ maxZoom: crossover }), opentopoLayer({ minZoom: crossover })]);
}
