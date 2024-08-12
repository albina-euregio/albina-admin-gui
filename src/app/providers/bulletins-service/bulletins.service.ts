import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable, Subject } from "rxjs";
import { map } from "rxjs/operators";
import { ConstantsService } from "../constants-service/constants.service";
import { SettingsService } from "../settings-service/settings.service";
import { AuthenticationService } from "../authentication-service/authentication.service";
import { WsBulletinService } from "../ws-bulletin-service/ws-bulletin.service";
import { BulletinLockModel } from "../../models/bulletin-lock.model";
import { ServerModel } from "../../models/server.model";
import * as Enums from "../../enums/enums";
import { BulletinModel } from "app/models/bulletin.model";
import { DateIsoString } from "app/models/stress-level.model";
import { UserService } from "../user-service/user.service";

@Injectable()
export class BulletinsService {
  private activeDate: [Date, Date];
  private copyDate: [Date, Date];
  private isEditable: boolean;
  private isReadOnly: boolean;

  public lockedBulletins: Map<string, BulletinLockModel>;
  public bulletinLocks: Subject<BulletinLockModel>;

  public stress: Record<DateIsoString, number> = {};

  public statusMap: Map<string, Map<number, Enums.BulletinStatus>>;

  public dates: [Date, Date][];

  constructor(
    public http: HttpClient,
    private constantsService: ConstantsService,
    private authenticationService: AuthenticationService,
    private settingsService: SettingsService,
    private userService: UserService,
    private wsBulletinService: WsBulletinService,
  ) {
    this.init();
  }

  init({ days } = { days: 10 }) {
    this.dates = [];
    this.activeDate = undefined;
    this.copyDate = undefined;
    this.isEditable = false;
    this.isReadOnly = false;
    this.lockedBulletins = new Map<string, BulletinLockModel>();

    // connect to websockets
    this.wsBulletinConnect();

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 3);
    endDate.setHours(0, 0, 0, 0);

    for (let i = 0; i <= days; i++) {
      const date = new Date(endDate.valueOf());
      date.setDate(endDate.getDate() - i);
      this.dates.push(this.getValidFromUntil(date));
    }

    this.userService.getStressLevels([this.dates.at(-1)[0], this.dates.at(0)[1]]).subscribe((stressLevels) => {
      this.stress = Object.fromEntries(stressLevels.map((s) => [s.date, s.stressLevel]));
    });

    this.loadStatus();
  }

  public loadStatus() {
    const startDate = this.dates[this.dates.length - 1];
    const endDate = this.dates[0];
    this.statusMap = new Map<string, Map<number, Enums.BulletinStatus>>();
    this.getStatus(this.authenticationService.getActiveRegionId(), startDate, endDate).subscribe(
      (data) => {
        let map = new Map<number, Enums.BulletinStatus>();
        for (let i = (data as any).length - 1; i >= 0; i--) {
          map.set(Date.parse((data as any)[i].date), Enums.BulletinStatus[<string>(data as any)[i].status]);
        }
        this.statusMap.set(this.authenticationService.getActiveRegionId(), map);
      },
      () => {
        console.error("Status {} could not be loaded!", this.authenticationService.getActiveRegionId());
      },
    );
    this.authenticationService.getActiveRegion()?.neighborRegions.forEach((neighborRegion) => {
      this.getStatus(neighborRegion, startDate, endDate).subscribe(
        (data) => {
          let map = new Map<number, Enums.BulletinStatus>();
          for (let i = (data as any).length - 1; i >= 0; i--) {
            map.set(Date.parse((data as any)[i].date), Enums.BulletinStatus[<string>(data as any)[i].status]);
          }
          this.statusMap.set(neighborRegion, map);
        },
        () => {
          console.error("Status {} could not be loaded!", neighborRegion);
        },
      );
    });
  }

  public wsBulletinConnect() {
    this.bulletinLocks = <Subject<BulletinLockModel>>(
      this.wsBulletinService
        .connect(this.constantsService.getServerWsUrl() + "../bulletin/" + this.authenticationService.getUsername())
        .pipe(
          map((response: any): BulletinLockModel => {
            const data = JSON.parse(response.data);
            const bulletinLock = BulletinLockModel.createFromJson(data);
            if (bulletinLock.getLock()) {
              console.debug("Bulletin lock received: " + bulletinLock.getBulletin());
              this.addLockedBulletin(bulletinLock);
            } else {
              console.debug("Bulletin unlock received: " + bulletinLock.getBulletin());
              this.removeLockedBulletin(bulletinLock.getBulletin());
            }
            return bulletinLock;
          }),
        )
    );

    this.bulletinLocks.subscribe(() => {});
  }

  public wsBulletinDisconnect() {
    this.wsBulletinService.disconnect();
  }

  getActiveDate(): [Date, Date] {
    return this.activeDate;
  }

  setActiveDate(date: [Date, Date]) {
    this.activeDate = date;
  }

  hasBeenPublished5PM(date: [Date, Date]): boolean {
    // date[0] = validFrom = 17:00 = published at
    const published = date[0];
    return Date.now() >= published.getTime();
  }

  hasBeenPublished8AM(date: [Date, Date]): boolean {
    // date[1] = validUntil = 17:00
    // date[1] at 08:00 = updated at
    const updated = new Date(date[1]);
    updated.setHours(8, 0, 0, 0);
    return Date.now() >= updated.getTime();
  }

  getValidFromUntil(date: Date): [Date, Date] {
    const validFrom = new Date(date);
    validFrom.setTime(validFrom.getTime() - 7 * 60 * 60 * 1000);
    const validUntil = new Date(date);
    validUntil.setTime(validUntil.getTime() + 17 * 60 * 60 * 1000);
    return [validFrom, validUntil];
  }

  /**
   * Returns a date that's offset from the activeDate by a given amount.
   *
   * @param offset - Number of days to offset. Can be positive (future) or negative (past).
   * @returns Date offset from the activeDate or null if not found or out of bounds.
   */
  private getDateOffset(offset: number): [Date, Date] | null {
    if (!this.activeDate) {
      return null;
    }

    const index = this.dates.findIndex((d) => d[0].getTime() === this.activeDate[0].getTime());

    if (index === -1 || index + offset < 0 || index + offset >= this.dates.length) {
      return null;
    }

    return this.dates[index + offset];
  }

  getNextDate(): [Date, Date] | null {
    return this.getDateOffset(1);
  }

  getPreviousDate(): [Date, Date] | null {
    return this.getDateOffset(-1);
  }

  getCopyDate(): [Date, Date] {
    return this.copyDate;
  }

  setCopyDate(date: [Date, Date]) {
    this.copyDate = date;
  }

  getIsEditable(): boolean {
    return this.isEditable && !this.isReadOnly;
  }

  setIsEditable(isEditable: boolean) {
    this.isEditable = isEditable;
  }

  getIsReadOnly(): boolean {
    return this.isReadOnly;
  }

  setIsReadOnly(isReadOnly: boolean) {
    this.isReadOnly = isReadOnly;
  }

  getUserRegionStatus(date: [Date, Date]): Enums.BulletinStatus {
    const region = this.authenticationService.getActiveRegionId();
    const regionStatusMap = this.statusMap.get(region);
    if (regionStatusMap) return regionStatusMap.get(date[0].getTime());
    else return Enums.BulletinStatus.missing;
  }

  setUserRegionStatus(date: [Date, Date], status: Enums.BulletinStatus) {
    const region = this.authenticationService.getActiveRegionId();
    this.statusMap.get(region).set(date[0].getTime(), status);
  }

  getPreviewPdf(date: [Date, Date]): Observable<Blob> {
    const url =
      this.constantsService.getServerUrl() +
      "bulletins/preview?" +
      this.constantsService
        .createSearchParams([
          ["date", this.constantsService.getISOStringWithTimezoneOffset(date[0])],
          ["region", this.authenticationService.getActiveRegionId()],
          ["lang", this.settingsService.getLangString()],
        ])
        .toString();
    const headers = this.authenticationService.newAuthHeader("application/pdf");
    return this.http.get(url, { headers, responseType: "blob" });
  }

  getStatus(region: string, startDate: [Date, Date], endDate: [Date, Date]) {
    const url =
      this.constantsService.getServerUrl() +
      "bulletins/status/internal?" +
      this.constantsService
        .createSearchParams([
          ["startDate", this.constantsService.getISOStringWithTimezoneOffset(startDate[0])],
          ["endDate", this.constantsService.getISOStringWithTimezoneOffset(endDate[0])],
          ["region", region],
        ])
        .toString();
    const headers = this.authenticationService.newAuthHeader();
    return this.http.get(url, { headers });
  }

  getPublicationStatus(region: string, date: [Date, Date]) {
    const url =
      this.constantsService.getServerUrl() +
      "bulletins/status/publication?" +
      this.constantsService
        .createSearchParams([
          ["date", this.constantsService.getISOStringWithTimezoneOffset(date[0])],
          ["region", region],
        ])
        .toString();
    const headers = this.authenticationService.newAuthHeader();
    return this.http.get(url, { headers });
  }

  loadBulletins(date: [Date, Date], regions: string[], etag?: string) {
    let url =
      this.constantsService.getServerUrl() +
      "bulletins/edit?" +
      this.constantsService
        .createSearchParams([
          ["date", this.constantsService.getISOStringWithTimezoneOffset(date[0])],
          ["region", regions],
        ])
        .toString();
    const headers = this.authenticationService.newAuthHeader();
    if (etag) headers.set("If-None-Match", etag);
    return this.http.get(url, { headers, observe: "response" });
  }

  loadExternalBulletins(date: [Date, Date], server: ServerModel) {
    let url =
      server.apiUrl +
      "bulletins/edit?" +
      this.constantsService
        .createSearchParams([
          ["date", this.constantsService.getISOStringWithTimezoneOffset(date[0])],
          ["region", server.regions.filter((region) => !this.authenticationService.isInternalRegion(region))],
        ])
        .toString();
    const headers = this.authenticationService.newExternalServerAuthHeader(server);
    return this.http.get(url, { headers });
  }

  loadCaamlBulletins(date: [Date, Date]): Observable<any> {
    const url =
      this.constantsService.getServerUrl() +
      "bulletins?" +
      this.constantsService
        .createSearchParams([
          ["date", this.constantsService.getISOStringWithTimezoneOffset(date[0])],
          ["lang", this.settingsService.getLangString()],
        ])
        .toString();
    const headers = this.authenticationService.newAuthHeader("application/xml");
    return this.http.get(url, { headers, responseType: "text" });
  }

  loadJsonBulletins(date: [Date, Date]) {
    const url =
      this.constantsService.getServerUrl() +
      "bulletins?" +
      this.constantsService
        .createSearchParams([["date", this.constantsService.getISOStringWithTimezoneOffset(date[0])]])
        .toString();
    const headers = this.authenticationService.newAuthHeader();
    return this.http.get(url, { headers });
  }

  saveBulletins(bulletins: BulletinModel[], date: [Date, Date]) {
    const url =
      this.constantsService.getServerUrl() +
      "bulletins?" +
      this.constantsService
        .createSearchParams([
          ["date", this.constantsService.getISOStringWithTimezoneOffset(date[0])],
          ["region", this.authenticationService.getActiveRegionId()],
        ])
        .toString();
    const headers = this.authenticationService.newAuthHeader();
    const jsonBulletins = [];
    for (let i = bulletins.length - 1; i >= 0; i--) {
      jsonBulletins.push(bulletins[i].toJson());
    }
    const body = JSON.stringify(jsonBulletins);
    return this.http.post(url, body, { headers });
  }

  createBulletin(bulletin: BulletinModel, date: [Date, Date]) {
    const url =
      this.constantsService.getServerUrl() +
      "bulletins?" +
      this.constantsService
        .createSearchParams([
          ["date", this.constantsService.getISOStringWithTimezoneOffset(date[0])],
          ["region", this.authenticationService.getActiveRegionId()],
        ])
        .toString();
    const headers = this.authenticationService.newAuthHeader();
    const body = JSON.stringify(bulletin.toJson());
    return this.http.put(url, body, { headers });
  }

  updateBulletin(bulletin: BulletinModel, date: [Date, Date]) {
    // check if bulletin has ID
    const url =
      this.constantsService.getServerUrl() +
      "bulletins/" +
      bulletin.getId() +
      "?" +
      this.constantsService
        .createSearchParams([
          ["date", this.constantsService.getISOStringWithTimezoneOffset(date[0])],
          ["region", this.authenticationService.getActiveRegionId()],
        ])
        .toString();
    const headers = this.authenticationService.newAuthHeader();
    const body = JSON.stringify(bulletin.toJson());
    return this.http.post(url, body, { headers });
  }

  deleteBulletin(bulletin: BulletinModel, date: [Date, Date]) {
    // check if bulletin has ID
    const url =
      this.constantsService.getServerUrl() +
      "bulletins/" +
      bulletin.getId() +
      "?" +
      this.constantsService
        .createSearchParams([
          ["date", this.constantsService.getISOStringWithTimezoneOffset(date[0])],
          ["region", this.authenticationService.getActiveRegionId()],
        ])
        .toString();
    const headers = this.authenticationService.newAuthHeader();
    return this.http.delete(url, { headers });
  }

  submitBulletins(date: [Date, Date], region: string) {
    const url =
      this.constantsService.getServerUrl() +
      "bulletins/submit?" +
      this.constantsService
        .createSearchParams([
          ["date", this.constantsService.getISOStringWithTimezoneOffset(date[0])],
          ["region", region],
        ])
        .toString();
    const headers = this.authenticationService.newAuthHeader();
    const body = JSON.stringify("");
    return this.http.post(url, body, { headers });
  }

  publishBulletins(date: [Date, Date], region: string) {
    const url =
      this.constantsService.getServerUrl() +
      "bulletins/publish?" +
      this.constantsService
        .createSearchParams([
          ["date", this.constantsService.getISOStringWithTimezoneOffset(date[0])],
          ["region", region],
        ])
        .toString();
    const headers = this.authenticationService.newAuthHeader();
    const body = JSON.stringify("");
    return this.http.post(url, body, { headers });
  }

  changeBulletins(date: [Date, Date], region: string) {
    const url =
      this.constantsService.getServerUrl() +
      "bulletins/change?" +
      this.constantsService
        .createSearchParams([
          ["date", this.constantsService.getISOStringWithTimezoneOffset(date[0])],
          ["region", region],
        ])
        .toString();
    const headers = this.authenticationService.newAuthHeader();
    const jsonBulletins = [];
    const body = JSON.stringify(jsonBulletins);
    return this.http.post(url, body, { headers });
  }

  publishAllBulletins(date: [Date, Date]) {
    const url =
      this.constantsService.getServerUrl() +
      "bulletins/publish/all?" +
      this.constantsService
        .createSearchParams([["date", this.constantsService.getISOStringWithTimezoneOffset(date[0])]])
        .toString();
    const headers = this.authenticationService.newAuthHeader();
    const body = JSON.stringify("");
    return this.http.post(url, body, { headers });
  }

  createCaaml(date: [Date, Date]) {
    const url =
      this.constantsService.getServerUrl() +
      "bulletins/publish/caaml?" +
      this.constantsService
        .createSearchParams([["date", this.constantsService.getISOStringWithTimezoneOffset(date[0])]])
        .toString();
    const headers = this.authenticationService.newAuthHeader();
    const body = JSON.stringify("");
    return this.http.post(url, body, { headers });
  }

  createPdf(date: [Date, Date]) {
    const url =
      this.constantsService.getServerUrl() +
      "bulletins/publish/pdf?" +
      this.constantsService
        .createSearchParams([["date", this.constantsService.getISOStringWithTimezoneOffset(date[0])]])
        .toString();
    const headers = this.authenticationService.newAuthHeader();
    const body = JSON.stringify("");
    return this.http.post(url, body, { headers });
  }

  createHtml(date: [Date, Date]) {
    const url =
      this.constantsService.getServerUrl() +
      "bulletins/publish/html?" +
      this.constantsService
        .createSearchParams([["date", this.constantsService.getISOStringWithTimezoneOffset(date[0])]])
        .toString();
    const headers = this.authenticationService.newAuthHeader();
    const body = JSON.stringify("");
    return this.http.post(url, body, { headers });
  }

  createMap(date: [Date, Date]) {
    const url =
      this.constantsService.getServerUrl() +
      "bulletins/publish/map?" +
      this.constantsService
        .createSearchParams([["date", this.constantsService.getISOStringWithTimezoneOffset(date[0])]])
        .toString();
    const headers = this.authenticationService.newAuthHeader();
    const body = JSON.stringify("");
    return this.http.post(url, body, { headers });
  }

  createStaticWidget(date: [Date, Date]) {
    const url =
      this.constantsService.getServerUrl() +
      "bulletins/publish/staticwidget?" +
      this.constantsService
        .createSearchParams([["date", this.constantsService.getISOStringWithTimezoneOffset(date[0])]])
        .toString();
    const headers = this.authenticationService.newAuthHeader();
    const body = JSON.stringify("");
    return this.http.post(url, body, { headers });
  }

  sendEmail(date: [Date, Date], region: string, language: string) {
    let url: string;
    if (language && language !== "") {
      url =
        this.constantsService.getServerUrl() +
        "bulletins/publish/email?" +
        this.constantsService
          .createSearchParams([
            ["date", this.constantsService.getISOStringWithTimezoneOffset(date[0])],
            ["region", region],
            ["lang", language],
          ])
          .toString();
    } else {
      url =
        this.constantsService.getServerUrl() +
        "bulletins/publish/email?" +
        this.constantsService
          .createSearchParams([
            ["date", this.constantsService.getISOStringWithTimezoneOffset(date[0])],
            ["region", region],
          ])
          .toString();
    }
    const headers = this.authenticationService.newAuthHeader();
    const body = JSON.stringify("");
    return this.http.post(url, body, { headers });
  }

  sendTestEmail(date: [Date, Date], region: string, language: string) {
    let url: string;
    if (language && language !== "") {
      url =
        this.constantsService.getServerUrl() +
        "bulletins/publish/email/test?" +
        this.constantsService
          .createSearchParams([
            ["date", this.constantsService.getISOStringWithTimezoneOffset(date[0])],
            ["region", region],
            ["lang", language],
          ])
          .toString();
    } else {
      url =
        this.constantsService.getServerUrl() +
        "bulletins/publish/email/test?" +
        this.constantsService
          .createSearchParams([
            ["date", this.constantsService.getISOStringWithTimezoneOffset(date[0])],
            ["region", region],
          ])
          .toString();
    }
    const headers = this.authenticationService.newAuthHeader();
    const body = JSON.stringify("");
    return this.http.post(url, body, { headers });
  }

  triggerTelegramChannel(date: [Date, Date], region: string, language: string) {
    let url: string;
    if (language && language !== "") {
      url =
        this.constantsService.getServerUrl() +
        "bulletins/publish/telegram?" +
        this.constantsService
          .createSearchParams([
            ["date", this.constantsService.getISOStringWithTimezoneOffset(date[0])],
            ["region", region],
            ["lang", language],
          ])
          .toString();
    } else {
      url =
        this.constantsService.getServerUrl() +
        "bulletins/publish/telegram?" +
        this.constantsService
          .createSearchParams([
            ["date", this.constantsService.getISOStringWithTimezoneOffset(date[0])],
            ["region", region],
          ])
          .toString();
    }
    const headers = this.authenticationService.newAuthHeader();
    const body = JSON.stringify("");
    return this.http.post(url, body, { headers });
  }

  triggerTestTelegramChannel(date: [Date, Date], region: string, language: string) {
    let url: string;
    if (language && language !== "") {
      url =
        this.constantsService.getServerUrl() +
        "bulletins/publish/telegram/test?" +
        this.constantsService
          .createSearchParams([
            ["date", this.constantsService.getISOStringWithTimezoneOffset(date[0])],
            ["region", region],
            ["lang", language],
          ])
          .toString();
    } else {
      url =
        this.constantsService.getServerUrl() +
        "bulletins/publish/telegram/test?" +
        this.constantsService
          .createSearchParams([
            ["date", this.constantsService.getISOStringWithTimezoneOffset(date[0])],
            ["region", region],
          ])
          .toString();
    }
    const headers = this.authenticationService.newAuthHeader();
    const body = JSON.stringify("");
    return this.http.post(url, body, { headers });
  }

  triggerPushNotifications(date: [Date, Date], region: string, language: string) {
    let url: string;
    if (language && language !== "") {
      url =
        this.constantsService.getServerUrl() +
        "bulletins/publish/push?" +
        this.constantsService
          .createSearchParams([
            ["date", this.constantsService.getISOStringWithTimezoneOffset(date[0])],
            ["region", region],
            ["lang", language],
          ])
          .toString();
    } else {
      url =
        this.constantsService.getServerUrl() +
        "bulletins/publish/push?" +
        this.constantsService
          .createSearchParams([
            ["date", this.constantsService.getISOStringWithTimezoneOffset(date[0])],
            ["region", region],
          ])
          .toString();
    }
    const headers = this.authenticationService.newAuthHeader();
    const body = JSON.stringify("");
    return this.http.post(url, body, { headers });
  }

  triggerTestPushNotifications(date: [Date, Date], region: string, language: string) {
    let url: string;
    if (language && language !== "") {
      url =
        this.constantsService.getServerUrl() +
        "bulletins/publish/push/test?" +
        this.constantsService
          .createSearchParams([
            ["date", this.constantsService.getISOStringWithTimezoneOffset(date[0])],
            ["region", region],
            ["lang", language],
          ])
          .toString();
    } else {
      url =
        this.constantsService.getServerUrl() +
        "bulletins/publish/push/test?" +
        this.constantsService
          .createSearchParams([
            ["date", this.constantsService.getISOStringWithTimezoneOffset(date[0])],
            ["region", region],
          ])
          .toString();
    }
    const headers = this.authenticationService.newAuthHeader();
    const body = JSON.stringify("");
    return this.http.post(url, body, { headers });
  }

  checkBulletins(date: [Date, Date], region: string) {
    const url =
      this.constantsService.getServerUrl() +
      "bulletins/check?" +
      this.constantsService
        .createSearchParams([
          ["date", this.constantsService.getISOStringWithTimezoneOffset(date[0])],
          ["region", region],
        ])
        .toString();
    const headers = this.authenticationService.newAuthHeader();
    return this.http.get(url, { headers });
  }

  loadLockedBulletins() {
    this.lockedBulletins.clear();
    let url = this.constantsService.getServerUrl() + "bulletins/locked";
    let headers = this.authenticationService.newAuthHeader();
    this.http.get(url, { headers }).subscribe(
      (data) => {
        for (const response of data as any) {
          const data = JSON.parse(response.data);
          const bulletinLock = BulletinLockModel.createFromJson(data);
          this.addLockedBulletin(bulletinLock);
        }
      },
      (error) => {
        console.warn("Locked bulletins could not be loaded!");
      },
    );
  }

  isLocked(bulletinId: string) {
    if (
      this.lockedBulletins.has(bulletinId) &&
      this.lockedBulletins.get(bulletinId).getUserEmail() !== this.authenticationService.getEmail()
    ) {
      return true;
    }
    return false;
  }

  lockBulletin(date: [Date, Date], bulletinId: string) {
    const bulletinLock = new BulletinLockModel();
    bulletinLock.setBulletin(bulletinId);
    bulletinLock.setDate(date[0]);
    bulletinLock.setUserName(this.authenticationService.getUsername());
    bulletinLock.setUserEmail(this.authenticationService.getEmail());
    bulletinLock.setLock(true);

    this.bulletinLocks.next(bulletinLock);

    console.debug("Bulletin lock sent: " + bulletinLock.getDate() + " - " + bulletinLock.getBulletin());
  }

  unlockBulletin(date: [Date, Date], bulletinId: string) {
    const bulletinLock = new BulletinLockModel();
    bulletinLock.setBulletin(bulletinId);
    bulletinLock.setDate(date[0]);
    bulletinLock.setUserName(this.authenticationService.getUsername());
    bulletinLock.setUserEmail(this.authenticationService.getEmail());
    bulletinLock.setLock(false);

    this.bulletinLocks.next(bulletinLock);

    console.debug("Bulletin unlock sent: " + bulletinLock.getDate() + " - " + bulletinLock.getBulletin());
  }

  addLockedBulletin(bulletinLock: BulletinLockModel) {
    if (this.lockedBulletins.has(bulletinLock.getBulletin())) {
      console.warn("Bulletin already locked by " + bulletinLock.getUserName());
    } else {
      this.lockedBulletins.set(bulletinLock.getBulletin(), bulletinLock);
    }
  }

  removeLockedBulletin(bulletinId: string) {
    if (this.lockedBulletins.has(bulletinId)) {
      this.lockedBulletins.delete(bulletinId);
    } else {
      console.warn("Bulletin was not locked!");
    }
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
}
