import { Component, Input } from "@angular/core";
import * as Enums from "../enums/enums";
import { NgIf } from "@angular/common";

@Component({
  selector: "app-avalanche-type",
  templateUrl: "./avalanche-type.component.html",
  standalone: true,
  imports: [NgIf],
})
export class AvalancheTypeComponent {
  @Input() value: Enums.AvalancheType;
  avalancheTypeEnum = Enums.AvalancheType;

  isAvalancheType(avalancheType: Enums.AvalancheType) {
    const v = this.value;
    return v === avalancheType;
  }
}
