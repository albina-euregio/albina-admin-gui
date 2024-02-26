import { Component, Input } from "@angular/core";
import { BulletinDaytimeDescriptionModel } from "../models/bulletin-daytime-description.model";
import { SettingsService } from "../providers/settings-service/settings.service";
import * as Enums from "../enums/enums";

@Component({
  selector: "app-danger-rating",
  templateUrl: "danger-rating.component.html",
})
export class DangerRatingComponent {
  dangerRating = Enums.DangerRating;

  @Input() bulletinDaytimeDescription: BulletinDaytimeDescriptionModel;
  @Input() below: boolean;
  @Input() disabled: boolean;

  constructor(public settingsService: SettingsService) {}

  isDangerRating(dangerRating: Enums.DangerRating) {
    return this.below
      ? this.bulletinDaytimeDescription.dangerRatingBelow === dangerRating
      : this.bulletinDaytimeDescription.dangerRatingAbove === dangerRating;
  }

  selectDangerRating(dangerRating: Enums.DangerRating) {
    if (this.below) {
      this.bulletinDaytimeDescription.setDangerRatingBelow(dangerRating);
    } else {
      this.bulletinDaytimeDescription.setDangerRatingAbove(dangerRating);
    }
  }
}
