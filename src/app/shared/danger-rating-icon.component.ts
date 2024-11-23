import { Component, input } from "@angular/core";
import { ConstantsService } from "../providers/constants-service/constants.service";
import { BulletinDaytimeDescriptionModel } from "app/models/bulletin-daytime-description.model";
import * as Enums from "../enums/enums";
import { NgIf } from "@angular/common";

@Component({
  selector: "app-danger-rating-icon",
  templateUrl: "danger-rating-icon.component.html",
  standalone: true,
  imports: [NgIf],
})
export class DangerRatingIconComponent {
  readonly dangerRatingAbove = input<Enums.DangerRating>(undefined);
  readonly dangerRatingBelow = input<Enums.DangerRating>(undefined);
  readonly hasElevationDependency = input<boolean>(undefined);

  constructor(private constantsService: ConstantsService) {}

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
