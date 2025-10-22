import { Component, inject, input, output } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { TranslateService } from "@ngx-translate/core";

@Component({
  selector: "app-toggle-btn-group",
  templateUrl: "toggle-btn-group.html",
  standalone: true,
  imports: [FormsModule],
})
export class ToggleBtnGroup<T> {
  translateService = inject(TranslateService);
  enumValues = input<T[]>();
  value = input<T>();
  valueChange = output<T>();
  disabled = input<boolean>(false);
  labelI18n = input<string>();
  titleI18n = input<string>("");

  label(v: T) {
    const key = this.labelI18n().replace("#", String(v));
    return this.translateService.instant(key);
  }

  title(v: T) {
    const key = (this.titleI18n() || this.labelI18n()).replace("#", String(v));
    return this.translateService.instant(key);
  }
}
