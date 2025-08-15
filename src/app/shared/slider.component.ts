import { NgForOf } from "@angular/common";
import { Component, input, output } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { TranslateModule } from "@ngx-translate/core";

let uniqueId = 0;

export interface SliderOptions {
  floor: number;
  ceil: number;
  ticks: number[];
  getLegend: (value: number) => string;
  getSelectionBarColor: (value: number) => string;
  onValueChange(value: number): void;
}

@Component({
  selector: "app-slider",
  templateUrl: "slider.component.html",
  standalone: true,
  imports: [TranslateModule, FormsModule, NgForOf],
})
export class SliderComponent {
  id = input(`app-slider-${uniqueId++}`);
  label = input<string>();
  disabled = input<boolean>();
  sliderOptions = input<SliderOptions>();
  sliderValue = input<number>();
  sliderValueChange = output<number>();
}
