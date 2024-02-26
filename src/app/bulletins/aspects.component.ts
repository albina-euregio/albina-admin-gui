import { Component, EventEmitter, Input, Output } from "@angular/core";
import * as Enums from "../enums/enums";

@Component({
  selector: "app-aspects",
  templateUrl: "aspects.component.html",
})
export class AspectsComponent {
  @Input() aspects: Enums.Aspect[];
  @Output() aspectsChange = new EventEmitter<Enums.Aspect[]>();
  @Input() disabled: boolean;
  @Input() size: string;

  aspect = Enums.Aspect;

  constructor() {}

  getSize() {
    return this.size + "px";
  }

  getColor(aspect: Enums.Aspect) {
    return this.aspects.includes(aspect) ? "#000000" : "#FFFFFF";
  }

  selectAspect(aspect: Enums.Aspect) {
    if (this.disabled) {
      return;
    }
    if (this.aspects?.length !== 1) {
      this.aspects = [aspect];
      return this.aspectsChange.emit(this.aspects);
    }
    if (this.aspects[0] === aspect) {
      this.aspects = [];
      return this.aspectsChange.emit(this.aspects);
    }
    const values: Enums.Aspect[] = Object.values(Enums.Aspect);
    const end: number = values.indexOf(aspect);
    let a: number = values.indexOf(this.aspects[0]);
    do {
      a = (a + 1) % values.length;
      this.aspects.push(values[a]);
    } while (a !== end);
    return this.aspectsChange.emit(this.aspects);
  }
}
