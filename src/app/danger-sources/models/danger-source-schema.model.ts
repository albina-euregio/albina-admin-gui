import { Aspect, AvalancheProblem, AvalancheType, DangerPattern, SnowpackStability, Tendency } from "../../enums/enums";
import { z } from "zod";

export enum DangerSourceVariantStatus {
  active,
  dormant,
  inactive,
}

export enum DangerSourceVariantType {
  missing,
  forecasted,
  verified,
}

export enum Daytime {
  evening = "evening",
  first_night_half = "first_night_half",
  second_night_half = "second_night_half",
  morning = "morning",
  forenoon = "forenoon",
  afternnon = "afternnon",
}

export enum SlopeGradient {
  moderately_steep = "moderately_steep",
  steep = "steep",
  very_steep = "very_steep",
  extremely_steep = "extremely_steep",
}

export enum Probability {
  likely = "likely",
  possible = "possible",
  unlikely = "unlikely",
}

export enum DangerSign {
  shooting_cracks = "shooting_cracks",
  whumpfing = "whumpfing",
}

export enum GlidingSnowActivity {
  low = "low",
  medium = "medium",
  high = "high",
}

export enum GrainShape {
  PP = "PP",
  MM = "MM",
  DF = "DF",
  RG = "RG",
  FC = "FC",
  DH = "DH",
  SH = "SH",
  MF = "MF",
  IF = "IF",
  PPco = "PPco",
  PPnd = "PPnd",
  PPpl = "PPpl",
  PPsd = "PPsd",
  PPir = "PPir",
  PPgp = "PPgp",
  PPhl = "PPhl",
  PPip = "PPip",
  PPrm = "PPrm",
  MMrp = "MMrp",
  MMci = "MMci",
  DFdc = "DFdc",
  DFbk = "DFbk",
  RGsr = "RGsr",
  RGlr = "RGlr",
  RGwp = "RGwp",
  RGxf = "RGxf",
  FCso = "FCso",
  FCsf = "FCsf",
  FCxr = "FCxr",
  DHcp = "DHcp",
  DHpr = "DHpr",
  DHch = "DHch",
  DHla = "DHla",
  DHxr = "DHxr",
  SHsu = "SHsu",
  SHcv = "SHcv",
  SHxr = "SHxr",
  MFcl = "MFcl",
  MFpc = "MFpc",
  MFsl = "MFsl",
  MFcr = "MFcr",
  IFil = "IFil",
  IFic = "IFic",
  IFbi = "IFbi",
  IFrc = "IFrc",
  IFsc = "IFsc",
}

export enum HandHardness {
  fist = "fist",
  four_fingers = "four_fingers",
  one_finger = "one_finger",
  pencil = "pencil",
  knife = "knife",
  ice = "ice",
}

export enum Characteristic {
  low = "low",
  medium = "medium",
  high = "high",
  very_high = "very_high",
}

export enum Distribution {
  isolated = "isolated",
  specific = "specific",
  widespread = "widespread",
}

export enum Thickness {
  thick = "thick",
  thin = "thin",
}

export enum SnowpackPosition {
  upper = "upper",
  middle = "middle",
  lower = "lower",
  ground = "ground",
}

export enum CreationProcess {
  radiation_recrystallization = "radiation_recrystallization",
  diurnal_recrystallization = "diurnal_recrystallization",
  melt_layer_recrystallization = "melt_layer_recrystallization",
}

export enum Recognizability {
  very_easy = "very_easy",
  easy = "easy",
  hard = "hard",
  very_hard = "very_hard",
}

export enum TerrainType {
  gullies = "gullies",
  bowls = "bowls",
  pass_areas = "pass_areas",
  ridgelines = "ridgelines",
}

export enum Wetness {
  wet = "wet",
  moist = "moist",
  dry = "dry",
}

export const matrixInformationSchema = z.object({
  // TODO implement
});

export const dangerSourceSchema = z.object({
  creationDate: z.date().optional().nullable().describe(""),
  title: z.string().optional().nullable().describe(""),
  description: z.string().optional().nullable().describe(""),
});

// https://transform.tools/typescript-to-zod
export const dangerSourceVariantSchema = z.object({
  dangerSourceVariantId: z.string().optional().nullable().describe(""),
  dangerSource: dangerSourceSchema,
  creationDate: z.date().optional().nullable().describe(""),
  updateDate: z.date().optional().nullable().describe(""),
  validFrom: z.date().optional().nullable().describe(""),
  validUntil: z.date().optional().nullable().describe(""),
  status: z.nativeEnum(DangerSourceVariantStatus).optional().nullable().describe(""),
  type: z.nativeEnum(DangerSourceVariantType).optional().nullable().describe(""),
  ownerRegion: z.string().optional().nullable().describe(""),
  regions: z.array(z.string()).optional().nullable().describe(""),
  hasDaytimeDependency: z.boolean().optional().nullable().describe(""),
  avalancheType: z.nativeEnum(AvalancheType).optional().nullable().describe(""),
  aspects: z.array(z.nativeEnum(Aspect)).optional().nullable().describe(""),
  elevationHigh: z.number().optional().nullable().describe(""),
  treelineHigh: z.boolean().optional().nullable().describe(""),
  elevationLow: z.number().optional().nullable().describe(""),
  treelineLow: z.boolean().optional().nullable().describe(""),
  dangerIncreaseWithElevation: z.boolean().optional().nullable().describe(""),
  highestDangerAspect: z.nativeEnum(Aspect).optional().nullable().describe(""),
  dangerPeak: z.nativeEnum(Daytime).optional().nullable().describe(""),
  slopeGradient: z.nativeEnum(SlopeGradient).optional().nullable().describe(""),
  runoutIntoGreen: z.boolean().optional().nullable().describe(""),
  naturalRelease: z.nativeEnum(Probability).optional().nullable().describe(""),
  dangerSigns: z.array(z.nativeEnum(DangerSign)).optional().nullable().describe(""),
  eawsMatrixInformation: matrixInformationSchema,

  /** --------------------- */
  /** LOOSE SNOW AVALANCHES */
  /** --------------------- */
  glidingSnowActivity: z.nativeEnum(GlidingSnowActivity).optional().nullable().describe(""),
  snowHeightUpperLimit: z.number().optional().nullable().describe(""),
  snowHeightLowerLimit: z.number().optional().nullable().describe(""),
  zeroDegreeIsotherm: z.boolean().optional().nullable().describe(""),

  /** --------------- */
  /** SLAB AVALANCHES */
  /** --------------- */
  slabGrainShape: z.nativeEnum(GrainShape).optional().nullable().describe(""),
  slabThicknessUpperLimit: z.number().optional().nullable().describe(""),
  slabThicknessLowerLimit: z.number().optional().nullable().describe(""),
  slabHandHardnessUpperLimit: z.nativeEnum(HandHardness).optional().nullable().describe(""),
  slabHandHardnessLowerLimit: z.nativeEnum(HandHardness).optional().nullable().describe(""),
  slabHardnessProfile: z.nativeEnum(Tendency).optional().nullable().describe(""),
  slabEneryTransferPotential: z.nativeEnum(Characteristic).optional().nullable().describe(""),
  slabDistribution: z.nativeEnum(Distribution).optional().nullable().describe(""),
  weakLayerGrainShape: z.nativeEnum(GrainShape).optional().nullable().describe(""),
  weakLayerGrainSizeUpperLimit: z.number().optional().nullable().describe(""),
  weakLayerGrainSizeLowerLimit: z.number().optional().nullable().describe(""),
  weakLayerPersistent: z.boolean().optional().nullable().describe(""),
  weakLayerThickness: z.nativeEnum(Thickness).optional().nullable().describe(""),
  weakLayerStrength: z.nativeEnum(Characteristic).optional().nullable().describe(""),
  weakLayerWet: z.boolean().optional().nullable().describe(""),
  weakLayerCrustAbove: z.boolean().optional().nullable().describe(""),
  weakLayerCrustBelow: z.boolean().optional().nullable().describe(""),
  weakLayerPosition: z.nativeEnum(SnowpackPosition).optional().nullable().describe(""),
  weakLayerCreation: z.nativeEnum(CreationProcess).optional().nullable().describe(""),
  weakLayerDistribution: z.nativeEnum(Distribution).optional().nullable().describe(""),
  dangerSpotRecognizability: z.nativeEnum(Recognizability).optional().nullable().describe(""),
  remoteTriggering: z.boolean().optional().nullable().describe(""),
  terrainTypes: z.array(z.nativeEnum(TerrainType)).optional().nullable().describe(""),

  /** --------------------- */
  /** LOOSE SNOW AVALANCHES */
  /** --------------------- */
  looseSnowGrainShape: z.nativeEnum(GrainShape).optional().nullable().describe(""),
  looseSnowMoisture: z.nativeEnum(Wetness).optional().nullable().describe(""),
});

export type DangerSourceVariant<Data = any> = z.infer<typeof dangerSourceVariantSchema> & {};
