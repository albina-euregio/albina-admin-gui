import { Component, input } from "@angular/core";
import { TranslateModule } from "@ngx-translate/core";

import { BulletinStatus } from "../enums/enums";

@Component({
  selector: "app-bulletin-status-badge",
  templateUrl: "bulletin-status-badge.component.html",
  standalone: true,
  imports: [TranslateModule],
})
export class BulletinStatusBadgeComponent {
  readonly status = input<BulletinStatus>(undefined);
  readonly submittedIcon = input<"newspaper" | "clock-countdown">("newspaper");
  readonly bulletinStatus = BulletinStatus;
}
