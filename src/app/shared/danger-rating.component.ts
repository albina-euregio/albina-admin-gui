import { ChangeDetectionStrategy, Component, input } from "@angular/core";
import { TranslateModule } from "@ngx-translate/core";

import * as Enums from "../enums/enums";

@Component({
  selector: "app-danger-rating",
  templateUrl: "danger-rating.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [TranslateModule],
})
export class DangerRatingComponent {
  dangerRating = Enums.DangerRating;
  value = input<Enums.DangerRating>();
}
