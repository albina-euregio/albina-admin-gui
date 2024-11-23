import { Component, Input, input, output } from "@angular/core";
import { TranslateService, TranslateModule } from "@ngx-translate/core";
import { BulletinDaytimeDescriptionModel } from "../models/bulletin-daytime-description.model";
import { AvalancheProblemModel } from "../models/avalanche-problem.model";
import * as Enums from "../enums/enums";
import { BulletinModel } from "app/models/bulletin.model";
import { NgIf } from "@angular/common";
import { DangerRatingComponent } from "../shared/danger-rating.component";
import { AvalancheProblemIconsComponent } from "../shared/avalanche-problem-icons.component";
import { AvalancheTypeComponent } from "../shared/avalanche-type.component";
import { AspectsComponent } from "../shared/aspects.component";

@Component({
  selector: "app-avalanche-problem-preview",
  templateUrl: "avalanche-problem-preview.component.html",
  standalone: true,
  imports: [
    NgIf,
    DangerRatingComponent,
    AvalancheProblemIconsComponent,
    AvalancheTypeComponent,
    AspectsComponent,
    TranslateModule,
  ],
})
export class AvalancheProblemPreviewComponent {
  readonly bulletin = input<BulletinModel>(undefined);
  readonly bulletinDaytimeDescription = input<BulletinDaytimeDescriptionModel>(undefined);
  @Input() avalancheProblem: AvalancheProblemModel;
  readonly count = input<number>(undefined);
  @Input() disabled: boolean;
  readonly changeAvalancheProblemPreviewEvent = output();

  avalancheProblemEnum = Enums.AvalancheProblem;

  constructor(public translateService: TranslateService) {}

  isAvalancheProblem(avalancheProblem: Enums.AvalancheProblem) {
    return this.avalancheProblem.avalancheProblem === avalancheProblem;
  }

  hasAspects() {
    return this.avalancheProblem && this.avalancheProblem.aspects && this.avalancheProblem.aspects.length > 0;
  }

  isFirst() {
    return this.count() === 1;
  }

  isLast() {
    switch (this.count()) {
      case 1:
        return this.bulletinDaytimeDescription().avalancheProblem2 === undefined;
      case 2:
        return this.bulletinDaytimeDescription().avalancheProblem3 === undefined;
      case 3:
        return this.bulletinDaytimeDescription().avalancheProblem4 === undefined;
      case 4:
        return this.bulletinDaytimeDescription().avalancheProblem5 === undefined;
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
    const count = this.count();
    switch (count) {
      case 1:
        this.bulletinDaytimeDescription().setAvalancheProblem1(undefined);
        break;
      case 2:
        this.bulletinDaytimeDescription().setAvalancheProblem2(undefined);
        break;
      case 3:
        this.bulletinDaytimeDescription().setAvalancheProblem3(undefined);
        break;
      case 4:
        this.bulletinDaytimeDescription().setAvalancheProblem4(undefined);
        break;
      case 5:
        this.bulletinDaytimeDescription().setAvalancheProblem5(undefined);
        break;
      default:
        break;
    }
    this.reorderAvalancheProblems(count);
    this.changeAvalancheProblemPreviewEvent.emit();
  }

  reorderAvalancheProblems(count) {
    for (let i = count; i <= 4; i++) {
      const bulletinDaytimeDescription = this.bulletinDaytimeDescription();
      const bulletinDaytimeDescriptionValue = this.bulletinDaytimeDescription();
      const bulletinDaytimeDescriptionVal = this.bulletinDaytimeDescription();
      const bulletinDaytimeDescriptionInput = this.bulletinDaytimeDescription();
      switch (i) {
        case 1:
          if (bulletinDaytimeDescription.avalancheProblem2) {
            bulletinDaytimeDescription.setAvalancheProblem1(
              new AvalancheProblemModel(bulletinDaytimeDescription.avalancheProblem2),
            );
          } else {
            bulletinDaytimeDescription.setAvalancheProblem1(undefined);
          }
          break;
        case 2:
          if (bulletinDaytimeDescriptionValue.avalancheProblem3) {
            bulletinDaytimeDescriptionValue.setAvalancheProblem2(
              new AvalancheProblemModel(bulletinDaytimeDescriptionValue.avalancheProblem3),
            );
          } else {
            bulletinDaytimeDescriptionValue.setAvalancheProblem2(undefined);
          }
          break;
        case 3:
          if (bulletinDaytimeDescriptionVal.avalancheProblem4) {
            bulletinDaytimeDescriptionVal.setAvalancheProblem3(
              new AvalancheProblemModel(bulletinDaytimeDescriptionVal.avalancheProblem4),
            );
          } else {
            bulletinDaytimeDescriptionVal.setAvalancheProblem3(undefined);
          }
          break;
        case 4:
          if (bulletinDaytimeDescriptionInput.avalancheProblem5) {
            bulletinDaytimeDescriptionInput.setAvalancheProblem4(
              new AvalancheProblemModel(bulletinDaytimeDescriptionInput.avalancheProblem5),
            );
          } else {
            bulletinDaytimeDescriptionInput.setAvalancheProblem4(undefined);
          }
          break;
        default:
          break;
      }
    }
    this.bulletinDaytimeDescription().updateDangerRating();
  }

  moveUpAvalancheProblem(event) {
    event.stopPropagation();
    let tmpAvalancheProblem = undefined;
    switch (this.count()) {
      case 2:
        tmpAvalancheProblem = new AvalancheProblemModel(this.avalancheProblem);
        this.avalancheProblem = new AvalancheProblemModel(this.bulletinDaytimeDescription().avalancheProblem1);
        this.bulletinDaytimeDescription().setAvalancheProblem2(this.avalancheProblem);
        this.bulletinDaytimeDescription().setAvalancheProblem1(tmpAvalancheProblem);
        break;
      case 3:
        tmpAvalancheProblem = new AvalancheProblemModel(this.avalancheProblem);
        this.avalancheProblem = new AvalancheProblemModel(this.bulletinDaytimeDescription().avalancheProblem2);
        this.bulletinDaytimeDescription().setAvalancheProblem3(this.avalancheProblem);
        this.bulletinDaytimeDescription().setAvalancheProblem2(tmpAvalancheProblem);
        break;
      case 4:
        tmpAvalancheProblem = new AvalancheProblemModel(this.avalancheProblem);
        this.avalancheProblem = new AvalancheProblemModel(this.bulletinDaytimeDescription().avalancheProblem3);
        this.bulletinDaytimeDescription().setAvalancheProblem4(this.avalancheProblem);
        this.bulletinDaytimeDescription().setAvalancheProblem3(tmpAvalancheProblem);
        break;
      case 5:
        tmpAvalancheProblem = new AvalancheProblemModel(this.avalancheProblem);
        this.avalancheProblem = new AvalancheProblemModel(this.bulletinDaytimeDescription().avalancheProblem4);
        this.bulletinDaytimeDescription().setAvalancheProblem5(this.avalancheProblem);
        this.bulletinDaytimeDescription().setAvalancheProblem4(tmpAvalancheProblem);
        break;

      default:
        break;
    }
    this.bulletinDaytimeDescription().updateDangerRating();
    this.changeAvalancheProblemPreviewEvent.emit();
  }

  moveDownAvalancheProblem(event) {
    event.stopPropagation();
    let tmpAvalancheProblem = undefined;
    switch (this.count()) {
      case 1:
        tmpAvalancheProblem = new AvalancheProblemModel(this.avalancheProblem);
        this.avalancheProblem = new AvalancheProblemModel(this.bulletinDaytimeDescription().avalancheProblem2);
        this.bulletinDaytimeDescription().setAvalancheProblem1(this.avalancheProblem);
        this.bulletinDaytimeDescription().setAvalancheProblem2(tmpAvalancheProblem);
        break;
      case 2:
        tmpAvalancheProblem = new AvalancheProblemModel(this.avalancheProblem);
        this.avalancheProblem = new AvalancheProblemModel(this.bulletinDaytimeDescription().avalancheProblem3);
        this.bulletinDaytimeDescription().setAvalancheProblem2(this.avalancheProblem);
        this.bulletinDaytimeDescription().setAvalancheProblem3(tmpAvalancheProblem);
        break;
      case 3:
        tmpAvalancheProblem = new AvalancheProblemModel(this.avalancheProblem);
        this.avalancheProblem = new AvalancheProblemModel(this.bulletinDaytimeDescription().avalancheProblem4);
        this.bulletinDaytimeDescription().setAvalancheProblem3(this.avalancheProblem);
        this.bulletinDaytimeDescription().setAvalancheProblem4(tmpAvalancheProblem);
        break;
      case 4:
        tmpAvalancheProblem = new AvalancheProblemModel(this.avalancheProblem);
        this.avalancheProblem = new AvalancheProblemModel(this.bulletinDaytimeDescription().avalancheProblem5);
        this.bulletinDaytimeDescription().setAvalancheProblem4(this.avalancheProblem);
        this.bulletinDaytimeDescription().setAvalancheProblem5(tmpAvalancheProblem);
        break;

      default:
        break;
    }
    this.bulletinDaytimeDescription().updateDangerRating();
    this.changeAvalancheProblemPreviewEvent.emit();
  }
}
