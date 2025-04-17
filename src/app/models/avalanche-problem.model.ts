import * as Enums from "../enums/enums";
import { MatrixInformationModel } from "./matrix-information.model";
import { TextModel } from "./text.model";

export class AvalancheProblemModel {
  public avalancheProblem: Enums.AvalancheProblem;
  public avalancheType: Enums.AvalancheType;
  public aspects: Enums.Aspect[];
  public elevationHigh: number;
  public treelineHigh: boolean;
  public elevationLow: number;
  public treelineLow: boolean;
  public dangerRatingDirection: Enums.DangerRatingDirection;
  public matrixInformation: MatrixInformationModel;
  public terrainFeatureTextcat: string;
  public terrainFeature: TextModel[];

  static createFromJson(json) {
    const avalancheProblem = new AvalancheProblemModel();

    avalancheProblem.avalancheProblem = json.avalancheProblem;
    avalancheProblem.avalancheType = json.avalancheType;
    const jsonAspects = json.aspects;
    const aspects = new Array<Enums.Aspect>();
    for (const i in jsonAspects) {
      if (jsonAspects[i] !== null) {
        aspects.push(jsonAspects[i].toUpperCase());
      }
    }
    avalancheProblem.aspects = aspects;
    avalancheProblem.elevationHigh = json.elevationHigh;
    avalancheProblem.treelineHigh = json.treelineHigh;
    avalancheProblem.elevationLow = json.elevationLow;
    avalancheProblem.treelineLow = json.treelineLow;

    if (json.dangerRatingDirection) {
      avalancheProblem.dangerRatingDirection = json.dangerRatingDirection;
    }

    if (json.eawsMatrixInformation) {
      avalancheProblem.matrixInformation = MatrixInformationModel.createFromJson(json.eawsMatrixInformation);
    }

    if (json.terrainFeatureTextcat) {
      avalancheProblem.terrainFeatureTextcat = json.terrainFeatureTextcat;
    }
    if (json.terrainFeature) {
      avalancheProblem.terrainFeature = json.terrainFeature;
    }

    return avalancheProblem;
  }

  constructor(avalancheProblem?: AvalancheProblemModel) {
    this.aspects = new Array<Enums.Aspect>();

    if (!avalancheProblem) {
      this.avalancheProblem = undefined;
      this.avalancheType = undefined;
      this.treelineHigh = false;
      this.treelineLow = false;
      this.dangerRatingDirection = undefined;
      this.matrixInformation = new MatrixInformationModel();
      this.terrainFeatureTextcat = undefined;
      this.terrainFeature = new Array<TextModel>();
    } else {
      this.setAvalancheProblem(avalancheProblem.avalancheProblem);
      this.avalancheType = avalancheProblem.avalancheType;
      for (const aspect of avalancheProblem.aspects) {
        this.aspects.push(aspect);
      }
      this.elevationHigh = avalancheProblem.elevationHigh;
      this.treelineHigh = avalancheProblem.treelineHigh;
      this.elevationLow = avalancheProblem.elevationLow;
      this.treelineLow = avalancheProblem.treelineLow;
      this.dangerRatingDirection = avalancheProblem.dangerRatingDirection;
      this.matrixInformation = new MatrixInformationModel(avalancheProblem.matrixInformation);
      this.terrainFeatureTextcat = avalancheProblem.terrainFeatureTextcat;
      this.terrainFeature = avalancheProblem.terrainFeature;
    }
  }

  setAvalancheProblem(avalancheProblem: Enums.AvalancheProblem) {
    this.avalancheProblem = avalancheProblem;
    this.avalancheType = undefined;
    switch (this.avalancheProblem) {
      case "wind_slab":
      case "persistent_weak_layers":
        this.avalancheType = Enums.AvalancheType.slab;
        break;
      case "gliding_snow":
        this.avalancheType = Enums.AvalancheType.glide;
        break;
      default:
        break;
    }
  }

  getDangerRating() {
    return this.matrixInformation.dangerRating;
  }

  hasElevationHigh() {
    return this.treelineHigh || this.elevationHigh;
  }

  hasElevationLow() {
    return this.treelineLow || this.elevationLow;
  }

  toJson() {
    const json = Object();

    if (this.avalancheProblem) {
      json["avalancheProblem"] = this.avalancheProblem;
    }
    if (this.avalancheType) {
      json["avalancheType"] = this.avalancheType;
    }
    if (this.aspects && this.aspects.length > 0) {
      const aspects = [];
      for (let i = 0; i <= this.aspects.length - 1; i++) {
        aspects.push(this.aspects[i]);
      }
      json["aspects"] = aspects;
    }
    if (this.treelineHigh) {
      json["treelineHigh"] = this.treelineHigh;
    } else if (this.elevationHigh) {
      json["elevationHigh"] = this.elevationHigh;
    }
    if (this.treelineLow) {
      json["treelineLow"] = this.treelineLow;
    } else if (this.elevationLow) {
      json["elevationLow"] = this.elevationLow;
    }
    if (this.dangerRatingDirection) {
      json["dangerRatingDirection"] = this.dangerRatingDirection;
    }
    if (this.matrixInformation) {
      json["eawsMatrixInformation"] = this.matrixInformation.toJson();
    }
    if (this.terrainFeatureTextcat) {
      json["terrainFeatureTextcat"] = this.terrainFeatureTextcat;
    }
    if (this.terrainFeature && this.terrainFeature.length > 0) {
      json["terrainFeature"] = this.terrainFeature;
    }

    return json;
  }

  toAinevaJson() {
    const json = Object();

    if (this.avalancheProblem) {
      if (this.avalancheProblem === Enums.AvalancheProblem.wind_slab) {
        json["avalancheSituation"] = "wind_drifted_snow";
      } else {
        json["avalancheSituation"] = this.avalancheProblem;
      }
    }
    if (this.aspects && this.aspects.length > 0) {
      const aspects = [];
      for (let i = 0; i <= this.aspects.length - 1; i++) {
        aspects.push(this.aspects[i]);
      }
      json["aspects"] = aspects;
    }
    if (this.treelineHigh) {
      json["treelineHigh"] = this.treelineHigh;
    } else if (this.elevationHigh) {
      json["elevationHigh"] = this.elevationHigh;
    }
    if (this.treelineLow) {
      json["treelineLow"] = this.treelineLow;
    } else if (this.elevationLow) {
      json["elevationLow"] = this.elevationLow;
    }
    if (this.dangerRatingDirection) {
      json["dangerRatingDirection"] = this.dangerRatingDirection;
    }
    if (this.terrainFeatureTextcat) {
      json["terrainFeatureTextcat"] = this.terrainFeatureTextcat;
    }
    if (this.terrainFeature && this.terrainFeature.length > 0) {
      json["terrainFeature"] = this.terrainFeature;
    }

    return json;
  }
}
