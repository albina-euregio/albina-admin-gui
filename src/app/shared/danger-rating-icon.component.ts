import { Component, Input } from "@angular/core";
import { ConstantsService } from "../providers/constants-service/constants.service";
import { BulletinDaytimeDescriptionModel } from "app/models/bulletin-daytime-description.model";
import * as Enums from "../enums/enums";

@Component({
  selector: "app-danger-rating-icon",
  templateUrl: "danger-rating-icon.component.html",
})
export class DangerRatingIconComponent {
  @Input() dangerRatingAbove: Enums.DangerRating;
  @Input() dangerRatingBelow: Enums.DangerRating;
  @Input() hasElevationDependency: boolean;

  constructor(private constantsService: ConstantsService) {}

  getColorAbove() {
    return this.getDangerRatingColor(this.dangerRatingAbove);
  }

  getColorBelow() {
    return this.getDangerRatingColor(this.dangerRatingBelow);
  }

  private getDangerRatingColor(dangerRating: Enums.DangerRating) {
    return this.constantsService.getDangerRatingColor(dangerRating);
  }
}
