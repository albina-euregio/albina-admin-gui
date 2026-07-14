import { widgetRegistry } from "app/shared/zod-schema-form.widget-registry";
import { withShowIf } from "app/shared/zod-util";
import { orderBy } from "es-toolkit";
import { z } from "zod/v4";

import { Aspect, AvalancheProblem, DangerPattern, SnowpackStability } from "../../enums/enums";

export enum ImportantObservation {
  SurfaceHoar = "SurfaceHoar",
  Graupel = "Graupel",
  StabilityTest = "StabilityTest",
  IceFormation = "IceFormation",
  VeryLightNewSnow = "VeryLightNewSnow",
  ForBlog = "ForBlog",
}

export enum ObservationSource {
  AvalancheWarningService = "AvalancheWarningService",
  Observer = "Observer",
  LwdKip = "LwdKip",
  Lawis = "Lawis",
  LoLaObserver = "LoLaObserver",
  LoLaKronos = "LoLaKronos",
  Snobs = "Snobs",
  WikisnowECT = "WikisnowECT",
  FotoWebcamsEU = "FotoWebcamsEU",
  Panomax = "Panomax",
  RasBzIt = "RasBzIt",
  PanoCloud = "PanoCloud",
}

export enum ForecastSource {
  meteogram = "meteogram",
  multimodel = "multimodel",
  qfa = "qfa",
}

export enum ObservationType {
  SimpleObservation = "SimpleObservation",
  Evaluation = "Evaluation",
  Avalanche = "Avalanche",
  Blasting = "Blasting",
  Closure = "Closure",
  Profile = "Profile",
  TimeSeries = "TimeSeries",
  Webcam = "Webcam",
  DrySnowfallLevel = "DrySnowfallLevel",
}

export enum PersonInvolvement {
  Dead = "Dead",
  Injured = "Injured",
  Uninjured = "Uninjured",
  No = "No",
  Unknown = "Unknown",
}

export interface ObservationTableRow {
  label: string;
  date?: Date;
  number?: number;
  boolean?: boolean;
  url?: string;
  value?: string;
}

export function toAspect(aspect: number | string | undefined): Aspect | undefined {
  enum NumericAspect {
    N = 1,
    NE = 2,
    E = 3,
    SE = 4,
    S = 5,
    SW = 6,
    W = 7,
    NW = 8,
  }
  if (typeof aspect === "number") {
    const string = NumericAspect[aspect];
    return Aspect[string];
  } else if (typeof aspect === "string") {
    return Aspect[aspect];
  }
}

export function imageCountString(images: unknown[] | undefined) {
  return images?.length ? ` 📷 ${images.length}` : "";
}

export function toGeoJSON(observations: GenericObservation[]) {
  const features = observations.map(
    (o): GeoJSON.Feature => ({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [o.longitude ?? 0.0, o.latitude ?? 0.0, o.elevation ?? 0.0],
      },
      properties: {
        ...o,
        ...o.$data,
        $data: undefined,
      },
    }),
  );
  const collection: GeoJSON.FeatureCollection = {
    type: "FeatureCollection",
    features,
  };
  return collection;
}

export function toCSV(observations: GenericObservation[]) {
  const csvDelimiter = ";";
  const csvLineBreak = "\n";

  // Sort observations by event date
  orderBy(observations, [(o) => +o.eventDate], ["asc"]);

  let csvContent = "";

  // Add header
  csvContent +=
    [
      "EventDate",
      "EventTime",
      "EventType",
      "ReportDate",
      "AuthorName",
      "LocationName",
      "Latitude",
      "Longitude",
      "Elevation",
      "Aspect",
      "Region",
      "Content",
    ].join(csvDelimiter) + csvLineBreak;

  // Add rows
  for (const observation of observations) {
    csvContent +=
      [
        observation.eventDate?.toISOString().split("T")[0] || "",
        observation.eventDate?.toISOString().split("T")[1]?.split(".")[0] || "",
        observation.$type || "",
        observation.reportDate?.toISOString() || "",
        observation.authorName || "",
        observation.locationName || "",
        observation.latitude || "",
        observation.longitude || "",
        observation.elevation || "",
        observation.aspect || "",
        observation.region || "",
        observation.content?.replace(/;/g, ",").replace(/\n/g, ", ") || "",
      ].join(csvDelimiter) + csvLineBreak;
  }

  return csvContent;
}

export function degreeToAspect(degree: number): Aspect {
  const aspects = Object.values(Aspect);
  const n = (Math.round((degree * 8) / 360) + 8) % 8;
  return aspects[n];
}

// https://transform.tools/typescript-to-zod
export const genericObservationSchema = z.object({
  $data: z.any().describe("Additional data (e.g. original data stored when fetching from external API)"),
  $id: z.string().nullish().describe("External ID of this observations"),
  $allowEdit: z.boolean().default(false),
  $deleted: z.boolean().default(false),
  $externalURL: z
    .string()
    .register(widgetRegistry, { class: "col-12", icon: "ph ph-link" })
    .nullish()
    .describe("External URL to display as iframe"),
  $externalImgs: z.string().array().nullish().describe("External image to display as img"),
  stability: z
    .enum(SnowpackStability)
    .register(widgetRegistry, { class: "col-md-3", widget: "select", valueI18n: "snowpackStability.#" })
    .nullish()
    .describe("Snowpack stability that can be inferred from this observation"),
  $source: z.union([z.enum(ObservationSource), z.enum(ForecastSource)]).describe("Source of this observation"),
  $type: z
    .enum(ObservationType)
    .register(widgetRegistry, { class: "col-md-3", widget: "select", valueI18n: "observationType.#" })
    .describe("Type of this observation"),
  aspect: z
    .enum(Aspect)
    .register(widgetRegistry, { class: "col-md-3", widget: "aspect" })
    .nullish()
    .describe("Aspect corresponding with this observation"),
  authorName: z
    .string()
    .register(widgetRegistry, { class: "col-md-6", icon: "ph ph-user" })
    .nullish()
    .describe("Name of the author"),
  content: z
    .string()
    .register(widgetRegistry, { class: "col-12", widget: "textarea", icon: "ph ph-chat" })
    .nullish()
    .describe("Free-text content"),
  elevation: z
    .number()
    .register(widgetRegistry, { class: "col-md-2", icon: "ph ph-arrows-out-line-vertical" })
    .nullish()
    .describe("Elevation in meters"),
  elevationLowerBound: z
    .number()
    .register(widgetRegistry, { class: "col-md-2", icon: "ph ph-arrows-out-line-vertical" })
    .nullish()
    .describe("Lower bound of elevation in meters"),
  elevationUpperBound: z
    .number()
    .register(widgetRegistry, { class: "col-md-2", icon: "ph ph-arrows-out-line-vertical" })
    .nullish()
    .describe("Upper bound of elevation in meters"),
  eventDate: z.coerce
    .date()
    .register(widgetRegistry, { class: "col-md-3", icon: "ph ph-calendar" })
    .describe("Date when the event occurred"),
  locationName: z
    .string()
    .register(widgetRegistry, { class: "col-md-9", icon: "ph ph-globe" })
    .nullish()
    .describe("Location name"),
  latitude: z
    .number()
    .register(widgetRegistry, { class: "col-md-3", icon: "ph ph-map-pin" })
    .nullish()
    .describe("Location latitude (WGS 84)"),
  longitude: z
    .number()
    .register(widgetRegistry, { class: "col-md-3", icon: "ph ph-map-pin" })
    .nullish()
    .describe("Location longitude (WGS 84)"),
  region: z.string().nullish().describe("Micro-region code (computed from latitude/longitude)"),
  reportDate: z.coerce
    .date()
    .register(widgetRegistry, { class: "col-md-6", icon: "ph ph-pencil" })
    .nullish()
    .describe("Date when the observation has been reported"),
  dangerSource: z.uuid().register(widgetRegistry, { class: "col-md-6" }).nullish().describe("Danger source UUID"),
  avalancheProblems: z
    .enum(AvalancheProblem)
    .array()
    .register(widgetRegistry, { class: "col-md-6", widget: "avalancheProblem", valueI18n: "avalancheProblem.#" })
    .nullish()
    .nullable()
    .describe("Avalanche problem corresponding with this observation"),
  dangerPatterns: z
    .enum(DangerPattern)
    .array()
    .register(widgetRegistry, { class: "col-md-6", valueI18n: "dangerPattern.#" })
    .nullish()
    .nullable()
    .describe("Danger pattern corresponding with this observation"),
  importantObservations: z
    .enum(ImportantObservation)
    .array()
    .register(widgetRegistry, { class: "col-md-6", valueI18n: "importantObservation.#" })
    .nullish()
    .describe("Important observations"),
  personInvolvement: z
    .enum(PersonInvolvement)
    .register(widgetRegistry, { class: "col-md-3", widget: "select" })
    .nullish()
    .describe("Person involvement"),
});

// These fields do not apply to the dry-snowfall-level observation type, so hide them
// (and skip validating them) whenever `$type` is DrySnowfallLevel.
withShowIf(genericObservationSchema, {
  personInvolvement: (m) => m.$type !== ObservationType.DrySnowfallLevel,
  stability: (m) => m.$type !== ObservationType.DrySnowfallLevel,
  elevationLowerBound: (m) => m.$type !== ObservationType.DrySnowfallLevel,
  elevationUpperBound: (m) => m.$type !== ObservationType.DrySnowfallLevel,
  reportDate: (m) => m.$type !== ObservationType.DrySnowfallLevel,
  avalancheProblems: (m) => m.$type !== ObservationType.DrySnowfallLevel,
  dangerPatterns: (m) => m.$type !== ObservationType.DrySnowfallLevel,
  importantObservations: (m) => m.$type !== ObservationType.DrySnowfallLevel,
});

export const genericObservationWithIdSchema = genericObservationSchema.extend({ $id: z.string().min(1) });

export const partialGenericObservationSchema = genericObservationSchema.partial();

export type RawGenericObservation = z.infer<typeof genericObservationSchema>;

export type GenericObservation<Data = any> = z.infer<typeof genericObservationSchema> & {
  $data?: Data;
  /**
   * Additional information to display as table rows in the observation dialog
   */
  $extraDialogRows?: ObservationTableRow[];
  regionLabel?: string;
};

export function findExistingObservation(
  observations: GenericObservation[],
  observation: GenericObservation,
): GenericObservation | undefined {
  return observations.find((o) => o.$source === observation.$source && o.$id === observation.$id);
}
