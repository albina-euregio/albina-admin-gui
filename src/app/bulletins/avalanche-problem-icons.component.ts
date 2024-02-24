import { Component, Input } from "@angular/core";
import { AvalancheProblemModel } from "../models/avalanche-problem.model";

@Component({
  selector: "app-avalanche-problem-icons",
  templateUrl: "./avalanche-problem-icons.component.html",
})
export class AvalancheProblemIconsComponent {
  @Input() avalancheProblem: AvalancheProblemModel;
  @Input() iconClass: string;

  isAvalancheProblem(avalancheProblem) {
    return this.avalancheProblem?.avalancheProblem === avalancheProblem;
  }
}
