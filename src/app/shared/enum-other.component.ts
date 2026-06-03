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
 *
 * With `multiple`, the value is an array (multi-select); enum keys toggle independently
 * and the "Other" text is stored as one additional array element.
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
  readonly multiple = input<boolean>(false);
  readonly enumValues = input<string[]>([]);
  readonly valueI18n = input<`${string}#${string}`>("#");
  readonly zodType = input<z.ZodType>();

  // True once the user picks "Other" even before any text is typed (an empty custom
  // value is otherwise indistinguishable from "nothing selected").
  private readonly otherActive = signal(false);

  private readonly arrayValue = computed(() => (Array.isArray(this.value()) ? (this.value() as string[]) : []));

  cssClasses() {
    return zodCssClass(this.zodType(), this.value());
  }

  prettyError(): string | undefined {
    const result = this.zodType()?.safeParse(this.value());
    return result?.error ? z.prettifyError(result.error) : undefined;
  }

  isSelected(v: string): boolean {
    return this.multiple() ? this.arrayValue().includes(v) : this.value() === v;
  }

  // The free-form text: the single array element that is not an enum key (multiple mode),
  // or the value itself when it is custom text (single mode).
  readonly customText = computed(() => {
    if (this.multiple()) return this.arrayValue().find((v) => !this.enumValues().includes(v)) ?? "";
    const v = this.value();
    return typeof v === "string" ? v : "";
  });

  readonly otherSelected = computed(() => this.customText() !== "" || this.otherActive());

  toggleEnum(v: string): void {
    if (this.multiple()) {
      const values = this.arrayValue();
      this.value.set(values.includes(v) ? values.filter((x) => x !== v) : [...values, v]);
    } else {
      this.otherActive.set(false);
      this.value.set(this.value() === v ? undefined : v);
    }
  }

  selectOther(): void {
    if (this.otherSelected()) {
      this.otherActive.set(false);
      this.setCustomText("");
    } else {
      this.otherActive.set(true);
      if (!this.multiple()) this.value.set("");
    }
  }

  setCustomText(text: string): void {
    if (this.multiple()) {
      const enumOnly = this.arrayValue().filter((v) => this.enumValues().includes(v));
      this.value.set(text ? [...enumOnly, text] : enumOnly);
    } else {
      this.value.set(text || undefined);
    }
  }
}
