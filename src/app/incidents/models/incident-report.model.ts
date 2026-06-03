import { z } from "zod/v4";

import * as Enums from "../../enums/enums";
import { widgetRegistry } from "../../shared/zod-schema-form.widget-registry";

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

  // [all warning services]; Outside AWS Forecast Area (default: Author affiliation (warning service of Author))
  publicAvalancheWarningService: z.string(),

  dangerRating: z.enum(Enums.DangerRating),

  avalancheProblem: z.enum(Enums.AvalancheProblem).array(),

  dangerPattern: z.enum(Enums.DangerPattern).array(),

  reportStatus: z.enum(["Draft", "Incomplete", "InReview", "Verified"]),

  externalLink: z.url().nullish(),

  generalInformationComment: z.string().register(widgetRegistry, { widget: "textarea" }).nullish(),
});

export const LocationInformationSchema = z.object({
  // TODO Multilanguage?
  location: z.string(),
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
  lineCoordinatesText: z.string().register(widgetRegistry, { widget: "textarea" }).nullish(),
  polygonCoordinatesText: z.string().register(widgetRegistry, { widget: "textarea" }).nullish(),
  country: z.string().nullish(),
  region: z.string().nullish(),
  // TODO Multilanguage?
  municipality: z.string().nullish(),
  avalancheRegion: z.string().nullish(),
  locationInformationComment: z.string().register(widgetRegistry, { widget: "textarea" }).nullish(),
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
  groupSize: z.number().nullish(),
  groupSizeUnknown: z.boolean().default(false),
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
  groupInformationComment: z.string().register(widgetRegistry, { widget: "textarea" }).nullish(),
});
export type GroupInformation = z.infer<typeof GroupInformationSchema>;

export const InvolvementsFatalitiesBurialsSchema = z.object({
  numberOfGroups: z.number().nullish(),
  activities: z.string().nullish(),
  terrainTypes: z.string().nullish(),
  fatalities: z.number().nullish(),
  injuredSurvivors: z.number().nullish(),
  uninjuredSurvivors: z.number().nullish(),
  caughtOnly: z.number().nullish(),
  fullyBuried: z.number().nullish(),
  partlyBuriedHeadCovered: z.number().nullish(),
  partlyBuriedHeadUncovered: z.number().nullish(),
  partlyBuried: z.number().nullish(),
  numberInvolved: z.number().nullish(),
  involvementsFatalitiesBurialsComment: z.string().register(widgetRegistry, { widget: "textarea" }).nullish(),
});

export const VictimInformationSchema = z.object({
  anonymousVictimIdentifier: z.string(),
  anonymousGroupIdentifier: z.string(),
  caught: z.enum(["Involved", "NotInvolved", "Unknown"]),
  fatalInjured: z.enum(["Fatal", "Injured", "Uninjured", "Unknown"]),
  burialDegree: z.enum([
    "FullyBuried",
    "PartlyBuriedHeadCovered",
    "PartlyBuriedHeadUncovered",
    "PartlyBuried",
    "NotBuried",
    "Unknown",
  ]),
  age: z.enum(["UpTo13", "From14To20", "From21To30", "From31To40", "From41To50", "From51To60", "From61To70", "From71"]),
  gender: z.enum(["Female", "Male", "Other"]),
  country: z.enum(["Austria", "Germany", "Italy", "Switzerland"]), // TODO [standard country list]
  workingAtTime: z.enum(["Yes", "No"]),
  leaderAtTime: z.enum(["Yes", "No"]),
  professionalCertification: z.enum([
    "IFMGAGuide",
    "FullSkiGuide",
    "AvalancheProfessional",
    "AvalancheEducator",
    // "Other [text]",
  ]),
  avalancheTraining: z.enum([
    "None",
    "Awareness",
    "BasicREC",
    "AdvancedREC",
    "Professional",
    // "Other [text]"
  ]),
  yearsActive: z.enum(["UpTo2Years", "From3To9Years", "From10Years"]),
  transceiver: z.enum(["NoTransceiver", "TransceiverOn", "TransceiverOff"]),
  shovel: z.enum(["Yes", "No"]),
  probe: z.enum(["Yes", "No"]),
  airbag: z.enum(["NoAirbag", "AirbagDeployed", "AirbagUndeployed"]),
  helmet: z.enum(["Yes", "No"]),
  terrainTrap: z.enum([
    "None",
    "Cliff",
    "Trees",
    "Gully",
    "Depression",
    "Bench",
    "Boulder",
    "CrevasseOrBergschrund",
    // "Other [text]",
  ]),
  burialDepth: z.number().register(widgetRegistry, { unit: "cm" }).nullish(),
  burialDuration: z.string().register(widgetRegistry, { unit: "dd:hh:mm" }).nullish(),
  primaryLocationMethod: z.enum([
    "NotBuried",
    "SelfExtraction",
    "VisualClues",
    "TransceiverProbeShovel",
    "SpotProbing",
    "ProbeLine",
    "Recco",
    "RescueDog",
    "Snowmelt",
    // "Other [text]",
  ]),
  rescuedBy: z.enum([
    "Self",
    "Companion",
    "OtherGroup",
    "OrganizedRescue",
    "Unknown",
    // "Other[text]"
  ]),
  medicalIntervention: z.enum([
    "CPR",
    "ALS",
    "ECMO",
    // "Other [text]"
  ]),
  estimatedTimeOfDeath: z.enum([
    "DuringTheAvalanche",
    "DuringBurial",
    "OnSiteAfterExtrication",
    "DuringTransport",
    "InHospital",
  ]),
  causeOfDeath: z.enum([
    "Asphyxiation",
    "TraumaticInjury",
    "Hypothermia",
    // "Other[text]"
  ]),
  respiratoryCavity: z.enum(["Yes", "No"]),
  injurySeverity: z.enum(["Minor", "Moderate", "Major"]),
  victimInformationComment: z.string().register(widgetRegistry, { widget: "textarea" }).nullish(),
});
export type VictimInformation = z.infer<typeof VictimInformationSchema>;

const Trigger = z.enum(["natural", "person", "explosives", "vehicle", "unknown"]);
export const AvalancheInformationSchema = z.object({
  multipleAvalanches: z.enum(["Yes", "No"]).nullish(),
  avalancheSize: z.enum(Enums.IncidentAvalancheSize),
  avalancheType: z.enum(Enums.IncidentAvalancheType),
  relevantAvalancheProblem: z
    .enum(Enums.AvalancheProblem)
    .register(widgetRegistry, { valueI18n: "avalancheProblem.#" })
    .nullish(),
  trigger: Trigger.nullish(),
  natural: z
    .enum(["Natural", "CorniceFall", "Earthquake", "IceFall", "RockFall"])
    .register(widgetRegistry, { showIf: ["trigger", Trigger.def.entries.natural] })
    .nullish(),
  person: z
    .enum(["PersonAccidental", "PersonControlled"])
    .register(widgetRegistry, { showIf: ["trigger", Trigger.def.entries.person] })
    .nullish(),
  additionalLoad: z
    .enum(["High", "Low"])
    .register(widgetRegistry, { showIf: ["trigger", Trigger.def.entries.person] })
    .nullish(),
  explosives: z
    .enum([
      "Artillery",
      "CaseCharge",
      "CorniceControlledByExplosives",
      "HelicopterDeployedGasExploder",
      "HandThrownOrPlaced",
      "GasExploder",
      "HelicopterBomb",
      "Avalauncher",
      "PrePlacedRemotelyDetonated",
      "TramOrRopewayDelivery",
      // "Other [text]",
    ])
    .register(widgetRegistry, { showIf: ["trigger", Trigger.def.entries.explosives] })
    .nullish(),
  vehicle: z
    .enum([
      "OverSnowVehicle",
      "Snowmobile",
      "Helicopter",
      // "Other [text]",
    ])
    .register(widgetRegistry, { showIf: ["trigger", Trigger.def.entries.vehicle] })
    .nullish(),
  accidentalControlled: z
    .enum(["Accidental", "Controlled"])
    .register(widgetRegistry, { showIf: ["trigger", Trigger.def.entries.vehicle] })
    .nullish(),
  remoteTriggering: z
    .enum(["Yes", "No"])
    .register(widgetRegistry, { showIf: ["avalancheType", Enums.IncidentAvalancheType.slab] })
    .nullish(),
  startZoneAspect: z.enum(Enums.Aspect).register(widgetRegistry, { valueI18n: "aspect.#" }),
  startZoneAspectAccuracy: z.enum(["Accurate", "Uncertain"]),
  startZoneElevation: z.number().register(widgetRegistry, { unit: "m" }),
  startZoneElevationAccuracy: z.enum(["exact", "within50m", "within100m", "within200m", "unknown"]),
  startZoneIncline: z.number().register(widgetRegistry, { unit: "°" }).nullish(),
  startZoneTerrainType: z
    .enum([
      "AlpineBowl",
      "Couloir",
      "NearRidgeCrest",
      "SparselyTreed",
      "OpenForest",
      "DenseForest",
      "ForestGlade",
      "Glacier",
      "OpenSlope",
      "Ridge",
      "ExtremeRockyTerrain",
      "BaseOfRockFace",
      "WoodPath",
      "LeewardSlope",
      "WindwardSlope",
      "IceWaterfall",
      // "Other [text]",
    ])
    .array()
    .nullish(),
  slabWidth: z
    .number()
    .register(widgetRegistry, {
      showIf: ["avalancheType", Enums.IncidentAvalancheType.slab, Enums.IncidentAvalancheType.glide],
      unit: "m",
    })
    .nullish(),
  crownDepthAvg: z
    .number()
    .register(widgetRegistry, {
      showIf: ["avalancheType", Enums.IncidentAvalancheType.slab, Enums.IncidentAvalancheType.glide],
      unit: "cm",
    })
    .nullish(),
  crownDepthMin: z
    .number()
    .register(widgetRegistry, {
      showIf: ["avalancheType", Enums.IncidentAvalancheType.slab, Enums.IncidentAvalancheType.glide],
      unit: "cm",
    })
    .nullish(),
  crownDepthMax: z
    .number()
    .register(widgetRegistry, {
      showIf: ["avalancheType", Enums.IncidentAvalancheType.slab, Enums.IncidentAvalancheType.glide],
      unit: "cm",
    })
    .nullish(),
  avalancheLength: z.number().register(widgetRegistry, { unit: "m" }).nullish(),
  weakLayerName: z.string().nullish(),
  weakLayerGrainType1: z
    .enum(["PP", "PPgp", "DF", "RG", "FC", "FCxr", "DH", "SH", "MF", "MM"])
    .register(widgetRegistry, { valueI18n: "grainShape.#.code" })
    .nullish(),
  weakLayerGrainType2: z
    .enum(["PP", "PPgp", "DF", "RG", "FC", "FCxr", "DH", "SH", "MF", "MM"])
    .register(widgetRegistry, { valueI18n: "grainShape.#.code" })
    .nullish(),
  weakLayerGrainSize1: z.number().nullish(),
  weakLayerGrainSize2: z.number().nullish(),
  weakLayerLocation: z
    .enum(["WithinNewSnow", "AtInterfaceWithOldSnow", "WithinOldSnowpack", "NearTheGround"])
    .nullish(),
  bedSurfaceStepped: z.enum(["Yes", "No"]).nullish(),
  avalancheMoistureStartZone: z.enum(["Dry", "Moist", "Wet", "Unknown"]),
  avalancheMoistureDeposit: z.enum(["Dry", "Moist", "Wet"]).nullish(),
  depositHeight: z.string().register(widgetRegistry, { unit: "cm" }).nullish(),
  depositWidth: z.string().register(widgetRegistry, { unit: "m" }).nullish(),
  debrisType: z
    .enum([
      "Fine",
      "Blocks",
      "Hard",
      "Soft",
      "Rocks",
      "Trees",
      // "Other [text]"
    ])
    .array()
    .nullish(),
  debrisDensity: z.string().register(widgetRegistry, { unit: "kg/m³" }).nullish(),
  depositElevation: z.string().register(widgetRegistry, { unit: "m" }).nullish(),
  avalancheDetailsComment: z.string().register(widgetRegistry, { widget: "textarea" }).nullish(),
});

export const OtherDamagesSchema = z.object({
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
    .register(widgetRegistry, { showIf: ["otherDamages", "Yes"] })
    .nullish(),
});

export const IncidentAnalysisSchema = z.object({
  incidentLede: z.string().register(widgetRegistry, { widget: "rich-text" }).nullish(),
  incidentDescription: z.string().register(widgetRegistry, { widget: "rich-text" }).nullish(),
  weatherDescription: z.string().register(widgetRegistry, { widget: "rich-text" }).nullish(),
  avalancheDescription: z.string().register(widgetRegistry, { widget: "rich-text" }).nullish(),
  snowpackDescription: z.string().register(widgetRegistry, { widget: "rich-text" }).nullish(),
  recentSlabAvalanches: z.string().nullish(),
  signsOfInstability: z.enum(["Present", "Absent", "Unknown"]).nullish(),
  recentLoading: z.enum(["Present", "Absent", "Unknown"]).nullish(),
  criticalWarming: z.enum(["Present", "Absent", "Unknown"]).nullish(),
  takeAways: z.string().register(widgetRegistry, { widget: "rich-text" }).nullish(),
  analysisStatus: z.enum(["Empty", "Draft", "Review", "Publish"]).nullish(),
  incidentAnalysisComment: z.string().nullish(),
});

export const IncidentReportSchema = z.object({
  ...MetaInformationSchema.shape,
  ...GeneralInformationSchema.shape,
  ...LocationInformationSchema.shape,
  ...AvalancheInformationSchema.shape,
  personInvolvement: z.enum(["Yes", "No", "Unknown"]),
  ...InvolvementsFatalitiesBurialsSchema.shape,
  ...OtherDamagesSchema.shape,
  groupInformation: GroupInformationSchema.array(),
  victimInformation: VictimInformationSchema.array(),
  ...IncidentAnalysisSchema.shape,
});

export const PartialIncidentReportSchema = IncidentReportSchema.partial().extend({
  timestamp: z.coerce.date(),
  groupInformation: GroupInformationSchema.partial().array(),
});

export type IncidentReport = z.infer<typeof IncidentReportSchema>;
