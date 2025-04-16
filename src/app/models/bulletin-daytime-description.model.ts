import * as Enums from "../enums/enums";
import { AvalancheProblemModel } from "./avalanche-problem.model";
import { TextModel } from "./text.model";

export class BulletinDaytimeDescriptionModel {
  public dangerRatingAbove: Enums.DangerRating;
  public terrainFeatureAboveTextcat: string;
  public terrainFeatureAbove: TextModel[];

  public dangerRatingBelow: Enums.DangerRating;
  public terrainFeatureBelowTextcat: string;
  public terrainFeatureBelow: TextModel[];

  public hasElevationDependency: boolean;
  public elevation: number;
  public treeline: boolean;

  public avalancheProblem1: AvalancheProblemModel;
  public avalancheProblem2: AvalancheProblemModel;
  public avalancheProblem3: AvalancheProblemModel;
  public avalancheProblem4: AvalancheProblemModel;
  public avalancheProblem5: AvalancheProblemModel;

  public isAvalancheProblemOpen = Array(5).fill(false);

  static createFromJson(json) {
    const bulletinDaytimeDescription = new BulletinDaytimeDescriptionModel();

    bulletinDaytimeDescription.dangerRatingAbove = json.dangerRatingAbove;

    if (json.terrainFeatureAboveTextcat) {
      bulletinDaytimeDescription.terrainFeatureAboveTextcat = json.terrainFeatureAboveTextcat;
    }
    const jsonTerrainFeatureAbove = json.terrainFeatureAbove;
    const terrainFeatureAbove = new Array<TextModel>();
    for (const i in jsonTerrainFeatureAbove) {
      if (jsonTerrainFeatureAbove[i] !== null) {
        terrainFeatureAbove.push(TextModel.createFromJson(jsonTerrainFeatureAbove[i]));
      }
    }
    bulletinDaytimeDescription.terrainFeatureAbove = terrainFeatureAbove;

    bulletinDaytimeDescription.dangerRatingBelow = json.dangerRatingBelow;

    if (json.terrainFeatureBelowTextcat) {
      bulletinDaytimeDescription.terrainFeatureBelowTextcat = json.terrainFeatureBelowTextcat;
    }
    const jsonTerrainFeatureBelow = json.terrainFeatureBelow;
    const terrainFeatureBelow = new Array<TextModel>();
    for (const i in jsonTerrainFeatureBelow) {
      if (jsonTerrainFeatureBelow[i] !== null) {
        terrainFeatureBelow.push(TextModel.createFromJson(jsonTerrainFeatureBelow[i]));
      }
    }
    bulletinDaytimeDescription.terrainFeatureBelow = terrainFeatureBelow;

    if (json.avalancheProblem1) {
      bulletinDaytimeDescription.avalancheProblem1 = AvalancheProblemModel.createFromJson(json.avalancheProblem1);
    }
    if (json.avalancheProblem2) {
      bulletinDaytimeDescription.avalancheProblem2 = AvalancheProblemModel.createFromJson(json.avalancheProblem2);
    }
    if (json.avalancheProblem3) {
      bulletinDaytimeDescription.avalancheProblem3 = AvalancheProblemModel.createFromJson(json.avalancheProblem3);
    }
    if (json.avalancheProblem4) {
      bulletinDaytimeDescription.avalancheProblem4 = AvalancheProblemModel.createFromJson(json.avalancheProblem4);
    }
    if (json.avalancheProblem5) {
      bulletinDaytimeDescription.avalancheProblem5 = AvalancheProblemModel.createFromJson(json.avalancheProblem5);
    }

    bulletinDaytimeDescription.elevation = json.elevation;
    bulletinDaytimeDescription.treeline = json.treeline;
    bulletinDaytimeDescription.hasElevationDependency = json.hasElevationDependency;

    return bulletinDaytimeDescription;
  }

  constructor(bulletinDaytimeDescription?: BulletinDaytimeDescriptionModel) {
    this.dangerRatingAbove = Enums.DangerRating.low;
    this.dangerRatingBelow = Enums.DangerRating.low;

    if (!bulletinDaytimeDescription) {
      this.dangerRatingAbove = Enums.DangerRating.low;
      this.terrainFeatureAboveTextcat = undefined;
      this.terrainFeatureAbove = new Array<TextModel>();
      this.dangerRatingBelow = Enums.DangerRating.low;
      this.terrainFeatureBelowTextcat = undefined;
      this.terrainFeatureBelow = new Array<TextModel>();
      this.elevation = undefined;
      this.treeline = false;
      this.hasElevationDependency = false;
    } else {
      this.dangerRatingAbove = bulletinDaytimeDescription.dangerRatingAbove;
      this.terrainFeatureAboveTextcat = bulletinDaytimeDescription.terrainFeatureAboveTextcat;
      const arrayAbove = new Array<TextModel>();
      for (const entry of bulletinDaytimeDescription.terrainFeatureAbove) {
        arrayAbove.push(TextModel.createFromJson(entry.toJson()));
      }
      this.terrainFeatureAbove = arrayAbove;
      this.dangerRatingBelow = bulletinDaytimeDescription.dangerRatingBelow;
      this.terrainFeatureBelowTextcat = bulletinDaytimeDescription.terrainFeatureBelowTextcat;
      const arrayBelow = new Array<TextModel>();
      for (const entry of bulletinDaytimeDescription.terrainFeatureBelow) {
        arrayBelow.push(TextModel.createFromJson(entry.toJson()));
      }
      this.terrainFeatureBelow = arrayBelow;
      if (bulletinDaytimeDescription.avalancheProblem1 !== undefined) {
        this.avalancheProblem1 = new AvalancheProblemModel(bulletinDaytimeDescription.avalancheProblem1);
      }
      if (bulletinDaytimeDescription.avalancheProblem2 !== undefined) {
        this.avalancheProblem2 = new AvalancheProblemModel(bulletinDaytimeDescription.avalancheProblem2);
      }
      if (bulletinDaytimeDescription.avalancheProblem3 !== undefined) {
        this.avalancheProblem3 = new AvalancheProblemModel(bulletinDaytimeDescription.avalancheProblem3);
      }
      if (bulletinDaytimeDescription.avalancheProblem4 !== undefined) {
        this.avalancheProblem4 = new AvalancheProblemModel(bulletinDaytimeDescription.avalancheProblem4);
      }
      if (bulletinDaytimeDescription.avalancheProblem5 !== undefined) {
        this.avalancheProblem5 = new AvalancheProblemModel(bulletinDaytimeDescription.avalancheProblem5);
      }
      this.elevation = bulletinDaytimeDescription.elevation;
      this.treeline = bulletinDaytimeDescription.treeline;
      this.hasElevationDependency = bulletinDaytimeDescription.hasElevationDependency;
    }
  }

  getSecondDangerRating(up: boolean): Enums.DangerRating {
    const dangerRatings: Enums.DangerRating[] = [
      this.getDangerRating(this.avalancheProblem2, up),
      this.getDangerRating(this.avalancheProblem3, up),
      this.getDangerRating(this.avalancheProblem4, up),
      this.getDangerRating(this.avalancheProblem5, up),
    ];
    return dangerRatings
      .filter((r) => !!r)
      .reduce((r1, r2) => (Enums.WarnLevel[r1] > Enums.WarnLevel[r2] ? r1 : r2), Enums.DangerRating.low);
  }

  getDangerRating(avalancheProblem: AvalancheProblemModel, up: boolean): Enums.DangerRating {
    let boundaryAvalancheProblem;
    let boundaryBulletin;

    if (avalancheProblem) {
      if (up) {
        if (avalancheProblem.treelineLow) {
          boundaryAvalancheProblem = 2000;
        } else {
          boundaryAvalancheProblem = avalancheProblem.elevationLow;
        }
      } else {
        if (avalancheProblem.treelineHigh) {
          boundaryAvalancheProblem = 1800;
        } else {
          boundaryAvalancheProblem = avalancheProblem.elevationHigh;
        }
      }

      if (up) {
        if (this.treeline) {
          boundaryBulletin = 2000;
        } else {
          boundaryBulletin = this.elevation;
        }
        if (boundaryAvalancheProblem === undefined || boundaryAvalancheProblem < boundaryBulletin) {
          return avalancheProblem.getDangerRating();
        }
      } else {
        if (this.treeline) {
          boundaryBulletin = 1800;
        } else {
          boundaryBulletin = this.elevation;
        }
        if (
          boundaryAvalancheProblem === undefined ||
          boundaryAvalancheProblem === null ||
          boundaryAvalancheProblem > boundaryBulletin
        ) {
          return avalancheProblem.getDangerRating();
        }
      }
    }
  }

  updateDangerRating() {
    if (this.avalancheProblem1) {
      // ap.1
      if (this.avalancheProblem1.elevationHigh > 0 || this.avalancheProblem1.treelineHigh) {
        if (this.avalancheProblem1.elevationLow > 0 || this.avalancheProblem1.treelineLow) {
          // band
          if (
            this.avalancheProblem1.dangerRatingDirection &&
            this.avalancheProblem1.dangerRatingDirection.toString() === Enums.DangerRatingDirection.down
          ) {
            if (this.avalancheProblem1.treelineHigh) {
              this.treeline = true;
              this.elevation = undefined;
            } else {
              this.treeline = false;
              this.elevation = this.avalancheProblem1.elevationHigh;
            }
            this.hasElevationDependency = true;
            this.dangerRatingBelow = this.avalancheProblem1.getDangerRating();
            this.dangerRatingAbove = this.getSecondDangerRating(false);
          } else if (
            this.avalancheProblem1.dangerRatingDirection &&
            this.avalancheProblem1.dangerRatingDirection.toString() === Enums.DangerRatingDirection.up
          ) {
            if (this.avalancheProblem1.treelineLow) {
              this.treeline = true;
              this.elevation = undefined;
            } else {
              this.treeline = false;
              this.elevation = this.avalancheProblem1.elevationLow;
            }
            this.hasElevationDependency = true;
            this.dangerRatingAbove = this.avalancheProblem1.getDangerRating();
            this.dangerRatingBelow = this.getSecondDangerRating(true);
          } else {
            this.treeline = false;
            this.elevation = undefined;
            this.hasElevationDependency = false;
            this.dangerRatingAbove = this.avalancheProblem1.getDangerRating();
            this.dangerRatingBelow = this.avalancheProblem1.getDangerRating();
          }
        } else {
          // only elevation high
          if (this.avalancheProblem1.treelineHigh) {
            this.treeline = true;
            this.elevation = undefined;
          } else {
            this.treeline = false;
            this.elevation = this.avalancheProblem1.elevationHigh;
          }
          this.hasElevationDependency = true;
          this.dangerRatingBelow = this.avalancheProblem1.getDangerRating();
          this.dangerRatingAbove = this.getSecondDangerRating(false);
        }
      } else if (this.avalancheProblem1.elevationLow > 0 || this.avalancheProblem1.treelineLow) {
        // only elevation low
        if (this.avalancheProblem1.treelineLow) {
          this.treeline = true;
          this.elevation = undefined;
        } else {
          this.treeline = false;
          this.elevation = this.avalancheProblem1.elevationLow;
        }
        this.hasElevationDependency = true;
        this.dangerRatingAbove = this.avalancheProblem1.getDangerRating();
        this.dangerRatingBelow = this.getSecondDangerRating(true);
      } else {
        // no elevation
        this.treeline = false;
        this.elevation = undefined;
        this.hasElevationDependency = false;
        this.dangerRatingAbove = this.avalancheProblem1.getDangerRating();
        this.dangerRatingBelow = this.avalancheProblem1.getDangerRating();
      }
    } else {
      this.treeline = false;
      this.elevation = undefined;
      this.hasElevationDependency = false;
      this.dangerRatingAbove = Enums.DangerRating.low;
      this.dangerRatingBelow = Enums.DangerRating.low;
    }
  }

  toJson() {
    const json = Object();

    if (this.dangerRatingAbove) {
      json["dangerRatingAbove"] = this.dangerRatingAbove;
    }
    if (this.terrainFeatureAboveTextcat) {
      json["terrainFeatureAboveTextcat"] = this.terrainFeatureAboveTextcat;
    }
    if (this.terrainFeatureAbove && this.terrainFeatureAbove.length > 0) {
      const terrainFeature = [];
      for (let i = 0; i <= this.terrainFeatureAbove.length - 1; i++) {
        terrainFeature.push(this.terrainFeatureAbove[i].toJson());
      }
      json["terrainFeatureAbove"] = terrainFeature;
    }
    if (this.hasElevationDependency && this.dangerRatingBelow) {
      json["dangerRatingBelow"] = this.dangerRatingBelow;
    }
    if (this.hasElevationDependency && this.terrainFeatureBelowTextcat) {
      json["terrainFeatureBelowTextcat"] = this.terrainFeatureBelowTextcat;
    }
    if (this.hasElevationDependency && this.terrainFeatureBelow && this.terrainFeatureBelow.length > 0) {
      const terrainFeature = [];
      for (let i = 0; i <= this.terrainFeatureBelow.length - 1; i++) {
        terrainFeature.push(this.terrainFeatureBelow[i].toJson());
      }
      json["terrainFeatureBelow"] = terrainFeature;
    }

    if (this.avalancheProblem1) {
      json["avalancheProblem1"] = this.avalancheProblem1.toJson();
    }
    if (this.avalancheProblem2) {
      json["avalancheProblem2"] = this.avalancheProblem2.toJson();
    }
    if (this.avalancheProblem3) {
      json["avalancheProblem3"] = this.avalancheProblem3.toJson();
    }
    if (this.avalancheProblem4) {
      json["avalancheProblem4"] = this.avalancheProblem4.toJson();
    }
    if (this.avalancheProblem5) {
      json["avalancheProblem5"] = this.avalancheProblem5.toJson();
    }

    // TODO delete if AINEVA does not need it anymore
    if (this.avalancheProblem1) {
      json["avalancheSituation1"] = this.avalancheProblem1.toAinevaJson();
    }
    if (this.avalancheProblem2) {
      json["avalancheSituation2"] = this.avalancheProblem2.toAinevaJson();
    }
    if (this.avalancheProblem3) {
      json["avalancheSituation3"] = this.avalancheProblem3.toAinevaJson();
    }
    if (this.avalancheProblem4) {
      json["avalancheSituation4"] = this.avalancheProblem4.toAinevaJson();
    }
    if (this.avalancheProblem5) {
      json["avalancheSituation5"] = this.avalancheProblem5.toAinevaJson();
    }

    if (this.hasElevationDependency) {
      json["hasElevationDependency"] = true;
      if (this.treeline) {
        json["treeline"] = this.treeline;
      } else if (this.elevation) {
        json["elevation"] = this.elevation;
      }
    } else {
      json["hasElevationDependency"] = false;
    }

    return json;
  }
}
