import { DatePipe, HashLocationStrategy, LocationStrategy, registerLocaleData } from "@angular/common";
import { provideHttpClient, withFetch, withInterceptors } from "@angular/common/http";
import localeCa from "@angular/common/locales/ca";
import localeDe from "@angular/common/locales/de";
import { default as localeEn, default as localeOc } from "@angular/common/locales/en";
import localeEs from "@angular/common/locales/es";
import localeFr from "@angular/common/locales/fr";
import localeIt from "@angular/common/locales/it";
import { importProvidersFrom, provideZoneChangeDetection } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { BrowserModule, bootstrapApplication } from "@angular/platform-browser";
import { provideAnimationsAsync } from "@angular/platform-browser/animations/async";
import { provideRouter } from "@angular/router";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
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
import { AlertModule } from "ngx-bootstrap/alert";
import { CollapseModule } from "ngx-bootstrap/collapse";
import { BsDropdownModule } from "ngx-bootstrap/dropdown";
import { ModalModule } from "ngx-bootstrap/modal";
import { TabsModule } from "ngx-bootstrap/tabs";
import { provideEchartsCore } from "ngx-echarts";

import { AppComponent } from "./app/app.component";
import { DangerSourcesService } from "./app/danger-sources/danger-sources.service";
import { AuthGuard } from "./app/guards/auth.guard";
import { AuthenticationService } from "./app/providers/authentication-service/authentication.service";
import { httpHeaders } from "./app/providers/authentication-service/http-headers";
import { BulletinsService } from "./app/providers/bulletins-service/bulletins.service";
import { ConstantsService } from "./app/providers/constants-service/constants.service";
import { CopyService } from "./app/providers/copy-service/copy.service";
import { LocalStorageService } from "./app/providers/local-storage-service/local-storage.service";
import { RegionsService } from "./app/providers/regions-service/regions.service";
import { UserService } from "./app/providers/user-service/user.service";
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
      provideRouter(routes),
      importProvidersFrom(BrowserModule, FormsModule, ReactiveFormsModule, TranslateModule.forRoot()),
      {
        provide: LocationStrategy,
        useClass: HashLocationStrategy,
      },
      AlertModule,
      AuthenticationService,
      AuthGuard,
      BsDropdownModule,
      BulletinsService,
      CollapseModule,
      ConstantsService,
      CopyService,
      DangerSourcesService,
      DatePipe,
      LocalStorageService,
      ModalModule,
      RegionsService,
      TabsModule,
      TranslateService,
      UserService,
      provideEchartsCore({ echarts }),
      provideHttpClient(withInterceptors([httpHeaders]), withFetch()),
      provideAnimationsAsync("noop"),
    ],
  });
}
