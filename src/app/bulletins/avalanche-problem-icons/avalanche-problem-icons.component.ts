import { Component, Input } from '@angular/core';
import { AvalancheProblemModel } from "../../models/avalanche-problem.model";

@Component({
  selector: 'app-avalanche-problem-icons',
  templateUrl: './avalanche-problem-icons.component.html',
  styleUrls: ['./avalanche-problem-icons.component.scss']
})
export class AvalancheProblemIconsComponent {

  @Input() avalancheProblem: AvalancheProblemModel;
  @Input() iconClass: string;

  isAvalancheProblem(avalancheProblem) {
    if (this.avalancheProblem && this.avalancheProblem.avalancheProblem === avalancheProblem) {
      return true;
    }
    return false;
  }

}
