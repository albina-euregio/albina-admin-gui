import { Component, computed, inject, input, model } from "@angular/core";
import { TranslateModule, TranslateService } from "@ngx-translate/core";

import { SliderComponent, SliderOptions } from "./slider.component";

@Component({
  selector: "app-enum-slider",
  templateUrl: "enum-slider.component.html",
  standalone: true,
  imports: [SliderComponent, TranslateModule],
})
export class EnumSliderComponent {
  readonly translateService = inject(TranslateService);

  readonly value = model<unknown>();
  readonly disabled = input<boolean>(false);
  readonly enumValues = input<string[]>([]);
  readonly valueI18n = input<string>("");

  readonly sliderOptions = computed<SliderOptions>(() => {
    const enumValues = this.enumValues();
    return {
      floor: 0,
      ceil: enumValues.length - 1,
      ticks: enumValues.map((_, i) => i),
      getLegend: (i) => this.translateService.instant(this.valueI18n().replace("#", "" + enumValues[i])),
      getSelectionBarColor: () => "var(--bs-secondary)",
      onValueChange: () => {},
    };
  });

  readonly sliderValue = computed<number>(() => {
    const i = this.enumValues().indexOf(this.value() as string);
    return i >= 0 ? i : 0;
  });

  onSliderEnumChange(index: number): void {
    const enumValues = this.enumValues();
    this.value.set(enumValues[index] ?? enumValues[0]);
  }
}
