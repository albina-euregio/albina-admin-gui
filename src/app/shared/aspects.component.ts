import { Component, Input, input, output } from "@angular/core";
import * as Enums from "../enums/enums";
import { TranslateModule } from "@ngx-translate/core";

@Component({
  selector: "app-aspects",
  templateUrl: "aspects.component.html",
  standalone: true,
  imports: [TranslateModule],
})
export class AspectsComponent {
  @Input() aspects: Enums.Aspect[];
  readonly aspectsChange = output<Enums.Aspect[]>();
  readonly disabled = input<boolean>(false);
  readonly singleton = input<boolean>(false);
  readonly size = input<number>(undefined);

  aspect = Enums.Aspect;

  constructor() {}

  getSize() {
    return this.size() + "px";
  }

  getColor(aspect: Enums.Aspect) {
    return this.aspects.includes(aspect) ? "#000000" : "#FFFFFF";
  }

  selectAspect(aspect: Enums.Aspect) {
    if (this.disabled()) {
      return;
    }
    const singleton = this.singleton();
    if (this.aspects[0] === aspect && singleton) {
      this.aspects = [];
      return this.aspectsChange.emit(this.aspects);
    }
    if (this.aspects?.length !== 1 || singleton) {
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
