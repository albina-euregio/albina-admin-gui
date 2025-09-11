import { Aspect, AvalancheProblem, AvalancheType, DangerRating, RegionStatus, Tendency } from "../../enums/enums";
import { MatrixInformationModel, MatrixInformationSchema } from "../../models/matrix-information.model";
import { DangerSourceModel } from "./danger-source.model";
import { PolygonObject } from "./polygon-object.model";

export enum DangerSourceVariantStatus {
  active = "active",
  dormant = "dormant",
  inactive = "inactive",
}

export enum DangerSourceVariantType {
  forecast = "forecast",
  analysis = "analysis",
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
  fresh_avalanches = "fresh_avalanches",
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

export enum WeakLayerCrust {
  yes = "yes",
  partly = "partly",
  no = "no",
}

export enum CreationProcess {
  radiation_recrystallization = "radiation_recrystallization",
  diurnal_recrystallization = "diurnal_recrystallization",
  melt_layer_recrystallization = "melt_layer_recrystallization",
  surface_hoar_formation = "surface_hoar_formation",
}

export enum Recognizability {
  very_easy = "very_easy",
  easy = "easy",
  hard = "hard",
  very_hard = "very_hard",
}

export enum TerrainType {
  gullies_and_bowls = "gullies_and_bowls",
  adjacent_to_ridgelines = "adjacent_to_ridgelines",
  distant_from_ridgelines = "distant_from_ridgelines",
  in_the_vicinity_of_peaks = "in_the_vicinity_of_peaks",
  pass_areas = "pass_areas",
  shady_slopes = "shady_slopes",
  sunny_slopes = "sunny_slopes",
  grassy_slopes = "grassy_slopes",
  cut_slopes = "cut_slopes",
  wind_loaded_slopes = "wind_loaded_slopes",
  base_of_rock_walls = "base_of_rock_walls",
  behind_abrupt_changes_in_the_terrain = "behind_abrupt_changes_in_the_terrain",
  transitions_into_gullies_and_bowls = "transitions_into_gullies_and_bowls",
  areas_where_the_snow_cover_is_rather_shallow = "areas_where_the_snow_cover_is_rather_shallow",
  transitions_from_a_shallow_to_a_deep_snowpack = "transitions_from_a_shallow_to_a_deep_snowpack",
  highly_frequented_off_piste_terrain = "highly_frequented_off_piste_terrain",
  little_used_backcountry_terrain = "little_used_backcountry_terrain",
  places_that_are_protected_from_the_wind = "places_that_are_protected_from_the_wind",
  regions_exposed_to_the_foehn_wind = "regions_exposed_to_the_foehn_wind",
  regions_with_a_lot_of_snow = "regions_with_a_lot_of_snow",
  regions_exposed_to_precipitation = "regions_exposed_to_precipitation",
  regions_exposed_to_heavier_precipitation = "regions_exposed_to_heavier_precipitation",
}

export enum Wetness {
  wet = "wet",
  moist = "moist",
  dry = "dry",
}

export class DangerSourceVariantModel implements PolygonObject {
  id: string;
  comment: string;
  textcat: string;

  originalDangerSourceVariantId: string;
  forecastDangerSourceVariantId: string;
  dangerSource: DangerSourceModel;
  creationDate: Date;
  updateDate: Date;
  validFrom: Date;
  validUntil: Date;
  dangerSourceVariantStatus: DangerSourceVariantStatus;
  dangerSourceVariantType: DangerSourceVariantType;
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
  penetrateDeepLayers: boolean | undefined;
  naturalRelease: Probability;
  dangerSigns: DangerSign[];
  eawsMatrixInformation: MatrixInformationModel;

  /** --------------------- */
  /** GLIDE SNOW AVALANCHES */
  /** --------------------- */
  glidingSnowActivity: GlidingSnowActivity;
  glidingSnowActivityValue: number | undefined;
  snowHeightUpperLimit: number | undefined;
  snowHeightLowerLimit: number | undefined;
  snowHeightAverage: number | undefined;
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
  weakLayerGrainShapes: GrainShape[];
  weakLayerGrainSizeUpperLimit: number | undefined;
  weakLayerGrainSizeLowerLimit: number | undefined;
  weakLayerPersistent: boolean | undefined;
  weakLayerThickness: Thickness;
  weakLayerStrength: Characteristic;
  weakLayerWet: boolean | undefined;
  weakLayerCrustAbove: WeakLayerCrust;
  weakLayerCrustBelow: WeakLayerCrust;
  weakLayerPosition: SnowpackPosition;
  weakLayerCreation: CreationProcess;
  weakLayerDistribution: Distribution;
  dangerSpotRecognizability: Recognizability;
  remoteTriggering: Probability;
  terrainTypes: TerrainType[];

  /** --------------------- */
  /** LOOSE SNOW AVALANCHES */
  /** --------------------- */
  looseSnowGrainShape: GrainShape;
  looseSnowMoisture: Wetness;

  static createFromJson(json) {
    const variant = new DangerSourceVariantModel();

    variant.id = json.id;
    variant.comment = json.comment;
    variant.textcat = json.textcat;
    variant.originalDangerSourceVariantId = json.originalDangerSourceVariantId;
    variant.forecastDangerSourceVariantId = json.forecastDangerSourceVariantId;
    variant.dangerSource = DangerSourceModel.createFromJson(json.dangerSource);
    variant.creationDate = json.creationDate;
    variant.updateDate = json.updateDate;
    variant.validFrom = json.validFrom;
    variant.validUntil = json.validUntil;
    variant.dangerSourceVariantStatus = json.dangerSourceVariantStatus;
    variant.dangerSourceVariantType = json.dangerSourceVariantType;
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
    variant.penetrateDeepLayers = json.penetrateDeepLayers;
    variant.naturalRelease = json.naturalRelease;
    variant.dangerSigns = json.dangerSigns;
    variant.eawsMatrixInformation = MatrixInformationSchema.parse(json.eawsMatrixInformation);
    variant.glidingSnowActivity = json.glidingSnowActivity;
    variant.glidingSnowActivityValue = json.glidingSnowActivityValue;
    variant.snowHeightUpperLimit = json.snowHeightUpperLimit;
    variant.snowHeightLowerLimit = json.snowHeightLowerLimit;
    variant.snowHeightAverage = json.snowHeightAverage;
    variant.zeroDegreeIsotherm = json.zeroDegreeIsotherm;
    variant.slabGrainShape = json.slabGrainShape;
    variant.slabThicknessUpperLimit = json.slabThicknessUpperLimit;
    variant.slabThicknessLowerLimit = json.slabThicknessLowerLimit;
    variant.slabHandHardnessUpperLimit = json.slabHandHardnessUpperLimit;
    variant.slabHandHardnessLowerLimit = json.slabHandHardnessLowerLimit;
    variant.slabHardnessProfile = json.slabHardnessProfile;
    variant.slabEnergyTransferPotential = json.slabEnergyTransferPotential;
    variant.slabDistribution = json.slabDistribution;
    variant.weakLayerGrainShapes = json.weakLayerGrainShapes;
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
      if (variant.originalDangerSourceVariantId) {
        this.originalDangerSourceVariantId = variant.originalDangerSourceVariantId;
      } else if (variant.id) {
        this.originalDangerSourceVariantId = variant.id;
      }
      this.comment = variant.comment;
      this.textcat = variant.textcat;
      this.dangerSource = DangerSourceModel.createFromJson(variant.dangerSource);
      this.creationDate = new Date(variant.creationDate);
      this.updateDate = new Date(variant.updateDate);
      this.validFrom = variant.validFrom;
      this.validUntil = variant.validUntil;
      this.dangerSourceVariantStatus = variant.dangerSourceVariantStatus;
      this.dangerSourceVariantType = variant.dangerSourceVariantType;
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
      this.penetrateDeepLayers = variant.penetrateDeepLayers;
      this.naturalRelease = variant.naturalRelease;
      this.dangerSigns = variant.dangerSigns;
      this.eawsMatrixInformation = MatrixInformationSchema.parse(variant.eawsMatrixInformation);
      this.glidingSnowActivity = variant.glidingSnowActivity;
      this.glidingSnowActivityValue = variant.glidingSnowActivityValue;
      this.snowHeightUpperLimit = variant.snowHeightUpperLimit;
      this.snowHeightLowerLimit = variant.snowHeightLowerLimit;
      this.snowHeightAverage = variant.snowHeightAverage;
      this.zeroDegreeIsotherm = variant.zeroDegreeIsotherm;
      this.slabGrainShape = variant.slabGrainShape;
      this.slabThicknessUpperLimit = variant.slabThicknessUpperLimit;
      this.slabThicknessLowerLimit = variant.slabThicknessLowerLimit;
      this.slabHandHardnessUpperLimit = variant.slabHandHardnessUpperLimit;
      this.slabHandHardnessLowerLimit = variant.slabHandHardnessLowerLimit;
      this.slabHardnessProfile = variant.slabHardnessProfile;
      this.slabEnergyTransferPotential = variant.slabEnergyTransferPotential;
      this.slabDistribution = variant.slabDistribution;
      this.weakLayerGrainShapes = variant.weakLayerGrainShapes;
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
      this.creationDate = new Date();
      this.updateDate = new Date();
      this.dangerSourceVariantStatus = DangerSourceVariantStatus.active;
      this.regions = new Array<string>();
      this.hasDaytimeDependency = false;
      this.aspects = new Array<Aspect>();
      this.dangerSigns = new Array<DangerSign>();
      this.eawsMatrixInformation = MatrixInformationSchema.parse({});
      this.terrainTypes = new Array<TerrainType>();
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
    // only valid below
    /*
    if (!(this.treelineLow || this.elevationLow) && (this.treelineHigh || this.elevationHigh)) {
      return undefined;
    }
    */

    if (this.hasDaytimeDependency) {
      if (this.dangerPeak !== Daytime.afternoon) {
        return this.eawsMatrixInformation.dangerRating;
      } else {
        return DangerRating.low;
      }
    } else {
      return this.eawsMatrixInformation.dangerRating;
    }
  }

  getAfternoonDangerRatingAbove(): DangerRating {
    // only valid below
    /*
    if (!(this.treelineLow || this.elevationLow) && (this.treelineHigh || this.elevationHigh)) {
        return undefined;
    }
    */

    if (this.hasDaytimeDependency) {
      if (this.dangerPeak !== Daytime.afternoon) {
        return DangerRating.low;
      } else {
        return this.eawsMatrixInformation.dangerRating;
      }
    } else {
      return this.eawsMatrixInformation.dangerRating;
    }
  }

  getForenoonDangerRatingBelow(): DangerRating {
    // only valid above
    /*
    if (!(this.treelineHigh || this.elevationHigh) && (this.treelineLow || this.elevationLow)) {
      return undefined;
    }
    */

    if (this.hasDaytimeDependency) {
      if (this.dangerPeak !== Daytime.afternoon) {
        return this.eawsMatrixInformation.dangerRating;
      } else {
        return DangerRating.low;
      }
    } else {
      return this.eawsMatrixInformation.dangerRating;
    }
  }

  getAfternoonDangerRatingBelow(): DangerRating {
    // only valid above
    /*
    if (!(this.treelineHigh || this.elevationHigh) && (this.treelineLow || this.elevationLow)) {
      return undefined;
    }
    */

    if (this.hasDaytimeDependency) {
      if (this.dangerPeak !== Daytime.afternoon) {
        return DangerRating.low;
      } else {
        return this.eawsMatrixInformation.dangerRating;
      }
    } else {
      return this.eawsMatrixInformation.dangerRating;
    }
  }

  updateDangerRating() {}

  getAvalancheProblem(): AvalancheProblem {
    switch (this.avalancheType) {
      case AvalancheType.slab:
        switch (this.slabGrainShape) {
          case GrainShape.PP:
          case GrainShape.DF:
          case GrainShape.RG:
          case GrainShape.FC:
            if (this.weakLayerPersistent) {
              switch (this.dangerSpotRecognizability) {
                case Recognizability.very_easy:
                case Recognizability.easy:
                  return AvalancheProblem.wind_slab;
                case Recognizability.hard:
                case Recognizability.very_hard:
                  return AvalancheProblem.persistent_weak_layers;
                default:
                  return undefined;
              }
            } else {
              switch (this.dangerSpotRecognizability) {
                case Recognizability.very_easy:
                case Recognizability.easy:
                  return AvalancheProblem.wind_slab;
                case Recognizability.hard:
                case Recognizability.very_hard:
                  return AvalancheProblem.new_snow;
                default:
                  return undefined;
              }
            }
          case GrainShape.MF:
            return AvalancheProblem.wet_snow;
          case GrainShape.MFcr:
            if (this.weakLayerPersistent) {
              return AvalancheProblem.persistent_weak_layers;
            } else {
              return AvalancheProblem.wet_snow;
            }
          default:
            return undefined;
        }
      case AvalancheType.loose:
        switch (this.looseSnowGrainShape) {
          case GrainShape.PP:
          case GrainShape.DF:
            return AvalancheProblem.new_snow;
          case GrainShape.MF:
            return AvalancheProblem.wet_snow;
          case GrainShape.FC:
          case GrainShape.DH:
          case GrainShape.SH:
            return undefined;
          default:
            return undefined;
        }
      case AvalancheType.glide:
        return AvalancheProblem.gliding_snow;
      default:
        return undefined;
    }
  }

  compareTo(other: DangerSourceVariantModel): number {
    if (this.eawsMatrixInformation.dangerRating < other.eawsMatrixInformation.dangerRating) {
      return -1;
    } else if (this.eawsMatrixInformation.dangerRating > other.eawsMatrixInformation.dangerRating) {
      return 1;
    } else {
      if (this.eawsMatrixInformation.snowpackStabilityValue < other.eawsMatrixInformation.snowpackStabilityValue) {
        return -1;
      } else if (
        this.eawsMatrixInformation.snowpackStabilityValue > other.eawsMatrixInformation.snowpackStabilityValue
      ) {
        return 1;
      } else {
        if (this.eawsMatrixInformation.avalancheSizeValue < other.eawsMatrixInformation.avalancheSizeValue) {
          return -1;
        } else if (this.eawsMatrixInformation.avalancheSizeValue > other.eawsMatrixInformation.avalancheSizeValue) {
          return 1;
        } else {
          return 0;
        }
      }
    }
  }
}
