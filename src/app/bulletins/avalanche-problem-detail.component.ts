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
import { NgClass, NgFor, NgIf } from "@angular/common";
import { Component, inject, input, OnChanges, output } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { BulletinModel } from "app/models/bulletin.model";
import { BsModalService } from "ngx-bootstrap/modal";

@Component({
  selector: "app-avalanche-problem-detail",
  templateUrl: "avalanche-problem-detail.component.html",
  styleUrls: ["avalanche-problem-detail.component.scss"],
  standalone: true,
  imports: [
    NgIf,
    NgFor,
    AvalancheProblemIconsComponent,
    NgClass,
    AspectsComponent,
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
  haveSameElements = haveSameElements;

  ngOnChanges() {
    this.avalancheProblems = this.authenticationService.getActiveRegionAvalancheProblems();
    if (!this.isElevationHighEditing) {
      const avalancheProblemModel = this.avalancheProblemModel();
      this.useElevationHigh = avalancheProblemModel.treelineHigh || avalancheProblemModel.elevationHigh !== undefined;
      this.localElevationHigh = this.avalancheProblemModel().elevationHigh;
      this.localTreelineHigh = this.avalancheProblemModel().treelineHigh;
    }
    if (!this.isElevationLowEditing) {
      const avalancheProblemModel = this.avalancheProblemModel();
      this.useElevationLow = avalancheProblemModel.treelineLow || avalancheProblemModel.elevationLow !== undefined;
      this.localElevationLow = this.avalancheProblemModel().elevationLow;
      this.localTreelineLow = this.avalancheProblemModel().treelineLow;
    }
  }

  public forLabelId(key: string): string {
    return this.count() + (this.afternoon() ? "_pm_" : "_am_") + key;
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

  updateElevationHigh() {
    if (!this.localTreelineHigh) {
      const avalancheProblemModel = this.avalancheProblemModel();
      if (avalancheProblemModel && this.localElevationHigh !== undefined && this.localElevationHigh !== "") {
        this.localElevationHigh = Math.round(this.localElevationHigh / 100) * 100;
        avalancheProblemModel.elevationHigh = this.localElevationHigh;
        if (avalancheProblemModel.elevationHigh > 9000) {
          avalancheProblemModel.elevationHigh = 9000;
        } else if (avalancheProblemModel.elevationHigh < 0) {
          avalancheProblemModel.elevationHigh = 0;
        }
      }
      this.bulletinDaytimeDescription().updateDangerRating();
      this.isElevationHighEditing = false;
      this.changeAvalancheProblemDetailEvent.emit();
    }
  }

  updateElevationLow() {
    if (!this.localTreelineLow) {
      const avalancheProblemModel = this.avalancheProblemModel();
      if (avalancheProblemModel && this.localElevationLow !== undefined && this.localElevationLow !== "") {
        this.localElevationLow = Math.round(this.localElevationLow / 100) * 100;
        avalancheProblemModel.elevationLow = this.localElevationLow;
        if (avalancheProblemModel.elevationLow > 9000) {
          avalancheProblemModel.elevationLow = 9000;
        } else if (avalancheProblemModel.elevationLow < 0) {
          avalancheProblemModel.elevationLow = 0;
        }
      }
      this.bulletinDaytimeDescription().updateDangerRating();
      this.isElevationLowEditing = false;
      this.changeAvalancheProblemDetailEvent.emit();
    }
  }

  treelineHighClicked(event: Event) {
    event.stopPropagation();
    const avalancheProblemModel = this.avalancheProblemModel();
    if (avalancheProblemModel.treelineHigh) {
      this.isElevationHighEditing = true;
      avalancheProblemModel.treelineHigh = false;
      this.localElevationHigh = "";
      this.localTreelineHigh = false;
    } else {
      avalancheProblemModel.treelineHigh = true;
      avalancheProblemModel.elevationHigh = undefined;
      this.localElevationHigh = "";
      this.localTreelineHigh = true;
      this.isElevationHighEditing = false;
    }
    this.bulletinDaytimeDescription().updateDangerRating();
    this.changeAvalancheProblemDetailEvent.emit();
  }

  treelineLowClicked(event: Event) {
    event.stopPropagation();
    const avalancheProblemModel = this.avalancheProblemModel();
    if (avalancheProblemModel.treelineLow) {
      this.isElevationLowEditing = true;
      this.localTreelineLow = false;
      this.localElevationLow = "";
      avalancheProblemModel.treelineLow = false;
    } else {
      avalancheProblemModel.treelineLow = true;
      avalancheProblemModel.elevationLow = undefined;
      this.localElevationLow = "";
      this.localTreelineLow = true;
      this.isElevationLowEditing = false;
    }
    this.bulletinDaytimeDescription().updateDangerRating();
    this.changeAvalancheProblemDetailEvent.emit();
  }

  setUseElevationHigh(event: Event) {
    if (!(event.currentTarget as HTMLInputElement).checked) {
      this.localElevationHigh = "";
      this.localTreelineHigh = false;
      const avalancheProblemModel = this.avalancheProblemModel();
      avalancheProblemModel.treelineHigh = false;
      avalancheProblemModel.elevationHigh = undefined;
      this.isElevationHighEditing = false;
      this.changeAvalancheProblemDetailEvent.emit();
      this.bulletinDaytimeDescription().updateDangerRating();
    } else {
      this.useElevationHigh = true;
      this.isElevationHighEditing = true;
    }
  }

  setUseElevationLow(event: Event) {
    if (!(event.currentTarget as HTMLInputElement).checked) {
      this.localElevationLow = "";
      this.localTreelineLow = false;
      const avalancheProblemModel = this.avalancheProblemModel();
      avalancheProblemModel.treelineLow = false;
      avalancheProblemModel.elevationLow = undefined;
      this.isElevationLowEditing = false;
      this.bulletinDaytimeDescription().updateDangerRating();
      this.changeAvalancheProblemDetailEvent.emit();
    } else {
      this.useElevationLow = true;
      this.isElevationLowEditing = true;
    }
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
