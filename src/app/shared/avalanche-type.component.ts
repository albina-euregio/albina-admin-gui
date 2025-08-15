import * as Enums from "../enums/enums";
import { NgIf } from "@angular/common";
import { Component, input } from "@angular/core";

@Component({
  selector: "app-avalanche-type",
  templateUrl: "./avalanche-type.component.html",
  standalone: true,
  imports: [NgIf],
})
export class AvalancheTypeComponent {
  readonly value = input<Enums.AvalancheType>(undefined);
  avalancheTypeEnum = Enums.AvalancheType;

  isAvalancheType(avalancheType: Enums.AvalancheType) {
    const v = this.value();
    return v === avalancheType;
  }
}
