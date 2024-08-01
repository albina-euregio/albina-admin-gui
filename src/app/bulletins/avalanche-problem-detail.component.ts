import { Component, EventEmitter, Input, OnChanges, Output } from "@angular/core";
import { SettingsService } from "../providers/settings-service/settings.service";
import { AuthenticationService } from "../providers/authentication-service/authentication.service";
import { BulletinDaytimeDescriptionModel } from "../models/bulletin-daytime-description.model";
import { AvalancheProblemModel } from "../models/avalanche-problem.model";
import * as Enums from "../enums/enums";
import { BulletinModel } from "app/models/bulletin.model";
import { TranslateService } from "@ngx-translate/core";
import { BsModalService } from "ngx-bootstrap/modal";
import { AvalancheProblemDecisionTreeComponent } from "./avalanche-problem-decision-tree.component";

@Component({
  selector: "app-avalanche-problem-detail",
  templateUrl: "avalanche-problem-detail.component.html",
  styleUrls: ["avalanche-problem-detail.component.scss"],
})
export class AvalancheProblemDetailComponent implements OnChanges {
  @Input() bulletin: BulletinModel;
  @Input() bulletinDaytimeDescription: BulletinDaytimeDescriptionModel;
  @Input() avalancheProblemModel: AvalancheProblemModel;
  @Input() disabled: boolean;
  @Input() count: number;
  @Input() afternoon: boolean;
  @Output() changeAvalancheProblemDetailEvent = new EventEmitter<string>();

  avalancheProblems: Enums.AvalancheProblem[];
  snowpackStability = Enums.SnowpackStability;
  frequency = Enums.Frequency;
  avalancheSize = Enums.AvalancheSize;
  useElevationHigh = false;
  useElevationLow = false;
  isElevationHighEditing = false;
  isElevationLowEditing = false;
  localElevationHigh = undefined;
  localElevationLow = undefined;
  localTreelineHigh = false;
  localTreelineLow = false;

  directionEnum = Enums.DangerRatingDirection;
  avalancheTypeEnum = Enums.AvalancheType;
  avalancheProblemEnum = Enums.AvalancheProblem;

  constructor(
    public settingsService: SettingsService,
    public authenticationService: AuthenticationService,
    private modalService: BsModalService,
    public translateService: TranslateService,
  ) {}

  ngOnChanges() {
    this.avalancheProblems = [
      Enums.AvalancheProblem.new_snow,
      Enums.AvalancheProblem.wind_slab,
      Enums.AvalancheProblem.persistent_weak_layers,
      Enums.AvalancheProblem.wet_snow,
      Enums.AvalancheProblem.gliding_snow,
      this.authenticationService.getActiveRegion().enableAvalancheProblemCornices && Enums.AvalancheProblem.cornices,
      this.authenticationService.getActiveRegion().enableAvalancheProblemNoDistinctAvalancheProblem &&
        Enums.AvalancheProblem.no_distinct_problem,
    ].filter((p) => !!p);
    if (!this.isElevationHighEditing) {
      this.useElevationHigh =
        this.avalancheProblemModel.getTreelineHigh() || this.avalancheProblemModel.getElevationHigh() !== undefined;
      this.localElevationHigh = this.avalancheProblemModel.getElevationHigh();
      this.localTreelineHigh = this.avalancheProblemModel.getTreelineHigh();
    }
    if (!this.isElevationLowEditing) {
      this.useElevationLow =
        this.avalancheProblemModel.getTreelineLow() || this.avalancheProblemModel.getElevationLow() !== undefined;
      this.localElevationLow = this.avalancheProblemModel.getElevationLow();
      this.localTreelineLow = this.avalancheProblemModel.getTreelineLow();
    }
  }

  public forLabelId(key: string): string {
    return this.count + (this.afternoon ? "_pm_" : "_am_") + key;
  }

  isAvalancheProblem(avalancheProblem: Enums.AvalancheProblem) {
    return this.avalancheProblemModel?.avalancheProblem === avalancheProblem;
  }

  selectAvalancheProblem(avalancheProblem: Enums.AvalancheProblem) {
    if (this.isAvalancheProblem(avalancheProblem)) {
      this.avalancheProblemModel.setAvalancheProblem(undefined);
    } else {
      this.avalancheProblemModel.setAvalancheProblem(avalancheProblem);
    }
    this.changeAvalancheProblemDetailEvent.emit();
  }

  updateElevationHigh(event) {
    if (!this.localTreelineHigh) {
      if (this.avalancheProblemModel && this.localElevationHigh !== undefined && this.localElevationHigh !== "") {
        this.localElevationHigh = Math.round(this.localElevationHigh / 100) * 100;
        this.avalancheProblemModel.elevationHigh = this.localElevationHigh;
        if (this.avalancheProblemModel.elevationHigh > 9000) {
          this.avalancheProblemModel.elevationHigh = 9000;
        } else if (this.avalancheProblemModel.elevationHigh < 0) {
          this.avalancheProblemModel.elevationHigh = 0;
        }
      }
      this.bulletinDaytimeDescription.updateDangerRating();
      this.isElevationHighEditing = false;
      this.changeAvalancheProblemDetailEvent.emit();
    }
  }

  updateElevationLow() {
    if (!this.localTreelineLow) {
      if (this.avalancheProblemModel && this.localElevationLow !== undefined && this.localElevationLow !== "") {
        this.localElevationLow = Math.round(this.localElevationLow / 100) * 100;
        this.avalancheProblemModel.elevationLow = this.localElevationLow;
        if (this.avalancheProblemModel.elevationLow > 9000) {
          this.avalancheProblemModel.elevationLow = 9000;
        } else if (this.avalancheProblemModel.elevationLow < 0) {
          this.avalancheProblemModel.elevationLow = 0;
        }
      }
      this.bulletinDaytimeDescription.updateDangerRating();
      this.isElevationLowEditing = false;
      this.changeAvalancheProblemDetailEvent.emit();
    }
  }

  treelineHighClicked(event) {
    event.stopPropagation();
    if (this.avalancheProblemModel.treelineHigh) {
      this.isElevationHighEditing = true;
      this.avalancheProblemModel.treelineHigh = false;
      this.localElevationHigh = "";
      this.localTreelineHigh = false;
    } else {
      this.avalancheProblemModel.treelineHigh = true;
      this.avalancheProblemModel.setElevationHigh(undefined);
      this.localElevationHigh = "";
      this.localTreelineHigh = true;
      this.isElevationHighEditing = false;
    }
    this.bulletinDaytimeDescription.updateDangerRating();
    this.changeAvalancheProblemDetailEvent.emit();
  }

  treelineLowClicked(event) {
    event.stopPropagation();
    if (this.avalancheProblemModel.treelineLow) {
      this.isElevationLowEditing = true;
      this.localTreelineLow = false;
      this.localElevationLow = "";
      this.avalancheProblemModel.treelineLow = false;
    } else {
      this.avalancheProblemModel.treelineLow = true;
      this.avalancheProblemModel.setElevationLow(undefined);
      this.localElevationLow = "";
      this.localTreelineLow = true;
      this.isElevationLowEditing = false;
    }
    this.bulletinDaytimeDescription.updateDangerRating();
    this.changeAvalancheProblemDetailEvent.emit();
  }

  setUseElevationHigh(event) {
    if (!event.currentTarget.checked) {
      this.localElevationHigh = "";
      this.localTreelineHigh = false;
      this.avalancheProblemModel.treelineHigh = false;
      this.avalancheProblemModel.elevationHigh = undefined;
      this.isElevationHighEditing = false;
      this.changeAvalancheProblemDetailEvent.emit();
      this.bulletinDaytimeDescription.updateDangerRating();
    } else {
      this.useElevationHigh = true;
      this.isElevationHighEditing = true;
    }
  }

  setUseElevationLow(event) {
    if (!event.currentTarget.checked) {
      this.localElevationLow = "";
      this.localTreelineLow = false;
      this.avalancheProblemModel.treelineLow = false;
      this.avalancheProblemModel.elevationLow = undefined;
      this.isElevationLowEditing = false;
      this.bulletinDaytimeDescription.updateDangerRating();
      this.changeAvalancheProblemDetailEvent.emit();
    } else {
      this.useElevationLow = true;
      this.isElevationLowEditing = true;
    }
  }

  isDangerRatingDirection(dir: Enums.DangerRatingDirection) {
    return this.avalancheProblemModel?.getDangerRatingDirection() === dir;
  }

  setDangerRatingDirection(event: Event, dir: Enums.DangerRatingDirection) {
    event.stopPropagation();
    this.avalancheProblemModel.setDangerRatingDirection(dir);
    this.bulletinDaytimeDescription.updateDangerRating();
    this.changeAvalancheProblemDetailEvent.emit();
  }

  isAvalancheType(type: Enums.AvalancheType) {
    return this.avalancheProblemModel?.getAvalancheType() === type;
  }

  setAvalancheType(event: Event, type: Enums.AvalancheType) {
    event.stopPropagation();
    this.avalancheProblemModel.setAvalancheType(type);
    this.changeAvalancheProblemDetailEvent.emit();
  }

  showDecisionTreeDialog() {
    const ref = this.modalService.show(AvalancheProblemDecisionTreeComponent, { class: "modal-fullscreen" });
    ref.onHide.subscribe(() => {
      const problem = ref.content?.problem;
      if (problem) {
        this.avalancheProblemModel.setAvalancheProblem(undefined);
        this.selectAvalancheProblem(problem);
      }
    });
  }

  changeMatrix(event) {
    this.changeAvalancheProblemDetailEvent.emit();
  }

  changeAspects(event) {
    this.changeAvalancheProblemDetailEvent.emit();
  }
}
