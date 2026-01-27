import * as Enums from "../enums/enums";
import { AvalancheProblemModel } from "../models/avalanche-problem.model";
import { BulletinDaytimeDescriptionModel } from "../models/bulletin-daytime-description.model";
import { AuthenticationService } from "../providers/authentication-service/authentication.service";
import { AspectsComponent } from "../shared/aspects.component";
import { AvalancheProblemIconsComponent } from "../shared/avalanche-problem-icons.component";
import { haveSameElements } from "../shared/compareArrays";
import { MatrixParameterComponent } from "../shared/matrix-parameter.component";
import { MatrixComponent } from "../shared/matrix.component";
import { AvalancheProblemDecisionTreeComponent } from "./avalanche-problem-decision-tree.component";
import { NgClass } from "@angular/common";
import { Component, inject, input, OnChanges, output } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { BulletinModel } from "app/models/bulletin.model";
import { ElevationsComponent } from "app/shared/elevations.component";
import { BsModalService } from "ngx-bootstrap/modal";

@Component({
  selector: "app-avalanche-problem-detail",
  templateUrl: "avalanche-problem-detail.component.html",
  styleUrls: ["avalanche-problem-detail.component.scss"],
  standalone: true,
  imports: [
    AvalancheProblemIconsComponent,
    NgClass,
    AspectsComponent,
    ElevationsComponent,
    FormsModule,
    MatrixParameterComponent,
    MatrixComponent,
    TranslateModule,
  ],
})
export class AvalancheProblemDetailComponent implements OnChanges {
  authenticationService = inject(AuthenticationService);
  private modalService = inject(BsModalService);
  translateService = inject(TranslateService);

  readonly bulletin = input<BulletinModel>(undefined);
  readonly bulletinDaytimeDescription = input<BulletinDaytimeDescriptionModel>(undefined);
  readonly avalancheProblemModel = input<AvalancheProblemModel>(undefined);
  readonly comparedAvalancheProblemModel = input<AvalancheProblemModel>(undefined);
  readonly isComparedBulletin = input<boolean>(undefined);
  readonly disabled = input<boolean>(undefined);
  readonly count = input<number>(undefined);
  readonly afternoon = input<boolean>(undefined);
  readonly changeAvalancheProblemDetailEvent = output();

  avalancheProblems: Enums.AvalancheProblem[];
  snowpackStability = Enums.SnowpackStability;
  frequency = Enums.Frequency;
  avalancheSize = Enums.AvalancheSize;

  directionEnum = Enums.DangerRatingDirection;
  avalancheTypeEnum = Enums.AvalancheType;
  avalancheProblemEnum = Enums.AvalancheProblem;
  haveSameElements = haveSameElements;

  ngOnChanges() {
    this.avalancheProblems = this.authenticationService.getActiveRegionAvalancheProblems();
  }

  isAvalancheProblem(avalancheProblem: Enums.AvalancheProblem) {
    return this.avalancheProblemModel()?.avalancheProblem === avalancheProblem;
  }

  selectAvalancheProblem(avalancheProblem: Enums.AvalancheProblem) {
    if (!this.disabled()) {
      if (this.isAvalancheProblem(avalancheProblem)) {
        this.avalancheProblemModel().setAvalancheProblem(undefined);
      } else {
        this.avalancheProblemModel().setAvalancheProblem(avalancheProblem);
      }
      this.changeAvalancheProblemDetailEvent.emit();
    }
  }

  updateElevations() {
    this.bulletinDaytimeDescription().updateDangerRating();
    this.changeAvalancheProblemDetailEvent.emit();
  }

  /**
   * Compares elevationHigh, elevationLow, treelineHigh, treelineLow between variant and comparedVariant.
   * For treelineHigh/treelineLow, null/undefined is treated as false.
   */
  get isElevationEqual(): boolean {
    const v = this.avalancheProblemModel();
    const c = this.comparedAvalancheProblemModel();
    if (!v || !c) return false;

    // elevationHigh
    if (
      !(
        ((v.elevationHigh === null || v.elevationHigh === undefined) &&
          (c.elevationHigh === null || c.elevationHigh === undefined)) ||
        v.elevationHigh === c.elevationHigh
      )
    ) {
      console.log("elevationHigh not equal", v.elevationHigh, c.elevationHigh);
      return true;
    }

    // elevationLow
    if (
      !(
        ((v.elevationLow === null || v.elevationLow === undefined) &&
          (c.elevationLow === null || c.elevationLow === undefined)) ||
        v.elevationLow === c.elevationLow
      )
    ) {
      console.log("elevationLow not equal", v.elevationLow, c.elevationLow);
      return true;
    }

    // treelineHigh
    if (
      !(
        ((v.treelineHigh === null || v.treelineHigh === undefined) &&
          (c.treelineHigh === null || c.treelineHigh === undefined)) ||
        (v.treelineHigh && c.treelineHigh) ||
        (!v.treelineHigh && !c.treelineHigh)
      )
    ) {
      console.log("treelineHigh not equal", v.treelineHigh, c.treelineHigh);
      return true;
    }

    // treelineLow
    if (
      !(
        ((v.treelineLow === null || v.treelineLow === undefined) &&
          (c.treelineLow === null || c.treelineLow === undefined)) ||
        (v.treelineLow && c.treelineLow) ||
        (!v.treelineLow && !c.treelineLow)
      )
    ) {
      console.log("treelineLow not equal", v.treelineLow, c.treelineLow);
      return true;
    }
    return false;
  }

  isDangerRatingDirection(dir: Enums.DangerRatingDirection) {
    return this.avalancheProblemModel().dangerRatingDirection === dir;
  }

  setDangerRatingDirection(event: Event, dir: Enums.DangerRatingDirection) {
    event.stopPropagation();
    this.avalancheProblemModel().dangerRatingDirection = dir;
    this.bulletinDaytimeDescription().updateDangerRating();
    this.changeAvalancheProblemDetailEvent.emit();
  }

  isAvalancheType(type: Enums.AvalancheType) {
    return this.avalancheProblemModel().avalancheType === type;
  }

  setAvalancheType(event: Event, type: Enums.AvalancheType) {
    event.stopPropagation();
    this.avalancheProblemModel().avalancheType = type;
    this.changeAvalancheProblemDetailEvent.emit();
  }

  showDecisionTreeDialog() {
    const ref = this.modalService.show(AvalancheProblemDecisionTreeComponent, { class: "modal-fullscreen" });
    ref.onHide.subscribe(() => {
      const problem = ref.content?.problem;
      if (problem) {
        this.avalancheProblemModel().setAvalancheProblem(undefined);
        this.selectAvalancheProblem(problem);
      }
    });
  }

  changeMatrix() {
    this.changeAvalancheProblemDetailEvent.emit();
  }

  changeAspects() {
    this.changeAvalancheProblemDetailEvent.emit();
  }
}
