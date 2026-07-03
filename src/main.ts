import { DatePipe, registerLocaleData } from "@angular/common";
import { provideHttpClient, withFetch, withInterceptors } from "@angular/common/http";
import localeCa from "@angular/common/locales/ca";
import localeDe from "@angular/common/locales/de";
import localeEn from "@angular/common/locales/en";
import localeEs from "@angular/common/locales/es";
import localeFr from "@angular/common/locales/fr";
import localeIt from "@angular/common/locales/it";
import localeOc from "@angular/common/locales/oc";
import { provideZoneChangeDetection } from "@angular/core";
import { bootstrapApplication } from "@angular/platform-browser";
import { provideRouter, TitleStrategy, withHashLocation } from "@angular/router";
import { provideTranslateService } from "@ngx-translate/core";
import { BarChart, LineChart, ScatterChart } from "echarts/charts";
import {
  DatasetComponent,
  GridComponent,
  LegendComponent,
  MarkLineComponent,
  PolarComponent,
  SingleAxisComponent,
  TitleComponent,
  TooltipComponent,
  TransformComponent,
} from "echarts/components";
import * as echarts from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import { provideEchartsCore } from "ngx-echarts";

import { AppComponent } from "./app/app.component";
import { provideAlbinaApiClient } from "./app/providers/albina-api.provider";
import { httpHeaders } from "./app/providers/authentication-service/http-headers";
import routes from "./app/routes";
import { TranslatedTitleStrategy } from "./app/shared/translated-title-strategy";

echarts.use([
  BarChart,
  CanvasRenderer,
  DatasetComponent,
  GridComponent,
  LegendComponent,
  LineChart,
  MarkLineComponent,
  PolarComponent,
  ScatterChart,
  SingleAxisComponent,
  TitleComponent,
  TooltipComponent,
  TransformComponent,
]);

for (const [id, data] of Object.entries({
  de: localeDe,
  it: localeIt,
  en: localeEn,
  fr: localeFr,
  es: localeEs,
  ca: localeCa,
  oc: localeOc,
})) {
  /**
   * Strip seconds from all of the locale's time formats (e.g. "HH:mm:ss" -> "HH:mm"),
   * which is what the "full"/"long"/"medium"/"short" Time DatePipe formats render.
   * Index 11 is the TimeFormat array [full, long, medium, short] in Angular's locale
   * data. Idempotent, so locales sharing the same array object (en/oc) are safe to
   * process twice.
   */
  const timeFormats = data[11] as string[];
  timeFormats.forEach((format, i) => {
    timeFormats[i] = format.replace(/[.:\s]*ss/, "");
  });

  /**
   * Drop the comma separating date and time in the combined date-time formats
   * (e.g. "{1}, {0}" -> "{1} {0}"), which is what the "medium"/"short" etc. DatePipe
   * formats use to join the two. Index 12 is the DateTimeFormat array [full, long,
   * medium, short]; entries may be null, in which case there is nothing to strip.
   */
  const dateTimeFormats = data[12] as (string | null)[];
  dateTimeFormats.forEach((format, i) => {
    if (format) dateTimeFormats[i] = format.replace(",", "");
  });
  registerLocaleData(data, id);
}

loadTemporalPolyfill().then(() => bootstrapApplication0());

async function loadTemporalPolyfill() {
  if (!globalThis.Temporal) {
    await import("temporal-polyfill/global");
  }
}

function bootstrapApplication0() {
  return bootstrapApplication(AppComponent, {
    providers: [
      provideZoneChangeDetection({ eventCoalescing: true }),
      provideRouter(routes, withHashLocation()),
      { provide: TitleStrategy, useClass: TranslatedTitleStrategy },
      provideTranslateService(),
      DatePipe,
      provideEchartsCore({ echarts }),
      provideHttpClient(withInterceptors([httpHeaders]), withFetch()),
      provideAlbinaApiClient(),
    ],
  });
}
