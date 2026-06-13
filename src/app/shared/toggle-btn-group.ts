import { Component, inject, input, output } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { TranslateService } from "@ngx-translate/core";
import { AvalancheProblem, DangerRating } from "app/enums/enums";
import { grainShapes } from "app/observations/grain.shapes";

import { AvalancheProblemIconsComponent } from "./avalanche-problem-icons.component";
import { DangerRatingComponent } from "./danger-rating.component";
import type { WidgetType } from "./zod-schema-form.widget-registry";

@Component({
  selector: "app-toggle-btn-group",
  templateUrl: "toggle-btn-group.html",
  standalone: true,
  imports: [FormsModule, AvalancheProblemIconsComponent, DangerRatingComponent],
})
export class ToggleBtnGroup<T> {
  translateService = inject(TranslateService);
  multiple = input<boolean>();
  enumValues = input<T[]>();
  diminishValues = input<Partial<Record<T extends string ? T : never, boolean>>>();

  value = input<T>();
  values = input<T[] | undefined>();
  valueChange = output<T>();
  valuesChange = output<T[]>();

  disabled = input<boolean>(false);
  labelI18n = input<`${string}#${string}`>();
  titleI18n = input<"" | `${string}#${string}`>("");
  widget = input<WidgetType["widget"]>(undefined);

  isSelected(v: T) {
    return this.value() === v || this.values()?.includes(v);
  }

  emitChange(v: T) {
    let values = this.values();
    if (Array.isArray(values) || this.multiple()) {
      values ??= [];
      if (values.includes(v)) {
        this.valuesChange.emit([...values].filter((v0) => v0 !== v));
      } else {
        this.valuesChange.emit([...values, v]);
      }
    } else {
      this.valueChange.emit(this.value() === v ? undefined : v);
    }
  }

  label(v: T) {
    const key = this.labelI18n().replace("#", String(v));
    return this.translateService.instant(key);
  }

  title(v: T) {
    const key = this.titleI18n()?.replace("#", String(v));
    if (!key) return "";
    return this.translateService.instant(key);
  }

  castAvalancheProblem(x: unknown) {
    return x as AvalancheProblem;
  }

  castDangerRating(x: unknown) {
    return x as DangerRating;
  }

  readonly grainShapes = grainShapes;
  castGrainShape(x: unknown) {
    return x as keyof typeof grainShapes;
  }
}
