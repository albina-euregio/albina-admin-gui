import * as Enums from "../enums/enums";

export interface MatrixInformationModel {
  dangerRating: Enums.DangerRating;
  dangerRatingModificator: Enums.DangerRatingModificator;
  avalancheSize: Enums.AvalancheSize;
  snowpackStability: Enums.SnowpackStability;
  frequency: Enums.Frequency;
  avalancheSizeValue: number;
  snowpackStabilityValue: number;
  frequencyValue: number;
}
