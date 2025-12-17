import * as Enums from "../enums/enums";
import { AvalancheProblemModel } from "../models/avalanche-problem.model";
import { BulletinDaytimeDescriptionModel } from "../models/bulletin-daytime-description.model";
import { AspectsComponent } from "../shared/aspects.component";
import { AvalancheProblemIconsComponent } from "../shared/avalanche-problem-icons.component";
import { AvalancheTypeComponent } from "../shared/avalanche-type.component";
import { DangerRatingComponent } from "../shared/danger-rating.component";

import { Component, inject, input, output } from "@angular/core";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { BulletinModel } from "app/models/bulletin.model";

@Component({
  selector: "app-avalanche-problem-preview",
  templateUrl: "avalanche-problem-preview.component.html",
  standalone: true,
  imports: [
    DangerRatingComponent,
    AvalancheProblemIconsComponent,
    AvalancheTypeComponent,
    AspectsComponent,
    TranslateModule
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
    if (avalancheProblem && avalancheProblem.treelineLow) {
      return this.translateService.instant("bulletins.create.tooltip.treeline");
    } else if (avalancheProblem) {
      return avalancheProblem.elevationLow + "m";
    }
  }

  getElevationHighString() {
    const avalancheProblem = this.avalancheProblem();
    if (avalancheProblem && avalancheProblem.treelineHigh) {
      return this.translateService.instant("bulletins.create.tooltip.treeline");
    } else if (avalancheProblem) {
      return avalancheProblem.elevationHigh + "m";
    }
  }

  deleteAvalancheProblem(event) {
    event.stopPropagation();
    const count = this.count();
    switch (count) {
      case 1:
        this.bulletinDaytimeDescription().avalancheProblem1 = undefined;
        break;
      case 2:
        this.bulletinDaytimeDescription().avalancheProblem2 = undefined;
        break;
      case 3:
        this.bulletinDaytimeDescription().avalancheProblem3 = undefined;
        break;
      case 4:
        this.bulletinDaytimeDescription().avalancheProblem4 = undefined;
        break;
      case 5:
        this.bulletinDaytimeDescription().avalancheProblem5 = undefined;
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
            bulletinDaytimeDescription.avalancheProblem1 = new AvalancheProblemModel(
              bulletinDaytimeDescription.avalancheProblem2,
            );
          } else {
            bulletinDaytimeDescription.avalancheProblem1 = undefined;
          }
          break;
        case 2:
          if (bulletinDaytimeDescriptionValue.avalancheProblem3) {
            bulletinDaytimeDescriptionValue.avalancheProblem2 = new AvalancheProblemModel(
              bulletinDaytimeDescriptionValue.avalancheProblem3,
            );
          } else {
            bulletinDaytimeDescriptionValue.avalancheProblem2 = undefined;
          }
          break;
        case 3:
          if (bulletinDaytimeDescriptionVal.avalancheProblem4) {
            bulletinDaytimeDescriptionVal.avalancheProblem3 = new AvalancheProblemModel(
              bulletinDaytimeDescriptionVal.avalancheProblem4,
            );
          } else {
            bulletinDaytimeDescriptionVal.avalancheProblem3 = undefined;
          }
          break;
        case 4:
          if (bulletinDaytimeDescriptionInput.avalancheProblem5) {
            bulletinDaytimeDescriptionInput.avalancheProblem4 = new AvalancheProblemModel(
              bulletinDaytimeDescriptionInput.avalancheProblem5,
            );
          } else {
            bulletinDaytimeDescriptionInput.avalancheProblem4 = undefined;
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
        this.bulletinDaytimeDescription().avalancheProblem2 = avalancheProblem1;
        this.bulletinDaytimeDescription().avalancheProblem1 = tmpAvalancheProblem;
        break;
      }
      case 3: {
        const tmpAvalancheProblem = new AvalancheProblemModel(this.avalancheProblem());
        const avalancheProblem2 = new AvalancheProblemModel(this.bulletinDaytimeDescription().avalancheProblem2);
        this.bulletinDaytimeDescription().avalancheProblem3 = avalancheProblem2;
        this.bulletinDaytimeDescription().avalancheProblem2 = tmpAvalancheProblem;
        break;
      }
      case 4: {
        const tmpAvalancheProblem = new AvalancheProblemModel(this.avalancheProblem());
        const avalancheProblem3 = new AvalancheProblemModel(this.bulletinDaytimeDescription().avalancheProblem3);
        this.bulletinDaytimeDescription().avalancheProblem4 = avalancheProblem3;
        this.bulletinDaytimeDescription().avalancheProblem3 = tmpAvalancheProblem;
        break;
      }
      case 5: {
        const tmpAvalancheProblem = new AvalancheProblemModel(this.avalancheProblem());
        const avalancheProblem4 = new AvalancheProblemModel(this.bulletinDaytimeDescription().avalancheProblem4);
        this.bulletinDaytimeDescription().avalancheProblem5 = avalancheProblem4;
        this.bulletinDaytimeDescription().avalancheProblem4 = tmpAvalancheProblem;
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
        this.bulletinDaytimeDescription().avalancheProblem1 = avalancheProblem2;
        this.bulletinDaytimeDescription().avalancheProblem2 = tmpAvalancheProblem;
        break;
      }
      case 2: {
        const tmpAvalancheProblem = new AvalancheProblemModel(this.avalancheProblem());
        const avalancheProblem3 = new AvalancheProblemModel(this.bulletinDaytimeDescription().avalancheProblem3);
        this.bulletinDaytimeDescription().avalancheProblem2 = avalancheProblem3;
        this.bulletinDaytimeDescription().avalancheProblem3 = tmpAvalancheProblem;
        break;
      }
      case 3: {
        const tmpAvalancheProblem = new AvalancheProblemModel(this.avalancheProblem());
        const avalancheProblem4 = new AvalancheProblemModel(this.bulletinDaytimeDescription().avalancheProblem4);
        this.bulletinDaytimeDescription().avalancheProblem3 = avalancheProblem4;
        this.bulletinDaytimeDescription().avalancheProblem4 = tmpAvalancheProblem;
        break;
      }
      case 4: {
        const tmpAvalancheProblem = new AvalancheProblemModel(this.avalancheProblem());
        const avalancheProblem5 = new AvalancheProblemModel(this.bulletinDaytimeDescription().avalancheProblem5);
        this.bulletinDaytimeDescription().avalancheProblem4 = avalancheProblem5;
        this.bulletinDaytimeDescription().avalancheProblem5 = tmpAvalancheProblem;
        break;
      }

      default:
        break;
    }
    this.bulletinDaytimeDescription().updateDangerRating();
    this.changeAvalancheProblemPreviewEvent.emit();
  }
}
