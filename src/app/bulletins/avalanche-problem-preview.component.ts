import { Component, EventEmitter, Input, Output } from "@angular/core";
import { TranslateService } from "@ngx-translate/core";
import { SettingsService } from "../providers/settings-service/settings.service";
import { BulletinDaytimeDescriptionModel } from "../models/bulletin-daytime-description.model";
import { AvalancheProblemModel } from "../models/avalanche-problem.model";
import * as Enums from "../enums/enums";
import { BulletinModel } from "app/models/bulletin.model";

@Component({
  selector: "app-avalanche-problem-preview",
  templateUrl: "avalanche-problem-preview.component.html",
})
export class AvalancheProblemPreviewComponent {
  @Input() bulletin: BulletinModel;
  @Input() bulletinDaytimeDescription: BulletinDaytimeDescriptionModel;
  @Input() avalancheProblem: AvalancheProblemModel;
  @Input() count: number;
  @Input() disabled: boolean;
  @Output() changeAvalancheProblemPreviewEvent = new EventEmitter<string>();

  avalancheProblemEnum = Enums.AvalancheProblem;

  constructor(
    public translateService: TranslateService,
    public settingsService: SettingsService,
  ) {}

  isAvalancheProblem(avalancheProblem: Enums.AvalancheProblem) {
    return this.avalancheProblem.avalancheProblem === avalancheProblem;
  }

  hasAspects() {
    return this.avalancheProblem && this.avalancheProblem.aspects && this.avalancheProblem.aspects.length > 0;
  }

  isFirst() {
    return this.count === 1;
  }

  isLast() {
    switch (this.count) {
      case 1:
        return this.bulletinDaytimeDescription.avalancheProblem2 === undefined;
      case 2:
        return this.bulletinDaytimeDescription.avalancheProblem3 === undefined;
      case 3:
        return this.bulletinDaytimeDescription.avalancheProblem4 === undefined;
      case 4:
        return this.bulletinDaytimeDescription.avalancheProblem5 === undefined;
      default:
        return true;
    }
  }

  getElevationLowString() {
    if (this.avalancheProblem && this.avalancheProblem.getTreelineLow()) {
      return this.translateService.instant("bulletins.create.tooltip.treeline");
    } else if (this.avalancheProblem) {
      return this.avalancheProblem.getElevationLow() + "m";
    }
  }

  getElevationHighString() {
    if (this.avalancheProblem && this.avalancheProblem.getTreelineHigh()) {
      return this.translateService.instant("bulletins.create.tooltip.treeline");
    } else if (this.avalancheProblem) {
      return this.avalancheProblem.getElevationHigh() + "m";
    }
  }

  deleteAvalancheProblem(event) {
    event.stopPropagation();
    switch (this.count) {
      case 1:
        this.bulletinDaytimeDescription.setAvalancheProblem1(undefined);
        break;
      case 2:
        this.bulletinDaytimeDescription.setAvalancheProblem2(undefined);
        break;
      case 3:
        this.bulletinDaytimeDescription.setAvalancheProblem3(undefined);
        break;
      case 4:
        this.bulletinDaytimeDescription.setAvalancheProblem4(undefined);
        break;
      case 5:
        this.bulletinDaytimeDescription.setAvalancheProblem5(undefined);
        break;
      default:
        break;
    }
    this.reorderAvalancheProblems(this.count);
    this.changeAvalancheProblemPreviewEvent.emit();
  }

  reorderAvalancheProblems(count) {
    for (let i = count; i <= 4; i++) {
      switch (i) {
        case 1:
          if (this.bulletinDaytimeDescription.avalancheProblem2) {
            this.bulletinDaytimeDescription.setAvalancheProblem1(
              new AvalancheProblemModel(this.bulletinDaytimeDescription.avalancheProblem2),
            );
          } else {
            this.bulletinDaytimeDescription.setAvalancheProblem1(undefined);
          }
          break;
        case 2:
          if (this.bulletinDaytimeDescription.avalancheProblem3) {
            this.bulletinDaytimeDescription.setAvalancheProblem2(
              new AvalancheProblemModel(this.bulletinDaytimeDescription.avalancheProblem3),
            );
          } else {
            this.bulletinDaytimeDescription.setAvalancheProblem2(undefined);
          }
          break;
        case 3:
          if (this.bulletinDaytimeDescription.avalancheProblem4) {
            this.bulletinDaytimeDescription.setAvalancheProblem3(
              new AvalancheProblemModel(this.bulletinDaytimeDescription.avalancheProblem4),
            );
          } else {
            this.bulletinDaytimeDescription.setAvalancheProblem3(undefined);
          }
          break;
        case 4:
          if (this.bulletinDaytimeDescription.avalancheProblem5) {
            this.bulletinDaytimeDescription.setAvalancheProblem4(
              new AvalancheProblemModel(this.bulletinDaytimeDescription.avalancheProblem5),
            );
          } else {
            this.bulletinDaytimeDescription.setAvalancheProblem4(undefined);
          }
          break;
        default:
          break;
      }
    }
    this.bulletinDaytimeDescription.updateDangerRating();
  }

  moveUpAvalancheProblem(event) {
    event.stopPropagation();
    let tmpAvalancheProblem = undefined;
    switch (this.count) {
      case 2:
        tmpAvalancheProblem = new AvalancheProblemModel(this.avalancheProblem);
        this.avalancheProblem = new AvalancheProblemModel(this.bulletinDaytimeDescription.avalancheProblem1);
        this.bulletinDaytimeDescription.setAvalancheProblem2(this.avalancheProblem);
        this.bulletinDaytimeDescription.setAvalancheProblem1(tmpAvalancheProblem);
        break;
      case 3:
        tmpAvalancheProblem = new AvalancheProblemModel(this.avalancheProblem);
        this.avalancheProblem = new AvalancheProblemModel(this.bulletinDaytimeDescription.avalancheProblem2);
        this.bulletinDaytimeDescription.setAvalancheProblem3(this.avalancheProblem);
        this.bulletinDaytimeDescription.setAvalancheProblem2(tmpAvalancheProblem);
        break;
      case 4:
        tmpAvalancheProblem = new AvalancheProblemModel(this.avalancheProblem);
        this.avalancheProblem = new AvalancheProblemModel(this.bulletinDaytimeDescription.avalancheProblem3);
        this.bulletinDaytimeDescription.setAvalancheProblem4(this.avalancheProblem);
        this.bulletinDaytimeDescription.setAvalancheProblem3(tmpAvalancheProblem);
        break;
      case 5:
        tmpAvalancheProblem = new AvalancheProblemModel(this.avalancheProblem);
        this.avalancheProblem = new AvalancheProblemModel(this.bulletinDaytimeDescription.avalancheProblem4);
        this.bulletinDaytimeDescription.setAvalancheProblem5(this.avalancheProblem);
        this.bulletinDaytimeDescription.setAvalancheProblem4(tmpAvalancheProblem);
        break;

      default:
        break;
    }
    this.bulletinDaytimeDescription.updateDangerRating();
    this.changeAvalancheProblemPreviewEvent.emit();
  }

  moveDownAvalancheProblem(event) {
    event.stopPropagation();
    let tmpAvalancheProblem = undefined;
    switch (this.count) {
      case 1:
        tmpAvalancheProblem = new AvalancheProblemModel(this.avalancheProblem);
        this.avalancheProblem = new AvalancheProblemModel(this.bulletinDaytimeDescription.avalancheProblem2);
        this.bulletinDaytimeDescription.setAvalancheProblem1(this.avalancheProblem);
        this.bulletinDaytimeDescription.setAvalancheProblem2(tmpAvalancheProblem);
        break;
      case 2:
        tmpAvalancheProblem = new AvalancheProblemModel(this.avalancheProblem);
        this.avalancheProblem = new AvalancheProblemModel(this.bulletinDaytimeDescription.avalancheProblem3);
        this.bulletinDaytimeDescription.setAvalancheProblem2(this.avalancheProblem);
        this.bulletinDaytimeDescription.setAvalancheProblem3(tmpAvalancheProblem);
        break;
      case 3:
        tmpAvalancheProblem = new AvalancheProblemModel(this.avalancheProblem);
        this.avalancheProblem = new AvalancheProblemModel(this.bulletinDaytimeDescription.avalancheProblem4);
        this.bulletinDaytimeDescription.setAvalancheProblem3(this.avalancheProblem);
        this.bulletinDaytimeDescription.setAvalancheProblem4(tmpAvalancheProblem);
        break;
      case 4:
        tmpAvalancheProblem = new AvalancheProblemModel(this.avalancheProblem);
        this.avalancheProblem = new AvalancheProblemModel(this.bulletinDaytimeDescription.avalancheProblem5);
        this.bulletinDaytimeDescription.setAvalancheProblem4(this.avalancheProblem);
        this.bulletinDaytimeDescription.setAvalancheProblem5(tmpAvalancheProblem);
        break;

      default:
        break;
    }
    this.bulletinDaytimeDescription.updateDangerRating();
    this.changeAvalancheProblemPreviewEvent.emit();
  }
}
