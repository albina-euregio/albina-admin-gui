import { fetchJSON } from "../util/fetchJSON";
import { type GenericObservation, ObservationSource, ObservationType } from "../models";

export async function getAwsWeatherStations(endDate: string): Promise<GenericObservation[]> {
  const url = endDate
    ? `https://static.avalanche.report/weather_stations/${endDate}_12-00_stations.geojson`
    : "https://static.avalanche.report/weather_stations/stations.geojson";
  const geojson: GeoJSON.FeatureCollection<GeoJSON.Point, FeatureProperties> = await fetchJSON(url);
  return geojson.features.map(
    (feature): GenericObservation => ({
      $data: feature.properties,
      $externalImgs: [
        `https://wiski.tirol.gv.at/lawine/grafiken/1100/standard/woche/${feature.properties.plot}.png`,
        `https://wiski.tirol.gv.at/lawine/grafiken/800/wind/0-6/${feature.properties.plot}.png`,
        `https://wiski.tirol.gv.at/lawine/grafiken/800/wind/0-12/${feature.properties.plot}.png`,
        `https://wiski.tirol.gv.at/lawine/grafiken/800/wind/0-24/${feature.properties.plot}.png`,
        `https://wiski.tirol.gv.at/lawine/grafiken/800/wind/24-48/${feature.properties.plot}.png`,
        `https://wiski.tirol.gv.at/lawine/grafiken/800/wind/48-72/${feature.properties.plot}.png`,
        `https://wiski.tirol.gv.at/lawine/grafiken/800/wind/72-168/${feature.properties.plot}.png`,
      ],
      $source: ObservationSource.AvalancheWarningService,
      $type: ObservationType.TimeSeries,
      aspect: undefined,
      authorName: "",
      locationName: feature.properties.name,
      content: "",
      elevation: feature.geometry.coordinates[2],
      latitude: feature.geometry.coordinates[1],
      longitude: feature.geometry.coordinates[0],
      region: feature.properties["LWD-Region"]?.split(" ")?.[0] || "",
    }),
  );
}

interface FeatureProperties {
  "LWD-Nummer"?: string;
  "LWD-Region"?: string;
  Beobachtungsbeginn: string;
  date?: Date;
  GS_O?: number;
  GS_U?: number;
  HS?: number;
  HSD24?: number;
  HSD48?: number;
  HSD72?: number;
  N6?: number;
  N24?: number;
  N48?: number;
  N72?: number;
  LD?: number;
  LT_MAX?: number;
  LT_MIN?: number;
  LT?: number;
  name: string;
  OFT?: number;
  operator: string;
  operatorLink?: string;
  plot: string;
  RH?: number;
  TD?: number;
  WG_BOE?: number;
  WG?: number;
  WR?: number;
}
