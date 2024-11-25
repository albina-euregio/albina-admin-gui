import { Component, input, output, inject } from "@angular/core";
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
  translateService = inject(TranslateService);

  readonly bulletin = input<BulletinModel>(undefined);
  readonly bulletinDaytimeDescription = input<BulletinDaytimeDescriptionModel>(undefined);
  readonly avalancheProblem = input<AvalancheProblemModel>(undefined);
  readonly count = input<number>(undefined);
  readonly disabled = input<boolean>(undefined);
  readonly changeAvalancheProblemPreviewEvent = output();

  avalancheProblemEnum = Enums.AvalancheProblem;

  isAvalancheProblem(avalancheProblem: Enums.AvalancheProblem) {
    return this.avalancheProblem().avalancheProblem === avalancheProblem;
  }

  hasAspects() {
    const avalancheProblem = this.avalancheProblem();
    return avalancheProblem && avalancheProblem.aspects && avalancheProblem.aspects.length > 0;
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
    const avalancheProblem = this.avalancheProblem();
    if (avalancheProblem && avalancheProblem.getTreelineLow()) {
      return this.translateService.instant("bulletins.create.tooltip.treeline");
    } else if (avalancheProblem) {
      return avalancheProblem.getElevationLow() + "m";
    }
  }

  getElevationHighString() {
    const avalancheProblem = this.avalancheProblem();
    if (avalancheProblem && avalancheProblem.getTreelineHigh()) {
      return this.translateService.instant("bulletins.create.tooltip.treeline");
    } else if (avalancheProblem) {
      return avalancheProblem.getElevationHigh() + "m";
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
    switch (this.count()) {
      case 2: {
        const tmpAvalancheProblem = new AvalancheProblemModel(this.avalancheProblem());
        const avalancheProblem1 = new AvalancheProblemModel(this.bulletinDaytimeDescription().avalancheProblem1);
        this.bulletinDaytimeDescription().setAvalancheProblem2(avalancheProblem1);
        this.bulletinDaytimeDescription().setAvalancheProblem1(tmpAvalancheProblem);
        break;
      }
      case 3: {
        const tmpAvalancheProblem = new AvalancheProblemModel(this.avalancheProblem());
        const avalancheProblem2 = new AvalancheProblemModel(this.bulletinDaytimeDescription().avalancheProblem2);
        this.bulletinDaytimeDescription().setAvalancheProblem3(avalancheProblem2);
        this.bulletinDaytimeDescription().setAvalancheProblem2(tmpAvalancheProblem);
        break;
      }
      case 4: {
        const tmpAvalancheProblem = new AvalancheProblemModel(this.avalancheProblem());
        const avalancheProblem3 = new AvalancheProblemModel(this.bulletinDaytimeDescription().avalancheProblem3);
        this.bulletinDaytimeDescription().setAvalancheProblem4(avalancheProblem3);
        this.bulletinDaytimeDescription().setAvalancheProblem3(tmpAvalancheProblem);
        break;
      }
      case 5: {
        const tmpAvalancheProblem = new AvalancheProblemModel(this.avalancheProblem());
        const avalancheProblem4 = new AvalancheProblemModel(this.bulletinDaytimeDescription().avalancheProblem4);
        this.bulletinDaytimeDescription().setAvalancheProblem5(avalancheProblem4);
        this.bulletinDaytimeDescription().setAvalancheProblem4(tmpAvalancheProblem);
        break;
      }

      default:
        break;
    }
    this.bulletinDaytimeDescription().updateDangerRating();
    this.changeAvalancheProblemPreviewEvent.emit();
  }

  moveDownAvalancheProblem(event) {
    event.stopPropagation();
    switch (this.count()) {
      case 1: {
        const tmpAvalancheProblem = new AvalancheProblemModel(this.avalancheProblem());
        const avalancheProblem2 = new AvalancheProblemModel(this.bulletinDaytimeDescription().avalancheProblem2);
        this.bulletinDaytimeDescription().setAvalancheProblem1(avalancheProblem2);
        this.bulletinDaytimeDescription().setAvalancheProblem2(tmpAvalancheProblem);
        break;
      }
      case 2: {
        const tmpAvalancheProblem = new AvalancheProblemModel(this.avalancheProblem());
        const avalancheProblem3 = new AvalancheProblemModel(this.bulletinDaytimeDescription().avalancheProblem3);
        this.bulletinDaytimeDescription().setAvalancheProblem2(avalancheProblem3);
        this.bulletinDaytimeDescription().setAvalancheProblem3(tmpAvalancheProblem);
        break;
      }
      case 3: {
        const tmpAvalancheProblem = new AvalancheProblemModel(this.avalancheProblem());
        const avalancheProblem4 = new AvalancheProblemModel(this.bulletinDaytimeDescription().avalancheProblem4);
        this.bulletinDaytimeDescription().setAvalancheProblem3(avalancheProblem4);
        this.bulletinDaytimeDescription().setAvalancheProblem4(tmpAvalancheProblem);
        break;
      }
      case 4: {
        const tmpAvalancheProblem = new AvalancheProblemModel(this.avalancheProblem());
        const avalancheProblem5 = new AvalancheProblemModel(this.bulletinDaytimeDescription().avalancheProblem5);
        this.bulletinDaytimeDescription().setAvalancheProblem4(avalancheProblem5);
        this.bulletinDaytimeDescription().setAvalancheProblem5(tmpAvalancheProblem);
        break;
      }

      default:
        break;
    }
    this.bulletinDaytimeDescription().updateDangerRating();
    this.changeAvalancheProblemPreviewEvent.emit();
  }
}
