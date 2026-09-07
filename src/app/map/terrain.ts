import {
  ErrorEvent as MlErrorEvent,
  Map as MlMap,
  NavigationControl,
  RasterDEMSourceSpecification,
  TerrainControl,
} from "maplibre-gl";

const DEM_SOURCE = "terrain-dem";
const TERRAIN_PITCH = 60;
const MAX_PITCH = 80;

/** Mapzen terrain tiles on AWS Open Data: Austria's 10 m DGM, EU-DEM in the rest of the Alps, SRTM/GMTED beyond. */
const terrariumSource: RasterDEMSourceSpecification = {
  type: "raster-dem",
  tiles: ["https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png"],
  encoding: "terrarium",
  tileSize: 256,
  maxzoom: 15,
  attribution:
    "terrain: © offene Daten Österreichs – Digitales Geländemodell (DGM) Österreich | produced using Copernicus data and information funded by the European Union – EU-DEM layers | SRTM and GMTED2010 courtesy of the U.S. Geological Survey | tiles: <a href='https://registry.opendata.aws/terrain-tiles/'>Mapzen/AWS</a>",
};

/** Adds a 3D-terrain toggle and a compass; enabling tilts the view, an unreachable DEM host switches it off again. */
export function addTerrainControl(map: MlMap): void {
  if (map.getSource(DEM_SOURCE)) return;
  map.addSource(DEM_SOURCE, terrariumSource);
  map.setMaxPitch(MAX_PITCH);
  map.addControl(new TerrainControl({ source: DEM_SOURCE }), "top-left");
  map.addControl(new NavigationControl({ showZoom: false, visualizePitch: true }), "top-left");
  map.on("terrain", () => map.easeTo({ pitch: map.getTerrain() ? TERRAIN_PITCH : 0 }));
  map.on("error", (e: MlErrorEvent & { sourceId?: string }) => {
    if (e.sourceId === DEM_SOURCE && map.getTerrain()) map.setTerrain(null);
  });
}
