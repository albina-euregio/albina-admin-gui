import { Component, Input, OnChanges } from "@angular/core";
import { SettingsService } from "../providers/settings-service/settings.service";
import { BulletinModel } from "../models/bulletin.model";
import { BulletinDaytimeDescriptionModel } from "../models/bulletin-daytime-description.model";
import { AvalancheSituationModel } from "../models/avalanche-situation.model";
import * as Enums from "../enums/enums";

@Component({
  selector: "app-avalanche-situation-detail",
  templateUrl: "avalanche-situation-detail.component.html"
})
export class AvalancheSituationDetailComponent implements OnChanges {

  @Input() bulletinModel: BulletinModel;
  @Input() bulletinDaytimeDescription: BulletinDaytimeDescriptionModel;
  @Input() afternoon: boolean;
  @Input() avalancheSituationModel: AvalancheSituationModel;
  @Input() disabled: boolean;

  avalancheSituationEnum = Enums.AvalancheSituation;
  useElevationHigh = false;
  useElevationLow = false;

  public terrainFeatureTextcat: string;
  public terrainFeatureDe: string;
  public terrainFeatureIt: string;
  public terrainFeatureEn: string;
  public terrainFeatureFr: string;

  constructor(
    public settingsService: SettingsService) {
  }

  ngOnChanges() {
    if (this.avalancheSituationModel.getTreelineHigh() || this.avalancheSituationModel.getElevationHigh() !== undefined) {
      this.useElevationHigh = true;
    } else {
      this.useElevationHigh = false;
    }
    if (this.avalancheSituationModel.getTreelineLow() || this.avalancheSituationModel.getElevationLow() !== undefined) {
      this.useElevationLow = true;
    } else {
      this.useElevationLow = false;
    }
  }

  isAvalancheSituation(situation) {
    if (this.avalancheSituationModel && this.avalancheSituationModel.avalancheSituation === situation) {
      return true;
    }
    return false;
  }

  selectAvalancheSituation(situation) {
    if (this.isAvalancheSituation(Enums.AvalancheSituation[situation])) {
      this.avalancheSituationModel.setAvalancheSituation(undefined);
      this.avalancheSituationModel.setAspects(new Array<Enums.Aspect>());
    } else {
      this.avalancheSituationModel.setAvalancheSituation(Enums.AvalancheSituation[situation]);
    }
  }

  updateElevationHigh() {
    if (this.avalancheSituationModel) {
      this.avalancheSituationModel.elevationHigh = Math.round(this.avalancheSituationModel.elevationHigh / 100) * 100;
      if (this.avalancheSituationModel.elevationHigh > 9000) {
        this.avalancheSituationModel.elevationHigh = 9000;
      } else if (this.avalancheSituationModel.elevationHigh < 0) {
        this.avalancheSituationModel.elevationHigh = 0;
      }
    }
    this.bulletinModel.updateDangerRating(this.afternoon);
  }

  updateElevationLow() {
    if (this.avalancheSituationModel) {
      this.avalancheSituationModel.elevationLow = Math.round(this.avalancheSituationModel.elevationLow / 100) * 100;
      if (this.avalancheSituationModel.elevationLow > 9000) {
        this.avalancheSituationModel.elevationLow = 9000;
      } else if (this.avalancheSituationModel.elevationLow < 0) {
        this.avalancheSituationModel.elevationLow = 0;
      }
    }
    this.bulletinModel.updateDangerRating(this.afternoon);
  }

  treelineHighClicked(event) {
    event.stopPropagation();
    if (this.avalancheSituationModel.treelineHigh) {
      this.avalancheSituationModel.treelineHigh = false;
    } else {
      this.avalancheSituationModel.treelineHigh = true;
    }
    this.bulletinModel.updateDangerRating(this.afternoon);
  }

  treelineLowClicked(event) {
    event.stopPropagation();
    if (this.avalancheSituationModel.treelineLow) {
      this.avalancheSituationModel.treelineLow = false;
    } else {
      this.avalancheSituationModel.treelineLow = true;
    }
    this.bulletinModel.updateDangerRating(this.afternoon);
  }

  setUseElevationHigh(event) {
    if (!event.currentTarget.checked) {
      this.avalancheSituationModel.treelineHigh = false;
      this.avalancheSituationModel.elevationHigh = undefined;
    }
    this.bulletinModel.updateDangerRating(this.afternoon);
  }

  setUseElevationLow(event) {
    if (!event.currentTarget.checked) {
      this.avalancheSituationModel.treelineLow = false;
      this.avalancheSituationModel.elevationLow = undefined;
    }
    this.bulletinModel.updateDangerRating(this.afternoon);
  }

  deleteTextcat(event) {
    this.terrainFeatureTextcat = undefined;
    this.terrainFeatureDe = undefined;
    this.terrainFeatureIt = undefined;
    this.terrainFeatureEn = undefined;
    this.terrainFeatureFr = undefined;
  }
}
