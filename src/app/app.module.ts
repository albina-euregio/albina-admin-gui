import { BrowserModule } from "@angular/platform-browser";
import { ErrorHandler, NgModule } from "@angular/core";
import { LocationStrategy, HashLocationStrategy, registerLocaleData, DatePipe } from "@angular/common";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";

import { AppComponent } from "./app.component";

import { BrowserAnimationsModule } from "@angular/platform-browser/animations";

// Routing Module
import { AppRoutingModule } from "./app.routing";

// Layouts
import { FullLayoutComponent } from "./layouts/full-layout.component";
import { SimpleLayoutComponent } from "./layouts/simple-layout.component";

// Services
import { AuthenticationService } from "./providers/authentication-service/authentication.service";
import { UserService } from "./providers/user-service/user.service";
import { BulletinsService } from "./providers/bulletins-service/bulletins.service";
import { DangerSourcesService } from "./danger-sources/danger-sources.service";
import { StatisticsService } from "./providers/statistics-service/statistics.service";
import { RegionsService } from "./providers/regions-service/regions.service";
import { ConstantsService } from "./providers/constants-service/constants.service";
import { SettingsService } from "./providers/settings-service/settings.service";
import { WsBulletinService } from "./providers/ws-bulletin-service/ws-bulletin.service";
import { WsUpdateService } from "./providers/ws-update-service/ws-update.service";
import { WsRegionService } from "./providers/ws-region-service/ws-region.service";
import { LocalStorageService } from "./providers/local-storage-service/local-storage.service";
import { ConfigurationService } from "./providers/configuration-service/configuration.service";
import { CopyService } from "./providers/copy-service/copy.service";
import { BlogService } from "./providers/blog-service/blog.service";
import { MediaFileService } from "./providers/media-file-service/media-file.service";
import { UndoRedoService } from "./providers/undo-redo-service/undo-redo.service";

import { AuthGuard } from "./guards/auth.guard";

import { TranslateModule, TranslateService } from "@ngx-translate/core";

import { provideHttpClient, withInterceptorsFromDi } from "@angular/common/http";

import { AlertModule } from "ngx-bootstrap/alert";
import { BsDropdownModule } from "ngx-bootstrap/dropdown";
import { CollapseModule } from "ngx-bootstrap/collapse";
import { ModalModule } from "ngx-bootstrap/modal";
import { TabsModule } from "ngx-bootstrap/tabs";
import { NgxSliderModule } from "@angular-slider/ngx-slider";

import { ModalSubmitComponent } from "./bulletins/modal-submit.component";
import { ModalPublishComponent } from "./bulletins/modal-publish.component";
import { ModalCheckComponent } from "./bulletins/modal-check.component";
import { ModalPublicationStatusComponent } from "./bulletins/modal-publication-status.component";
import { ModalPublishAllComponent } from "./bulletins/modal-publish-all.component";
import { ModalMediaFileComponent } from "./bulletins/modal-media-file.component";
import { ModalEditDangerSourceComponent } from "./danger-sources/modal-edit-danger-source.component";

import localeDe from "@angular/common/locales/de";
import localeIt from "@angular/common/locales/it";
import localeEn from "@angular/common/locales/en";
import localeFr from "@angular/common/locales/fr";
import localeEs from "@angular/common/locales/es";
import localeCa from "@angular/common/locales/ca";
// locale OC missing in @angular/common/locales/
import localeOc from "@angular/common/locales/en";
import { UpdateUserComponent } from "./admin/update-user.component";
import { ChangePasswordComponent } from "./admin/change-password.component";
import { BaseMapService } from "./providers/map-service/base-map.service";
import { MapService } from "./providers/map-service/map.service";
import {
  AlpsolutProfileService,
  MeteogramSourceService,
  MultimodelSourceService,
  ObservedProfileSourceService,
} from "./modelling/sources";
import { GetDustParamService, GetFilenamesService, ParamService, QfaService } from "./modelling/qfa";
import { GeocodingService } from "./observations/geocoding.service";
import { CoordinateDataService } from "./providers/map-service/coordinate-data.service";
import { AlbinaObservationsService } from "./observations/observations.service";
import { ObservationMarkerService } from "./observations/observation-marker.service";
import { ElevationService } from "./providers/map-service/elevation.service";
import { ObservationFilterService } from "./observations/observation-filter.service";
import { provideEcharts } from "ngx-echarts";
import { createErrorHandler } from "@sentry/angular";
import { ObservationMarkerWeatherStationService } from "./observations/observation-marker-weather-station.service";
import { ObservationMarkerWebcamService } from "./observations/observation-marker-webcam.service";
import { ObservationMarkerObserverService } from "./observations/observation-marker-observer.service";

registerLocaleData(localeDe, "de");
registerLocaleData(localeIt, "it");
registerLocaleData(localeEn, "en");
registerLocaleData(localeFr, "fr");
registerLocaleData(localeEs, "es");
registerLocaleData(localeCa, "ca");
registerLocaleData(localeOc, "oc");

@NgModule({
  declarations: [AppComponent],
  bootstrap: [AppComponent],
  exports: [TranslateModule],
  imports: [
    BrowserModule,
    AppRoutingModule,
    NgxSliderModule,
    BsDropdownModule.forRoot(),
    CollapseModule.forRoot(),
    TabsModule.forRoot(),
    AlertModule.forRoot(),
    FormsModule,
    ReactiveFormsModule,
    BrowserAnimationsModule,
    ModalModule.forRoot(),
    TranslateModule.forRoot(),
    FullLayoutComponent,
    SimpleLayoutComponent,
    ModalSubmitComponent,
    ModalPublishComponent,
    ModalCheckComponent,
    ModalPublicationStatusComponent,
    ModalPublishAllComponent,
    ModalMediaFileComponent,
    ModalEditDangerSourceComponent,
    UpdateUserComponent,
    ChangePasswordComponent,
  ],
  providers: [
    {
      provide: LocationStrategy,
      useClass: HashLocationStrategy,
    },
    {
      provide: ErrorHandler,
      useValue: createErrorHandler({
        logErrors: true,
        showDialog: true,
      }),
    },
    AlbinaObservationsService,
    AlpsolutProfileService,
    AuthenticationService,
    AuthGuard,
    BaseMapService,
    BlogService,
    BulletinsService,
    DangerSourcesService,
    StatisticsService,
    RegionsService,
    WsRegionService,
    WsUpdateService,
    WsBulletinService,
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
    MeteogramSourceService,
    MultimodelSourceService,
    ObservationFilterService,
    ObservationMarkerService,
    ObservationMarkerObserverService,
    ObservationMarkerWeatherStationService,
    ObservationMarkerWebcamService,
    ObservedProfileSourceService,
    ParamService,
    provideEcharts(),
    QfaService,
    RegionsService,
    SettingsService,
    StatisticsService,
    TranslateService,
    UndoRedoService,
    UserService,
    WsBulletinService,
    WsRegionService,
    WsUpdateService,
    provideHttpClient(withInterceptorsFromDi()),
  ],
})
export class AppModule {}
