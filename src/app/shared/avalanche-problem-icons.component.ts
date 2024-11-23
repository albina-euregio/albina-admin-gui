import { Component, input } from "@angular/core";
import { AvalancheProblemModel } from "../models/avalanche-problem.model";
import * as Enums from "../enums/enums";
import { NgIf } from "@angular/common";

@Component({
  standalone: true,
  imports: [NgIf],
  selector: "app-avalanche-problem-icons",
  templateUrl: "./avalanche-problem-icons.component.html",
})
export class AvalancheProblemIconsComponent {
  readonly value = input<AvalancheProblemModel | Enums.AvalancheProblem>(undefined);
  avalancheProblemEnum = Enums.AvalancheProblem;

  isAvalancheProblem(avalancheProblem: Enums.AvalancheProblem) {
    const v = this.value();
    return v === avalancheProblem || (typeof v === "object" && v?.avalancheProblem === avalancheProblem);
  }
}
