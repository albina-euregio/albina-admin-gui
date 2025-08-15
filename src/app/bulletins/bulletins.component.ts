import * as Enums from "../enums/enums";
import { BulletinUpdateModel } from "../models/bulletin-update.model";
import { StressLevel } from "../models/stress-level.model";
import { AuthenticationService } from "../providers/authentication-service/authentication.service";
import { BulletinsService } from "../providers/bulletins-service/bulletins.service";
import { ConstantsService } from "../providers/constants-service/constants.service";
import { LocalStorageService } from "../providers/local-storage-service/local-storage.service";
import { UserService } from "../providers/user-service/user.service";
import { WsUpdateService } from "../providers/ws-update-service/ws-update.service";
import { NgxMousetrapDirective } from "../shared/mousetrap-directive";
import { TeamStressLevelsComponent } from "./team-stress-levels.component";
import { formatDate, NgIf, NgFor, DatePipe } from "@angular/common";
import { Component, OnDestroy, OnInit, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { TranslateService, TranslateModule } from "@ngx-translate/core";
import { BsModalService } from "ngx-bootstrap/modal";
import { debounceTime, Subject } from "rxjs";
import { groupBy, map, mergeMap } from "rxjs/operators";

@Component({
  templateUrl: "bulletins.component.html",
  standalone: true,
  imports: [NgIf, NgFor, FormsModule, DatePipe, TranslateModule, NgxMousetrapDirective],
})
export class BulletinsComponent implements OnInit, OnDestroy {
  translate = inject(TranslateService);
  bulletinsService = inject(BulletinsService);
  route = inject(ActivatedRoute);
  translateService = inject(TranslateService);
  authenticationService = inject(AuthenticationService);
  constantsService = inject(ConstantsService);
  localStorageService = inject(LocalStorageService);
  router = inject(Router);
  wsUpdateService = inject(WsUpdateService);
  userService = inject(UserService);
  private modalService = inject(BsModalService);

  public bulletinStatus = Enums.BulletinStatus;
  public updates: Subject<BulletinUpdateModel>;
  public copying: boolean;
  public readonly postStressLevel = new Subject<StressLevel>();

  constructor() {
    this.copying = false;

    this.bulletinsService.init();

    this.postStressLevel
      .pipe(
        groupBy((l) => l.date),
        mergeMap((ll) => ll.pipe(debounceTime(1000))),
      )
      .subscribe((stressLevel) => this.userService.postStressLevel(stressLevel).subscribe(() => {}));
  }

  ngOnInit() {
    this.wsUpdateConnect();
  }

  ngOnDestroy() {
    this.copying = false;
    this.wsUpdateDisconnect();
  }

  private wsUpdateConnect() {
    this.updates = this.wsUpdateService
      .connect(this.constantsService.getServerWsUrl(`../update/${this.authenticationService.getUsername()}`))
      .pipe(
        map((response): BulletinUpdateModel => {
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
      ) as Subject<BulletinUpdateModel>;

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

  protected readonly formatDate = formatDate;
}
