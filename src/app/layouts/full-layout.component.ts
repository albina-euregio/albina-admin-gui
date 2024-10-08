import { Component, ViewChild, TemplateRef } from "@angular/core";
import { TranslateService } from "@ngx-translate/core";
import { AuthenticationService } from "../providers/authentication-service/authentication.service";
import { BulletinsService } from "../providers/bulletins-service/bulletins.service";
import { SettingsService } from "../providers/settings-service/settings.service";
import { RegionsService } from "../providers/regions-service/regions.service";
import { RegionConfiguration } from "../providers/configuration-service/configuration.service";
import { ConstantsService } from "../providers/constants-service/constants.service";
import { LocalStorageService } from "../providers/local-storage-service/local-storage.service";
import { Router } from "@angular/router";
import { BsModalService } from "ngx-bootstrap/modal";
import { BsModalRef } from "ngx-bootstrap/modal";
import { environment } from "../../environments/environment";
import { DomSanitizer } from "@angular/platform-browser";

@Component({
  selector: "app-dashboard",
  templateUrl: "./full-layout.component.html",
})
export class FullLayoutComponent {
  public isSidebarOpen = false;

  public tmpRegion: RegionConfiguration;

  public changeRegionModalRef: BsModalRef;
  @ViewChild("changeRegionTemplate") changeRegionTemplate: TemplateRef<any>;

  public config = {
    animated: false,
    keyboard: true,
    class: "modal-sm",
  };

  constructor(
    public translateService: TranslateService,
    public authenticationService: AuthenticationService,
    public bulletinsService: BulletinsService,
    public settingsService: SettingsService,
    public regionsService: RegionsService,
    public constantsService: ConstantsService,
    public router: Router,
    private localStorageService: LocalStorageService,
    private modalService: BsModalService,
    private sanitizer: DomSanitizer,
  ) {
    this.tmpRegion = undefined;
  }

  get environment() {
    return environment;
  }

  get isNavbarShown(): boolean {
    return this.authenticationService.isUserLoggedIn() || !this.router.url.startsWith("/modelling");
  }

  getStyle() {
    const color = this.localStorageService.isTrainingEnabled ? "#a6d96a" : environment.headerBgColor;
    const style = `background-color: ${color}`;
    return this.sanitizer.bypassSecurityTrustStyle(style);
  }

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  public logout() {
    this.authenticationService.logout();
  }

  changeRegion(region: RegionConfiguration) {
    if (!this.authenticationService.getActiveRegionId().startsWith(region.id)) {
      if (this.router.url.startsWith("/bulletins/") && this.bulletinsService.getIsEditable()) {
        this.tmpRegion = region;
        this.openChangeRegionModal(this.changeRegionTemplate);
      } else {
        this.change(region);
      }
    }
  }

  openChangeRegionModal(template: TemplateRef<any>) {
    this.changeRegionModalRef = this.modalService.show(template, this.config);
  }

  changeRegionModalConfirm(): void {
    this.changeRegionModalRef.hide();
    this.change(this.tmpRegion);
    this.tmpRegion = undefined;
  }

  changeRegionModalDecline(): void {
    this.changeRegionModalRef.hide();
  }

  private change(region: RegionConfiguration) {
    this.authenticationService.setActiveRegion(region);
    this.bulletinsService.loadStatus();
    if (
      (this.router.url.startsWith("/modelling/zamg-wbt") && !region.enableWeatherbox) ||
      (this.router.url.startsWith("/modelling/geosphere") && !region.enableModelling) ||
      (this.router.url.startsWith("/observations") && !region.enableObservations)
    ) {
      this.router.navigate(["/bulletins"]);
    }
  }
}
