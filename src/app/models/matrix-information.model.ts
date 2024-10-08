import * as Enums from "../enums/enums";

export class MatrixInformationModel {
  public dangerRating: Enums.DangerRating;
  public dangerRatingModificator: Enums.DangerRatingModificator;
  public avalancheSize: Enums.AvalancheSize;
  public snowpackStability: Enums.SnowpackStability;
  public frequency: Enums.Frequency;
  public avalancheSizeValue: number;
  public snowpackStabilityValue: number;
  public frequencyValue: number;

  static createFromJson(json) {
    const matrixInformation = new MatrixInformationModel();
    matrixInformation.dangerRating = json.dangerRating;
    matrixInformation.dangerRatingModificator = json.dangerRatingModificator;
    matrixInformation.avalancheSize = json.avalancheSize;
    matrixInformation.snowpackStability = json.snowpackStability;
    matrixInformation.frequency = json.frequency;
    matrixInformation.avalancheSizeValue = json.avalancheSizeValue;
    matrixInformation.snowpackStabilityValue = json.snowpackStabilityValue;
    matrixInformation.frequencyValue = json.frequencyValue;

    return matrixInformation;
  }

  constructor(matrixInformation?: MatrixInformationModel) {
    if (!matrixInformation) {
      this.setDangerRating(Enums.DangerRating.missing);
      this.dangerRatingModificator = undefined;
      this.avalancheSize = undefined;
      this.snowpackStability = undefined;
      this.frequency = undefined;
      this.avalancheSizeValue = undefined;
      this.snowpackStabilityValue = undefined;
      this.frequencyValue = undefined;
    } else {
      this.setDangerRating(matrixInformation.dangerRating);
      this.dangerRatingModificator = matrixInformation.dangerRatingModificator;
      this.avalancheSize = matrixInformation.avalancheSize;
      this.snowpackStability = matrixInformation.snowpackStability;
      this.frequency = matrixInformation.frequency;
      this.avalancheSizeValue = matrixInformation.avalancheSizeValue;
      this.snowpackStabilityValue = matrixInformation.snowpackStabilityValue;
      this.frequencyValue = matrixInformation.frequencyValue;
    }
  }

  getDangerRating(): Enums.DangerRating {
    return this.dangerRating;
  }

  setDangerRating(dangerRating: Enums.DangerRating) {
    this.dangerRating = dangerRating;
  }

  getDangerRatingModificator(): Enums.DangerRatingModificator {
    return this.dangerRatingModificator;
  }

  setDangerRatingModificator(dangerRatingModificator: Enums.DangerRatingModificator) {
    this.dangerRatingModificator = dangerRatingModificator;
  }

  getAvalancheSize(): Enums.AvalancheSize {
    return this.avalancheSize;
  }

  setAvalancheSize(avalancheSize: Enums.AvalancheSize) {
    this.avalancheSize = avalancheSize;
  }

  getSnowpackStability(): Enums.SnowpackStability {
    return this.snowpackStability;
  }

  setSnowpackStability(snowpackStability: Enums.SnowpackStability) {
    this.snowpackStability = snowpackStability;
  }

  getFrequency(): Enums.Frequency {
    return this.frequency;
  }

  setFrequency(frequency: Enums.Frequency) {
    this.frequency = frequency;
  }

  getAvalancheSizeValue(): number {
    return this.avalancheSizeValue;
  }

  setAvalancheSizeValue(avalancheSizeValue) {
    this.avalancheSizeValue = avalancheSizeValue;
  }

  getSnowpackStabilityValue(): number {
    return this.snowpackStabilityValue;
  }

  setSnowpackStabilityValue(snowpackStabilityValue) {
    this.snowpackStabilityValue = snowpackStabilityValue;
  }

  getFrequencyValue(): number {
    return this.frequencyValue;
  }

  setFrequencyValue(frequencyValue) {
    this.frequencyValue = frequencyValue;
  }

  toJson() {
    const json = Object();

    if (this.dangerRating && this.dangerRating !== Enums.DangerRating.missing) {
      json["dangerRating"] = this.dangerRating;
    }
    if (this.dangerRatingModificator) {
      json["dangerRatingModificator"] = this.dangerRatingModificator;
    }
    if (this.avalancheSize) {
      json["avalancheSize"] = this.avalancheSize;
    }
    if (this.snowpackStability) {
      json["snowpackStability"] = this.snowpackStability;
    }
    if (this.frequency) {
      json["frequency"] = this.frequency;
    }
    if (this.avalancheSizeValue) {
      json["avalancheSizeValue"] = this.avalancheSizeValue;
    }
    if (this.snowpackStabilityValue) {
      json["snowpackStabilityValue"] = this.snowpackStabilityValue;
    }
    if (this.frequencyValue) {
      json["frequencyValue"] = this.frequencyValue;
    }
    return json;
  }
}
