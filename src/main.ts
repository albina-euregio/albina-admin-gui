import { AppComponent } from "./app/app.component";
import { DangerSourcesService } from "./app/danger-sources/danger-sources.service";
import { AuthGuard } from "./app/guards/auth.guard";
import { GetDustParamService, GetFilenamesService, ParamService, QfaService } from "./app/modelling/qfa";
import { GeocodingService } from "./app/observations/geocoding.service";
import { ObservationFilterService } from "./app/observations/observation-filter.service";
import { ObservationMarkerObserverService } from "./app/observations/observation-marker-observer.service";
import { ObservationMarkerWeatherStationService } from "./app/observations/observation-marker-weather-station.service";
import { ObservationMarkerWebcamService } from "./app/observations/observation-marker-webcam.service";
import { ObservationMarkerService } from "./app/observations/observation-marker.service";
import { AlbinaObservationsService } from "./app/observations/observations.service";
import { AuthenticationService } from "./app/providers/authentication-service/authentication.service";
import { httpHeaders } from "./app/providers/authentication-service/http-headers";
import { BlogService } from "./app/providers/blog-service/blog.service";
import { BulletinsService } from "./app/providers/bulletins-service/bulletins.service";
import { ConfigurationService } from "./app/providers/configuration-service/configuration.service";
import { ConstantsService } from "./app/providers/constants-service/constants.service";
import { CopyService } from "./app/providers/copy-service/copy.service";
import { LocalStorageService } from "./app/providers/local-storage-service/local-storage.service";
import { BaseMapService } from "./app/providers/map-service/base-map.service";
import { CoordinateDataService } from "./app/providers/map-service/coordinate-data.service";
import { ElevationService } from "./app/providers/map-service/elevation.service";
import { MapService } from "./app/providers/map-service/map.service";
import { MediaFileService } from "./app/providers/media-file-service/media-file.service";
import { RegionsService } from "./app/providers/regions-service/regions.service";
import { StatisticsService } from "./app/providers/statistics-service/statistics.service";
import { UndoRedoService } from "./app/providers/undo-redo-service/undo-redo.service";
import { UserService } from "./app/providers/user-service/user.service";
import routes from "./app/routes";
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
import { provideAnimations } from "@angular/platform-browser/animations";
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

bootstrapApplication(AppComponent, {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    importProvidersFrom(
      BrowserModule,
      BsDropdownModule.forRoot(),
      CollapseModule.forRoot(),
      TabsModule.forRoot(),
      AlertModule.forRoot(),
      FormsModule,
      ReactiveFormsModule,
      ModalModule.forRoot(),
      TranslateModule.forRoot(),
    ),
    {
      provide: LocationStrategy,
      useClass: HashLocationStrategy,
    },
    AlbinaObservationsService,
    AuthenticationService,
    AuthGuard,
    BaseMapService,
    BlogService,
    BulletinsService,
    DangerSourcesService,
    StatisticsService,
    RegionsService,
    LocalStorageService,
    ConfigurationService,
    ConstantsService,
    CoordinateDataService,
    CopyService,
    DatePipe,
    ElevationService,
    GeocodingService,
    GetDustParamService,
    GetFilenamesService,
    LocalStorageService,
    MapService,
    MediaFileService,
    ObservationFilterService,
    ObservationMarkerService,
    ObservationMarkerObserverService,
    ObservationMarkerWeatherStationService,
    ObservationMarkerWebcamService,
    ParamService,
    provideEchartsCore({ echarts }),
    QfaService,
    RegionsService,
    StatisticsService,
    TranslateService,
    UndoRedoService,
    UserService,
    provideHttpClient(withInterceptors([httpHeaders]), withFetch()),
    provideAnimations(),
  ],
});
