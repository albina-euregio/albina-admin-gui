import { Component, computed, input, model, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { TranslateModule } from "@ngx-translate/core";
import { z } from "zod/v4";

import { zodCssClass } from "./zod-util";

/**
 * Renders an enum as toggle buttons plus an "Other" button. When "Other" is active,
 * a text input lets the user enter free-form text. Backed by a `enumWithOther` union
 * schema (see zodUtil.isEnumWithOther); the stored value is either an enum key or the
 * custom text.
 */
@Component({
  selector: "app-enum-other",
  templateUrl: "enum-other.component.html",
  standalone: true,
  imports: [FormsModule, TranslateModule],
})
export class EnumOtherComponent {
  // `unknown` so the schema form can two-way bind `value()[key]` (an indexed-access type).
  readonly value = model<unknown>();
  readonly disabled = input<boolean>(false);
  readonly enumValues = input<string[]>([]);
  readonly valueI18n = input<`${string}#${string}`>("#");
  readonly zodType = input<z.ZodType>();

  cssClasses() {
    return zodCssClass(this.zodType(), this.value());
  }

  // True once the user picks "Other" even before any text is typed (an empty custom
  // value is otherwise indistinguishable from "nothing selected").
  private readonly otherActive = signal(false);

  readonly otherSelected = computed(() => {
    const v = this.value();
    const isCustom = typeof v === "string" && v !== "" && !this.enumValues().includes(v);
    return isCustom || this.otherActive();
  });

  selectEnum(v: string): void {
    this.otherActive.set(false);
    this.value.set(this.value() === v ? undefined : v);
  }

  selectOther(): void {
    if (this.otherSelected()) {
      this.otherActive.set(false);
      this.value.set(undefined);
    } else {
      this.otherActive.set(true);
      this.value.set("");
    }
  }
}
