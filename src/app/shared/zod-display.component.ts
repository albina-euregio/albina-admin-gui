import { DatePipe } from "@angular/common";
import { ChangeDetectionStrategy, Component, computed, inject, input } from "@angular/core";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { z } from "zod/v4";

import * as zodUtil from "./zod-util";

@Component({
  selector: "app-zod-display",
  templateUrl: "zod-display.component.html",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [DatePipe, TranslateModule],
})
export class ZodDisplayComponent<T> {
  readonly translateService = inject(TranslateService);

  readonly zodType = input<z.ZodType<T>>();
  readonly value = input<T>();
  readonly valueI18n = input<string>("#");
  readonly dateFormat = input<string>("full");

  readonly inner = computed(() => zodUtil.unwrap(this.zodType()));

  castArray(x: unknown) {
    return x as unknown[];
  }
  castDate(x: unknown) {
    return x as Date;
  }
}
