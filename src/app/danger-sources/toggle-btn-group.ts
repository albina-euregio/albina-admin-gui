import { NgClass } from "@angular/common";
import { Component, inject, input, output } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { TranslateService } from "@ngx-translate/core";

@Component({
  selector: "app-toggle-btn-group",
  templateUrl: "toggle-btn-group.html",
  standalone: true,
  imports: [FormsModule, NgClass],
})
export class ToggleBtnGroup<T> {
  translateService = inject(TranslateService);
  enumValues = input<T[]>();
  diminishValues = input<Partial<Record<T extends string ? T : never, boolean>>>();

  value = input<T>();
  values = input<T[] | undefined>();
  valueChange = output<T>();
  valuesChange = output<T[]>();

  disabled = input<boolean>(false);
  labelI18n = input<string>();
  titleI18n = input<string>("");
  flexColumn = input(false);

  isSelected(v: T) {
    return this.value() === v || this.values()?.includes(v);
  }

  emitChange(v: T) {
    const values = this.values();
    if (Array.isArray(values)) {
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
    const key = (this.titleI18n() || this.labelI18n()).replace("#", String(v));
    return this.translateService.instant(key);
  }
}
