import { Component, OnInit, inject } from "@angular/core";
import { AuthenticationService } from "../providers/authentication-service/authentication.service";
import { ConstantsService } from "../providers/constants-service/constants.service";
import { ConfigurationService, ServerConfiguration } from "../providers/configuration-service/configuration.service";
import { AccordionModule } from "ngx-bootstrap/accordion";
import { NgIf, NgFor } from "@angular/common";
import { ServerConfigurationComponent } from "./server-configuration.component";
import { TranslateModule } from "@ngx-translate/core";

@Component({
  templateUrl: "servers-configuration.component.html",
  selector: "app-servers-configuration",
  standalone: true,
  imports: [AccordionModule, NgIf, ServerConfigurationComponent, NgFor, TranslateModule],
})
export class ServersConfigurationComponent implements OnInit {
  private authenticationService = inject(AuthenticationService);
  private constantsService = inject(ConstantsService);
  configurationService = inject(ConfigurationService);

  public saveConfigurationLoading: boolean;
  public localServerConfiguration: ServerConfiguration;
  public externalServerConfigurations: ServerConfiguration[];

  constructor() {
    this.saveConfigurationLoading = false;
  }

  ngOnInit() {
    if (this.authenticationService.isCurrentUserInRole(this.constantsService.roleAdmin)) {
      this.configurationService.loadLocalServerConfiguration().subscribe(
        (data) => {
          // TODO implement
          this.localServerConfiguration = data;
        },
        (error) => {
          console.error("Local server configuration could not be loaded!");
        },
      );
      this.configurationService.loadExternalServerConfigurations().subscribe(
        (data) => {
          // TODO implement
          this.externalServerConfigurations = data;
        },
        (error) => {
          console.error("External server configurations could not be loaded!");
        },
      );
    }
  }

  public createServer(event) {
    const newServer = {} as ServerConfiguration;
    newServer.isNew = true;
    newServer.externalServer = true;
    this.externalServerConfigurations.push(newServer);
  }
}
