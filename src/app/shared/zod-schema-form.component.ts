import { Component, computed, inject, input, model, ChangeDetectionStrategy } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { Aspect } from "app/enums/enums";
import { isEqual, xor } from "es-toolkit";
import { QuillModule } from "ngx-quill";
import { z } from "zod/v4";

import type * as IncidentModels from "../incidents/models/incident-report.model";
import type { RegionConfigurationSchema } from "../models/region-configuration.model";
import type { ServerConfigurationSchema } from "../models/server-configuration.model";
import { AspectsComponent } from "./aspects.component";
import { DateTimeInputComponent } from "./date-time-input.component";
import { EnumOtherComponent } from "./enum-other.component";
import { EnumSliderComponent } from "./enum-slider.component";
import { ToggleBtnGroup } from "./toggle-btn-group";
import { ZodDisplayComponent } from "./zod-display.component";
import { widgetRegistry } from "./zod-schema-form.widget-registry";
import * as zodUtil from "./zod-util";

type SupportedSchema =
  | typeof ServerConfigurationSchema
  | typeof RegionConfigurationSchema
  | typeof IncidentModels.MetaInformationSchema
  | typeof IncidentModels.GeneralInformationSchema
  | typeof IncidentModels.BulletinInformationSchema
  | typeof IncidentModels.LocationInformationSchema
  | typeof IncidentModels.GroupInformationSchema
  | typeof IncidentModels.InvolvementsFatalitiesBurialsSchema
  | typeof IncidentModels.VictimInformationSchema
  | typeof IncidentModels.AvalancheInformationSchema
  | typeof IncidentModels.OtherDamagesSchema
  | typeof IncidentModels.IncidentAnalysisSchema
  | typeof IncidentModels.IncidentLinksSchema
  | typeof IncidentModels.IncidentAttachmentSchema;

type ShapeFields<T> = T extends { shape: infer S } ? S[keyof S] : never;

@Component({
  selector: "app-zod-schema-form",
  templateUrl: "zod-schema-form.component.html",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    AspectsComponent,
    DateTimeInputComponent,
    EnumOtherComponent,
    EnumSliderComponent,
    FormsModule,
    QuillModule,
    ToggleBtnGroup,
    TranslateModule,
    ZodDisplayComponent,
  ],
})
export class ZodSchemaFormComponent<T extends z.ZodObject, V extends z.infer<T>> {
  readonly translateService = inject(TranslateService);
  readonly JSON = JSON;
  readonly Object = Object;
  readonly widgetRegistry = widgetRegistry;
  readonly zPrettifyError = z.prettifyError;
  readonly zodUtil = zodUtil;
  readonly isEqual = isEqual;

  readonly value = model<V>();
  readonly valueForCompare = input<V | undefined>();

  readonly disabled = input<boolean>(false);
  readonly displayOnly = input<boolean>(false);
  readonly diminishValues = input<Record<string, Partial<Record<string, boolean>>>>({});
  readonly zodType = input<T>();
  readonly labelI18n = input<`${string}#${string}`>();
  readonly helpI18n = input<`${string}#${string}`>();
  readonly groupIdentifiers = input<string[]>([]);
  readonly includeFields = input<string[]>();
  readonly excludeFields = input<string[]>();
  readonly fields = computed(() => {
    const include = this.includeFields();
    const exclude = this.excludeFields();
    return Object.entries(this.zodType().shape)
      .filter(([key]) => (!include || include.includes(key)) && (!exclude || !exclude.includes(key)))
      .map(([key, value]) => ({
        key,
        value: value as ShapeFields<SupportedSchema>,
      }));
  });

  castArray(x: unknown) {
    return x as unknown[];
  }
  castAspect(x: unknown) {
    return x as Aspect;
  }

  readonly showMandatoryOnly = input<boolean>(false);

  isPublicField(key: string): boolean {
    if (key === "public") return true;
    if (!key.endsWith("Public")) return false;
    const baseKey = key.slice(0, -6);
    const shape = this.zodType()?.shape;
    return !!shape && baseKey in shape;
  }

  hasPublicField(key: string): boolean {
    const shape = this.zodType()?.shape;
    if (!shape) return false;
    return key + "Public" in shape;
  }

  isOutsideField(key: string): boolean {
    if (!key.endsWith("Outside")) return false;
    const baseKey = key.slice(0, -7);
    const shape = this.zodType()?.shape;
    return !!shape && baseKey in shape;
  }

  hasOutsideField(key: string): boolean {
    const shape = this.zodType()?.shape;
    if (!shape) return false;
    return key + "Outside" in shape;
  }

  onOutsideFieldChange(key: string, isOutside: boolean): void {
    const val = this.value();
    if (!val) return;
    const text = isOutside ? (this.zodType()?.shape?.[key + "Outside"]?.description ?? "") : "";
    Object.assign(val, { [key]: text });
    this.onFieldChange();
  }

  shouldShowField(key: string, schema: z.ZodType): boolean {
    if (this.isPublicField(key)) return false;
    if (this.isOutsideField(key)) return false;
    if (this.showMandatoryOnly() && zodUtil.isFieldOptional(schema)) return false;
    const showIf = widgetRegistry.get(zodUtil.unwrap(schema))?.showIf;
    if (!showIf) return true;
    return showIf.every((cond) => {
      const val = this.value()?.[cond.field];
      const matches = (cond.values as unknown[]).includes(val);
      return cond.negate ? !matches : matches;
    });
  }

  fieldAriaLabel(key: string, zodValue: z.ZodType): string {
    const labelI18n = this.labelI18n();
    if (labelI18n) return this.translateService.instant(labelI18n.replace("#", key));
    return (zodValue as z.ZodType & { description?: string })?.description || key;
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
