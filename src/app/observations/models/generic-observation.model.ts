import { Aspect, AvalancheProblem, DangerPattern, SnowpackStability } from "../../enums/enums";
import { z } from "zod/v4";

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
  LoLaKronos = "LoLaKronos",
  Snobs = "Snobs",
  WikisnowECT = "WikisnowECT",
  FotoWebcamsEU = "FotoWebcamsEU",
  Panomax = "Panomax",
  RasBzIt = "RasBzIt",
  PanoCloud = "PanoCloud",
}

export enum ForecastSource {
  alpsolut_profile = "alpsolut_profile",
  meteogram = "meteogram",
  multimodel = "multimodel",
  observed_profile = "observed_profile",
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
        ...(o.$data || {}),
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
  observations.sort((a, b) => (a.eventDate?.getTime() || 0) - (b.eventDate?.getTime() || 0));

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
  $id: z.string().nullish().nullable().describe("External ID of this observations"),
  $allowEdit: z.boolean().default(false),
  $deleted: z.boolean().default(false),
  $externalURL: z.string().nullish().nullable().describe("External URL to display as iframe"),
  $externalImgs: z.array(z.string()).nullish().nullable().describe("External image to display as img"),
  stability: z
    .enum(SnowpackStability)
    .nullish()
    .nullable()
    .describe("Snowpack stability that can be inferred from this observation"),
  $source: z.union([z.enum(ObservationSource), z.enum(ForecastSource)]).describe("Source of this observation"),
  $type: z.enum(ObservationType).describe("Type of this observation"),
  aspect: z.enum(Aspect).nullish().nullable().describe("Aspect corresponding with this observation"),
  authorName: z.string().nullish().nullable().describe("Name of the author"),
  content: z.string().nullish().nullable().describe("Free-text content"),
  elevation: z.number().nullish().nullable().describe("Elevation in meters"),
  elevationLowerBound: z.number().nullish().nullable().describe("Lower bound of elevation in meters"),
  elevationUpperBound: z.number().nullish().nullable().describe("Upper bound of elevation in meters"),
  eventDate: z.coerce.date().describe("Date when the event occurred"),
  locationName: z.string().nullish().nullable().describe("Location name"),
  latitude: z.number().nullish().nullable().describe("Location latitude (WGS 84)"),
  longitude: z.number().nullish().nullable().describe("Location longitude (WGS 84)"),
  region: z.string().nullish().nullable().describe("Micro-region code (computed from latitude/longitude)"),
  reportDate: z.coerce.date().nullish().nullable().describe("Date when the observation has been reported"),
  dangerSource: z.string().uuid().nullish().nullable().describe("Danger source UUID"),
  avalancheProblems: z
    .array(z.enum(AvalancheProblem))
    .nullish()
    .nullable()
    .describe("Avalanche problem corresponding with this observation"),
  dangerPatterns: z
    .array(z.enum(DangerPattern))
    .nullish()
    .nullable()
    .describe("Danger pattern corresponding with this observation"),
  importantObservations: z.array(z.enum(ImportantObservation)).nullish().nullable().describe("Important observations"),
  personInvolvement: z.enum(PersonInvolvement).nullish().nullable().describe("Person involvement"),
});

export const genericObservationWithIdSchema = genericObservationSchema.extend({ $id: z.string().min(1) });

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
