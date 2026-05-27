import { KeyValuePipe } from "@angular/common";
import { Component, computed, inject, input, model } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import z from "zod";

import { ToggleBtnGroup } from "../danger-sources/toggle-btn-group";
import { GeneralInformationSchema, MetaInformationSchema } from "../incidents/models/incident-report.model";
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

  zodObject = computed((): typeof MetaInformationSchema | typeof GeneralInformationSchema => {
    const t = this.zodType() as unknown;
    if (t === MetaInformationSchema) {
      return MetaInformationSchema;
    }
    if (t === GeneralInformationSchema) {
      return GeneralInformationSchema;
    }
    throw Error();
  });

  castArray(x: unknown) {
    return x as unknown[];
  }
}
