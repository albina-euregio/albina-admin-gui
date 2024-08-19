import { Aspect, AvalancheType, DangerRating, RegionStatus, Tendency } from "../../enums/enums";
import { MatrixInformationModel } from "../../models/matrix-information.model";
import { DangerSourceModel } from "./danger-source.model";
import { PolygonObject } from "./polygon-object.model";

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
  afternoon = "afternoon",
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
  ridge_lines = "ridge_lines",
}

export enum Wetness {
  wet = "wet",
  moist = "moist",
  dry = "dry",
}

export class DangerSourceVariantModel implements PolygonObject {
  id: string;

  dangerSourceVariantId: string;
  dangerSource: DangerSourceModel;
  creationDate: Date;
  updateDate: Date;
  validFrom: Date;
  validUntil: Date;
  status: DangerSourceVariantStatus;
  ownerRegion: string;
  regions: string[];
  hasDaytimeDependency: boolean | undefined;
  avalancheType: AvalancheType;
  aspects: Aspect[];
  elevationHigh: number | undefined;
  treelineHigh: boolean | undefined;
  elevationLow: number | undefined;
  treelineLow: boolean | undefined;
  dangerIncreaseWithElevation: boolean | undefined;
  highestDangerAspect: Aspect;
  dangerPeak: Daytime;
  slopeGradient: SlopeGradient;
  runoutIntoGreen: boolean | undefined;
  naturalRelease: Probability;
  dangerSigns: DangerSign[];
  eawsMatrixInformation: MatrixInformationModel;

  /** --------------------- */
  /** LOOSE SNOW AVALANCHES */
  /** --------------------- */
  glidingSnowActivity: GlidingSnowActivity;
  snowHeightUpperLimit: number | undefined;
  snowHeightLowerLimit: number | undefined;
  zeroDegreeIsotherm: boolean | undefined;

  /** --------------- */
  /** SLAB AVALANCHES */
  /** --------------- */
  slabGrainShape: GrainShape;
  slabThicknessUpperLimit: number | undefined;
  slabThicknessLowerLimit: number | undefined;
  slabHandHardnessUpperLimit: HandHardness;
  slabHandHardnessLowerLimit: HandHardness;
  slabHardnessProfile: Tendency;
  slabEnergyTransferPotential: Characteristic;
  slabDistribution: Distribution;
  weakLayerGrainShape: GrainShape;
  weakLayerGrainSizeUpperLimit: number | undefined;
  weakLayerGrainSizeLowerLimit: number | undefined;
  weakLayerPersistent: boolean | undefined;
  weakLayerThickness: Thickness;
  weakLayerStrength: Characteristic;
  weakLayerWet: boolean | undefined;
  weakLayerCrustAbove: boolean | undefined;
  weakLayerCrustBelow: boolean | undefined;
  weakLayerPosition: SnowpackPosition;
  weakLayerCreation: CreationProcess;
  weakLayerDistribution: Distribution;
  dangerSpotRecognizability: Recognizability;
  remoteTriggering: boolean | undefined;
  terrainTypes: TerrainType[];

  /** --------------------- */
  /** LOOSE SNOW AVALANCHES */
  /** --------------------- */
  looseSnowGrainShape: GrainShape;
  looseSnowMoisture: Wetness;

  static createFromJson(json) {
    const variant = new DangerSourceVariantModel();

    // TODO implement correct
    variant.id = json.id;
    variant.dangerSourceVariantId = json.dangerSourceId;
    variant.dangerSource = DangerSourceModel.createFromJson(json.dangerSource);
    variant.creationDate = json.creationDate;
    variant.updateDate = json.updateDate;
    variant.validFrom = json.validFrom;
    variant.validUntil = json.validUntil;
    variant.status = json.status;
    variant.ownerRegion = json.ownerRegion;
    variant.regions = json.regions;
    variant.hasDaytimeDependency = json.hasDaytimeDependency;
    variant.avalancheType = json.avalancheType;
    variant.aspects = json.aspects;
    variant.elevationHigh = json.elevationHigh;
    variant.treelineHigh = json.treelineHigh;
    variant.elevationLow = json.elevationLow;
    variant.treelineLow = json.treelineLow;
    variant.dangerIncreaseWithElevation = json.dangerIncreaseWithElevation;
    variant.highestDangerAspect = json.highestDangerAspect;
    variant.dangerPeak = json.dangerPeak;
    variant.slopeGradient = json.slopeGradient;
    variant.runoutIntoGreen = json.runoutIntoGreen;
    variant.naturalRelease = json.naturalRelease;
    variant.dangerSigns = json.dangerSigns;
    variant.eawsMatrixInformation = MatrixInformationModel.createFromJson(json.eawsMatrixInformation);
    variant.glidingSnowActivity = json.glidingSnowActivity;
    variant.snowHeightUpperLimit = json.snowHeightUpperLimit;
    variant.snowHeightLowerLimit = json.snowHeightLowerLimit;
    variant.zeroDegreeIsotherm = json.zeroDegreeIsotherm;
    variant.slabGrainShape = json.slabGrainShape;
    variant.slabThicknessUpperLimit = json.slabThicknessUpperLimit;
    variant.slabThicknessLowerLimit = json.slabThicknessLowerLimit;
    variant.slabHandHardnessUpperLimit = json.slabHandHardnessUpperLimit;
    variant.slabHandHardnessLowerLimit = json.slabHandHardnessLowerLimit;
    variant.slabHardnessProfile = json.slabHardnessProfile;
    variant.slabEnergyTransferPotential = json.slabEnergyTransferPotential;
    variant.slabDistribution = json.slabDistribution;
    variant.weakLayerGrainShape = json.weakLayerGrainShape;
    variant.weakLayerGrainSizeUpperLimit = json.weakLayerGrainSizeUpperLimit;
    variant.weakLayerGrainSizeLowerLimit = json.weakLayerGrainSizeLowerLimit;
    variant.weakLayerPersistent = json.weakLayerPersistent;
    variant.weakLayerThickness = json.weakLayerThickness;
    variant.weakLayerStrength = json.weakLayerStrength;
    variant.weakLayerWet = json.weakLayerWet;
    variant.weakLayerCrustAbove = json.weakLayerCrustAbove;
    variant.weakLayerCrustBelow = json.weakLayerCrustBelow;
    variant.weakLayerPosition = json.weakLayerPosition;
    variant.weakLayerCreation = json.weakLayerCreation;
    variant.weakLayerDistribution = json.weakLayerDistribution;
    variant.dangerSpotRecognizability = json.dangerSpotRecognizability;
    variant.remoteTriggering = json.remoteTriggering;
    variant.terrainTypes = json.terrainTypes;
    variant.looseSnowGrainShape = json.looseSnowGrainShape;
    variant.looseSnowMoisture = json.looseSnowMoisture;

    return variant;
  }

  constructor(variant?: DangerSourceVariantModel) {
    if (variant) {
      if (variant.dangerSourceVariantId) {
        this.dangerSourceVariantId = variant.dangerSourceVariantId;
      } else if (variant.id) {
        this.dangerSourceVariantId = variant.id;
      }
      this.dangerSource = DangerSourceModel.createFromJson(variant.dangerSource);
      this.creationDate = new Date();
      this.updateDate = new Date();
      this.validFrom = variant.validFrom;
      this.validUntil = variant.validUntil;
      this.status = variant.status;
      this.ownerRegion = variant.ownerRegion;
      this.regions = variant.regions;
      this.hasDaytimeDependency = variant.hasDaytimeDependency;
      this.avalancheType = variant.avalancheType;
      this.aspects = variant.aspects;
      this.elevationHigh = variant.elevationHigh;
      this.treelineHigh = variant.treelineHigh;
      this.elevationLow = variant.elevationLow;
      this.treelineLow = variant.treelineLow;
      this.dangerIncreaseWithElevation = variant.dangerIncreaseWithElevation;
      this.highestDangerAspect = variant.highestDangerAspect;
      this.dangerPeak = variant.dangerPeak;
      this.slopeGradient = variant.slopeGradient;
      this.runoutIntoGreen = variant.runoutIntoGreen;
      this.naturalRelease = variant.naturalRelease;
      this.dangerSigns = variant.dangerSigns;
      this.eawsMatrixInformation = new MatrixInformationModel(variant.eawsMatrixInformation);
      this.glidingSnowActivity = variant.glidingSnowActivity;
      this.snowHeightUpperLimit = variant.snowHeightUpperLimit;
      this.snowHeightLowerLimit = variant.snowHeightLowerLimit;
      this.zeroDegreeIsotherm = variant.zeroDegreeIsotherm;
      this.slabGrainShape = variant.slabGrainShape;
      this.slabThicknessUpperLimit = variant.slabThicknessUpperLimit;
      this.slabThicknessLowerLimit = variant.slabThicknessLowerLimit;
      this.slabHandHardnessUpperLimit = variant.slabHandHardnessUpperLimit;
      this.slabHandHardnessLowerLimit = variant.slabHandHardnessLowerLimit;
      this.slabHardnessProfile = variant.slabHardnessProfile;
      this.slabEnergyTransferPotential = variant.slabEnergyTransferPotential;
      this.slabDistribution = variant.slabDistribution;
      this.weakLayerGrainShape = variant.weakLayerGrainShape;
      this.weakLayerGrainSizeUpperLimit = variant.weakLayerGrainSizeUpperLimit;
      this.weakLayerGrainSizeLowerLimit = variant.weakLayerGrainSizeLowerLimit;
      this.weakLayerPersistent = variant.weakLayerPersistent;
      this.weakLayerThickness = variant.weakLayerThickness;
      this.weakLayerStrength = variant.weakLayerStrength;
      this.weakLayerWet = variant.weakLayerWet;
      this.weakLayerCrustAbove = variant.weakLayerCrustAbove;
      this.weakLayerCrustBelow = variant.weakLayerCrustBelow;
      this.weakLayerPosition = variant.weakLayerPosition;
      this.weakLayerCreation = variant.weakLayerCreation;
      this.weakLayerDistribution = variant.weakLayerDistribution;
      this.dangerSpotRecognizability = variant.dangerSpotRecognizability;
      this.remoteTriggering = variant.remoteTriggering;
      this.terrainTypes = variant.terrainTypes;
      this.looseSnowGrainShape = variant.looseSnowGrainShape;
      this.looseSnowMoisture = variant.looseSnowMoisture;
    } else {
      this.dangerSourceVariantId = undefined;
      this.dangerSource = undefined;
      this.creationDate = new Date();
      this.updateDate = new Date();
      this.validFrom = undefined;
      this.validUntil = undefined;
      this.status = undefined;
      this.ownerRegion = undefined;
      this.regions = new Array<string>();
      this.hasDaytimeDependency = false;
      this.avalancheType = undefined;
      this.aspects = new Array<Aspect>();
      this.elevationHigh = undefined;
      this.treelineHigh = undefined;
      this.elevationLow = undefined;
      this.treelineLow = undefined;
      this.dangerIncreaseWithElevation = undefined;
      this.highestDangerAspect = undefined;
      this.dangerPeak = undefined;
      this.slopeGradient = undefined;
      this.runoutIntoGreen = undefined;
      this.naturalRelease = undefined;
      this.dangerSigns = new Array<DangerSign>();
      this.eawsMatrixInformation = new MatrixInformationModel();
      this.glidingSnowActivity = undefined;
      this.snowHeightUpperLimit = undefined;
      this.snowHeightLowerLimit = undefined;
      this.zeroDegreeIsotherm = undefined;
      this.slabGrainShape = undefined;
      this.slabThicknessUpperLimit = undefined;
      this.slabThicknessLowerLimit = undefined;
      this.slabHandHardnessUpperLimit = undefined;
      this.slabHandHardnessLowerLimit = undefined;
      this.slabHardnessProfile = undefined;
      this.slabEnergyTransferPotential = undefined;
      this.slabDistribution = undefined;
      this.weakLayerGrainShape = undefined;
      this.weakLayerGrainSizeUpperLimit = undefined;
      this.weakLayerGrainSizeLowerLimit = undefined;
      this.weakLayerPersistent = undefined;
      this.weakLayerThickness = undefined;
      this.weakLayerStrength = undefined;
      this.weakLayerWet = undefined;
      this.weakLayerCrustAbove = undefined;
      this.weakLayerCrustBelow = undefined;
      this.weakLayerPosition = undefined;
      this.weakLayerCreation = undefined;
      this.weakLayerDistribution = undefined;
      this.dangerSpotRecognizability = undefined;
      this.remoteTriggering = undefined;
      this.terrainTypes = new Array<TerrainType>();
      this.looseSnowGrainShape = undefined;
      this.looseSnowMoisture = undefined;
    }
  }

  getAllRegions(): string[] {
    return this.regions;
  }

  getRegionsByStatus(status: RegionStatus): string[] {
    if (status == RegionStatus.saved) {
      return this.regions;
    } else {
      return [];
    }
  }

  getForenoonDangerRatingAbove(): DangerRating {
    return this.eawsMatrixInformation.dangerRating;
  }

  getAfternoonDangerRatingAbove(): DangerRating {
    return this.eawsMatrixInformation.dangerRating;
  }

  getForenoonDangerRatingBelow(): DangerRating {
    return this.eawsMatrixInformation.dangerRating;
  }

  getAfternoonDangerRatingBelow(): DangerRating {
    return this.eawsMatrixInformation.dangerRating;
  }
}
