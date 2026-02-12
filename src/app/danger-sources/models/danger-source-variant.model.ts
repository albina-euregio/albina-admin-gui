import { Aspect, AvalancheProblem, AvalancheType, DangerRating, RegionStatus, Tendency } from "../../enums/enums";
import * as Enums from "../../enums/enums";
import { MatrixInformationSchema } from "../../models/matrix-information.model";
import { DangerSourceSchema } from "./danger-source.model";
import { PolygonObject } from "./polygon-object.model";
import { ZSchema } from "./zod-util";
import { orderBy } from "es-toolkit";
import { z } from "zod/v4";

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
  glide_cracks = "glide_cracks",
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

export const DangerSourceVariantSchema = z.object({
  id: z.string().nullish(),
  title: z.string().nullish(),
  comment: z.string().nullish(),
  uncertainties: z.string().nullish(),
  textcat: z.string().nullish(),

  originalDangerSourceVariantId: z.string().nullish(),
  forecastDangerSourceVariantId: z.string().nullish(),
  dangerSource: DangerSourceSchema,
  creationDate: z.coerce.date().nullish(),
  updateDate: z.coerce.date().nullish(),
  validFrom: z.coerce.date().nullish(),
  validUntil: z.coerce.date().nullish(),
  dangerSourceVariantStatus: z.enum(DangerSourceVariantStatus).nullish(),
  dangerSourceVariantType: z.enum(DangerSourceVariantType).nullish(),
  ownerRegion: z.string().nullish(),
  regions: z.string().array().nullish(),
  hasDaytimeDependency: z.boolean().nullish(),
  avalancheType: z.enum(AvalancheType).nullish(),
  aspects: z.enum(Aspect).array().nullish(),
  elevationHigh: z.number().nullish(),
  treelineHigh: z.boolean().nullish(),
  elevationLow: z.number().nullish(),
  treelineLow: z.boolean().nullish(),
  aspectsOfExistence: z.enum(Aspect).array().nullish(),
  elevationHighOfExistence: z.number().nullish(),
  treelineHighOfExistence: z.boolean().nullish(),
  elevationLowOfExistence: z.number().nullish(),
  treelineLowOfExistence: z.boolean().nullish(),
  dangerIncreaseWithElevation: z.boolean().nullish(),
  highestDangerAspect: z.enum([Aspect.N, Aspect.E, Aspect.S, Aspect.W]).nullish(),
  dangerPeak: z.enum(Daytime).nullish(),
  slopeGradient: z.enum(SlopeGradient).nullish(),
  runoutIntoGreen: z.boolean().nullish(),
  penetrateDeepLayers: z.boolean().nullish(),
  naturalRelease: z.enum(Probability).nullish(),
  dangerSigns: z.enum(DangerSign).array().nullish(),
  eawsMatrixInformation: MatrixInformationSchema.nullish(),

  /** --------------------- */
  /** GLIDE SNOW AVALANCHES */
  /** --------------------- */
  glidingSnowActivity: z.enum(GlidingSnowActivity).nullish(),
  glidingSnowActivityValue: z.number().nullish(),
  snowHeightUpperLimit: z.number().nullish(),
  snowHeightLowerLimit: z.number().nullish(),
  snowHeightAverage: z.number().nullish(),
  zeroDegreeIsotherm: z.boolean().nullish(),

  /** --------------- */
  /** SLAB AVALANCHES */
  /** --------------- */
  slabGrainShape: z.enum(GrainShape).nullish(),
  slabThicknessUpperLimit: z.number().nullish(),
  slabThicknessLowerLimit: z.number().nullish(),
  slabHandHardnessUpperLimit: z.enum(HandHardness).nullish(),
  slabHandHardnessLowerLimit: z.enum(HandHardness).nullish(),
  slabHardnessProfile: z.enum(Tendency).nullish(),
  slabEnergyTransferPotential: z.enum(Characteristic).nullish(),
  slabDistribution: z.enum(Distribution).nullish(),
  weakLayerGrainShapes: z.enum(GrainShape).array().nullish(),
  weakLayerGrainSizeUpperLimit: z.number().nullish(),
  weakLayerGrainSizeLowerLimit: z.number().nullish(),
  weakLayerPersistent: z.boolean().nullish(),
  weakLayerThickness: z.enum(Thickness).nullish(),
  weakLayerStrength: z.enum(Characteristic).nullish(),
  weakLayerWet: z.boolean().nullish(),
  weakLayerCrustAbove: z.enum(WeakLayerCrust).nullish(),
  weakLayerCrustBelow: z.enum(WeakLayerCrust).nullish(),
  weakLayerPosition: z.enum(SnowpackPosition).nullish(),
  weakLayerCreation: z.enum(CreationProcess).nullish(),
  weakLayerDistribution: z.enum(Distribution).nullish(),
  dangerSpotRecognizability: z.enum(Recognizability).nullish(),
  remoteTriggering: z.enum(Probability).nullish(),
  terrainTypes: z.enum(TerrainType).array().nullish(),

  /** --------------------- */
  /** LOOSE SNOW AVALANCHES */
  /** --------------------- */
  looseSnowGrainShape: z.enum(GrainShape).nullish(),
  looseSnowMoisture: z.enum(Wetness).nullish(),
});

export class DangerSourceVariantModel extends ZSchema(DangerSourceVariantSchema) implements PolygonObject {
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

export function sortDangerSourceVariantsByRelevance(dangerSourceVariants: DangerSourceVariantModel[]) {
  orderBy(
    dangerSourceVariants,
    [
      // 1. dangerRating (desc)
      (v) => Enums.WarnLevel[v.eawsMatrixInformation?.dangerRating] ?? -1,
      // 2. dangerRatingModificator (desc)
      (v) =>
        // Order: plus (1) > equal (0) > minus (-1) > null/undefined
        [
          Enums.DangerRatingModificator.plus,
          Enums.DangerRatingModificator.equal,
          Enums.DangerRatingModificator.minus,
          null,
          undefined,
        ].indexOf(v.eawsMatrixInformation?.dangerRatingModificator ?? null),
      // 3. snowpackStability (desc)
      (v) =>
        // Order: very_poor > poor > fair > good > null/undefined
        [
          Enums.SnowpackStability.very_poor,
          Enums.SnowpackStability.poor,
          Enums.SnowpackStability.fair,
          Enums.SnowpackStability.good,
          null,
          undefined,
        ].indexOf(v.eawsMatrixInformation?.snowpackStability ?? null),
      // 4. avalancheSize (desc)
      (v) =>
        // Order: extreme > very_large > large > medium > small > null/undefined
        [
          Enums.AvalancheSize.extreme,
          Enums.AvalancheSize.very_large,
          Enums.AvalancheSize.large,
          Enums.AvalancheSize.medium,
          Enums.AvalancheSize.small,
          null,
          undefined,
        ].indexOf(v.eawsMatrixInformation?.avalancheSize ?? null),
    ],
    ["desc", "asc", "asc", "asc"],
  );
}
