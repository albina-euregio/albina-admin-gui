import { Component, Input } from "@angular/core";
import * as Enums from "../enums/enums";

@Component({
  selector: "app-danger-rating",
  templateUrl: "danger-rating.component.html",
})
export class DangerRatingComponent {
  dangerRating = Enums.DangerRating;
  @Input() value: Enums.DangerRating;
}
