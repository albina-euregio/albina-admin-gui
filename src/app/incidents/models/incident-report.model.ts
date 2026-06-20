import { z } from "zod/v4";

import * as Enums from "../../enums/enums";
import { widgetRegistry } from "../../shared/zod-schema-form.widget-registry";
import { enumWithOther, not, withShowIf } from "../../shared/zod-util";

export const MetaInformationSchema = z.object({
  id: z.uuid().register(widgetRegistry, { widget: "none" }).nullish(),
  updatedAt: z.coerce.date().register(widgetRegistry, { widget: "none" }).nullish(),
  author: z.string(),
  authorAffiliation: z.string(),
});

export const GeneralInformationSchema = z.object({
  reportStatus: z.enum(["Draft", "Incomplete", "InReview", "Verified"]).register(widgetRegistry, { widget: "none" }),

  sourceOfInformation: z.array(
    enumWithOther(
      z.enum(["PublicObservation", "AWSInternal", "AWSObserver", "DispatchCentre", "Police", "MountainRescue"]),
    ),
  ),

  dateTime: z.coerce.date().register(widgetRegistry, { class: "col-5", public: true }),
  timeAccuracy: z
    .enum(["exact", "PT15M", "PT30M", "PT1H", "PT2H", "PT4H", "PT6H", "PT12H", "P1D", "P2D", "P3D", "unknown"])
    .register(widgetRegistry, { public: true }),

  location: z.string().register(widgetRegistry, { public: true }),
  latitude: z.number().register(widgetRegistry, { class: "col-6", public: true }),
  longitude: z.number().register(widgetRegistry, { class: "col-6", public: true }),
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
    .register(widgetRegistry, { public: true }),
  lineCoordinatesText: z.string().register(widgetRegistry, { widget: "textarea", class: "col-6" }).nullish(),
  polygonCoordinatesText: z.string().register(widgetRegistry, { widget: "textarea", class: "col-6" }).nullish(),
  country: z.string().register(widgetRegistry, { class: "col-6", public: true }).nullish(),
  region: z.string().register(widgetRegistry, { class: "col-6" }).nullish(),
  municipality: z.string().register(widgetRegistry, { class: "col-6" }).nullish(),
  avalancheRegion: z.string().register(widgetRegistry, { class: "col-6", public: true }).nullish(),

  generalInformationComment: z.string().register(widgetRegistry, { widget: "textarea" }).nullish(),
});

export const BulletinInformationSchema = z.object({
  // [all warning services]; Outside AWS Forecast Area (default: Author affiliation (warning service of Author))
  publicAvalancheWarningService: z.string().register(widgetRegistry, { public: true }),
  publicAvalancheWarningServiceOutside: z.boolean().nullish().describe("Outside AWS Forecast Area"),

  dangerRating: z
    .enum([
      Enums.DangerRating.no_snow,
      Enums.DangerRating.no_rating,
      Enums.DangerRating.low,
      Enums.DangerRating.moderate,
      Enums.DangerRating.considerable,
      Enums.DangerRating.high,
      Enums.DangerRating.very_high,
    ])
    .register(widgetRegistry, { widget: "dangerRating", public: true }),

  avalancheProblem: z
    .enum(Enums.AvalancheProblem)
    .array()
    .register(widgetRegistry, { widget: "avalancheProblem", public: true }),

  dangerPattern: z.enum(Enums.DangerPattern).array().register(widgetRegistry, { public: true }),

  bulletinInformationComment: z.string().register(widgetRegistry, { widget: "textarea" }).nullish(),
});
withShowIf(BulletinInformationSchema, {
  dangerRating: not("publicAvalancheWarningServiceOutside", true),
  avalancheProblem: [
    not("publicAvalancheWarningServiceOutside", true),
    not("dangerRating", Enums.DangerRating.no_rating, Enums.DangerRating.no_snow),
  ],
  dangerPattern: [
    not("publicAvalancheWarningServiceOutside", true),
    not("dangerRating", Enums.DangerRating.no_rating, Enums.DangerRating.no_snow),
  ],
});

const incidentTerrainType = z.enum(["FreeTerrain", "ControlledTerrainOpen", "ControlledTerrainClosed", "Unknown"]);
const incidentActivity = enumWithOther(
  z.enum([
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
  ]),
);
export const GroupInformationSchema = z.object({
  anonymousGroupIdentifier: z.string(),
  groupType: enumWithOther(
    z.enum(["RecreationalFamilyFriends", "Club", "Commercial", "Industrial", "Solo", "Unknown"]),
  ),
  groupSizeAccuracy: z
    .enum(["Exact", "Approximately", "AtLeast", "Unknown"])
    .register(widgetRegistry, { class: "col-6", public: true }),
  groupSize: z.number().register(widgetRegistry, { class: "col-6" }).nullish(),
  incidentTerrainType: incidentTerrainType.register(widgetRegistry, { public: true }),
  typeOfControlledTerrain: enumWithOther(
    z.enum(["IndoorInsideBuilding", "Street", "TrainTrack", "SkiAreaResort", "CrossCountryTrack", "SledgingTrack"]),
  ).nullish(),
  incidentActivity: incidentActivity.register(widgetRegistry, { public: true }),
  travelDirection: enumWithOther(
    z.enum([
      "Ascending",
      "Descending",
      "Stationary",
      "Traversing",
      "MovingOnPeaksRidges",
      "SnowmobileHighMarking",
      "CrossingRunouts",
    ]),
  ).nullish(),
  vehicleType: enumWithOther(z.enum(["Car", "Bus", "SnowPlower", "Snowcat"])),
  avalancheGear: z.enum(["All", "Some", "None", "Unknown"]),
  groupInformationComment: z.string().register(widgetRegistry, { widget: "textarea" }).nullish(),
});
withShowIf(GroupInformationSchema, {
  groupSize: not("groupSizeAccuracy", "Unknown"),
  typeOfControlledTerrain: ["incidentTerrainType", "ControlledTerrainOpen", "ControlledTerrainClosed"],
  incidentActivity: not("typeOfControlledTerrain", "IndoorInsideBuilding"),
  vehicleType: ["incidentActivity", "InsideVehicle"],
  travelDirection: [not("typeOfControlledTerrain", "IndoorInsideBuilding"), not("incidentActivity", "InsideVehicle")],
});
export type GroupInformation = z.infer<typeof GroupInformationSchema>;

export const InvolvementsFatalitiesBurialsSchema = z.object({
  numberOfGroups: z.number().register(widgetRegistry, { class: "col-6" }).nullish(),
  numberInvolved: z.number().register(widgetRegistry, { class: "col-6", public: true }).nullish(),
  incidentActivity: incidentActivity.array().register(widgetRegistry, { class: "col-6", public: true }).nullish(),
  incidentTerrainType: incidentTerrainType.array().register(widgetRegistry, { class: "col-6", public: true }).nullish(),
  fatalities: z.number().register(widgetRegistry, { class: "col-3", public: true }).nullish(),
  injuredSurvivors: z.number().register(widgetRegistry, { class: "col-3", public: true }).nullish(),
  uninjuredSurvivors: z.number().register(widgetRegistry, { class: "col-3", public: true }).nullish(),
  caughtOnly: z.number().register(widgetRegistry, { class: "col-3", public: true }).nullish(),
  fullyBuried: z.number().register(widgetRegistry, { class: "col-3", public: true }).nullish(),
  partlyBuriedHeadCovered: z.number().register(widgetRegistry, { class: "col-3" }).nullish(),
  partlyBuriedHeadUncovered: z.number().register(widgetRegistry, { class: "col-3" }).nullish(),
  partlyBuried: z.number().register(widgetRegistry, { class: "col-3", public: true }).nullish(),
});

export const VictimInformationSchema = z.object({
  anonymousVictimIdentifier: z.string().nullish(),
  anonymousGroupIdentifier: z.string(),
  age: z
    .enum(["UpTo13", "From14To20", "From21To30", "From31To40", "From41To50", "From51To60", "From61To70", "From71"])
    .register(widgetRegistry, { class: "col-6" })
    .nullish(),
  gender: z.enum(["Female", "Male", "Other"]).register(widgetRegistry, { class: "col-5" }).nullish(),
  country: enumWithOther(z.enum(["Austria", "Germany", "Italy", "Switzerland"])).nullish(), // TODO [standard country list] or just use "other" with free text
  workingAtTime: z.enum(["Yes", "No"]).register(widgetRegistry, { class: "col-6" }).nullish(),
  leaderAtTime: z.enum(["Yes", "No"]).register(widgetRegistry, { class: "col-6" }).nullish(),
  professionalCertification: enumWithOther(
    z.enum([
      "IFMGAGuide",
      "FullSkiGuide",
      "SkiInstructor",
      "ApprenticeGuide",
      "AvalancheProfessional",
      "AvalancheEducator",
    ]),
  ).nullish(),
  avalancheTraining: enumWithOther(z.enum(["None", "Awareness", "BasicREC", "AdvancedREC", "Professional"]))
    .register(widgetRegistry, { class: "col-6" })
    .nullish(),
  yearsActive: z
    .enum(["UpTo2Years", "From3To9Years", "From10Years"])
    .register(widgetRegistry, { class: "col-6" })
    .nullish(),
  transceiver: z
    .enum(["NoTransceiver", "TransceiverOn", "TransceiverOff"])
    .register(widgetRegistry, { class: "col-6" })
    .nullish(),
  shovel: z.enum(["Yes", "No"]).register(widgetRegistry, { class: "col-3" }).nullish(),
  probe: z.enum(["Yes", "No"]).register(widgetRegistry, { class: "col-3" }).nullish(),
  airbag: z
    .enum(["NoAirbag", "AirbagDeployed", "AirbagUndeployed"])
    .register(widgetRegistry, { class: "col-6" })
    .nullish(),
  helmet: z.enum(["Yes", "No"]).register(widgetRegistry, { class: "col-6" }).nullish(),
  caught: z.enum(["Involved", "NotInvolved", "Unknown"]).register(widgetRegistry, { class: "bg-person-injury" }),
  fatalInjured: z
    .enum(["Fatal", "Injured", "Uninjured", "Unknown"])
    .register(widgetRegistry, { class: "bg-person-injury" }),
  injurySeverity: z
    .enum(["Minor", "Moderate", "Major"])
    .register(widgetRegistry, { class: "bg-person-injury" })
    .nullish(),
  causeOfDeath: enumWithOther(z.enum(["Asphyxiation", "TraumaticInjury", "Hypothermia"]))
    .register(widgetRegistry, { class: "bg-person-injury" })
    .nullish(),
  estimatedTimeOfDeath: z
    .enum(["DuringTheAvalanche", "DuringBurial", "OnSiteAfterExtrication", "DuringTransport", "InHospital"])
    .register(widgetRegistry, { class: "bg-person-injury" })
    .nullish(),
  burialDegree: z
    .enum([
      "FullyBuried",
      "PartlyBuriedHeadCovered",
      "PartlyBuriedHeadUncovered",
      "PartlyBuried",
      "NotBuried",
      "Unknown",
    ])
    .register(widgetRegistry, { class: "bg-person-burial" }),
  burialDepth: z.number().register(widgetRegistry, { unit: "cm", class: "col-6 bg-person-burial" }).nullish(),
  burialDuration: z.number().register(widgetRegistry, { class: "col-6 bg-person-burial" }).nullish(),
  respiratoryCavity: z.enum(["Yes", "No"]).register(widgetRegistry, { class: "bg-person-burial" }).nullish(),
  terrainTrap: enumWithOther(
    z.enum(["None", "Cliff", "Trees", "Gully", "Depression", "Bench", "Boulder", "CrevasseOrBergschrund"]),
  )
    .register(widgetRegistry, { class: "bg-person-burial" })
    .nullish(),
  primaryLocationMethod: enumWithOther(
    z.enum([
      "NotBuried",
      "SelfExtraction",
      "VisualClues",
      "TransceiverProbeShovel",
      "SpotProbing",
      "ProbeLine",
      "Recco",
      "RescueDog",
      "Snowmelt",
    ]),
  )
    .register(widgetRegistry, { class: "bg-person-rescue" })
    .nullish(),
  rescuedBy: enumWithOther(z.enum(["Self", "Companion", "OtherGroup", "OrganizedRescue", "Unknown"]))
    .register(widgetRegistry, { class: "col-7 bg-person-rescue" })
    .nullish(),
  medicalIntervention: enumWithOther(z.enum(["CPR", "ALS", "ECMO"]))
    .register(widgetRegistry, { class: "col-5 bg-person-rescue" })
    .nullish(),
  victimInformationComment: z.string().register(widgetRegistry, { widget: "textarea" }).nullish(),
});
withShowIf(VictimInformationSchema, {
  fatalInjured: ["caught", "Involved", "Unknown"],
  terrainTrap: ["caught", "Involved"],
  burialDegree: ["caught", "Involved"],
  burialDepth: ["burialDegree", "PartlyBuriedHeadCovered", "FullyBuried"],
  burialDuration: ["burialDegree", "PartlyBuriedHeadCovered", "FullyBuried"],
  estimatedTimeOfDeath: ["fatalInjured", "Fatal"],
  causeOfDeath: ["fatalInjured", "Fatal"],
  respiratoryCavity: ["burialDegree", "PartlyBuriedHeadCovered", "FullyBuried"],
  injurySeverity: ["fatalInjured", "Injured"],
});
export type VictimInformation = z.infer<typeof VictimInformationSchema>;

const Trigger = z.enum(["natural", "person", "explosives", "vehicle", "unknown"]);
export const AvalancheInformationSchema = z.object({
  avalancheType: z.enum(Enums.IncidentAvalancheType).register(widgetRegistry, { public: true }),
  avalancheSize: z.enum(Enums.IncidentAvalancheSize).register(widgetRegistry, { public: true }),
  avalancheLength: z.number().register(widgetRegistry, { unit: "m", public: true }).nullish(),
  multipleAvalanches: z.enum(["Yes", "No"]).nullish(),
  startZoneAspect: z.enum(Enums.Aspect).register(widgetRegistry, {
    class: "col-6 bg-avalanche-start-zone",
    valueI18n: "aspect.#",
    widget: "aspect",
    public: true,
  }),
  startZoneAspectAccuracy: z
    .enum(["Accurate", "Uncertain"])
    .register(widgetRegistry, { class: "col-6 bg-avalanche-start-zone", public: true }),
  startZoneElevation: z
    .number()
    .register(widgetRegistry, { class: "col-6 bg-avalanche-start-zone", unit: "m", public: true }),
  startZoneElevationAccuracy: z
    .enum(["exact", "within50m", "within100m", "within200m", "unknown"])
    .register(widgetRegistry, { class: "col-6 bg-avalanche-start-zone", public: true }),
  startZoneIncline: z
    .number()
    .register(widgetRegistry, { class: "col-6 bg-avalanche-start-zone", unit: "°", public: true })
    .nullish(),
  startZoneMoisture: z
    .enum(["Dry", "Moist", "Wet", "Unknown"])
    .register(widgetRegistry, { class: "col-6 bg-avalanche-start-zone", public: true }),
  startZoneTerrainType: enumWithOther(
    z.enum([
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
    ]),
  )
    .array()
    .register(widgetRegistry, { class: "bg-avalanche-start-zone" })
    .nullish(),
  trigger: Trigger.register(widgetRegistry, { class: "bg-avalanche-trigger", public: true }).nullish(),
  natural: z
    .enum(["Natural", "CorniceFall", "Earthquake", "IceFall", "RockFall"])
    .register(widgetRegistry, { class: "bg-avalanche-trigger" })
    .nullish(),
  person: z
    .enum(["PersonAccidental", "PersonControlled"])
    .register(widgetRegistry, { class: "bg-avalanche-trigger" })
    .nullish(),
  additionalLoad: z.enum(["Low", "High"]).register(widgetRegistry, { class: "bg-avalanche-trigger" }).nullish(),
  explosives: enumWithOther(
    z.enum([
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
    ]),
  )
    .register(widgetRegistry, { class: "bg-avalanche-trigger" })
    .nullish(),
  vehicle: enumWithOther(z.enum(["OverSnowVehicle", "Snowmobile", "Helicopter"]))
    .register(widgetRegistry, { class: "bg-avalanche-trigger" })
    .nullish(),
  accidentalControlled: z
    .enum(["Accidental", "Controlled"])
    .register(widgetRegistry, { class: "bg-avalanche-trigger" })
    .nullish(),
  remoteTriggering: z
    .enum(["Yes", "No"])
    .register(widgetRegistry, { class: "bg-avalanche-trigger", public: true })
    .nullish(),
  bedSurfaceStepped: z.enum(["Yes", "No"]).register(widgetRegistry, { class: "bg-avalanche-trigger" }).nullish(),
  weakLayerName: z.string().register(widgetRegistry, { class: "bg-avalanche-weak-layer" }).nullish(),
  weakLayerGrainType1: z
    .enum(["PP", "PPgp", "DF", "RG", "FC", "FCxr", "DH", "SH", "MF", "MM"])
    .register(widgetRegistry, {
      class: "bg-avalanche-weak-layer col-8",
      valueI18n: "grainShape.#.code",
      widget: "grainShape",
      public: true,
    })
    .nullish(),
  weakLayerGrainSize1: z.number().register(widgetRegistry, { class: "bg-avalanche-weak-layer col-4" }).nullish(),
  weakLayerGrainType2: z
    .enum(["PP", "PPgp", "DF", "RG", "FC", "FCxr", "DH", "SH", "MF", "MM"])
    .register(widgetRegistry, {
      class: "bg-avalanche-weak-layer col-8",
      valueI18n: "grainShape.#.code",
      widget: "grainShape",
      public: true,
    })
    .nullish(),
  weakLayerGrainSize2: z.number().register(widgetRegistry, { class: "bg-avalanche-weak-layer col-4" }).nullish(),
  weakLayerLocation: z
    .enum(["WithinNewSnow", "AtInterfaceWithOldSnow", "WithinOldSnowpack", "NearTheGround"])
    .register(widgetRegistry, { class: "bg-avalanche-weak-layer", public: true })
    .nullish(),
  slabWidth: z.number().register(widgetRegistry, { unit: "m", class: "bg-avalanche-slab", public: true }).nullish(),
  crownDepthAvg: z
    .number()
    .register(widgetRegistry, { unit: "cm", class: "col-4 bg-avalanche-slab", public: true })
    .nullish(),
  crownDepthMin: z.number().register(widgetRegistry, { unit: "cm", class: "col-4 bg-avalanche-slab" }).nullish(),
  crownDepthMax: z.number().register(widgetRegistry, { unit: "cm", class: "col-4 bg-avalanche-slab" }).nullish(),
  debrisType: enumWithOther(z.enum(["Fine", "Blocks", "Hard", "Soft", "Rocks", "Trees"]))
    .array()
    .register(widgetRegistry, { class: "col-6  bg-avalanche-deposit" })
    .nullish(),
  depositElevation: z.string().register(widgetRegistry, { class: "col-6 bg-avalanche-deposit", unit: "m" }).nullish(),
  depositHeight: z.string().register(widgetRegistry, { class: "col-6 bg-avalanche-deposit", unit: "cm" }).nullish(),
  depositWidth: z.string().register(widgetRegistry, { class: "col-6 bg-avalanche-deposit", unit: "m" }).nullish(),
  depositMoisture: z
    .enum(["Dry", "Moist", "Wet"])
    .register(widgetRegistry, { class: "col-6 bg-avalanche-deposit" })
    .nullish(),
  debrisDensity: z.string().register(widgetRegistry, { class: "col-6  bg-avalanche-deposit", unit: "kg/m³" }).nullish(),
  relevantAvalancheProblem: z
    .enum(Enums.AvalancheProblem)
    .register(widgetRegistry, {
      valueI18n: "avalancheProblem.#",
      widget: "avalancheProblem",
      class: "bg-avalanche-communication",
      public: true,
    })
    .nullish(),
  relevantDangerPattern: z
    .enum(Enums.DangerPattern)
    .array()
    .register(widgetRegistry, { valueI18n: "dangerPattern.#", class: "bg-avalanche-communication" }),
  avalancheDetailsComment: z.string().register(widgetRegistry, { widget: "textarea" }).nullish(),
});
const slabGlide = [Enums.IncidentAvalancheType.slab, Enums.IncidentAvalancheType.glide] as const;
withShowIf(AvalancheInformationSchema, {
  natural: ["trigger", "natural"],
  person: ["trigger", "person"],
  additionalLoad: ["trigger", "person"],
  explosives: ["trigger", "explosives"],
  vehicle: ["trigger", "vehicle"],
  accidentalControlled: ["trigger", "vehicle"],
  remoteTriggering: ["avalancheType", Enums.IncidentAvalancheType.slab],
  slabWidth: ["avalancheType", ...slabGlide],
  crownDepthAvg: ["avalancheType", ...slabGlide],
  crownDepthMin: ["avalancheType", ...slabGlide],
  crownDepthMax: ["avalancheType", ...slabGlide],
});

export const OtherDamagesSchema = z.object({
  otherDamages: z.enum(["Yes", "No"]).register(widgetRegistry, { public: true }),

  damagedAssets: enumWithOther(
    z.enum(["Vehicle", "Forest", "Agriculture", "Livestock", "UtilitiesTechnicalInfrastructure"]),
  ).array(),

  otherDamagesComment: z.string().register(widgetRegistry, { widget: "textarea" }).nullish(),
});
withShowIf(OtherDamagesSchema, {
  damagedAssets: ["otherDamages", "Yes"],
  otherDamagesComment: ["otherDamages", "Yes"],
});

export const IncidentAnalysisSchema = z.object({
  recentSlabAvalanches: z.enum(["Present", "Absent", "Unknown"]).nullish(),
  signsOfInstability: z.enum(["Present", "Absent", "Unknown"]).nullish(),
  recentLoading: z.enum(["Present", "Absent", "Unknown"]).nullish(),
  criticalWarming: z.enum(["Present", "Absent", "Unknown"]).nullish(),
  incidentLedePublic: z.boolean().nullish(),
  incidentLede: z.string().register(widgetRegistry, { widget: "rich-text" }).nullish(),
  incidentDescriptionPublic: z.boolean().nullish(),
  incidentDescription: z.string().register(widgetRegistry, { widget: "rich-text" }).nullish(),
  weatherDescriptionPublic: z.boolean().nullish(),
  weatherDescription: z.string().register(widgetRegistry, { widget: "rich-text" }).nullish(),
  avalancheDescriptionPublic: z.boolean().nullish(),
  avalancheDescription: z.string().register(widgetRegistry, { widget: "rich-text" }).nullish(),
  snowpackDescriptionPublic: z.boolean().nullish(),
  snowpackDescription: z.string().register(widgetRegistry, { widget: "rich-text" }).nullish(),
  takeAwaysPublic: z.boolean().nullish(),
  takeAways: z.string().register(widgetRegistry, { widget: "rich-text" }).nullish(),
  incidentAnalysisComment: z.string().register(widgetRegistry, { widget: "textarea" }).nullish(),
});

export const IncidentLinksSchema = z.object({
  publicExternalLinks: z.string().register(widgetRegistry, { widget: "textarea" }).nullish(),
  privateExternalLinks: z.string().register(widgetRegistry, { widget: "textarea" }).nullish(),
  privateExternalDatabaseLinks: z.string().register(widgetRegistry, { widget: "textarea" }).nullish(),
});

export const IncidentAttachmentSchema = z.object({
  id: z.uuid().register(widgetRegistry, { widget: "none" }).nullish(),
  dateAdded: z.coerce.date().register(widgetRegistry, { widget: "none" }),
  file: z.file().register(widgetRegistry, { widget: "none" }).nullish(),
  fileName: z.string().register(widgetRegistry, { widget: "none" }).nullish(),
  mediaType: z.string().register(widgetRegistry, { widget: "none" }).nullish(),
  dateCreated: z.coerce.date().register(widgetRegistry, { widget: "date" }),
  credit: z.string(),
  caption: z.string().nullish(),
  altText: z.string().nullish(),
  public: z.boolean().nullish(),
  attachmentCategory: z.enum(["Incident", "Avalanche", "Snowpack", "Group", "Person", "Weather"]).nullish(),
  attachmentTags: enumWithOther(z.enum(["Picture", "PoliceReport", "MedicalReport"]))
    .array()
    .nullish(),
});
export type IncidentAttachment = z.infer<typeof IncidentAttachmentSchema>;

export const IncidentReportSchema = z.object({
  ...MetaInformationSchema.shape,
  ...GeneralInformationSchema.shape,
  ...BulletinInformationSchema.shape,
  ...AvalancheInformationSchema.shape,
  personInvolvement: z.enum(["Yes", "No", "Unknown"]).register(widgetRegistry, { public: true }),
  ...OtherDamagesSchema.shape,
  groupInformation: GroupInformationSchema.array(),
  victimInformation: VictimInformationSchema.array(),
  ...IncidentAnalysisSchema.shape,
  ...IncidentLinksSchema.shape,
  attachments: IncidentAttachmentSchema.array(),
});

export const PartialIncidentReportSchema = IncidentReportSchema.partial().extend({
  groupInformation: GroupInformationSchema.partial().array(),
  victimInformation: VictimInformationSchema.partial().array(),
  attachments: IncidentAttachmentSchema.partial().array(),
});

export type IncidentReport = z.infer<typeof IncidentReportSchema>;
export type PartialIncidentReport = z.infer<typeof PartialIncidentReportSchema>;
