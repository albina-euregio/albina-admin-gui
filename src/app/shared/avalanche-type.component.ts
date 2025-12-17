import * as Enums from "../enums/enums";

import { Component, input } from "@angular/core";

@Component({
  selector: "app-avalanche-type",
  templateUrl: "./avalanche-type.component.html",
  standalone: true,
  imports: [],
})
export class AvalancheTypeComponent {
  readonly value = input<Enums.AvalancheType>(undefined);
  avalancheTypeEnum = Enums.AvalancheType;

  isAvalancheType(avalancheType: Enums.AvalancheType) {
    const v = this.value();
    return v === avalancheType;
  }
}
