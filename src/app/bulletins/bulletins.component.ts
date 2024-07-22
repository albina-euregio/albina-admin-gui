import { Component, HostListener, OnInit, OnDestroy } from "@angular/core";
import { TranslateService } from "@ngx-translate/core";
import { BulletinUpdateModel } from "../models/bulletin-update.model";
import { BulletinsService } from "../providers/bulletins-service/bulletins.service";
import { AuthenticationService } from "../providers/authentication-service/authentication.service";
import { ConstantsService } from "../providers/constants-service/constants.service";
import { WsUpdateService } from "../providers/ws-update-service/ws-update.service";
import { SettingsService } from "../providers/settings-service/settings.service";
import { Subject } from "rxjs";
import { map } from "rxjs/operators";
import { Router, ActivatedRoute } from "@angular/router";
import * as Enums from "../enums/enums";
import { formatDate } from "@angular/common";
import { UserService } from "../providers/user-service/user.service";

@Component({
  templateUrl: "bulletins.component.html",
})
export class BulletinsComponent implements OnInit, OnDestroy {
  public bulletinStatus = Enums.BulletinStatus;
  public updates: Subject<BulletinUpdateModel>;
  public copying: boolean;
  public stress: Record<number, number> = {};

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
  ) {
    this.copying = false;

    this.bulletinsService.init();
    this.userService
      .getStressLevels([this.bulletinsService.dates.at(-1)[0], this.bulletinsService.dates[0][0]])
      .subscribe(() => {});
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
    const format = "yyyy-MM-dd";
    const locale = "en-US";
    const formattedDate = formatDate(date[1], format, locale);
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

  postStressLevel(date: Date) {
    console.trace();
    this.userService
      .postStressLevel({
        date,
        stressLevel: this.stress[+date],
      })
      .subscribe(() => {});
  }
}
