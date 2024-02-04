import * as Enums from "../enums/enums";
import { MatrixInformationModel } from "./matrix-information.model";
import { TextModel } from "./text.model";

export class DangerSourceVariantModel {
  public id: string;

  public avalancheType: Enums.AvalancheType;
  
  
  // variant
  public variants: DangerSourceVariant[];
  public regions: String[];
  public validity: Enums.Validity;

  public avalancheProblem: Enums.AvalancheProblem;
  public aspects: Enums.Aspect[];
  public elevationHigh: number;
  public treelineHigh: boolean;
  public elevationLow: number;
  public treelineLow: boolean;
  public dangerRatingDirection: Enums.Direction;
  public matrixInformation: MatrixInformationModel;
  public terrainFeatureTextcat: string;
  public terrainFeature: TextModel[];

  static createFromJson(json) {
    const dangerSource = new DangerSourceModel();
    return dangerSource;
  }

  constructor() {
    this.regions = new Array<String>();
  }

  getId(): string {
    return this.id;
  }

  setId(id: string) {
    this.id = id;
  }

  getRegions(): String[] {
    return this.regions;
  }

  setRegions(Regions: String[]) {
    this.regions = Regions;
  }

  getValidFrom(): Date {
    return this.validFrom;
  }

  setValidFrom(validFrom: Date) {
    this.validFrom = validFrom;
  }

  getValidUntil(): Date {
    return this.validUntil;
  }

  setValidUntil(validUntil: Date) {
    this.validUntil = validUntil;
  }

  getForenoonDangerRatingAbove(): Enums.DangerRating {
    // TODO implement
    return Enums.DangerRating.considerable;
  }

  getAfternoonDangerRatingAbove(): Enums.DangerRating {
    // TODO implement
    return Enums.DangerRating.moderate;
  }

  getForenoonDangerRatingBelow(): Enums.DangerRating {
    // TODO implement
    return Enums.DangerRating.moderate;
  }

  getAfternoonDangerRatingBelow(): Enums.DangerRating {
    // TODO implement
    return Enums.DangerRating.low;
  }

  toJson() {
    const json = Object();

    // TODO implement

    return json;
  }
}
