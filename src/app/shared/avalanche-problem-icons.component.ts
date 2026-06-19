import { Component, input, ChangeDetectionStrategy } from "@angular/core";
import { TranslateModule } from "@ngx-translate/core";

import * as Enums from "../enums/enums";
import { AvalancheProblemModel } from "../models/avalanche-problem.model";

@Component({
  standalone: true,
  imports: [TranslateModule],
  selector: "app-avalanche-problem-icons",
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: "./avalanche-problem-icons.component.html",
})
export class AvalancheProblemIconsComponent {
  readonly value = input<AvalancheProblemModel | Enums.AvalancheProblem>(undefined);
  avalancheProblemEnum = Enums.AvalancheProblem;

  get avalancheProblem(): Enums.AvalancheProblem {
    const v = this.value();
    if (typeof v === "object") return v.avalancheProblem;
    return v;
  }
}
