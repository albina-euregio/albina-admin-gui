import * as z from "zod";

// https://incidents-api.prod.avalanche.ca/v1/public/en/incidents

export const CriticalWarmingSchema = z.enum(["Absent", "", "Present", "Unknown"]);

export const ForestDensityDetailSchema = z.enum(["Alpine", "Forest_Glade", "Open_Forest", "Sparsely_Treed"]);

export const SlopeShapeDetailSchema = z.enum(["Concave", "Convex", "Planar", "Unsupported"]);

export const SlopeSizeSchema = z.enum(["", "Large_(2-2.5)", "Small_(<=1.5)", "Very_Large_(>=3)"]);

export const SlopeSteepnessSchema = z.enum([
  "",
  "Between_30_and_35_degrees",
  "Greater_than_35_degrees",
  "Less_than_30_degrees",
  "Unknown",
]);

export const TerrainTrapDetailSchema = z.enum([
  "Bench",
  "Cliff",
  "Crevasse/Bergshrund",
  "Depression",
  "Gully",
  "None",
  "Other",
  "Trees",
]);

export const StatusSchema = z.enum(["Final"]);

export const AtesSchema = z.enum(["Challenging", "Complex", "", "Extreme", "Not_Rated", "Simple"]);

export const TagSchema = z.enum([
  "Analysis",
  "Avalanche",
  "General",
  "Group",
  "Involvements",
  "Location",
  "SnowProfile",
  "Snowpack",
  "Victim",
  "Weather",
]);

export const TypeSchema = z.enum(["application/pdf", "", "image/jpeg", "image/png", "Other", "Photo"]);

export const AvProbTypeSchema = z.enum([
  "",
  "Cornice",
  "Deep_Persistent_Slab",
  "Loose_Wet",
  "Persistent_Slab",
  "Storm_Slab",
  "Wet_Slab",
  "Wind_Slab",
]);

export const AvTypeSchema = z.enum([
  "",
  "Cornice",
  "Cornice_Slab",
  "Ice_Fall",
  "Loose_Snow",
  "Loose_Snow+Slab",
  "Slab",
]);

export const BlowingSnowSchema = z.enum(["", "Intense", "Moderate", "Nil", "Unknown"]);

export const BsfGrainTypeSchema = z.enum([
  "",
  "DF",
  "DH",
  "DHxr",
  "FC",
  "FCxr",
  "IF",
  "MF",
  "MFcr",
  "MFpc",
  "MFrc",
  "MFsc",
  "PP",
  "PPgp",
  "RG",
  "SH",
  "SHsu",
  "Unknown",
]);

export const BsfLevelSchema = z.enum(["", "Ground_Glacier_ice_Firn", "Old_Snow", "Storm_Snow", "Unknown"]);

export const BsfSteppedSchema = z.enum(["", "No", "Yes"]);

export const DangerRatingSchema = z.enum([
  "",
  "Considerable",
  "Extreme",
  "High",
  "Low",
  "Moderate",
  "No_Forecast",
  "No_Rating",
  "None",
  "Spring_Conditions",
]);

export const GroupActivitySchema = z.enum([
  "At_Outdoor_Worksite",
  "Backcountry_Skiing/Snowboarding",
  "Car/Truck_On_Road",
  "Hunting/Fishing",
  "Ice_Climbing",
  "Inside_Building",
  "Lift_Skiing_Closed",
  "Lift_Skiing_Open",
  "Mechanized_Skiing/Snowboarding",
  "Mountaineering",
  "Other",
  "Other_Recreational",
  "Out_of_Bounds_Skiing/Snowboarding",
  "Outside_Building",
  "Snowbiking",
  "Snowmobiling",
  "Snowshoeing",
  "Unknown",
]);

export const GroupTypeSchema = z.enum([
  "",
  "Club",
  "Commercial",
  "Custodial",
  "Family/Friends",
  "Industrial",
  "Other",
  "Solo",
  "Unknown",
]);

export const LocationAccuracySchema = z.enum(["", "Drainage", "Mountain", "Path", "Slope"]);

export const LwcSchema = z.enum(["", "Dry", "Moist", "Unknown", "Wet"]);

export const PrecipTiSchema = z.enum([
  "",
  "G",
  "NIL",
  "RL",
  "RS",
  "RV",
  "S",
  "S-1",
  "S1",
  "S2",
  "S3",
  "S4",
  "S5",
  "Unknown",
]);

export const MountainRangeSchema = z.string();

export const ProvinceSchema = z.string();

export const PublicForecastAgencySchema = z.string();

export const SkyCondSchema = z.enum(["", "BKN", "CLR", "FEW", "OVC", "SCT", "-SCT", "Unknown", "X"]);

export const StartZoneAspectSchema = z.enum(["", "E", "N", "NE", "NW", "S", "SE", "SW", "Unknown", "W"]);

export const StartZoneElevBandSchema = z.enum(["", "Alpine", "Below_Treeline", "Treeline", "Unknown"]);

export const TemperatureTrendSchema = z.enum([
  "",
  "Falling_rapidly",
  "Falling_slowly",
  "Falling_unspec",
  "Rising_rapidly",
  "Rising_slowly",
  "Rising_unspec",
  "Steady",
  "Unknown",
]);

export const TriggerSchema = z.enum([
  "",
  "Ha",
  "M",
  "Ma",
  "Mr",
  "N",
  "Na",
  "Nc",
  "Ni",
  "Nr",
  "S",
  "Sa",
  "Sc",
  "Sy",
  "U",
]);

export const WindSpdSchema = z.enum(["Calm", "", "Extreme", "Light", "Moderate", "Strong", "Unknown"]);

export const AttachmentSchema = z.object({
  id: z.number(),
  incidentId: z.number(),
  name: z.string(),
  type: TypeSchema,
  groupId: z.string(),
  description: z.string().nullish(),
  fileId: z.string(),
  caption: z.string().nullish(),
  source: z.string(),
  publicUrl: z.string(),
  tags: TagSchema.array(),
  altText: z.string().nullish(),
  order: z.union([z.number(), z.null()]),
});

export const TextSchema = z.object({
  en: z.string().nullish(),
  fr: z.string().nullish(),
  isTranslated: z.string().nullish(),
});

export const AvaluatorSchema = z.object({
  dangerRating: CriticalWarmingSchema.nullish(),
  persistentSlab: CriticalWarmingSchema.nullish(),
  recentSlabAvalanches: CriticalWarmingSchema.nullish(),
  signsOfInstability: CriticalWarmingSchema.nullish(),
  recentLoading: CriticalWarmingSchema.nullish(),
  criticalWarming: CriticalWarmingSchema.nullish(),
  slopeSteepness: SlopeSteepnessSchema.nullish(),
  terrainTrap: CriticalWarmingSchema.nullish(),
  terrainTrapDetails: TerrainTrapDetailSchema.array().nullish(),
  slopeShape: CriticalWarmingSchema.nullish(),
  slopeShapeDetails: SlopeShapeDetailSchema.array().nullish(),
  forestDensity: CriticalWarmingSchema.nullish(),
  forestDensityDetails: ForestDensityDetailSchema.array().nullish(),
  slopeSize: SlopeSizeSchema.nullish(),
  comments: TextSchema.nullish(),
});

export const AnalysisSchema = z.object({
  id: z.number(),
  incidentId: z.number(),
  description: TextSchema,
  narrative: TextSchema,
  conclusion: TextSchema,
  tags: z.string().array().nullish(),
  sources: z.string().nullish(),
  author: z.string().nullish(),
  avaluator: AvaluatorSchema,
  attachments: AttachmentSchema.array().nullish(),
  status: StatusSchema,
});

export const IncidentSchema = z.object({
  analysis: AnalysisSchema.nullish(),
  atesIncidentLocation: AtesSchema.nullish(),
  atesRoute: AtesSchema.nullish(),
  attachments: AttachmentSchema.array().nullish(),
  avComments: TextSchema.nullish(),
  avProbType: AvProbTypeSchema.nullish(),
  avSize: z.string().nullish(),
  avType: AvTypeSchema.nullish(),
  blowingSnow: BlowingSnowSchema.nullish(),
  bsfGrainSize1: z.number().nullish(),
  bsfGrainType1: BsfGrainTypeSchema.nullish(),
  bsfGrainType2: BsfGrainTypeSchema.nullish(),
  bsfLevel: BsfLevelSchema.nullish(),
  bsfStepped: BsfSteppedSchema.nullish(),
  crownDepthAvg: z.number().nullish(),
  crownDepthMax: z.number().nullish(),
  crownDepthMin: z.number().nullish(),
  dangerRating: DangerRatingSchema.nullish(),
  date: z.iso.date(),
  forecastRegion: z.string().nullish(),
  groupActivity: GroupActivitySchema,
  groupSize: z.number().nullish(),
  groupType: GroupTypeSchema.nullish(),
  hn24: z.number().nullish(),
  hs: z.number().nullish(),
  hst: z.number().nullish(),
  id: z.number().nullish(),
  incidentDescription: TextSchema.nullish(),
  incidentLede: TextSchema.nullish(),
  latitude: z.number().nullish(),
  location: TextSchema.nullish(),
  locationAccuracy: LocationAccuracySchema.nullish(),
  locationDescription: TextSchema.nullish(),
  longitude: z.number().nullish(),
  lwcDeposit: LwcSchema.nullish(),
  lwcSz: LwcSchema.nullish(),
  mountainRange: MountainRangeSchema.nullish(),
  numberCaughtOnly: z.number().nullish(),
  numberFatalities: z.number().nullish(),
  numberFullyBuried: z.number().nullish(),
  numberInjuredSurvivors: z.number().nullish(),
  numberInvolved: z.number().nullish(),
  numberInvolvedStateUnknown: z.number().nullish(),
  numberPartlyBuried: z.number().nullish(),
  numberPartlyBuriedStateUnknown: z.number().nullish(),
  numberUninjuredSurvivors: z.number().nullish(),
  precipTI: PrecipTiSchema.nullish(),
  province: ProvinceSchema.nullish(),
  publicForecastAgency: PublicForecastAgencySchema.nullish(),
  runLength: z.number().nullish(),
  skyCond: SkyCondSchema.nullish(),
  slabWidth: z.number().nullish(),
  snowpackComment: TextSchema.nullish(),
  startOfStorm: z.string().nullish(),
  startZoneAspect: StartZoneAspectSchema.nullish(),
  startZoneElevBand: StartZoneElevBandSchema.nullish(),
  startZoneElevation: z.number().nullish(),
  startZoneIncline: z.number().nullish(),
  temperature: z.number().nullish(),
  temperatureTrend: TemperatureTrendSchema.nullish(),
  terminus: z.string().nullish(),
  time: z.iso.time(),
  trigger: TriggerSchema.nullish(),
  triggerDistance: z.number().nullish(),
  weakLayerDate: z.string().nullish(),
  weakLayerName: z.string().nullish(),
  windDir: StartZoneAspectSchema.nullish(),
  windSpd: WindSpdSchema.nullish(),
  wklGrainSize1: z.number().nullish(),
  wklGrainSize2: z.number().nullish(),
  wklGrainType1: BsfGrainTypeSchema.nullish(),
  wklGrainType2: BsfGrainTypeSchema.nullish(),
  wxComment: TextSchema.nullish(),
});
