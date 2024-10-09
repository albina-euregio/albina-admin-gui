import { Component } from "@angular/core";
import { TranslateService, TranslateModule } from "@ngx-translate/core";
import { AuthenticationService } from "../providers/authentication-service/authentication.service";
import { ConstantsService } from "../providers/constants-service/constants.service";
import { ActivatedRoute, Router } from "@angular/router";
import { formatDate, NgFor, NgIf, DatePipe } from "@angular/common";
import { UserService } from "../providers/user-service/user.service";
import { DangerSourcesService } from "./danger-sources.service";

@Component({
  templateUrl: "danger-sources.component.html",
  standalone: true,
  imports: [NgFor, NgIf, DatePipe, TranslateModule],
})
export class DangerSourcesComponent {
  constructor(
    public translate: TranslateService,
    public dangerSourcesService: DangerSourcesService,
    public route: ActivatedRoute,
    public translateService: TranslateService,
    public authenticationService: AuthenticationService,
    public constantsService: ConstantsService,
    public router: Router,
    public userService: UserService,
  ) {
    this.dangerSourcesService.init();
  }

  isOwnRegion(region) {
    const userRegion = this.authenticationService.getActiveRegionId();
    if (userRegion) {
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

  getForecastStatus(date: [Date, Date]) {
    return this.dangerSourcesService.forecastStatusMap.get(date[0].getTime());
  }

  getAnalysisStatus(date: [Date, Date]) {
    return this.dangerSourcesService.analysisStatusMap.get(date[0].getTime());
  }

  protected readonly formatDate = formatDate;
}
