import * as Enums from "../enums/enums";

import { ChangeDetectionStrategy, Component, input } from "@angular/core";

@Component({
  selector: "app-danger-rating",
  templateUrl: "danger-rating.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [],
})
export class DangerRatingComponent {
  dangerRating = Enums.DangerRating;
  value = input<Enums.DangerRating>();
}
