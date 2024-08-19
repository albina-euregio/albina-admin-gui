import { Component, Input } from "@angular/core";
import * as Enums from "../enums/enums";

@Component({
  selector: "app-avalanche-type",
  templateUrl: "./avalanche-type.component.html",
})
export class AvalancheTypeComponent {
  @Input() value: Enums.AvalancheType;
  avalancheTypeEnum = Enums.AvalancheType;

  isAvalancheType(avalancheType: Enums.AvalancheType) {
    const v = this.value;
    return v === avalancheType;
  }
}
