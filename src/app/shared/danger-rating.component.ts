import { ChangeDetectionStrategy, Component, input } from "@angular/core";
import * as Enums from "../enums/enums";
import { NgIf } from "@angular/common";

@Component({
  selector: "app-danger-rating",
  templateUrl: "danger-rating.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [NgIf],
})
export class DangerRatingComponent {
  dangerRating = Enums.DangerRating;
  value = input<Enums.DangerRating>();
}
