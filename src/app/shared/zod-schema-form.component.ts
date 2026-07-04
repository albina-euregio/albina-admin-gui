import { Component, computed, inject, input, model, ChangeDetectionStrategy } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { TranslatePipe, TranslateService } from "@ngx-translate/core";
import { Aspect } from "app/enums/enums";
import { isEqual, xor } from "es-toolkit";
import { QuillModule } from "ngx-quill";
import { z } from "zod/v4";

import type * as IncidentModels from "../incidents/incident-report.model";
import type { RegionConfigurationSchema } from "../models/region-configuration.model";
import type { ServerConfigurationSchema } from "../models/server-configuration.model";
import { AspectsComponent } from "./aspects.component";
import { DateTimeInputComponent } from "./date-time-input.component";
import { EnumOtherComponent } from "./enum-other.component";
import { EnumSliderComponent } from "./enum-slider.component";
import { RichTextMultilangComponent } from "./rich-text-multilang.component";
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
  | typeof IncidentModels.GroupInformationSchema
  | typeof IncidentModels.InvolvementsFatalitiesBurialsSchema
  | typeof IncidentModels.VictimInformationSchema
  | typeof IncidentModels.AvalancheInformationSchema
  | typeof IncidentModels.OtherDamagesSchema
  | typeof IncidentModels.IncidentAnalysisSchema
  | typeof IncidentModels.IncidentLinksSchema
  | typeof IncidentModels.IncidentAttachmentSchema;

type ShapeFields<T> = T extends { shape: infer S } ? S[keyof S] : never;

/**
 * How the form renders its fields. `Edit` and `EditMostRelevant` are interactive forms; every
 * other value is a read-only preview that additionally filters which fields are shown. New
 * variants can be added here without touching the form's API.
 */
export enum DisplayMode {
  /** Interactive, editable form (default). */
  Edit = "edit",
  /** Interactive, editable form showing mandatory ("most relevant") fields only. */
  EditMostRelevant = "editMostRelevant",
  /** Read-only preview of all fields. */
  All = "all",
  /** Read-only preview of fields flagged `public` only. */
  Public = "public",
  /** Read-only preview of fields that have a value only. */
  FilledOut = "filledOut",
}

/** Whether the given display mode renders an interactive, editable form (vs. a read-only preview). */
export function isEditableDisplayMode(mode: DisplayMode): boolean {
  return mode === DisplayMode.Edit || mode === DisplayMode.EditMostRelevant;
}

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
    RichTextMultilangComponent,
    ToggleBtnGroup,
    TranslatePipe,
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
  readonly displayMode = input<DisplayMode>(DisplayMode.Edit);
  /** True for any read-only preview mode; drives the existing display-vs-edit branches. */
  readonly displayOnly = computed(() => !isEditableDisplayMode(this.displayMode()));
  readonly diminishValues = input<Record<string, Partial<Record<string, boolean>>>>({});
  readonly zodType = input<T>();
  readonly labelI18n = input<`${string}#${string}`>();
  readonly helpI18n = input<`${string}#${string}`>();
  /** Dynamic `<select>` options keyed by field name, for string fields whose choices are not in the schema. */
  readonly selectOptions = input<Record<string, { value: string; label: string }[]>>({});
  // Which fields render (and in what order) is chosen by the caller via the `zodType` schema:
  // pass `Schema.pick({...})` / `Schema.omit({...})`. `.pick()` renders in the mask's key order.
  readonly fields = computed(() =>
    Object.entries(this.zodType().shape).map(([key, value]) => ({
      key,
      value: value as ShapeFields<SupportedSchema>,
    })),
  );

  castArray(x: unknown) {
    return x as unknown[];
  }
  castAspect(x: unknown) {
    return x as Aspect;
  }

  /** True in the {@link DisplayMode.EditMostRelevant} mode, which hides optional fields. */
  readonly showMandatoryOnly = computed(() => this.displayMode() === DisplayMode.EditMostRelevant);

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
    this.setField(`${key}Outside`, isOutside);
    this.setField(key, isOutside ? (this.zodType()?.shape?.[`${key}Outside`]?.description ?? "") : "");
  }

  shouldShowField(key: string, schema: z.ZodType): boolean {
    if (this.isPublicField(key)) return false;
    if (this.isOutsideField(key)) return false;
    if (this.showMandatoryOnly() && zodUtil.isFieldOptional(schema)) return false;
    if (this.displayMode() === DisplayMode.Public && !widgetRegistry.get(zodUtil.unwrap(schema))?.public) return false;
    if (this.displayMode() === DisplayMode.FilledOut && !zodUtil.hasValue(this.value()?.[key])) return false;
    const showIf = widgetRegistry.get(zodUtil.unwrap(schema))?.showIf;
    if (!showIf) return true;
    return showIf.every((cond) => {
      const val = this.value()?.[cond.field];
      const matches = (cond.values as unknown[]).includes(val);
      return cond.negate ? !matches : matches;
    });
  }

  fieldAriaLabel(key: string, zodValue: z.ZodType): string {
    const override = this.widgetRegistry.get(zodUtil.unwrap(zodValue))?.labelI18n;
    if (override) return this.translateService.instant(override);
    const labelI18n = this.labelI18n();
    if (labelI18n) return this.translateService.instant(labelI18n.replace("#", key));
    return (zodValue as z.ZodType & { description?: string })?.description || key;
  }

  /**
   * Immutably updates a single field: replaces the whole value object rather than mutating the
   * bound one in place. Mutating in place would alias the caller's object (the form receives it by
   * reference), so a parent diffing successive `valueChange`s could not see what changed.
   */
  setField(key: string, fieldValue: unknown): void {
    this.value.update((val) => (val ? ({ ...val, [key]: fieldValue } as V) : val));
  }

  onCheckboxArrayChange(key: string, v: string): void {
    this.setField(key, xor(this.castArray(this.value()?.[key]) ?? [], [v]));
  }
}
