import { KeyValuePipe } from "@angular/common";
import { Component, computed, inject, input, model } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import z from "zod";

import { ToggleBtnGroup } from "../danger-sources/toggle-btn-group";
import * as IncidentModels from "../incidents/models/incident-report.model";
import { ZodInputComponent } from "./zod-input.component";

@Component({
  selector: "app-zod-schema-form",
  templateUrl: "zod-schema-form.component.html",
  standalone: true,
  imports: [FormsModule, KeyValuePipe, ToggleBtnGroup, TranslateModule, ZodInputComponent],
})
export class ZodSchemaFormComponent<T extends z.ZodObject, V extends z.infer<T>> {
  readonly JSON = JSON;
  readonly Object = Object;

  readonly translateService = inject(TranslateService);

  readonly value = model<V>();

  readonly disabled = input<boolean>(false);
  readonly zodType = input<T>();
  readonly labelI18n = input<`${string}#${string}`>();
  readonly helpI18n = input<`${string}#${string}`>();

  zodObject = computed(
    ():
      | typeof IncidentModels.MetaInformationSchema
      | typeof IncidentModels.GeneralInformationSchema
      | typeof IncidentModels.LocationInformationSchema => {
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
      throw Error();
    },
  );

  castArray(x: unknown) {
    return x as unknown[];
  }

  unwrap<T extends z.ZodType>(t: T): T {
    while (t.type === "optional" || t.type === "nullable") {
      t = (t as unknown as z.ZodOptional | z.ZodNullable).unwrap() as T;
    }
    return t;
  }
}
