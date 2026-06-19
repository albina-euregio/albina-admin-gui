import { Component, input, ChangeDetectionStrategy } from "@angular/core";

import * as Enums from "../enums/enums";

@Component({
  selector: "app-avalanche-type",
  templateUrl: "./avalanche-type.component.html",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
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
