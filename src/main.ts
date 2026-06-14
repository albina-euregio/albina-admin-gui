import { DatePipe, registerLocaleData } from "@angular/common";
import { provideHttpClient, withFetch, withInterceptors } from "@angular/common/http";
import localeCa from "@angular/common/locales/ca";
import localeDe from "@angular/common/locales/de";
import { default as localeEn, default as localeOc } from "@angular/common/locales/en";
import localeEs from "@angular/common/locales/es";
import localeFr from "@angular/common/locales/fr";
import localeIt from "@angular/common/locales/it";
import { provideZoneChangeDetection } from "@angular/core";
import { bootstrapApplication } from "@angular/platform-browser";
import { provideAnimationsAsync } from "@angular/platform-browser/animations/async";
import { provideRouter, withHashLocation } from "@angular/router";
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
import { httpHeaders } from "./app/providers/authentication-service/http-headers";
import routes from "./app/routes";

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

registerLocaleData(localeDe, "de");
registerLocaleData(localeIt, "it");
registerLocaleData(localeEn, "en");
registerLocaleData(localeFr, "fr");
registerLocaleData(localeEs, "es");
registerLocaleData(localeCa, "ca");
registerLocaleData(localeOc, "oc");

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
      provideTranslateService(),
      DatePipe,
      provideEchartsCore({ echarts }),
      provideHttpClient(withInterceptors([httpHeaders]), withFetch()),
      provideAnimationsAsync("noop"),
    ],
  });
}
