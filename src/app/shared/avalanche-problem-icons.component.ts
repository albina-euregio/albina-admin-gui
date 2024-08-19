import { Component, Input } from "@angular/core";
import { AvalancheProblemModel } from "../models/avalanche-problem.model";
import * as Enums from "../enums/enums";

@Component({
  selector: "app-avalanche-problem-icons",
  templateUrl: "./avalanche-problem-icons.component.html",
})
export class AvalancheProblemIconsComponent {
  @Input() value: AvalancheProblemModel | Enums.AvalancheProblem;
  avalancheProblemEnum = Enums.AvalancheProblem;

  isAvalancheProblem(avalancheProblem: Enums.AvalancheProblem) {
    const v = this.value;
    return v === avalancheProblem || (typeof v === "object" && v?.avalancheProblem === avalancheProblem);
  }
}
