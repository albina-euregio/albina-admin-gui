import { Aspect, AvalancheProblem, DangerPattern, SnowpackStability } from "../../enums/enums";
import { z } from "zod";

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

export function imageCountString(images: any[] | undefined) {
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

export function degreeToAspect(degree: number): Aspect {
  const aspects = Object.values(Aspect);
  const n = (Math.round((degree * 8) / 360) + 8) % 8;
  return aspects[n];
}

// https://transform.tools/typescript-to-zod
export const genericObservationSchema = z.object({
  $data: z.any().describe("Additional data (e.g. original data stored when fetching from external API)"),
  $id: z.string().optional().nullable().describe("External ID of this observations"),
  $allowEdit: z.boolean().default(false),
  $deleted: z.boolean().default(false),
  $externalURL: z.string().optional().nullable().describe("External URL to display as iframe"),
  $externalImgs: z.array(z.string()).optional().nullable().describe("External image to display as img"),
  stability: z
    .nativeEnum(SnowpackStability)
    .optional()
    .nullable()
    .describe("Snowpack stability that can be inferred from this observation"),
  $source: z
    .union([z.nativeEnum(ObservationSource), z.nativeEnum(ForecastSource)])
    .describe("Source of this observation"),
  $type: z.nativeEnum(ObservationType).describe("Type of this observation"),
  aspect: z.nativeEnum(Aspect).optional().nullable().describe("Aspect corresponding with this observation"),
  authorName: z.string().optional().nullable().describe("Name of the author"),
  content: z.string().optional().nullable().describe("Free-text content"),
  elevation: z.number().optional().nullable().describe("Elevation in meters"),
  elevationLowerBound: z.number().optional().nullable().describe("Lower bound of elevation in meters"),
  elevationUpperBound: z.number().optional().nullable().describe("Upper bound of elevation in meters"),
  eventDate: z.coerce.date().describe("Date when the event occurred"),
  locationName: z.string().optional().nullable().describe("Location name"),
  latitude: z.number().optional().nullable().describe("Location latitude (WGS 84)"),
  longitude: z.number().optional().nullable().describe("Location longitude (WGS 84)"),
  region: z.string().optional().nullable().describe("Micro-region code (computed from latitude/longitude)"),
  reportDate: z.coerce.date().optional().nullable().describe("Date when the observation has been reported"),
  dangerSource: z.string().uuid().optional().nullable().describe("Danger source UUID"),
  avalancheProblems: z
    .array(z.nativeEnum(AvalancheProblem))
    .optional()
    .nullable()
    .describe("Avalanche problem corresponding with this observation"),
  dangerPatterns: z
    .array(z.nativeEnum(DangerPattern))
    .optional()
    .nullable()
    .describe("Danger pattern corresponding with this observation"),
  importantObservations: z
    .array(z.nativeEnum(ImportantObservation))
    .optional()
    .nullable()
    .describe("Important observations"),
  personInvolvement: z.nativeEnum(PersonInvolvement).optional().nullable().describe("Person involvement"),
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
