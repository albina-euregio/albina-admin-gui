import * as Enums from "../enums/enums";
import { ConstantsService } from "../providers/constants-service/constants.service";
import { NgIf } from "@angular/common";
import { Component, input, inject } from "@angular/core";
import { BulletinDaytimeDescriptionModel } from "app/models/bulletin-daytime-description.model";

@Component({
  selector: "app-danger-rating-icon",
  templateUrl: "danger-rating-icon.component.html",
  standalone: true,
  imports: [NgIf],
})
export class DangerRatingIconComponent {
  private constantsService = inject(ConstantsService);

  readonly dangerRatingAbove = input<Enums.DangerRating>(undefined);
  readonly dangerRatingBelow = input<Enums.DangerRating>(undefined);
  readonly hasElevationDependency = input<boolean>(undefined);

  getColorAbove() {
    return this.getDangerRatingColor(this.dangerRatingAbove());
  }

  getColorBelow() {
    return this.getDangerRatingColor(this.dangerRatingBelow());
  }

  private getDangerRatingColor(dangerRating: Enums.DangerRating) {
    return this.constantsService.getDangerRatingColor(dangerRating);
  }
}
