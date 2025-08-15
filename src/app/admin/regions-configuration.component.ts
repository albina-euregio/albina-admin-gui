import { RegionConfiguration } from "../models/region-configuration.model";
import { AuthenticationService } from "../providers/authentication-service/authentication.service";
import { ConfigurationService } from "../providers/configuration-service/configuration.service";
import { ConstantsService } from "../providers/constants-service/constants.service";
import { RegionsService } from "../providers/regions-service/regions.service";
import { RegionConfigurationComponent } from "./region-configuration.component";
import { NgIf, NgFor } from "@angular/common";
import { Component, AfterContentInit, inject } from "@angular/core";
import { TranslateModule } from "@ngx-translate/core";
import { AccordionModule } from "ngx-bootstrap/accordion";

@Component({
  templateUrl: "regions-configuration.component.html",
  selector: "app-regions-configuration",
  standalone: true,
  imports: [NgIf, AccordionModule, NgFor, RegionConfigurationComponent, TranslateModule],
})
export class RegionsConfigurationComponent implements AfterContentInit {
  private authenticationService = inject(AuthenticationService);
  private constantsService = inject(ConstantsService);
  regionsService = inject(RegionsService);
  configurationService = inject(ConfigurationService);

  public configurationPropertiesLoaded = false;
  public regionConfigurations: RegionConfiguration[];

  ngAfterContentInit() {
    if (this.authenticationService.isCurrentUserInRole(this.constantsService.roleAdmin)) {
      this.configurationService.loadRegionConfigurations().subscribe(
        (data) => {
          this.regionConfigurations = data.sort((r1, r2) =>
            this.regionsService.getRegionName(r1.id).localeCompare(this.regionsService.getRegionName(r2.id)),
          );
          this.configurationPropertiesLoaded = true;
        },
        (error) => {
          console.error("Region configurations could not be loaded!");
        },
      );
    }
  }

  public createRegion(event) {
    const newRegion = {} as RegionConfiguration;
    newRegion.isNew = true;
    this.regionConfigurations.push(newRegion);
  }
}
