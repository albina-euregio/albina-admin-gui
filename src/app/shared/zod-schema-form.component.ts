import { Component, computed, input, model } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { TranslateModule } from "@ngx-translate/core";
import { xor } from "es-toolkit";
import { QuillModule } from "ngx-quill";
import { z } from "zod/v4";

import { ToggleBtnGroup } from "../danger-sources/toggle-btn-group";
import type * as IncidentModels from "../incidents/models/incident-report.model";
import { DateTimeInputComponent } from "./date-time-input.component";
import { EnumOtherComponent } from "./enum-other.component";
import { EnumSliderComponent } from "./enum-slider.component";
import { IncidentGroupSizeComponent } from "./incident-group-size.component";
import { widgetRegistry } from "./zod-schema-form.widget-registry";
import * as zodUtil from "./zod-util";

type IncidentSchema =
  | typeof IncidentModels.MetaInformationSchema
  | typeof IncidentModels.GeneralInformationSchema
  | typeof IncidentModels.LocationInformationSchema
  | typeof IncidentModels.GroupInformationSchema
  | typeof IncidentModels.InvolvementsFatalitiesBurialsSchema
  | typeof IncidentModels.VictimInformationSchema
  | typeof IncidentModels.AvalancheInformationSchema
  | typeof IncidentModels.OtherDamagesSchema
  | typeof IncidentModels.IncidentAnalysisSchema
  | typeof IncidentModels.IncidentAttachmentSchema;

type ShapeFields<T> = T extends { shape: infer S } ? S[keyof S] : never;

@Component({
  selector: "app-zod-schema-form",
  templateUrl: "zod-schema-form.component.html",
  standalone: true,
  imports: [
    DateTimeInputComponent,
    EnumOtherComponent,
    EnumSliderComponent,
    FormsModule,
    IncidentGroupSizeComponent,
    QuillModule,
    ToggleBtnGroup,
    TranslateModule,
  ],
})
export class ZodSchemaFormComponent<T extends z.ZodObject, V extends z.infer<T>> {
  readonly JSON = JSON;
  readonly Object = Object;
  readonly widgetRegistry = widgetRegistry;
  readonly zPrettifyError = z.prettifyError;
  readonly zodUtil = zodUtil;

  readonly value = model<V>();

  readonly disabled = input<boolean>(false);
  readonly zodType = input<T>();
  readonly labelI18n = input<`${string}#${string}`>();
  readonly helpI18n = input<`${string}#${string}`>();
  readonly groupIdentifiers = input<string[]>([]);
  readonly fields = computed(() =>
    Object.entries(this.zodType().shape).map(([key, value]) => ({
      key,
      value: value as ShapeFields<IncidentSchema>,
    })),
  );

  castArray(x: unknown) {
    return x as unknown[];
  }

  readonly showMandatoryOnly = input<boolean>(false);

  shouldShowField(schema: z.ZodType): boolean {
    if (this.showMandatoryOnly() && zodUtil.isFieldOptional(schema)) return false;
    const showIf = widgetRegistry.get(zodUtil.unwrap(schema))?.showIf;
    if (!showIf || showIf.length < 2) return true;
    const [key, ...allowed] = showIf;
    const val = this.value()?.[key];
    return allowed.includes(val as string);
  }

  onFieldChange() {
    const val = this.value();
    if (val) {
      this.value.set({ ...val });
    }
  }

  onCheckboxArrayChange(key: string, v: string): void {
    const value = this.value();
    Object.assign(value, { [key]: xor(this.castArray(value[key]) ?? [], [v]) });
    this.onFieldChange();
  }
}
