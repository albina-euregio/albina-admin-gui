import { Component, Input } from "@angular/core";
import { ConstantsService } from "../providers/constants-service/constants.service";
import { BulletinDaytimeDescriptionModel } from "app/models/bulletin-daytime-description.model";

@Component({
  selector: "app-danger-rating-icon",
  templateUrl: "danger-rating-icon.component.html",
})
export class DangerRatingIconComponent {
  @Input() bulletinDaytimeDescription: BulletinDaytimeDescriptionModel;

  constructor(private constantsService: ConstantsService) {}

  getColorAbove() {
    const dangerRating = this.bulletinDaytimeDescription?.getDangerRatingAbove()?.toString();
    return this.getDangerRatingColor(dangerRating);
  }

  getColorBelow() {
    const dangerRating = this.bulletinDaytimeDescription?.getDangerRatingBelow()?.toString();
    return this.getDangerRatingColor(dangerRating);
  }

  private getDangerRatingColor(dangerRating) {
    return this.constantsService.getDangerRatingColor(dangerRating);
  }
}
