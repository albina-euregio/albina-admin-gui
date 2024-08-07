import { MapObject } from "app/models/bulletin.model";
import { Aspect, AvalancheType, Tendency } from "../../enums/enums";
import { MatrixInformationModel } from "../../models/matrix-information.model";
import { DangerSourceModel } from "./danger-source.model";

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

export interface DangerSourceVariantModel extends MapObject {
  id: string;

  dangerSourceVariantId: string;
  dangerSource: DangerSourceModel;
  creationDate: Date;
  updateDate: Date;
  validFrom: Date;
  validUntil: Date;
  status: DangerSourceVariantStatus;
  type: DangerSourceVariantType;
  ownerRegion: string;
  regions: string[];
  hasDaytimeDependency: boolean;
  avalancheType: AvalancheType;
  aspects: Aspect[];
  elevationHigh: number;
  treelineHigh: boolean;
  elevationLow: number;
  treelineLow: boolean;
  dangerIncreaseWithElevation: boolean;
  highestDangerAspect: Aspect;
  dangerPeak: Daytime;
  slopeGradient: SlopeGradient;
  runoutIntoGreen: boolean;
  naturalRelease: Probability;
  dangerSigns: DangerSign[];
  eawsMatrixInformation: MatrixInformationModel;

  /** --------------------- */
  /** LOOSE SNOW AVALANCHES */
  /** --------------------- */
  glidingSnowActivity: GlidingSnowActivity;
  snowHeightUpperLimit: number;
  snowHeightLowerLimit: number;
  zeroDegreeIsotherm: boolean;

  /** --------------- */
  /** SLAB AVALANCHES */
  /** --------------- */
  slabGrainShape: GrainShape;
  slabThicknessUpperLimit: number;
  slabThicknessLowerLimit: number;
  slabHandHardnessUpperLimit: HandHardness;
  slabHandHardnessLowerLimit: HandHardness;
  slabHardnessProfile: Tendency;
  slabEneryTransferPotential: Characteristic;
  slabDistribution: Distribution;
  weakLayerGrainShape: GrainShape;
  weakLayerGrainSizeUpperLimit: number;
  weakLayerGrainSizeLowerLimit: number;
  weakLayerPersistent: boolean;
  weakLayerThickness: Thickness;
  weakLayerStrength: Characteristic;
  weakLayerWet: boolean;
  weakLayerCrustAbove: boolean;
  weakLayerCrustBelow: boolean;
  weakLayerPosition: SnowpackPosition;
  weakLayerCreation: CreationProcess;
  weakLayerDistribution: Distribution;
  dangerSpotRecognizability: Recognizability;
  remoteTriggering: boolean;
  terrainTypes: TerrainType[];

  /** --------------------- */
  /** LOOSE SNOW AVALANCHES */
  /** --------------------- */
  looseSnowGrainShape: GrainShape;
  looseSnowMoisture: Wetness;
}
