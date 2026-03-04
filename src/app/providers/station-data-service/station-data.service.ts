interface StationFeatureGeometry {
  type: "Point";
  coordinates: [number, number, ...number[]];
}

interface ScalarLike {
  convertTo(unit: string): number | undefined;
}

interface StationFeatureProperties extends Record<string, unknown> {
  name: string;
  shortName?: string;
  altitude?: number;
  microRegionID?: string;
  startYear?: number | string;
  date?: unknown;
  operator?: string;
  plot?: string;
  TA?: ScalarLike;
  TSS?: ScalarLike;
  TD?: ScalarLike;
  TA_MAX?: ScalarLike;
  TA_MIN?: ScalarLike;
  HS?: ScalarLike;
  HSD_6?: ScalarLike;
  HSD_24?: ScalarLike;
  HSD_48?: ScalarLike;
  HSD_72?: ScalarLike;
  PSUM_6?: ScalarLike;
  PSUM_24?: ScalarLike;
  PSUM_48?: ScalarLike;
  PSUM_72?: ScalarLike;
  RH?: ScalarLike;
  DW?: ScalarLike;
  VW?: ScalarLike;
  VW_MAX?: ScalarLike;
  ISWR?: ScalarLike;
  RSWR?: ScalarLike;
}

interface StationFeature {
  id?: string;
  geometry: StationFeatureGeometry;
  properties: StationFeatureProperties;
}

export class StationData {
  id: string;
  geometry: StationFeature["geometry"];
  properties: StationFeature["properties"];
  $smet: string[] | undefined;
  $png: string | undefined;
  $stationsArchiveFile: string | undefined;

  constructor(object: {
    id?: StationFeature["id"];
    geometry: StationFeature["geometry"];
    properties: StationFeature["properties"];
  }) {
    this.id = object.id ?? object.properties.shortName ?? object.properties.name;
    this.geometry = object.geometry;
    this.properties = object.properties;
  }
  get lon() {
    return this.geometry.coordinates[0];
  }
  get lat() {
    return this.geometry.coordinates[1];
  }
  get altitude() {
    return this.geometry.coordinates[2] ?? this.properties.altitude;
  }
  get name() {
    return this.properties.name;
  }
  get startYear() {
    return this.properties.startYear;
  }
  get province() {
    const region = this.properties.microRegionID;
    if (typeof region !== "string") {
      return "";
    }
    return region.split(/ /)?.[0] ?? "";
  }
  get microRegion() {
    const region = this.properties.microRegionID;
    if (typeof region !== "string") {
      return "";
    }
    return region.split(/ /)?.[0];
  }
  get date() {
    return this.properties.date;
  }
  get TA() {
    return this.properties.TA.convertTo("°C");
  }
  get TSS() {
    return this.properties.TSS.convertTo("°C");
  }
  get TD() {
    return this.properties.TD.convertTo("°C");
  }
  get TA_MAX() {
    return this.properties.TA_MAX.convertTo("°C");
  }
  get TA_MIN() {
    return this.properties.TA_MIN.convertTo("°C");
  }
  get HS() {
    return this.properties.HS.convertTo("cm");
  }
  get HSD_6() {
    return this.properties.HSD_6.convertTo("cm");
  }
  get HSD_24() {
    return this.properties.HSD_24.convertTo("cm");
  }
  get HSD_48() {
    return this.properties.HSD_48.convertTo("cm");
  }
  get HSD_72() {
    return this.properties.HSD_72.convertTo("cm");
  }
  get PSUM_6() {
    return this.properties.PSUM_6.convertTo("mm");
  }
  get PSUM_24() {
    return this.properties.PSUM_24.convertTo("mm");
  }
  get PSUM_48() {
    return this.properties.PSUM_48.convertTo("mm");
  }
  get PSUM_72() {
    return this.properties.PSUM_72.convertTo("mm");
  }
  get RH() {
    return this.properties.RH.convertTo("%");
  }
  get DW() {
    return this.properties.DW.convertTo("°");
  }
  get aspectDW() {
    if (typeof this.DW !== "number") {
      return false;
    }
    const index = Math.round(((this.DW + 360 - 22.5) % 360) / 45);
    const classes = ["N", "NE", "E", "SE", "S", "SW", "W", "NW", "N"];
    return classes[index];
  }
  get VW() {
    return this.properties.VW.convertTo("km/h");
  }
  get VW_MAX() {
    return this.properties.VW_MAX.convertTo("km/h");
  }
  get ISWR() {
    return this.properties.ISWR.convertTo("W/m²");
  }
  get RSWR() {
    return this.properties.RSWR.convertTo("W/m²");
  }

  get plot() {
    return this.properties.plot;
  }

  get smetId() {
    const shortName = this.properties.shortName;
    if (typeof shortName === "string" && shortName.length > 0) {
      return shortName;
    }

    const lwdNumber = this.properties["LWD-Nummer"];
    if (typeof lwdNumber === "string" && lwdNumber.length > 0) {
      return lwdNumber;
    }

    const gsNumber = this.properties.GS_O;
    if (typeof gsNumber === "string" && gsNumber.length > 0) {
      return gsNumber;
    }

    return this.id;
  }

  get parametersForDialog() {
    const types = [
      { type: "HS", digits: 0, unit: "cm" },
      { type: "TA", digits: 1, unit: "°C" },
      { type: "RH", digits: 0, unit: "%" },
      { type: "VW", digits: 0, unit: "km/h" },
      { type: "VW_MAX", digits: 0, unit: "km/h" },
    ] as const;
    return types
      .filter((t) => this[t.type] !== undefined)
      .map((t) => ({
        ...t,
        value: this[t.type],
      }));
  }

  round(value: number, digits = 0) {
    if (typeof value === "number") {
      return +value.toFixed(digits);
    } else if (value === undefined) {
      return false;
    } else {
      return value;
    }
  }
}

interface StationApiConfig {
  smet: string[];
  smetOperators: string;
  stations: string;
}

const STATION_API_CONFIG_KEYS = ["smet", "smetOperators", "stations"] as const;

let stationApis: StationApiConfig[] = [];
let stationApisLoaded = false;

interface LoadOptions {
  consumer?: (station: StationData[]) => void;
  dateTime?: Temporal.ZonedDateTime;
  ogd?: boolean;
}

function isPointGeometry(value: unknown): value is StationFeatureGeometry {
  if (!value || typeof value !== "object") {
    return false;
  }
  const geometry = value as { type?: unknown; coordinates?: unknown };
  if (geometry.type !== "Point" || !Array.isArray(geometry.coordinates)) {
    return false;
  }
  if (geometry.coordinates.length < 2) {
    return false;
  }
  return typeof geometry.coordinates[0] === "number" && typeof geometry.coordinates[1] === "number";
}

function parseStationFeature(feature: unknown): StationFeature | undefined {
  if (!feature || typeof feature !== "object") {
    return;
  }
  const candidate = feature as {
    id?: unknown;
    geometry?: unknown;
    properties?: unknown;
  };
  if (!isPointGeometry(candidate.geometry)) {
    return;
  }
  if (!candidate.properties || typeof candidate.properties !== "object") {
    return;
  }

  const properties = candidate.properties as Record<string, unknown>;
  const name =
    typeof properties.name === "string"
      ? properties.name
      : typeof properties.shortName === "string"
        ? properties.shortName
        : undefined;
  if (!name) {
    return;
  }

  return {
    id: typeof candidate.id === "string" ? candidate.id : undefined,
    geometry: candidate.geometry,
    properties: {
      ...properties,
      name,
    } as StationFeatureProperties,
  };
}

function parseStationFeatures(value: unknown): StationFeature[] {
  if (!value || typeof value !== "object") {
    return [];
  }
  const maybeFeatures = (value as { features?: unknown }).features;
  if (!Array.isArray(maybeFeatures)) {
    return [];
  }
  return maybeFeatures.map(parseStationFeature).filter((feature): feature is StationFeature => !!feature);
}

function isStationApiConfig(value: unknown): value is StationApiConfig {
  if (!value || typeof value !== "object") {
    return false;
  }
  const record = value as Record<string, unknown>;
  const smetValue = record.smet;
  const smetIsValid = Array.isArray(smetValue) && smetValue.every((item) => typeof item === "string");
  if (!smetIsValid) {
    return false;
  }

  return STATION_API_CONFIG_KEYS.filter((key) => key !== "smet").every((key) => typeof record[key] === "string");
}

function parseStationApis(value: unknown): StationApiConfig[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter(isStationApiConfig);
}

export async function initializeStationApiConfig(): Promise<void> {
  if (stationApisLoaded) {
    return;
  }
  stationApisLoaded = true;
  try {
    const url = new URL("assets/config/stations.json", document.baseURI).toString();
    const response = await fetch(url, { cache: "no-cache" });
    if (!response.ok) {
      stationApis = [];
      return;
    }
    const json = await response.json();
    stationApis = parseStationApis(json);
  } catch {
    stationApis = [];
  }
}

function getStationApis(): StationApiConfig[] {
  return stationApis;
}

export async function loadStationData({ consumer, ogd }: LoadOptions = {}): Promise<StationData[]> {
  if (!stationApisLoaded) {
    await initializeStationApiConfig();
  }
  const all = getStationApis().map(async ({ smet, smetOperators, stations: url }) => {
    const isLocalhost = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
    if (isLocalhost && url.startsWith("https://smet.hydrographie.info/")) {
      url = url.slice("https:/".length);
      smet = smet.map((template) => template.slice("https:/".length));
    }

    try {
      const response = await fetch(url, { cache: "no-cache" });
      if (!response.ok) throw new Error(response.statusText);
      if (response.status === 404) return [];

      const json = await response.json();
      const stations = parseStationFeatures(json)
        .filter((el) => ogd || el.properties.date)
        .filter((el) => !ogd || !el.properties.name.startsWith("Beobachter"))
        .map((feature) => {
          const data = new StationData({
            id: feature.id,
            geometry: feature.geometry,
            properties: feature.properties,
          });
          const operator = feature.properties.operator ?? "";
          data.$smet = new RegExp(smetOperators).test(operator) ? smet : [];

          if (!data.$smet?.length && !data.$png) {
            return;
          }

          return data;
        })
        .filter((d) => !!d);
      consumer?.(stations);
      return stations;
    } catch (e) {
      console.error("Failed fetching station data from " + url, e);
      return [];
    }
  });

  const data = await Promise.all(all);
  return data.flat();
}
