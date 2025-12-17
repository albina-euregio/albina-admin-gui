import * as Enums from "../enums/enums";
import { BulletinUpdateModel } from "../models/bulletin-update.model";
import { StressLevel } from "../models/stress-level.model";
import { AuthenticationService } from "../providers/authentication-service/authentication.service";
import { BulletinsService } from "../providers/bulletins-service/bulletins.service";
import { ConstantsService } from "../providers/constants-service/constants.service";
import { LocalStorageService } from "../providers/local-storage-service/local-storage.service";
import { RegionsService } from "../providers/regions-service/regions.service";
import { StatusService } from "../providers/status-service/status.service";
import { UserService } from "../providers/user-service/user.service";
import { NgxMousetrapDirective } from "../shared/mousetrap-directive";
import { TeamStressLevelsComponent } from "./team-stress-levels.component";
import { formatDate, DatePipe } from "@angular/common";
import { Component, OnDestroy, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { TranslateService, TranslateModule } from "@ngx-translate/core";
import { StatusInformationModel } from "app/models/status-information.model";
import { AlertModule } from "ngx-bootstrap/alert";
import { BsModalService } from "ngx-bootstrap/modal";
import { debounceTime, Subject } from "rxjs";
import { groupBy, mergeMap } from "rxjs/operators";

@Component({
  templateUrl: "bulletins.component.html",
  standalone: true,
  imports: [FormsModule, DatePipe, TranslateModule, NgxMousetrapDirective, AlertModule],
})
export class BulletinsComponent implements OnDestroy {
  translate = inject(TranslateService);
  bulletinsService = inject(BulletinsService);
  route = inject(ActivatedRoute);
  translateService = inject(TranslateService);
  authenticationService = inject(AuthenticationService);
  regionsService = inject(RegionsService);
  constantsService = inject(ConstantsService);
  localStorageService = inject(LocalStorageService);
  router = inject(Router);
  userService = inject(UserService);
  statusService = inject(StatusService);
  private modalService = inject(BsModalService);

  public bulletinStatus = Enums.BulletinStatus;
  public updates: Subject<BulletinUpdateModel>;
  public copying: boolean;
  public readonly postStressLevel = new Subject<StressLevel>();
  public channelStatusInformation: StatusInformationModel[] = [];

  constructor() {
    this.copying = false;

    this.bulletinsService.init();

    if (this.authenticationService.isCurrentUserInRole(this.constantsService.roleAdmin)) {
      this.loadChannelStatusInformation();
    }

    this.postStressLevel
      .pipe(
        groupBy((l) => l.date),
        mergeMap((ll) => ll.pipe(debounceTime(1000))),
      )
      .subscribe((stressLevel) => this.userService.postStressLevel(stressLevel).subscribe(() => {}));
  }

  ngOnDestroy() {
    this.copying = false;
  }

  getActiveRegionStatus(date: [Date, Date]) {
    const regionStatusMap = this.bulletinsService.statusMap.get(this.authenticationService.getActiveRegionId());
    if (regionStatusMap) return regionStatusMap.get(date[0].getTime());
    else return Enums.BulletinStatus.missing;
  }

  getRegionStatus(region, date: [Date, Date]) {
    const regionStatusMap = this.bulletinsService.statusMap.get(region);
    if (regionStatusMap) return regionStatusMap.get(date[0].getTime());
    else return Enums.BulletinStatus.missing;
  }

  showCopyButton(date: [Date, Date]) {
    return (
      this.authenticationService.getActiveRegionId() !== undefined &&
      this.bulletinsService.getUserRegionStatus(date) &&
      this.bulletinsService.getUserRegionStatus(date) !== this.bulletinStatus.missing &&
      !this.copying &&
      (this.authenticationService.isCurrentUserInRole(this.constantsService.roleForecaster) ||
        this.authenticationService.isCurrentUserInRole(this.constantsService.roleForeman))
    );
  }

  showPasteButton(date: [Date, Date]) {
    return (
      this.authenticationService.getActiveRegionId() !== undefined &&
      this.bulletinsService.getUserRegionStatus(date) !== this.bulletinStatus.published &&
      this.bulletinsService.getUserRegionStatus(date) !== this.bulletinStatus.republished &&
      this.bulletinsService.getUserRegionStatus(date) !== this.bulletinStatus.submitted &&
      this.bulletinsService.getUserRegionStatus(date) !== this.bulletinStatus.resubmitted &&
      this.copying &&
      this.bulletinsService.getCopyDate() !== date &&
      !this.bulletinsService.hasBeenPublished5PM(date)
    );
  }

  isOwnRegion(region) {
    const userRegion = this.authenticationService.getActiveRegionId();
    if (userRegion) {
      return this.authenticationService.getActiveRegionId().startsWith(region);
    } else {
      return false;
    }
  }

  editBulletin(date: [Date, Date], isReadOnly?: boolean) {
    const formattedDate = this.constantsService.getISODateString(date[1]);
    this.bulletinsService.setIsReadOnly(isReadOnly);
    this.router.navigate(["/bulletins/" + formattedDate], { queryParams: { readOnly: isReadOnly } });
  }

  copy(event, date: [Date, Date]) {
    event.stopPropagation();
    this.copying = true;
    this.bulletinsService.setCopyDate(date);
  }

  paste(event, date: [Date, Date]) {
    event.stopPropagation();
    this.copying = false;
    this.editBulletin(date);
  }

  cancelCopy(event: Event) {
    event.stopPropagation();
    this.copying = false;
    this.bulletinsService.setCopyDate(undefined);
  }

  showTeamStressLevels() {
    if (!this.authenticationService.isCurrentUserInRole(this.constantsService.roleForecaster)) {
      return;
    }
    this.modalService.show(TeamStressLevelsComponent, {});
  }

  loadChannelStatusInformation() {
    this.statusService.getStatusInformation().subscribe((result) => {
      this.channelStatusInformation = result;
    });
  }

  /**
   * Filter status information to get only those entries for which the server returned
   * {"ok": false, "message": "..."}.
   */
  get invalidStatusInformation() {
    return this.channelStatusInformation.filter((status) => !status.ok);
  }

  protected readonly formatDate = formatDate;
}
