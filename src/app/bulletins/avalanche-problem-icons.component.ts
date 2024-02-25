import { Component, Input } from "@angular/core";
import { AvalancheProblemModel } from "../models/avalanche-problem.model";
import * as Enums from "../enums/enums";

@Component({
  selector: "app-avalanche-problem-icons",
  templateUrl: "./avalanche-problem-icons.component.html",
})
export class AvalancheProblemIconsComponent {
  @Input() avalancheProblem: AvalancheProblemModel;
  @Input() iconClass: string;
  avalancheProblemEnum = Enums.AvalancheProblem;

  isAvalancheProblem(avalancheProblem: Enums.AvalancheProblem) {
    return this.avalancheProblem?.avalancheProblem === avalancheProblem;
  }
}
