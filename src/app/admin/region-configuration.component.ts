import { Component, input, inject, ChangeDetectionStrategy, linkedSignal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { TranslateService, TranslatePipe } from "@ngx-translate/core";
import { Alert } from "app/models/Alert";
import { ZodSchemaFormComponent } from "app/shared/zod-schema-form.component";
import { AlertModule } from "ngx-bootstrap/alert";
import { TabsModule } from "ngx-bootstrap/tabs";

import * as RegionModels from "../models/region-configuration.model";
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
  imports: [AlertModule, TabsModule, FormsModule, TranslatePipe, ZodInputComponent, ZodSchemaFormComponent],
  providers: [ConfigurationService],
  changeDetection: ChangeDetectionStrategy.Eager,
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

  readonly RegionModels = RegionModels;
  readonly RegionConfigurationSchema = RegionConfigurationSchema;
  readonly LanguageConfigurationSchema = LanguageConfigurationSchema;
  readonly LanguageConfigurationKeys: (keyof LanguageConfiguration)[] = [
    "warningServiceName",
    "warningServiceEmail",
    "websiteName",
    "url",
    "urlWithDate",
  ];
  readonly config = input<RegionConfiguration>(undefined);
  readonly localConfig = linkedSignal(() => this.config());
  readonly languages = LANGUAGES;

  public saveConfigurationLoading = false;

  public alerts: Alert[] = [];

  toggleLanguage(language: string, checked: boolean) {
    this.localConfig().enabledLanguages ??= [];
    if (checked) {
      this.localConfig().enabledLanguages.push(language);
    } else {
      this.localConfig().enabledLanguages = this.localConfig().enabledLanguages.filter((l) => l !== language);
    }
  }

  toggleTTSLanguage(language: string, checked: boolean) {
    this.localConfig().ttsLanguages ??= [];
    if (checked) {
      this.localConfig().ttsLanguages.push(language);
    } else {
      this.localConfig().ttsLanguages = this.localConfig().ttsLanguages.filter((l) => l !== language);
    }
  }

  public save() {
    this.saveConfigurationLoading = true;
    const config = this.localConfig();
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
