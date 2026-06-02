import { KeyValuePipe } from "@angular/common";
import { Component, computed, inject, input, model } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { xor } from "es-toolkit";
import { z } from "zod/v4";

import { ToggleBtnGroup } from "../danger-sources/toggle-btn-group";
import * as IncidentModels from "../incidents/models/incident-report.model";
import { DateTimeInputComponent } from "./date-time-input.component";
import { SliderComponent, SliderOptions } from "./slider.component";
import { zodCssClass } from "./zod-css-class";
import { widgetRegistry } from "./zod-schema-form.widget-registry";

@Component({
  selector: "app-zod-schema-form",
  templateUrl: "zod-schema-form.component.html",
  standalone: true,
  imports: [DateTimeInputComponent, FormsModule, KeyValuePipe, SliderComponent, ToggleBtnGroup, TranslateModule],
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
    | typeof IncidentModels.AvalancheInformationSchema
    | typeof IncidentModels.OtherDamagesSchema
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
    if (t === IncidentModels.AvalancheInformationSchema) {
      return IncidentModels.AvalancheInformationSchema;
    }
    if (t === IncidentModels.OtherDamagesSchema) {
      return IncidentModels.OtherDamagesSchema;
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

  hasValue(val: unknown): boolean {
    return val !== undefined && val !== null && val !== "" && (!Array.isArray(val) || val.length > 0);
  }

  shouldShowField(widget: { showIf?: string[] } | undefined): boolean {
    if (!widget?.showIf || widget.showIf.length < 2) return true;
    const key = widget.showIf[0];
    const allowed = widget.showIf.slice(1);
    const val = (this.value() as Record<string, unknown>)?.[key];
    return allowed.includes(val as string);
  }

  onCheckboxArrayChange(key: string, v: string): void {
    const value = this.value();
    Object.assign(value, { [key]: xor(this.castArray(value[key]) ?? [], [v]) });
    this.value.set(value);
  }

  readonly showMandatoryOnly = input<boolean>(false);

  unwrap<T extends z.ZodType>(t: T): T | z.ZodNumber | z.ZodBoolean {
    while (this.isFieldOptional(t)) {
      t = t.unwrap() as T;
    }
    return t;
  }
  isFieldOptional(zodType: z.ZodType): zodType is z.ZodOptional | z.ZodNullable | z.ZodDefault {
    return zodType.type === "optional" || zodType.type === "nullable" || zodType.type === "default";
  }
  isFieldValid(schema: z.ZodType, val: unknown): boolean {
    return this.hasValue(val) && schema.safeParse(val).success;
  }

  get groupSizeUnknown(): boolean {
    const val = this.value() as z.infer<typeof IncidentModels.GroupInformationSchema>;
    return !!val?.groupSizeUnknown;
  }

  onGroupSizeUnknownChange(checked: boolean): void {
    const val = this.value() as z.infer<typeof IncidentModels.GroupInformationSchema>;
    if (!val) return;
    val.groupSizeUnknown = checked;
    this.value.set(val as any);
  }
}
