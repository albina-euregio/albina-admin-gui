import { BrowserModule } from "@angular/platform-browser";
import { NgModule } from "@angular/core";
import { LocationStrategy, HashLocationStrategy, registerLocaleData, DatePipe } from "@angular/common";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatDialogModule } from "@angular/material/dialog";

import { AppComponent } from "./app.component";

import { BrowserAnimationsModule } from "@angular/platform-browser/animations";

import { SIDEBAR_TOGGLE_DIRECTIVES } from "./shared/sidebar.directive";
import { AsideToggleDirective } from "./shared/aside.directive";
import { PasswordMismatchValidatorDirective } from "./shared/password-mismatch.directive";

import { CatalogOfPhrasesComponent } from "./catalog-of-phrases/catalog-of-phrases.component";

// Routing Module
import { AppRoutingModule } from "./app.routing";

// Layouts
import { FullLayoutComponent } from "./layouts/full-layout.component";
import { SimpleLayoutComponent } from "./layouts/simple-layout.component";

// Services
import { AuthenticationService } from "./providers/authentication-service/authentication.service";
import { UserService } from "./providers/user-service/user.service";
import { BulletinsService } from "./providers/bulletins-service/bulletins.service";
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
import { ConfirmationService } from "primeng/api";

// Pipes
import { PipeModule } from "./pipes/pipes.module";

import { AuthGuard } from "./guards/auth.guard";

import { TranslateModule, TranslateService } from "@ngx-translate/core";

import { HttpClientModule } from "@angular/common/http";

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
import { DialogService } from "primeng/dynamicdialog";
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

registerLocaleData(localeDe, "de");
registerLocaleData(localeIt, "it");
registerLocaleData(localeEn, "en");
registerLocaleData(localeFr, "fr");
registerLocaleData(localeEs, "es");
registerLocaleData(localeCa, "ca");
registerLocaleData(localeOc, "oc");

@NgModule({
  imports: [
    BrowserModule,
    AppRoutingModule,
    MatDialogModule,
    NgxSliderModule,
    BsDropdownModule.forRoot(),
    CollapseModule.forRoot(),
    TabsModule.forRoot(),
    AlertModule.forRoot(),
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    BrowserAnimationsModule,
    PipeModule.forRoot(),
    ModalModule.forRoot(),
    TranslateModule.forRoot(),
  ],
  declarations: [
    AppComponent,
    FullLayoutComponent,
    SimpleLayoutComponent,
    SIDEBAR_TOGGLE_DIRECTIVES,
    AsideToggleDirective,
    PasswordMismatchValidatorDirective,
    ModalSubmitComponent,
    ModalPublishComponent,
    ModalCheckComponent,
    ModalPublicationStatusComponent,
    ModalPublishAllComponent,
    ModalMediaFileComponent,
    CatalogOfPhrasesComponent,
    UpdateUserComponent,
    ChangePasswordComponent,
  ],
  providers: [
    {
      provide: LocationStrategy,
      useClass: HashLocationStrategy,
    },
    AlbinaObservationsService,
    AlpsolutProfileService,
    AuthenticationService,
    AuthGuard,
    BaseMapService,
    BlogService,
    BulletinsService,
    StatisticsService,
    RegionsService,
    WsRegionService,
    WsUpdateService,
    WsBulletinService,
    LocalStorageService,
    ConfigurationService,
    ConfirmationService,
    ConstantsService,
    CoordinateDataService,
    CopyService,
    DatePipe,
    DialogService,
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
    ObservedProfileSourceService,
    ParamService,
    provideEcharts(),
    QfaService,
    RegionsService,
    SettingsService,
    StatisticsService,
    TranslateService,
    UserService,
    WsBulletinService,
    WsRegionService,
    WsUpdateService,
  ],
  bootstrap: [AppComponent],
  exports: [TranslateModule],
})
export class AppModule {}
