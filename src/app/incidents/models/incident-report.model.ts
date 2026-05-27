import { z } from "zod/v4";

import * as Enums from "../../enums/enums";

const GeneralInformation = z.object({
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

  // TODO array?
  externalLink: z.url(),

  generalInformationComment: z.string(),
});

// Location	YES	YES	Text Multilanguage
// Municipality	NO	NO	Text Multilanguage

export const IncidentReportSchema = GeneralInformation;

export type IncidentReport = z.infer<typeof IncidentReportSchema>;
