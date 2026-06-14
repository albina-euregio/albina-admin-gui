import { Component, input, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { TranslateService, TranslateModule } from "@ngx-translate/core";
import { Alert } from "app/models/Alert";
import { ZodSchemaFormComponent } from "app/shared/zod-schema-form.component";
import { AlertModule } from "ngx-bootstrap/alert";
import { TabsModule } from "ngx-bootstrap/tabs";

import {
  LanguageConfiguration,
  LanguageConfigurationSchema,
  RegionConfiguration,
  RegionConfigurationSchema,
} from "../models/region-configuration.model";
import { LANGUAGES } from "../models/text.model";
import { AuthenticationService } from "../providers/authentication-service/authentication.service";
import { ConfigurationService } from "../providers/configuration-service/configuration.service";
import { ZodInputComponent } from "../shared/zod-input.component";

@Component({
  templateUrl: "region-configuration.component.html",
  selector: "app-region-configuration",
  standalone: true,
  imports: [AlertModule, TabsModule, FormsModule, TranslateModule, ZodInputComponent, ZodSchemaFormComponent],
  providers: [ConfigurationService],
  styles: `
    ::ng-deep .zod-form-field {
      margin-top: 1rem;
    }
    ::ng-deep .zod-form-field:last-of-type {
      margin-bottom: 1rem;
    }
  `,
})
export class RegionConfigurationComponent {
  private translateService = inject(TranslateService);
  configurationService = inject(ConfigurationService);
  authenticationService = inject(AuthenticationService);

  readonly RegionConfigurationSchema = RegionConfigurationSchema;
  readonly GeneralSchema = RegionConfigurationSchema.pick({
    id: true,
    coatOfArms: true,
    staticUrl: true,
    serverImagesUrl: true,
    educationUrl: true,
    microRegions: true,
    subRegions: true,
    superRegions: true,
    neighborRegions: true,
  });
  readonly PublicationSchema = RegionConfigurationSchema.pick({
    publishBulletins: true,
    enabledLanguages: true,
    ttsLanguages: true,
    publishBlogs: true,
    createCaamlV5: true,
    createCaamlV6: true,
    createJson: true,
    //
    createMaps: true,
    geoDataDirectory: true,
    mapLogoColorPath: true,
    mapLogoBwPath: true,
    mapLogoPosition: true,
    //
    createPdf: true,
    pdfColor: true,
    pdfMapYAmPm: true,
    pdfMapYFd: true,
    pdfMapWidthAmPm: true,
    pdfMapWidthFd: true,
    pdfMapHeight: true,
    pdfFooterLogo: true,
    pdfFooterLogoColorPath: true,
    pdfFooterLogoBwPath: true,
    imageColorbarColorPath: true,
    imageColorbarBwPath: true,
    //
    createSimpleHtml: true,
    simpleHtmlTemplateName: true,
    sendEmails: true,
    emailColor: true,
    sendTelegramMessages: true,
    sendWhatsAppMessages: true,
    sendPushNotifications: true,
  });
  readonly ComponentsSchema = RegionConfigurationSchema.pick({
    enableDangerSources: true,
    enableObservations: true,
    enableIncidents: true,
    enableModelling: true,
    enableIcon: true,
    enableLineaExport: true,
  });
  readonly ConfigurationSchema = RegionConfigurationSchema.pick({
    showMatrix: true,
    enableMediaFile: true,
    enableStrategicMindset: true,
    enableStressLevel: true,
    enableAvalancheProblemCornices: true,
    enableAvalancheProblemNoDistinctAvalancheProblem: true,
    enabledTextcatFields: true,
    enabledEditableFields: true,
  });
  readonly LanguageConfigurationSchema = LanguageConfigurationSchema;
  readonly LanguageConfigurationKeys: (keyof LanguageConfiguration)[] = [
    "warningServiceName",
    "warningServiceEmail",
    "websiteName",
    "url",
    "urlWithDate",
  ];
  readonly config = input<RegionConfiguration>(undefined);
  readonly languages = LANGUAGES;

  public saveConfigurationLoading = false;

  public alerts: Alert[] = [];

  toggleLanguage(language: string, checked: boolean) {
    this.config().enabledLanguages ??= [];
    if (checked) {
      this.config().enabledLanguages.push(language);
    } else {
      this.config().enabledLanguages = this.config().enabledLanguages.filter((l) => l !== language);
    }
  }

  toggleTTSLanguage(language: string, checked: boolean) {
    this.config().ttsLanguages ??= [];
    if (checked) {
      this.config().ttsLanguages.push(language);
    } else {
      this.config().ttsLanguages = this.config().ttsLanguages.filter((l) => l !== language);
    }
  }

  public save() {
    this.saveConfigurationLoading = true;
    const config = this.config();
    if (this.authenticationService.getActiveRegionId() == config.id) {
      this.authenticationService.setActiveRegion(config);
    }

    const json = RegionConfigurationSchema.parse(config);
    this.configurationService.postRegionConfiguration(json).subscribe(
      () => {
        this.saveConfigurationLoading = false;
        console.debug("Region configuration saved!");
        window.scrollTo(0, 0);
        this.alerts.push({
          type: "success",
          msg: this.translateService.instant("admin.region-configuration.success"),
          timeout: 5000,
        });
      },
      (error) => {
        this.saveConfigurationLoading = false;
        console.error("Region configuration could not be saved!", error);
        window.scrollTo(0, 0);
        this.alerts.push({
          type: "danger",
          msg: this.translateService.instant("admin.region-configuration.error"),
          timeout: 5000,
        });
      },
    );
  }

  onClosed(dismissedAlert: Alert): void {
    this.alerts = this.alerts.filter((alert) => alert !== dismissedAlert);
  }
}
