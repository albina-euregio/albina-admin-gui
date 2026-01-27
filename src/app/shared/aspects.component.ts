import * as Enums from "../enums/enums";
import { Component, input, model } from "@angular/core";
import { TranslateModule } from "@ngx-translate/core";

@Component({
  selector: "app-aspects",
  templateUrl: "aspects.component.html",
  standalone: true,
  imports: [TranslateModule],
})
export class AspectsComponent {
  readonly aspects = model<Enums.Aspect[]>(undefined);
  readonly disabled = input<boolean>(false);
  readonly singleton = input<boolean>(false);
  readonly size = input<number>(undefined);

  aspect = Enums.Aspect;

  getSize() {
    return this.size() + "px";
  }

  getColor(aspect: Enums.Aspect) {
    return this.aspects()?.includes(aspect) ? "#000000" : "#FFFFFF";
  }

  selectAspect(aspect: Enums.Aspect) {
    if (this.disabled()) {
      return;
    }
    const singleton = this.singleton();
    this.aspects.update((aspects) => {
      aspects = [...(aspects ?? [])];
      if (aspects[0] === aspect && singleton) {
        aspects.length = 0;
        return aspects;
      }
      if (aspects?.length !== 1 || singleton) {
        aspects.length = 0;
        aspects.push(aspect);
        return aspects;
      }
      if (aspects[0] === aspect) {
        aspects.length = 0;
        return aspects;
      }
      const values: Enums.Aspect[] = Object.values(Enums.Aspect);
      const end: number = values.indexOf(aspect);
      let a: number = values.indexOf(aspects[0]);
      do {
        a = (a + 1) % values.length;
        aspects.push(values[a]);
      } while (a !== end);
      return aspects;
    });
  }
}
