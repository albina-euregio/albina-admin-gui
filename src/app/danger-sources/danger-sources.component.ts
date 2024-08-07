import { Component } from "@angular/core";
import { TranslateService } from "@ngx-translate/core";
import { AuthenticationService } from "../providers/authentication-service/authentication.service";
import { ConstantsService } from "../providers/constants-service/constants.service";
import { SettingsService } from "../providers/settings-service/settings.service";
import { ActivatedRoute, Router } from "@angular/router";
import { formatDate } from "@angular/common";
import { UserService } from "../providers/user-service/user.service";
import { DangerSourcesService } from "./danger-sources.service";

@Component({
  templateUrl: "danger-sources.component.html",
})
export class DangerSourcesComponent {
  constructor(
    public translate: TranslateService,
    public dangerSourcesService: DangerSourcesService,
    public route: ActivatedRoute,
    public translateService: TranslateService,
    public authenticationService: AuthenticationService,
    public constantsService: ConstantsService,
    public settingsService: SettingsService,
    public router: Router,
    public userService: UserService,
  ) {
    this.dangerSourcesService.init();
  }

  isOwnRegion(region) {
    const userRegion = this.authenticationService.getActiveRegionId();
    if (userRegion && userRegion !== undefined) {
      return this.authenticationService.getActiveRegionId().startsWith(region);
    } else {
      return false;
    }
  }

  editDangerSources(date: [Date, Date], isReadOnly?: boolean) {
    const formattedDate = this.constantsService.getISODateString(date[1]);
    this.dangerSourcesService.setIsReadOnly(isReadOnly);
    this.router.navigate(["/danger-sources/" + formattedDate], { queryParams: { readOnly: isReadOnly } });
  }

  protected readonly formatDate = formatDate;
}
