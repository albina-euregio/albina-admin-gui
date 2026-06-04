import { z } from "zod/v4";

import * as Enums from "../../enums/enums";
import { widgetRegistry } from "../../shared/zod-schema-form.widget-registry";
import { enumWithOther } from "../../shared/zod-util";

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
    enumWithOther(
      z.enum(["PublicObservation", "AWSInternal", "AWSObserver", "DispatchCentre", "Police", "MountainRescue"]),
    ),
  ),

  // [all warning services]; Outside AWS Forecast Area (default: Author affiliation (warning service of Author))
  publicAvalancheWarningService: z.string(),

  dangerRating: z.enum(Enums.DangerRating),

  avalancheProblem: z.enum(Enums.AvalancheProblem).array(),

  dangerPattern: z.enum(Enums.DangerPattern).array(),

  reportStatus: z.enum(["Draft", "Incomplete", "InReview", "Verified"]).register(widgetRegistry, { widget: "none" }),

  publicExternalLinks: z.string().register(widgetRegistry, { widget: "textarea" }).nullish(),

  privateExternalLinks: z.string().register(widgetRegistry, { widget: "textarea" }).nullish(),

  privateExternalDatabaseLinks: z.string().register(widgetRegistry, { widget: "textarea" }).nullish(),

  generalInformationComment: z.string().register(widgetRegistry, { widget: "textarea" }).nullish(),
});

export const LocationInformationSchema = z.object({
  location: z.string(),
  latitude: z.number().register(widgetRegistry, { class: "col-6" }),
  longitude: z.number().register(widgetRegistry, { class: "col-6" }),
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
  municipality: z.string().nullish(),
  avalancheRegion: z.string().nullish(),
  locationInformationComment: z.string().register(widgetRegistry, { widget: "textarea" }).nullish(),
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
  groupSize: z.number().register(widgetRegistry, { class: "col-6" }).nullish(),
  groupSizeAccuracy: z
    .enum(["Exact", "Approximately", "AtLeast", "Unknown"])
    .register(widgetRegistry, { class: "col-6" }),
  incidentTerrainType,
  typeOfControlledTerrain: enumWithOther(
    z.enum(["IndoorInsideBuilding", "Street", "TrainTrack", "SkiAreaResort", "CrossCountryTrack", "SledgingTrack"]),
  )
    .register(widgetRegistry, { showIf: ["incidentTerrainType", "ControlledTerrainOpen", "ControlledTerrainClosed"] })
    .nullish(),
  incidentActivity,
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
export type GroupInformation = z.infer<typeof GroupInformationSchema>;

export const InvolvementsFatalitiesBurialsSchema = z.object({
  numberOfGroups: z.number().register(widgetRegistry, { class: "col-6" }).nullish(),
  numberInvolved: z.number().register(widgetRegistry, { class: "col-6" }).nullish(),
  incidentActivity: incidentActivity.array().nullish(),
  incidentTerrainType: incidentTerrainType.array().nullish(),
  fatalities: z.number().register(widgetRegistry, { class: "col-3" }).nullish(),
  injuredSurvivors: z.number().register(widgetRegistry, { class: "col-3" }).nullish(),
  uninjuredSurvivors: z.number().register(widgetRegistry, { class: "col-3" }).nullish(),
  caughtOnly: z.number().register(widgetRegistry, { class: "col-3" }).nullish(),
  fullyBuried: z.number().register(widgetRegistry, { class: "col-3" }).nullish(),
  partlyBuriedHeadCovered: z.number().register(widgetRegistry, { class: "col-3" }).nullish(),
  partlyBuriedHeadUncovered: z.number().register(widgetRegistry, { class: "col-3" }).nullish(),
  partlyBuried: z.number().register(widgetRegistry, { class: "col-3" }).nullish(),
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
  professionalCertification: enumWithOther(
    z.enum(["IFMGAGuide", "FullSkiGuide", "AvalancheProfessional", "AvalancheEducator"]),
  ),
  avalancheTraining: enumWithOther(z.enum(["None", "Awareness", "BasicREC", "AdvancedREC", "Professional"])),
  yearsActive: z.enum(["UpTo2Years", "From3To9Years", "From10Years"]),
  transceiver: z.enum(["NoTransceiver", "TransceiverOn", "TransceiverOff"]),
  shovel: z.enum(["Yes", "No"]),
  probe: z.enum(["Yes", "No"]),
  airbag: z.enum(["NoAirbag", "AirbagDeployed", "AirbagUndeployed"]),
  helmet: z.enum(["Yes", "No"]),
  terrainTrap: enumWithOther(
    z.enum(["None", "Cliff", "Trees", "Gully", "Depression", "Bench", "Boulder", "CrevasseOrBergschrund"]),
  ),
  burialDepth: z.number().register(widgetRegistry, { unit: "cm" }).nullish(),
  burialDuration: z.string().register(widgetRegistry, { unit: "dd:hh:mm" }).nullish(),
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
  ),
  rescuedBy: enumWithOther(z.enum(["Self", "Companion", "OtherGroup", "OrganizedRescue", "Unknown"])),
  medicalIntervention: enumWithOther(z.enum(["CPR", "ALS", "ECMO"])),
  estimatedTimeOfDeath: z.enum([
    "DuringTheAvalanche",
    "DuringBurial",
    "OnSiteAfterExtrication",
    "DuringTransport",
    "InHospital",
  ]),
  causeOfDeath: enumWithOther(z.enum(["Asphyxiation", "TraumaticInjury", "Hypothermia"])),
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
  trigger: Trigger.register(widgetRegistry, { class: "bg-incident-trigger" }).nullish(),
  natural: z
    .enum(["Natural", "CorniceFall", "Earthquake", "IceFall", "RockFall"])
    .register(widgetRegistry, { class: "bg-incident-trigger", showIf: ["trigger", Trigger.def.entries.natural] })
    .nullish(),
  person: z
    .enum(["PersonAccidental", "PersonControlled"])
    .register(widgetRegistry, { class: "bg-incident-trigger", showIf: ["trigger", Trigger.def.entries.person] })
    .nullish(),
  additionalLoad: z
    .enum(["High", "Low"])
    .register(widgetRegistry, { class: "bg-incident-trigger", showIf: ["trigger", Trigger.def.entries.person] })
    .nullish(),
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
    .register(widgetRegistry, { class: "bg-incident-trigger", showIf: ["trigger", Trigger.def.entries.explosives] })
    .nullish(),
  vehicle: enumWithOther(z.enum(["OverSnowVehicle", "Snowmobile", "Helicopter"]))
    .register(widgetRegistry, { class: "bg-incident-trigger", showIf: ["trigger", Trigger.def.entries.vehicle] })
    .nullish(),
  accidentalControlled: z
    .enum(["Accidental", "Controlled"])
    .register(widgetRegistry, { class: "bg-incident-trigger", showIf: ["trigger", Trigger.def.entries.vehicle] })
    .nullish(),
  remoteTriggering: z
    .enum(["Yes", "No"])
    .register(widgetRegistry, {
      class: "bg-incident-trigger",
      showIf: ["avalancheType", Enums.IncidentAvalancheType.slab],
    })
    .nullish(),
  startZoneAspect: z
    .enum(Enums.Aspect)
    .register(widgetRegistry, { class: "col-6 bg-start-zone", valueI18n: "aspect.#" }),
  startZoneAspectAccuracy: z.enum(["Accurate", "Uncertain"]).register(widgetRegistry, { class: "col-6 bg-start-zone" }),
  startZoneElevation: z.number().register(widgetRegistry, { class: "col-6 bg-start-zone", unit: "m" }),
  startZoneElevationAccuracy: z
    .enum(["exact", "within50m", "within100m", "within200m", "unknown"])
    .register(widgetRegistry, { class: "col-6 bg-start-zone" }),
  startZoneIncline: z.number().register(widgetRegistry, { class: "bg-start-zone", unit: "°" }).nullish(),
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
    .register(widgetRegistry, { class: "bg-start-zone" })
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
  weakLayerName: z.string().register(widgetRegistry, { class: "bg-weak-layer" }).nullish(),
  weakLayerGrainType1: z
    .enum(["PP", "PPgp", "DF", "RG", "FC", "FCxr", "DH", "SH", "MF", "MM"])
    .register(widgetRegistry, { class: "bg-weak-layer", valueI18n: "grainShape.#.code" })
    .nullish(),
  weakLayerGrainType2: z
    .enum(["PP", "PPgp", "DF", "RG", "FC", "FCxr", "DH", "SH", "MF", "MM"])
    .register(widgetRegistry, { class: "bg-weak-layer", valueI18n: "grainShape.#.code" })
    .nullish(),
  weakLayerGrainSize1: z.number().register(widgetRegistry, { class: "bg-weak-layer" }).nullish(),
  weakLayerGrainSize2: z.number().register(widgetRegistry, { class: "bg-weak-layer" }).nullish(),
  weakLayerLocation: z
    .enum(["WithinNewSnow", "AtInterfaceWithOldSnow", "WithinOldSnowpack", "NearTheGround"])
    .register(widgetRegistry, { class: "bg-weak-layer" })
    .nullish(),
  bedSurfaceStepped: z.enum(["Yes", "No"]).nullish(),
  avalancheMoistureStartZone: z.enum(["Dry", "Moist", "Wet", "Unknown"]),
  avalancheMoistureDeposit: z.enum(["Dry", "Moist", "Wet"]).nullish(),
  depositHeight: z.string().register(widgetRegistry, { unit: "cm" }).nullish(),
  depositWidth: z.string().register(widgetRegistry, { unit: "m" }).nullish(),
  debrisType: enumWithOther(z.enum(["Fine", "Blocks", "Hard", "Soft", "Rocks", "Trees"]))
    .array()
    .nullish(),
  debrisDensity: z.string().register(widgetRegistry, { unit: "kg/m³" }).nullish(),
  depositElevation: z.string().register(widgetRegistry, { unit: "m" }).nullish(),
  avalancheDetailsComment: z.string().register(widgetRegistry, { widget: "textarea" }).nullish(),
});

export const OtherDamagesSchema = z.object({
  otherDamages: z.enum(["Yes", "No"]),

  damagedAssets: enumWithOther(
    z.enum(["Vehicle", "Forest", "Agriculture", "Livestock", "UtilitiesTechnicalInfrastructure"]),
  )
    .array()
    .register(widgetRegistry, { showIf: ["otherDamages", "Yes"] })
    .nullish(),
});

export const IncidentAnalysisSchema = z.object({
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
  recentSlabAvalanches: z.string().nullish(),
  signsOfInstability: z.enum(["Present", "Absent", "Unknown"]).nullish(),
  recentLoading: z.enum(["Present", "Absent", "Unknown"]).nullish(),
  criticalWarming: z.enum(["Present", "Absent", "Unknown"]).nullish(),
  incidentAnalysisComment: z.string().nullish(),
});

export const IncidentAttachmentSchema = z.object({
  uuid: z.uuid().nullish(),
  dateAdded: z.coerce.date(),
  file: z.file().register(widgetRegistry, { widget: "none" }).nullish(),
  fileName: z.string().nullish(),
  mediaType: z.string().nullish(),
  attachmentTags: enumWithOther(z.enum(["Picture", "PoliceReport", "MedicalReport"]))
    .array()
    .nullish(),
  altText: z.string().nullish(),
  credit: z.string().nullish(),
  caption: z.string().nullish(),
  public: z.boolean().nullish(),
  attachmentCategory: z.enum(["Incident", "Avalanche", "Snowpack", "Group", "Person", "Weather"]).nullish(),
});

export const IncidentReportSchema = z.object({
  ...MetaInformationSchema.shape,
  ...GeneralInformationSchema.shape,
  ...LocationInformationSchema.shape,
  ...AvalancheInformationSchema.shape,
  personInvolvement: z.enum(["Yes", "No", "Unknown"]),
  ...OtherDamagesSchema.shape,
  groupInformation: GroupInformationSchema.array(),
  victimInformation: VictimInformationSchema.array(),
  ...IncidentAnalysisSchema.shape,
  attachments: IncidentAttachmentSchema.array(),
});

export const PartialIncidentReportSchema = IncidentReportSchema.partial().extend({
  timestamp: z.coerce.date(),
  groupInformation: GroupInformationSchema.partial().array(),
});

export type IncidentReport = z.infer<typeof IncidentReportSchema>;
