import { KeyValuePipe } from "@angular/common";
import { Component, computed, inject, input, model } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { z } from "zod/v4";

import { ToggleBtnGroup } from "../danger-sources/toggle-btn-group";
import * as IncidentModels from "../incidents/models/incident-report.model";
import { SliderComponent, SliderOptions } from "./slider.component";
import { widgetRegistry } from "./widget-registry";
import { zodCssClass } from "./zod-css-class";

@Component({
  selector: "app-zod-schema-form",
  templateUrl: "zod-schema-form.component.html",
  standalone: true,
  imports: [FormsModule, KeyValuePipe, SliderComponent, ToggleBtnGroup, TranslateModule],
})
export class ZodSchemaFormComponent<T extends z.ZodObject, V extends z.infer<T>> {
  readonly JSON = JSON;
  readonly Object = Object;
  readonly widgetRegistry = widgetRegistry;
  readonly zodCssClass = zodCssClass;
  readonly zPrettifyError = z.prettifyError;

  readonly translateService = inject(TranslateService);

  readonly value = model<V>();

  readonly disabled = input<boolean>(false);
  readonly zodType = input<T>();
  readonly labelI18n = input<`${string}#${string}`>();
  readonly helpI18n = input<`${string}#${string}`>();

  zodObject = computed<
    | typeof IncidentModels.MetaInformationSchema
    | typeof IncidentModels.GeneralInformationSchema
    | typeof IncidentModels.LocationInformationSchema
    | typeof IncidentModels.GroupInformationSchema
  >(() => {
    const t = this.zodType() as unknown;
    if (t === IncidentModels.MetaInformationSchema) {
      return IncidentModels.MetaInformationSchema;
    }
    if (t === IncidentModels.GeneralInformationSchema) {
      return IncidentModels.GeneralInformationSchema;
    }
    if (t === IncidentModels.LocationInformationSchema) {
      return IncidentModels.LocationInformationSchema;
    }
    if (t === IncidentModels.GroupInformationSchema) {
      return IncidentModels.GroupInformationSchema;
    }
    throw Error();
  });

  enumSliderOptions(key: string, enumValues: string[]): SliderOptions {
    return {
      floor: 0,
      ceil: enumValues.length - 1,
      ticks: enumValues.map((_, i) => i),
      getLegend: (i) => this.translateService.instant(`${key}.${enumValues[i]}`),
      getSelectionBarColor: () => "var(--bs-secondary)",
      onValueChange: () => {},
    };
  }

  enumValueIndex(value: unknown, enumValues: string[]): number {
    const i = enumValues.indexOf(value as string);
    return i >= 0 ? i : 0;
  }

  onSliderEnumChange(key: string, index: number, enumValues: string[]): void {
    Object.assign(this.value(), { [key]: enumValues[index] ?? enumValues[0] });
    this.value.set(this.value());
  }

  castArray(x: unknown) {
    return x as unknown[];
  }

  onCheckboxArrayChange(key: string, v: string, checked: boolean): void {
    const value = this.value();
    const array = Array.isArray(value[key]) ? [...value[key]] : [];
    const index = array.indexOf(v);
    if (checked && index < 0) {
      array.push(v);
    } else if (!checked && index >= 0) {
      array.splice(index, 1);
    }
    Object.assign(value, { [key]: array });
    this.value.set(value);
  }

  unwrap<T extends z.ZodType>(t: T): T | z.ZodNumber {
    while (t.type === "optional" || t.type === "nullable" || t.type === "default") {
      t = (t as unknown as z.ZodOptional | z.ZodNullable | z.ZodDefault).unwrap() as T;
    }
    return t;
  }
}
