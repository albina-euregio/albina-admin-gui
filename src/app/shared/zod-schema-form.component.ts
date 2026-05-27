import { KeyValuePipe } from "@angular/common";
import { Component, computed, inject, input, model } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { z } from "zod/v4";

import { ToggleBtnGroup } from "../danger-sources/toggle-btn-group";
import * as IncidentModels from "../incidents/models/incident-report.model";
import { zodCssClass } from "./zod-css-class";

@Component({
  selector: "app-zod-schema-form",
  templateUrl: "zod-schema-form.component.html",
  standalone: true,
  imports: [FormsModule, KeyValuePipe, ToggleBtnGroup, TranslateModule],
})
export class ZodSchemaFormComponent<T extends z.ZodObject, V extends z.infer<T>> {
  readonly JSON = JSON;
  readonly Object = Object;
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

  castArray(x: unknown) {
    return x as unknown[];
  }

  unwrap<T extends z.ZodType>(t: T): T | z.ZodNumber {
    while (t.type === "optional" || t.type === "nullable" || t.type === "default") {
      t = (t as unknown as z.ZodOptional | z.ZodNullable | z.ZodDefault).unwrap() as T;
    }
    return t;
  }
}
