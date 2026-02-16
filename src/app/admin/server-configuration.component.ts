import { ServerConfiguration, ServerConfigurationSchema } from "../models/server-configuration.model";
import { ConfigurationService } from "../providers/configuration-service/configuration.service";
import { Component, inject, input } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { Alert } from "app/models/Alert";
import { ZodInputComponent } from "app/shared/zod-input.component";
import { AlertModule } from "ngx-bootstrap/alert";

@Component({
  templateUrl: "server-configuration.component.html",
  selector: "app-server-configuration",
  standalone: true,
  imports: [AlertModule, FormsModule, TranslateModule, ZodInputComponent],
})
export class ServerConfigurationComponent {
  private translateService = inject(TranslateService);
  configurationService = inject(ConfigurationService);

  ServerConfigurationSchema = ServerConfigurationSchema;
  readonly config = input<ServerConfiguration>(undefined);

  public saveConfigurationLoading = false;

  public alerts: Alert[] = [];

  public save() {
    this.saveConfigurationLoading = true;

    this.configurationService.postServerConfiguration(this.config()).subscribe(
      (response) => {
        this.config().id = response.id;
        console.log(response);
        this.saveConfigurationLoading = false;
        console.debug("Server configuration saved!");
        window.scrollTo(0, 0);
        this.alerts.push({
          type: "success",
          msg: this.translateService.instant("admin.server-configuration.success"),
          timeout: 5000,
        });
      },
      (error) => {
        this.saveConfigurationLoading = false;
        console.error("Server configuration could not be saved!", error);
        window.scrollTo(0, 0);
        this.alerts.push({
          type: "danger",
          msg: this.translateService.instant("admin.server-configuration.error"),
          timeout: 5000,
        });
      },
    );
  }

  onClosed(dismissedAlert: Alert): void {
    this.alerts = this.alerts.filter((alert) => alert !== dismissedAlert);
  }
}
