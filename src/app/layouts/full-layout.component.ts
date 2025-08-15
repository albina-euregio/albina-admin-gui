import { environment } from "../../environments/environment";
import { getRegionCoatOfArms, RegionConfiguration } from "../models/region-configuration.model";
import { AuthenticationService } from "../providers/authentication-service/authentication.service";
import { BulletinsService } from "../providers/bulletins-service/bulletins.service";
import { ConstantsService } from "../providers/constants-service/constants.service";
import { LocalStorageService } from "../providers/local-storage-service/local-storage.service";
import { RegionsService } from "../providers/regions-service/regions.service";
import { NgxMousetrapDirective } from "../shared/mousetrap-directive";
import { NgIf, NgFor } from "@angular/common";
import { Component, TemplateRef, viewChild, inject } from "@angular/core";
import { DomSanitizer } from "@angular/platform-browser";
import { Router, RouterLinkActive, RouterLink, RouterOutlet } from "@angular/router";
import { TranslateService, TranslateModule } from "@ngx-translate/core";
import { BsDropdownModule } from "ngx-bootstrap/dropdown";
import { BsModalService } from "ngx-bootstrap/modal";
import { BsModalRef } from "ngx-bootstrap/modal";

@Component({
  selector: "app-dashboard",
  templateUrl: "./full-layout.component.html",
  standalone: true,
  imports: [
    NgIf,
    RouterLinkActive,
    RouterLink,
    BsDropdownModule,
    NgFor,
    RouterOutlet,
    TranslateModule,
    NgxMousetrapDirective,
  ],
})
export class FullLayoutComponent {
  translateService = inject(TranslateService);
  authenticationService = inject(AuthenticationService);
  bulletinsService = inject(BulletinsService);
  regionsService = inject(RegionsService);
  constantsService = inject(ConstantsService);
  router = inject(Router);
  localStorageService = inject(LocalStorageService);
  private modalService = inject(BsModalService);
  private sanitizer = inject(DomSanitizer);
  getRegionCoatOfArms = getRegionCoatOfArms;

  public isSidebarOpen = false;

  public tmpRegion: RegionConfiguration;

  public changeRegionModalRef: BsModalRef;
  readonly changeRegionTemplate = viewChild<TemplateRef<unknown>>("changeRegionTemplate");

  public config = {
    animated: false,
    keyboard: true,
    class: "modal-sm",
  };

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
        this.openChangeRegionModal(this.changeRegionTemplate());
      } else {
        this.change(region);
      }
    }
  }

  openChangeRegionModal(template: TemplateRef<unknown>) {
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

  focusMap() {
    const mapElement = document.getElementById("map") ?? document.getElementById("observationsMap");
    if (mapElement) {
      mapElement.focus();
    }
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
