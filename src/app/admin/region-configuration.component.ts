import {
  LanguageConfigurationSchema,
  RegionConfiguration,
  RegionConfigurationSchema,
} from "../models/region-configuration.model";
import { LANGUAGES } from "../models/text.model";
import { AuthenticationService } from "../providers/authentication-service/authentication.service";
import { ConfigurationService } from "../providers/configuration-service/configuration.service";
import { Component, input, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { TranslateService, TranslateModule } from "@ngx-translate/core";
import { Alert } from "app/models/Alert";
import { AlertModule } from "ngx-bootstrap/alert";
import { TabsModule } from "ngx-bootstrap/tabs";

@Component({
  templateUrl: "region-configuration.component.html",
  selector: "app-region-configuration",
  standalone: true,
  imports: [AlertModule, TabsModule, FormsModule, TranslateModule],
})
export class RegionConfigurationComponent {
  private translateService = inject(TranslateService);
  configurationService = inject(ConfigurationService);
  authenticationService = inject(AuthenticationService);

  readonly RegionConfigurationSchema = RegionConfigurationSchema;
  readonly LanguageConfigurationSchema = LanguageConfigurationSchema;
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

    const json = RegionConfigurationSchema.omit({ $isNew: true }).parse(config);
    if (!config.$isNew) {
      this.configurationService.updateRegionConfiguration(json).subscribe(
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
    } else {
      this.configurationService.createRegionConfiguration(json).subscribe(
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
  }

  onClosed(dismissedAlert: Alert): void {
    this.alerts = this.alerts.filter((alert) => alert !== dismissedAlert);
  }
}
