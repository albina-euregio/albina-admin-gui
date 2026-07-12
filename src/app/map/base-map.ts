import { StyleSpecification } from "maplibre-gl";

const ALBINA_BASEMAP_URL = "https://static.avalanche.report/albina-basemap.pmtiles";
const OPENTOPO_URL = "https://tile.opentopomap.org/{z}/{x}/{y}.png";

const ALBINA_ATTRIBUTION =
  "© <a href='https://sonny.4lima.de/'>Sonny</a>, CC BY 4.0 | © <a href='https://www.eea.europa.eu/en/datahub/datahubitem-view/d08852bc-7b5f-4835-a776-08362e2fbf4b'>EU-DEM</a>, CC BY 4.0 | © avalanche.report, CC BY 4.0";
const OPENTOPO_ATTRIBUTION = "map data: © OpenStreetMap contributors, SRTM | map style: © OpenTopoMap (CC-BY-SA)";

/**
 * Builds the base MapLibre style: Albina PMTiles raster below `crossoverZoom`,
 * OpenTopoMap raster at/above it. Replaces the manual add/remove-on-zoomend swap
 * of the Leaflet `MapService` — the crossover is now declarative via layer min/maxzoom.
 *
 * Overlays (regions, aggregated regions) are added by the respective helpers after load.
 */
export function buildBaseStyle(opts: { crossoverZoom?: number } = {}): StyleSpecification {
  const crossover = opts.crossoverZoom ?? 13;
  return {
    version: 8,
    sources: {
      "albina-basemap": {
        type: "raster",
        url: `pmtiles://${ALBINA_BASEMAP_URL}`,
        tileSize: 256,
        attribution: ALBINA_ATTRIBUTION,
      },
      opentopo: {
        type: "raster",
        tiles: [OPENTOPO_URL],
        tileSize: 256,
        attribution: OPENTOPO_ATTRIBUTION,
      },
    },
    layers: [
      { id: "albina-basemap", type: "raster", source: "albina-basemap", maxzoom: crossover },
      { id: "opentopo", type: "raster", source: "opentopo", minzoom: crossover },
    ],
  };
}
