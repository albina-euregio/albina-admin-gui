import { z } from "zod/v4";

import * as Enums from "../../enums/enums";

export const MetaInformationSchema = z.object({
  author: z.string(),
  authorAffiliation: z.string(),
  timestamp: z.coerce.date(),
});

export const GeneralInformationSchema = z.object({
  dateTime: z.coerce.date(),

  timeAccuracy: z.enum([
    "exact",
    "PT15M",
    "PT30M",
    "PT1H",
    "PT2H",
    "PT4H",
    "PT6H",
    "PT12H",
    "P1D",
    "P2D",
    "P3D",
    "unknown",
  ]),

  sourceOfInformation: z.array(
    z.enum([
      "PublicObservation",
      "AWSInternal",
      "AWSObserver",
      "DispatchCentre",
      "Police",
      "MountainRescue",
      // "Other [text]", // TODO
    ]),
  ),

  personInvolvement: z.enum(["Yes", "No", "Unknown"]),

  // TODO only use DamagedAssets?
  // otherDamages: z.enum(["Yes", "No"]),

  damagedAssets: z
    .enum([
      "Vehicle",
      "Forest",
      "Agriculture",
      "Livestock",
      "UtilitiesTechnicalInfrastructure",
      // "Other [text]", // TODO
    ])
    .array(),

  // [all warning services]; Outside AWS Forecast Area (default: Author affiliation (warning service of Author))
  publicAvalancheWarningService: z.string(),

  dangerRating: z.enum(Enums.DangerRating),

  avalancheProblem: z.enum(Enums.AvalancheProblem).array(),

  dangerPattern: z.enum(Enums.DangerPattern).array(),

  reportStatus: z.enum(["Draft", "Incomplete", "InReview", "Verified"]),

  externalLink: z.url().nullish(),

  generalInformationComment: z.string().nullish(),
});

export const LocationInformationSchema = z.object({
  // TODO Multilanguage?
  location: z.string(),
  country: z.string().nullish(),
  region: z.string().nullish(),
  // TODO Multilanguage?
  municipality: z.string().nullish(),
  avalancheRegion: z.string().nullish(),
  latitude: z.number(),
  longitude: z.number(),
  locationAccuracy: z.enum([
    "exact",
    "within15m",
    "within30m",
    "within100m",
    "within250m",
    "within500m",
    "within1km",
    "within2km",
    "within5km",
    "within10km",
    "within20km",
    "within50km",
    "unknown",
  ]),
  locationInformationComment: z.string().nullish(),
});

export const IncidentReportSchema = MetaInformationSchema.and(GeneralInformationSchema).and(LocationInformationSchema);

export type IncidentReport = z.infer<typeof IncidentReportSchema>;
