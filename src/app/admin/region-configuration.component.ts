import { Component, input, inject } from "@angular/core";
import { TranslateService, TranslateModule } from "@ngx-translate/core";
import { ConfigurationService } from "../providers/configuration-service/configuration.service";
import { AuthenticationService } from "../providers/authentication-service/authentication.service";
import { AlertComponent, AlertModule } from "ngx-bootstrap/alert";
import { NgFor, NgIf } from "@angular/common";
import { TabsModule } from "ngx-bootstrap/tabs";
import { FormsModule } from "@angular/forms";
import { RegionConfiguration } from "../models/region-configuration.model";

@Component({
  templateUrl: "region-configuration.component.html",
  selector: "app-region-configuration",
  standalone: true,
  imports: [NgFor, AlertModule, TabsModule, FormsModule, NgIf, TranslateModule],
})
export class RegionConfigurationComponent {
  private translateService = inject(TranslateService);
  configurationService = inject(ConfigurationService);
  authenticationService = inject(AuthenticationService);

  readonly config = input<RegionConfiguration>(undefined);

  public saveConfigurationLoading = false;

  public alerts: any[] = [];

  public save() {
    this.saveConfigurationLoading = true;
    const config = this.config();
    if (this.authenticationService.getActiveRegionId() == config.id) this.authenticationService.setActiveRegion(config);
    const json = Object();
    json["id"] = config.id;
    json["microRegions"] = config.microRegions;
    json["subRegions"] = config.subRegions;
    json["superRegions"] = config.superRegions;
    json["neighborRegions"] = config.neighborRegions;
    json["showMatrix"] = config.showMatrix;
    json["publishBulletins"] = config.publishBulletins;
    json["publishBlogs"] = config.publishBlogs;
    json["createCaamlV5"] = config.createCaamlV5;
    json["createCaamlV6"] = config.createCaamlV6;
    json["createJson"] = config.createJson;
    json["createMaps"] = config.createMaps;
    json["createPdf"] = config.createPdf;
    json["createSimpleHtml"] = config.createSimpleHtml;
    json["sendEmails"] = config.sendEmails;
    json["sendTelegramMessages"] = config.sendTelegramMessages;
    json["sendWhatsAppMessages"] = config.sendWhatsAppMessages;
    json["sendPushNotifications"] = config.sendPushNotifications;
    json["enableMediaFile"] = config.enableMediaFile;
    json["enableDangerSources"] = config.enableDangerSources;
    json["enableObservations"] = config.enableObservations;
    json["enableModelling"] = config.enableModelling;
    json["enableWeatherbox"] = config.enableWeatherbox;
    json["enableStrategicMindset"] = config.enableStrategicMindset;
    json["enableStressLevel"] = config.enableStressLevel;
    json["enableEditableFields"] = config.enableEditableFields;
    json["serverInstance"] = config.serverInstance;
    json["pdfColor"] = config.pdfColor;
    json["emailColor"] = config.emailColor;
    json["pdfMapYAmPm"] = config.pdfMapYAmPm;
    json["pdfMapYFd"] = config.pdfMapYFd;
    json["pdfMapWidthAmPm"] = config.pdfMapWidthAmPm;
    json["pdfMapWidthFd"] = config.pdfMapWidthFd;
    json["pdfMapHeight"] = config.pdfMapHeight;
    json["pdfFooterLogo"] = config.pdfFooterLogo;
    json["pdfFooterLogoColorPath"] = config.pdfFooterLogoColorPath;
    json["pdfFooterLogoBwPath"] = config.pdfFooterLogoBwPath;
    json["mapXmax"] = config.mapXmax;
    json["mapXmin"] = config.mapXmin;
    json["mapYmax"] = config.mapYmax;
    json["mapYmin"] = config.mapYmin;
    json["simpleHtmlTemplateName"] = config.simpleHtmlTemplateName;
    json["geoDataDirectory"] = config.geoDataDirectory;
    json["mapLogoColorPath"] = config.mapLogoColorPath;
    json["mapLogoBwPath"] = config.mapLogoBwPath;
    json["mapLogoPosition"] = config.mapLogoPosition;
    json["mapCenterLat"] = config.mapCenterLat;
    json["mapCenterLng"] = config.mapCenterLng;
    json["imageColorbarColorPath"] = config.imageColorbarColorPath;
    json["imageColorbarBwPath"] = config.imageColorbarBwPath;

    if (!config.isNew) {
      this.configurationService.updateRegionConfiguration(json).subscribe(
        (data) => {
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
          console.error("Region configuration could not be saved!");
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
        (data) => {
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
          console.error("Region configuration could not be saved!");
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

  onClosed(dismissedAlert: AlertComponent): void {
    this.alerts = this.alerts.filter((alert) => alert !== dismissedAlert);
  }
}
