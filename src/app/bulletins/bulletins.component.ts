import { Component, HostListener, OnDestroy, OnInit } from "@angular/core";
import { TranslateService } from "@ngx-translate/core";
import { BulletinUpdateModel } from "../models/bulletin-update.model";
import { BulletinsService } from "../providers/bulletins-service/bulletins.service";
import { AuthenticationService } from "../providers/authentication-service/authentication.service";
import { ConstantsService } from "../providers/constants-service/constants.service";
import { WsUpdateService } from "../providers/ws-update-service/ws-update.service";
import { SettingsService } from "../providers/settings-service/settings.service";
import { debounceTime, Subject } from "rxjs";
import { map } from "rxjs/operators";
import { ActivatedRoute, Router } from "@angular/router";
import * as Enums from "../enums/enums";
import { formatDate } from "@angular/common";
import { UserService } from "../providers/user-service/user.service";
import { DateIsoString, StressLevel } from "../models/stress-level.model";
import { BsModalService } from "ngx-bootstrap/modal";
import { TeamStressLevelsComponent } from "./team-stress-levels.component";

@Component({
  templateUrl: "bulletins.component.html",
})
export class BulletinsComponent implements OnInit, OnDestroy {
  public bulletinStatus = Enums.BulletinStatus;
  public updates: Subject<BulletinUpdateModel>;
  public copying: boolean;
  public stress: Record<DateIsoString, number> = {};
  public readonly postStressLevel = new Subject<StressLevel>();

  constructor(
    public translate: TranslateService,
    public bulletinsService: BulletinsService,
    public route: ActivatedRoute,
    public translateService: TranslateService,
    public authenticationService: AuthenticationService,
    public constantsService: ConstantsService,
    public settingsService: SettingsService,
    public router: Router,
    public wsUpdateService: WsUpdateService,
    public userService: UserService,
    private modalService: BsModalService,
  ) {
    this.copying = false;

    this.bulletinsService.init();

    this.postStressLevel
      .pipe(debounceTime(1000))
      .subscribe((stressLevel) => this.userService.postStressLevel(stressLevel).subscribe(() => {}));
    this.userService
      .getStressLevels([this.bulletinsService.dates.at(-1)[0], this.bulletinsService.dates.at(0)[1]])
      .subscribe((stressLevels) => {
        this.stress = Object.fromEntries(stressLevels.map((s) => [s.date, s.stressLevel]));
      });
  }

  ngOnInit() {
    this.wsUpdateConnect();
  }

  ngOnDestroy() {
    this.copying = false;
    this.wsUpdateDisconnect();
  }

  private wsUpdateConnect() {
    this.updates = <Subject<BulletinUpdateModel>>(
      this.wsUpdateService
        .connect(this.constantsService.getServerWsUrl() + "../update/" + this.authenticationService.getUsername())
        .pipe(
          map((response: any): BulletinUpdateModel => {
            const data = JSON.parse(response.data);
            const bulletinUpdate = BulletinUpdateModel.createFromJson(data);
            console.debug(
              "Bulletin update received: " +
                bulletinUpdate.getDate().toLocaleDateString() +
                " - " +
                bulletinUpdate.getRegion() +
                " [" +
                bulletinUpdate.getStatus() +
                "]",
            );
            this.bulletinsService.statusMap
              .get(bulletinUpdate.region)
              ?.set(new Date(bulletinUpdate.getDate()).getTime(), bulletinUpdate.getStatus());
            return bulletinUpdate;
          }),
        )
    );

    this.updates.subscribe((msg) => {});
  }

  private wsUpdateDisconnect() {
    this.wsUpdateService.disconnect();
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
    if (
      this.authenticationService.getActiveRegionId() !== undefined &&
      this.bulletinsService.getUserRegionStatus(date) &&
      this.bulletinsService.getUserRegionStatus(date) !== this.bulletinStatus.missing &&
      !this.copying &&
      (this.authenticationService.isCurrentUserInRole(this.constantsService.roleForecaster) ||
        this.authenticationService.isCurrentUserInRole(this.constantsService.roleForeman))
    ) {
      return true;
    } else {
      return false;
    }
  }

  showPasteButton(date: [Date, Date]) {
    if (
      this.authenticationService.getActiveRegionId() !== undefined &&
      this.bulletinsService.getUserRegionStatus(date) !== this.bulletinStatus.published &&
      this.bulletinsService.getUserRegionStatus(date) !== this.bulletinStatus.republished &&
      this.bulletinsService.getUserRegionStatus(date) !== this.bulletinStatus.submitted &&
      this.bulletinsService.getUserRegionStatus(date) !== this.bulletinStatus.resubmitted &&
      this.copying &&
      this.bulletinsService.getCopyDate() !== date &&
      !this.bulletinsService.hasBeenPublished5PM(date)
    ) {
      return true;
    } else {
      return false;
    }
  }

  isOwnRegion(region) {
    const userRegion = this.authenticationService.getActiveRegionId();
    if (userRegion && userRegion !== undefined) {
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

  @HostListener("document:keydown", ["$event"])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (event.keyCode === 27 && this.copying) {
      this.cancelCopy(event);
    }
  }

  cancelCopy(event) {
    event.stopPropagation();
    this.copying = false;
    this.bulletinsService.setCopyDate(undefined);
  }

  getStressLevelColor(date: DateIsoString) {
    const stress0 = this.stress[date];
    return !stress0 ? "gray" : stress0 < 20 ? "green" : stress0 < 70 ? "orange" : "red";
  }

  getStressLevelIcon(date: DateIsoString) {
    const stress0 = this.stress[date];
    return stress0 < 20
      ? "ph-smiley"
      : stress0 < 70
        ? "ph-smiley-meh"
        : stress0 <= 100
          ? "ph-smiley-x-eyes"
          : "ph-circle-dashed";
  }

  showTeamStressLevels() {
    if (!this.authenticationService.isCurrentUserInRole(this.constantsService.roleForecaster)) {
      return;
    }
    this.modalService.show(TeamStressLevelsComponent, {
      initialState: {
        dates: this.bulletinsService.dates,
      },
    });
  }

  protected readonly formatDate = formatDate;
}
