import { average, max, median, min, sum } from "simple-statistics";
import { type GenericObservation, ObservationSource, ObservationType } from "../generic-observation";
import { fetchJSON, fetchText } from "../util/fetchJSON";
import { fetchSnowLineCalculations } from "./observations/snow_line";

export async function getAwsWeatherStations(
  startDate: Date,
  endDate: Date,
): Promise<GenericObservation<FeatureProperties>[]> {
  let url = "https://static.avalanche.report/weather_stations/stations.geojson";
  if (endDate instanceof Date) {
    const yyyy = endDate.getFullYear();
    const mm = (endDate.getMonth() + 1).toString().padStart(2, "0");
    const dd = endDate.getDate().toString().padStart(2, "0");
    url = `https://static.avalanche.report/weather_stations/${yyyy}-${mm}-${dd}_00-00_stations.geojson`;
  }

  const geojson: GeoJSON.FeatureCollection<GeoJSON.Point, FeatureProperties> = await fetchJSON(url);
  const stations = geojson.features.map((feature) => mapFeature(feature));
  const smetData = await StationValues.fetchSMET(stations);
  for (const station of stations) {
    station.$data.statistics = smetData?.statistics(startDate, endDate, station);
  }

  const snowLines = await Array.fromAsync(fetchSnowLineCalculations(startDate, endDate));
  for (const station of stations) {
    const snowLine = snowLines.find((o) => o.locationName === station.locationName);
    if (!snowLine) continue;
    station.$externalImgs.unshift(...snowLine.$externalImgs);
    const $data: FeatureProperties = station.$data;
    $data.statistics ??= {};
    $data.statistics.SnowLine = {
      parameter: "SnowLine",
      unit: "m",
      max: snowLine.elevation,
      plot: snowLine.$externalImgs?.[0],
    };
  }

  return stations;
}

class StationValues {
  constructor(private data: Record<GenericObservation["$id"], string>) {}

  statistics(startDate: Date, endDate: Date, station: GenericObservation<FeatureProperties>): Data | undefined {
    if (!station?.$id) {
      return;
    }
    const smet = this.data[station.$id];
    if (!smet) {
      return;
    }
    return parseSMET(smet, startDate, endDate);
  }

  static async fetchSMET(stations: GenericObservation<FeatureProperties>[]): Promise<StationValues> {
    const data: [GenericObservation["$id"], string][] = [];
    for (const station of stations) {
      if (!station?.$id || !process.env.ALBINA_SMET_API) {
        continue;
      }
      const url = process.env.ALBINA_SMET_API.replace("{station}", station.$id);
      try {
        const smet = await fetchText(url);
        if (!smet) {
          continue;
        }
        data.push([station?.$id, smet]);
      } catch (e) {
        console.warn(`Fetching ${station.locationName} from ${url} failed!`, e);
      }
    }
    return new StationValues(Object.fromEntries(data.filter((d) => Array.isArray(d))));
  }
}

function mapFeature(feature: GeoJSON.Feature<GeoJSON.Point, FeatureProperties>): GenericObservation<FeatureProperties> {
  return {
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
    $id: feature.properties["LWD-Nummer"] || String(feature.id),
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
  } satisfies GenericObservation;
}

export interface FeatureProperties {
  statistics?: Data;
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

// P Air pressure, in Pa
// TA Temperature Air, in Kelvin
// TD Temperature Dew Point, in Kelvin
// TSS Temperature Snow Surface, in Kelvin
// TSG Temperature Surface Ground, in Kelvin
// RH Relative Humidity, between 0 and 1
// VW_MAX Maximum wind velocity, in m/s
// VW Velocity Wind, in m/s
// DW Direction Wind, in degrees, clockwise and north being zero degrees
// ISWR Incoming Short Wave Radiation, in W/m2
// RSWR Reflected Short Wave Radiation, in W/m2 (previously OSWR)
// ILWR Incoming Long Wave Radiation, in W/m2
// OLWR Outgoing Long Wave Radiation, in W/m2
// PINT Precipitation Intensity, in mm/h, as an average over the timestep
// PSUM Precipitation accumulation, in mm, summed over the last timestep
// HS Height Snow, in m
type ParameterType =
  | "SnowLine"
  | "P"
  | "TA"
  | "TD"
  | "TSS"
  | "TSG"
  | "RH"
  | "VW_MAX"
  | "VW"
  | "DW"
  | "ISWR"
  | "RSWR"
  | "ILWR"
  | "OLWR"
  | "PINT"
  | "PSUM"
  | "HS";

const UNIT_MAPPING: Record<string, { to: string; convert: (v: number) => number }> = {
  K: { to: "°C", convert: (v) => v - 273.15 },
  m: { to: "cm", convert: (v) => v * 100 },
  "m/s": { to: "km/h", convert: (v) => v * 3.6 },
};

type Data = Partial<
  Record<
    Exclude<ParameterType, "SnowLine">,
    {
      parameter: Exclude<ParameterType, "SnowLine">;
      unit: string;
      count: number;
      min: number;
      average: number;
      median: number;
      max: number;
      sum: number;
      delta: number;
    }
  > &
    Record<
      "SnowLine",
      {
        parameter: "SnowLine";
        unit: "m";
        max: number;
        plot: string;
      }
    >
>;

export function parseSMET(smet: string, startDate: Date, endDate: Date): Data {
  // https://code.wsl.ch/snow-models/meteoio/-/blob/master/doc/SMET_specifications.pdf
  let fields = [] as ParameterType[];
  let units = [] as string[];
  let nodata = "-777";
  const values: number[][] = [];
  smet.split(/\r?\n/).forEach((line) => {
    if (line.startsWith("fields =")) {
      fields = line.slice("fields =".length).trim().split(" ") as ParameterType[];
      return;
    } else if (line.startsWith("#units =")) {
      units = line.slice("#units =".length).trim().split(" ");
      return;
    } else if (line.startsWith("nodata =")) {
      nodata = line.slice("nodata =".length).trim();
      return;
    } else if (!/^(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})/.test(line)) {
      return;
    }
    if (!values.length) {
      values.push(...fields.map(() => []));
    }
    const cells = line.split(" ");
    const date = new Date(cells[0]);
    if (+date < +startDate || +date > +endDate) {
      return;
    }
    values.forEach((p, i) => {
      if (cells[i] === nodata) return;
      const value = +cells[i].replace(",", ".");
      p.push(UNIT_MAPPING[units[i]]?.convert(value) ?? value);
    });
  });
  const statistics = values
    .map((values, i) => ({
      parameter: fields[i],
      unit: units.map((u) => UNIT_MAPPING[u]?.to ?? u)[i],
      count: values.length,
      min: values.length ? min(values) : NaN,
      average: values.length ? average(values) : NaN,
      median: values.length ? median(values) : NaN,
      max: values.length ? max(values) : NaN,
      sum: values.length ? sum(values) : NaN,
      delta: values.length ? values.at(-1) - values.at(0) : NaN,
    }))
    .slice(1);
  return Object.fromEntries(statistics.map((s) => [s.parameter, s]));
}
