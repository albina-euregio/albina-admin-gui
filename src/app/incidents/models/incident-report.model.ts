import { z } from "zod/v4";

import * as Enums from "../../enums/enums";
import { widgetRegistry } from "../../shared/widget-registry";

export const MetaInformationSchema = z.object({
  author: z.string(),
  authorAffiliation: z.string(),
  timestamp: z.coerce.date(),
});

export const GeneralInformationSchema = z.object({
  dateTime: z.coerce.date(),

  timeAccuracy: z
    .enum(["exact", "PT15M", "PT30M", "PT1H", "PT2H", "PT4H", "PT6H", "PT12H", "P1D", "P2D", "P3D", "unknown"])
    .register(widgetRegistry, { widget: "slider" }),

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

  otherDamages: z.enum(["Yes", "No"]),

  damagedAssets: z
    .enum([
      "Vehicle",
      "Forest",
      "Agriculture",
      "Livestock",
      "UtilitiesTechnicalInfrastructure",
      // "Other [text]", // TODO
    ])
    .array()
    .register(widgetRegistry, { showIf: ["otherDamages", "Yes"] }),

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
  locationAccuracy: z
    .enum([
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
    ])
    .register(widgetRegistry, { widget: "slider" }),
  locationInformationComment: z.string().nullish(),
});

export const GroupInformationSchema = z.object({
  anonymousGroupIdentifier: z.string(),
  groupType: z.enum([
    "RecreationalFamilyFriends",
    "Club",
    "Commercial",
    "Industrial",
    "Solo",
    // "Other [text]", // TODO
    "Unknown",
  ]),
  groupSize: z.number().default(0),
  // TODO unknown => groupSize=0
  // groupSizeUnknown: z.string(),
  incidentTerrainType: z.enum(["FreeTerrain", "ControlledTerrainOpen", "ControlledTerrainClosed", "Unknown"]),
  typeOfControlledTerrain: z
    .enum([
      "IndoorInsideBuilding",
      "Street",
      "TrainTrack",
      "SkiAreaResort",
      "CrossCountryTrack",
      "SledgingTrack",
      // "Other [text]", // TODO
    ])
    .nullish(),
  incidentActivity: z.enum([
    "Touring",
    "Freeriding",
    "SkiingSnowboarding",
    "Snowmobiling",
    "Mountaineering",
    "IceClimbing",
    "Snowshoeing",
    "HikingOnFoot",
    "CrossCountrySkiing",
    "HuntingFishing",
    "Sledging",
    "Snowbiking",
    "Biking",
    "InsideVehicle",
    "Unknown",
    // "Other [text] ", // TODO
  ]),
  travelDirection: z
    .enum([
      "Ascending",
      "Descending",
      "Stationary",
      "Traversing",
      "MovingOnPeaksRidges",
      "SnowmobileHighMarking",
      "CrossingRunouts",
      // "Other [text]", // TODO
    ])
    .nullish(),
  vehicleType: z.enum([
    "Car",
    "Bus",
    "SnowPlower",
    "Snowcat",
    // "Other [text]" // TODO
  ]),
  avalancheGear: z.enum(["All", "Some", "None", "Unknown"]),
  groupInformationComment: z.string().nullish(),
});
export type GroupInformation = z.infer<typeof GroupInformationSchema>;

export const IncidentReportSchema = z.object({
  ...MetaInformationSchema.shape,
  ...GeneralInformationSchema.shape,
  ...LocationInformationSchema.shape,
  groupInformation: GroupInformationSchema.array(),
});

export const PartialIncidentReportSchema = IncidentReportSchema.partial().extend({
  groupInformation: GroupInformationSchema.partial().array(),
});

export type IncidentReport = z.infer<typeof IncidentReportSchema>;
