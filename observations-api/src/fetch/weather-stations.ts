import { Feature, FeatureCollectionSchema, ParameterTypeSchema, Unit } from "@albina-euregio/linea/listing";
import { PROVIDERS } from "@albina-euregio/linea/providers";
import { orderBy, groupBy } from "es-toolkit";
import { average, max, median, min, sum } from "simple-statistics";

import { type GenericObservation, ObservationSource, ObservationType } from "../generic-observation";
import { fetchJSON } from "../util/fetchJSON";

export type FeatureProperties = Feature["properties"];

export async function getAwsWeatherStations(
  startDate: Date,
  endDate: Date,
): Promise<GenericObservation<FeatureProperties>[]> {
  if (!globalThis.Temporal) {
    await import("temporal-polyfill/global");
  }

  let url = "https://static.avalanche.report/eaws_weather_stations/linea.geojson";
  if (endDate instanceof Date) {
    const date = getISODateString(endDate);
    url = `https://static.avalanche.report/eaws_weather_stations/${date}/${date}_00-00_linea.geojson`;
  }

  const json: unknown = await fetchJSON(url);
  const geojson = await FeatureCollectionSchema.parseAsync(json);
  const stations$ = geojson.features.map(async (feature) => {
    await fetchStatistics(startDate, endDate, feature);
    return mapFeature(feature);
  });
  const stations: GenericObservation<FeatureProperties>[] = await Promise.all(stations$);

  const snowLinesByStation = groupBy(
    await Array.fromAsync(fetchSnowLineCalculations(startDate, endDate)),
    (o) => o.station_name,
  );
  for (const station of stations) {
    const snowLines = snowLinesByStation[station.locationName ?? "---"];
    if (!snowLines?.length) continue;
    station.$data.statistics ??= {};
    station.$data.statistics.DrySnowfallLevel = buildStatistics(
      "m",
      snowLines.map((o) => o.snowfall_limit),
    );
    const $externalImgs = snowLines[0]?.$externalImgs ?? [];
    station.$externalImgs.push(...$externalImgs.map((i) => `${i}?DrySnowfallLevel`));
  }

  return orderBy(stations, [(s) => s.region, (s) => s.locationName], ["asc", "asc"]);
}

function mapFeature(feature: Feature): GenericObservation<FeatureProperties> {
  return {
    $data: feature.properties,
    $externalImgs: [
      ...feature.properties.dataURLs,
      `https://wiski.tirol.gv.at/lawine/grafiken/1100/standard/woche/${feature.properties.plot}.png`,
      `https://wiski.tirol.gv.at/lawine/grafiken/800/wind/0-6/${feature.properties.plot}.png`,
      `https://wiski.tirol.gv.at/lawine/grafiken/800/wind/0-12/${feature.properties.plot}.png`,
      `https://wiski.tirol.gv.at/lawine/grafiken/800/wind/0-24/${feature.properties.plot}.png`,
      `https://wiski.tirol.gv.at/lawine/grafiken/800/wind/24-48/${feature.properties.plot}.png`,
      `https://wiski.tirol.gv.at/lawine/grafiken/800/wind/48-72/${feature.properties.plot}.png`,
      `https://wiski.tirol.gv.at/lawine/grafiken/800/wind/72-168/${feature.properties.plot}.png`,
    ],
    $id: feature.properties.shortName || String(feature.id),
    $source: ObservationSource.AvalancheWarningService,
    $type: ObservationType.TimeSeries,
    aspect: undefined,
    authorName: "",
    locationName: feature.properties.name,
    content: "",
    elevation: feature.geometry.coordinates[2],
    latitude: feature.geometry.coordinates[1],
    longitude: feature.geometry.coordinates[0],
    region: feature.properties.microRegionID?.split(" ")?.[0] || "",
  } as GenericObservation;
}

async function fetchStatistics(startDate: Date, endDate: Date, feature: Feature) {
  const station = feature?.properties?.shortName || feature?.id;
  try {
    feature.properties.statistics ??= {};
    let smetData = await PROVIDERS.fetchStationData(
      {
        ...feature,
        properties: {
          ...feature.properties,
          dataURLs: [process.env.ALBINA_SMET_API.replace("{station}", station)],
        },
      },
      0,
    );
    smetData = smetData.filter(
      startDate.toTemporalInstant().toZonedDateTimeISO("UTC"),
      endDate.toTemporalInstant().toZonedDateTimeISO("UTC"),
    );
    ParameterTypeSchema.options.forEach((p) => {
      const values = smetData.values[p];
      if (!values?.length) return;
      feature.properties.statistics[p] = buildStatistics(undefined, values);
    });
  } catch (e) {
    console.warn(`Failed to fetch statistics for ${station}`, e);
  }
}

function buildStatistics(
  unit: Unit | undefined,
  values: number[],
): FeatureProperties["statistics"][keyof FeatureProperties["statistics"]] {
  return {
    unit,
    count: values.length,
    min: values.length ? min(values) : NaN,
    average: values.length ? average(values) : NaN,
    median: values.length ? median(values) : NaN,
    max: values.length ? max(values) : NaN,
    sum: values.length ? sum(values) : NaN,
    delta: values.length ? (values.at(-1) ?? NaN) - (values.at(0) ?? NaN) : NaN,
  };
}

interface SnowLineProperties {
  station_number: string;
  station_name: string;
  subregion: string;
  region: string;
  extended_region: string;
  snowfall_limit: number;
  plot_name: string;
  $externalImgs?: string[];
}

/**
 * Calculated snow fall levels from weather stations
 * https://gitlab.com/lwd.met/lwd-internal-projects/snow-fall-level-calculator
 */
export async function* fetchSnowLineCalculations(
  startDate: Date,
  endDate: Date,
): AsyncGenerator<SnowLineProperties, void, unknown> {
  let endDateImages: Date | undefined = undefined;
  while (+endDate > +startDate) {
    const date = getISODateString(endDate);
    const url = `https://static.avalanche.report/snow-fall-level-calculator/geojson/${date}.geojson`;
    try {
      const json: GeoJSON.FeatureCollection<GeoJSON.Point, SnowLineProperties> = await fetchJSON(url);
      endDateImages ??= new Date(endDate);
      for (const f of json.features) {
        yield {
          ...f.properties,
          $externalImgs: getSnowLineCalculationsImages(endDateImages, f.properties),
        };
      }
    } catch (err) {
      console.log(`Failed to fetch ${url}`, err);
    }
    endDate = new Date(endDate);
    endDate.setDate(endDate.getDate() - 1);
  }
}

function getSnowLineCalculationsImages(endDate: Date, { plot_name }: SnowLineProperties): string[] {
  return Array.from({ length: 17 }).map((_, i) => {
    const d = new Date(endDate);
    d.setDate(d.getDate() - i * 3);
    const date = getISODateString(d);
    return `https://static.avalanche.report/snow-fall-level-calculator/Plots/weekly/${date}/${plot_name}`;
  });
}

function getISODateString(date: Date) {
  // like Date.toISOString(), but not using UTC
  // Angular is too slow - formatDate(date, "yyyy-MM-dd", "en-US");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` as const;

  function pad(number: number) {
    return number < 10 ? (`${0}${number}` as unknown as number) : number;
  }
}
