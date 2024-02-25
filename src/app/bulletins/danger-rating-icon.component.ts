import { Component, Input } from "@angular/core";
import { ConstantsService } from "../providers/constants-service/constants.service";
import { BulletinDaytimeDescriptionModel } from "app/models/bulletin-daytime-description.model";
import * as Enums from "../enums/enums";

@Component({
  selector: "app-danger-rating-icon",
  templateUrl: "danger-rating-icon.component.html",
})
export class DangerRatingIconComponent {
  @Input() bulletinDaytimeDescription: BulletinDaytimeDescriptionModel;

  constructor(private constantsService: ConstantsService) {}

  getColorAbove() {
    const dangerRating = this.bulletinDaytimeDescription?.getDangerRatingAbove();
    return this.getDangerRatingColor(dangerRating);
  }

  getColorBelow() {
    const dangerRating = this.bulletinDaytimeDescription?.getDangerRatingBelow();
    return this.getDangerRatingColor(dangerRating);
  }

  private getDangerRatingColor(dangerRating: Enums.DangerRating) {
    return this.constantsService.getDangerRatingColor(dangerRating);
  }
}
