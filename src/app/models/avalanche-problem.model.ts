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
    avalancheProblem.setAspects(aspects);
    avalancheProblem.elevationHigh = json.elevationHigh;
    avalancheProblem.treelineHigh = json.treelineHigh;
    avalancheProblem.elevationLow = json.elevationLow;
    avalancheProblem.treelineLow = json.treelineLow;

    if (json.dangerRatingDirection) {
      avalancheProblem.setDangerRatingDirection(json.dangerRatingDirection);
    }

    if (json.eawsMatrixInformation) {
      avalancheProblem.matrixInformation = MatrixInformationModel.createFromJson(json.eawsMatrixInformation);
    }

    if (json.terrainFeatureTextcat) {
      avalancheProblem.setTerrainFeatureTextcat(json.terrainFeatureTextcat);
    }
    const jsonTerrainFeature = json.terrainFeature;
    const terrainFeature = new Array<TextModel>();
    for (const i in jsonTerrainFeature) {
      if (jsonTerrainFeature[i] !== null) {
        terrainFeature.push(TextModel.createFromJson(jsonTerrainFeature[i]));
      }
    }
    avalancheProblem.setTerrainFeature(terrainFeature);

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
      this.setAvalancheProblem(avalancheProblem.getAvalancheProblem());
      this.setAvalancheType(avalancheProblem.getAvalancheType());
      for (const aspect of avalancheProblem.aspects) {
        this.aspects.push(aspect);
      }
      this.elevationHigh = avalancheProblem.getElevationHigh();
      this.treelineHigh = avalancheProblem.getTreelineHigh();
      this.elevationLow = avalancheProblem.getElevationLow();
      this.treelineLow = avalancheProblem.getTreelineLow();
      this.dangerRatingDirection = avalancheProblem.getDangerRatingDirection();
      this.matrixInformation = new MatrixInformationModel(avalancheProblem.getMatrixInformation());
      this.terrainFeatureTextcat = avalancheProblem.terrainFeatureTextcat;
      const array = new Array<TextModel>();
      for (const entry of avalancheProblem.terrainFeature) {
        array.push(TextModel.createFromJson(entry.toJson()));
      }
      this.terrainFeature = array;
    }
  }

  getAvalancheProblem(): Enums.AvalancheProblem {
    return this.avalancheProblem;
  }

  setAvalancheProblem(avalancheProblem: Enums.AvalancheProblem) {
    this.avalancheProblem = avalancheProblem;
    this.avalancheType = undefined;
    switch (this.avalancheProblem) {
      case "wind_slab":
      case "persistent_weak_layers":
        this.setAvalancheType(Enums.AvalancheType.slab);
        break;
      case "gliding_snow":
        this.setAvalancheType(Enums.AvalancheType.glide);
        break;
      default:
        break;
    }
  }

  getAvalancheType(): Enums.AvalancheType {
    return this.avalancheType;
  }

  setAvalancheType(avalancheType: Enums.AvalancheType) {
    this.avalancheType = avalancheType;
  }

  getAspects() {
    return this.aspects;
  }

  setAspects(aspects) {
    this.aspects = aspects;
  }

  getElevationHigh() {
    return this.elevationHigh;
  }

  setElevationHigh(elevationHigh: number) {
    this.elevationHigh = elevationHigh;
  }

  getTreelineHigh() {
    return this.treelineHigh;
  }

  setTreelineHigh(treeline: boolean) {
    this.treelineHigh = treeline;
  }

  getElevationLow() {
    return this.elevationLow;
  }

  setElevationLow(elevationLow: number) {
    this.elevationLow = elevationLow;
  }

  getTreelineLow() {
    return this.treelineLow;
  }

  setTreelineLow(treeline: boolean) {
    this.treelineLow = treeline;
  }

  getDangerRatingDirection() {
    return this.dangerRatingDirection;
  }

  setDangerRatingDirection(dangerRatingDirection: Enums.DangerRatingDirection) {
    this.dangerRatingDirection = dangerRatingDirection;
  }

  getMatrixInformation() {
    return this.matrixInformation;
  }

  setMatrixInformation(matrixInformation) {
    this.matrixInformation = matrixInformation;
  }

  getTerrainFeatureTextcat(): string {
    return this.terrainFeatureTextcat;
  }

  setTerrainFeatureTextcat(terrainFeatureTextcat: string) {
    this.terrainFeatureTextcat = terrainFeatureTextcat;
  }

  getTerrainFeature(): TextModel[] {
    return this.terrainFeature;
  }

  getTerrainFeatureIn(language: string): string {
    for (let i = this.terrainFeature.length - 1; i >= 0; i--) {
      if (this.terrainFeature[i].getLanguageCode() === language) {
        return this.terrainFeature[i].getText();
      }
    }
  }

  getTerrainFeatureInString(language: string): string {
    return this.getTerrainFeatureIn(language);
  }

  setTerrainFeature(terrainFeature: TextModel[]) {
    this.terrainFeature = terrainFeature;
  }

  setTerrainFeatureIn(text: string, language: string) {
    for (let i = this.terrainFeature.length - 1; i >= 0; i--) {
      if (this.terrainFeature[i].getLanguageCode() === language) {
        this.terrainFeature[i].setText(text);
        return;
      }
    }
    const model = new TextModel();
    model.setLanguageCode(language);
    model.setText(text);
    this.terrainFeature.push(model);
  }

  getDangerRating() {
    return this.matrixInformation.getDangerRating();
  }

  hasElevationHigh() {
    return this.getTreelineHigh() || (this.getElevationHigh() && this.getElevationHigh() !== undefined);
  }

  hasElevationLow() {
    return this.getTreelineLow() || (this.getElevationLow() && this.getElevationLow() !== undefined);
  }

  isDangerRating(dangerRating) {
    return this.getDangerRating() === dangerRating;
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
      const terrainFeature = [];
      for (let i = 0; i <= this.terrainFeature.length - 1; i++) {
        terrainFeature.push(this.terrainFeature[i].toJson());
      }
      json["terrainFeature"] = terrainFeature;
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
      const terrainFeature = [];
      for (let i = 0; i <= this.terrainFeature.length - 1; i++) {
        terrainFeature.push(this.terrainFeature[i].toJson());
      }
      json["terrainFeature"] = terrainFeature;
    }

    return json;
  }
}
