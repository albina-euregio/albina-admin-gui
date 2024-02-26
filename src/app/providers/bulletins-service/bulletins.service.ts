import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable, Subject } from "rxjs";
import { map } from "rxjs/operators";
import { ConstantsService } from "../constants-service/constants.service";
import { SettingsService } from "../settings-service/settings.service";
import { AuthenticationService } from "../authentication-service/authentication.service";
import { WsBulletinService } from "../ws-bulletin-service/ws-bulletin.service";
import { WsRegionService } from "../ws-region-service/ws-region.service";
import { BulletinLockModel } from "../../models/bulletin-lock.model";
import { ServerModel } from "../../models/server.model";
import * as Enums from "../../enums/enums";
import { BulletinModel } from "app/models/bulletin.model";

@Injectable()
export class BulletinsService {

  private activeDate: Date;
  private copyDate: Date;
  private isEditable: boolean;
  private isReadOnly: boolean;

  public lockedBulletins: Map<string, BulletinLockModel>;
  public bulletinLocks: Subject<BulletinLockModel>;

  public statusMap: Map<string, Map<number, Enums.BulletinStatus>>;

  public dates: Date[];

  constructor(
    public http: HttpClient,
    private constantsService: ConstantsService,
    private authenticationService: AuthenticationService,
    private settingsService: SettingsService,
    private wsBulletinService: WsBulletinService) {
    this.init();
  }

  init() {
    this.dates = new Array<Date>();
    this.activeDate = undefined;
    this.copyDate = undefined;
    this.isEditable = false;
    this.isReadOnly = false;
    this.statusMap = new Map<string, Map<number, Enums.BulletinStatus>>();
    this.lockedBulletins = new Map<string, BulletinLockModel>();

    // connect to websockets
    this.wsBulletinConnect();

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 3);
    endDate.setHours(0, 0, 0, 0);

    for (let i = 0; i <= 10; i++) {
      const date = new Date(endDate.valueOf());
      date.setDate(endDate.getDate() - i);
      date.setHours(0, 0, 0, 0);
      this.dates.push(date);
    }

    this.getStatus(this.authenticationService.getActiveRegionId(), startDate, endDate).subscribe(
      data => {
        let map = new Map<number, Enums.BulletinStatus>();
        for (let i = (data as any).length - 1; i >= 0; i--) {
          map.set(Date.parse((data as any)[i].date), Enums.BulletinStatus[<string>(data as any)[i].status]);
        }
        this.statusMap.set(this.authenticationService.getActiveRegionId(), map);
      },
      () => {
        console.error("Status {} could not be loaded!", this.authenticationService.getActiveRegionId());
      }
    );
    this.authenticationService.getActiveRegion()?.neighborRegions.forEach(neighborRegion => {
      this.getStatus(neighborRegion, startDate, endDate).subscribe(
        data => {
          let map = new Map<number, Enums.BulletinStatus>();
          for (let i = (data as any).length - 1; i >= 0; i--) {
            map.set(Date.parse((data as any)[i].date), Enums.BulletinStatus[<string>(data as any)[i].status]);
          }
          this.statusMap.set(neighborRegion, map);
        },
        () => {
          console.error("Status {} could not be loaded!", neighborRegion);
        }
      );
    });
  }

  public wsBulletinConnect() {
    this.bulletinLocks = <Subject<BulletinLockModel>>this.wsBulletinService
      .connect(this.constantsService.getWsBulletinUrl() + this.authenticationService.getUsername())
      .pipe(map((response: any): BulletinLockModel => {
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
      }));

    this.bulletinLocks.subscribe(() => {
    });
  }

  public wsBulletinDisconnect() {
    this.wsBulletinService.disconnect();
  }

  getActiveDate(): Date {
    return this.activeDate;
  }

  setActiveDate(date: Date) {
    this.activeDate = date;
  }

  hasBeenPublished5PM(date: Date) {
    let today = new Date();

    if (today.getHours() >= 17) {
      today.setHours(0, 0, 0, 0);
      today = new Date(today.getTime() + (1000 * 60 * 60 * 24));
    } else {
      today.setHours(0, 0, 0, 0);
    }

    if (today.getTime() >= date.getTime()) {
      return true;
    }
    return false;
  }

  hasBeenPublished8AM(date: Date) {
    let today = new Date();

    if (today.getHours() >= 8) {
      today.setHours(0, 0, 0, 0);
    } else {
      today = new Date(today.getTime() - (1000 * 60 * 60 * 24));
      today.setHours(0, 0, 0, 0);
    }

    if (today.getTime() >= date.getTime()) {
      return true;
    }
    return false;
  }

  /**
   * Returns a date that's offset from the activeDate by a given amount.
   *
   * @param offset - Number of days to offset. Can be positive (future) or negative (past).
   * @returns Date offset from the activeDate or null if not found or out of bounds.
   */
  private getDateOffset(offset: number): Date | null {
    if (!this.activeDate) {
        return null;
    }

    const index = this.dates.findIndex(d => d.getTime() === this.activeDate.getTime());

    if (index === -1 || index + offset < 0 || index + offset >= this.dates.length) {
        return null;
    }

    return this.dates[index + offset];
  }

  getNextDate(): Date | null {
    return this.getDateOffset(1);
  }

  getPreviousDate(): Date | null {
    return this.getDateOffset(-1);
  }

  getCopyDate(): Date {
    return this.copyDate;
  }

  setCopyDate(date: Date) {
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

  getUserRegionStatus(date: Date): Enums.BulletinStatus {
    const region = this.authenticationService.getActiveRegionId();
    const regionStatusMap = this.statusMap.get(region);
    if (regionStatusMap)
      return regionStatusMap.get(date.getTime());
    else
      return Enums.BulletinStatus.missing;
  }

  setUserRegionStatus(date: Date, status: Enums.BulletinStatus) {
    const region = this.authenticationService.getActiveRegionId();
    this.statusMap.get(region).set(date.getTime(), status);
  }

  getPreviewPdf(date: Date): Observable<Blob> {
    const url = this.constantsService.getServerUrl() + "bulletins/preview?date=" + this.constantsService.getISOStringWithTimezoneOffsetUrlEncoded(date) + "&region=" + this.authenticationService.getActiveRegionId() + "&lang=" + this.settingsService.getLangString();
    const headers = this.authenticationService.newAuthHeader("application/pdf");
    const options = { headers: headers };

    return this.http.get(url, { headers: headers, responseType: "blob" });
  }

  getStatus(region: string, startDate: Date, endDate: Date): Observable<Response> {
    const url = this.constantsService.getServerUrl() + "bulletins/status/internal?startDate=" + this.constantsService.getISOStringWithTimezoneOffsetUrlEncoded(startDate) + "&endDate=" + this.constantsService.getISOStringWithTimezoneOffsetUrlEncoded(endDate) + "&region=" + region;
    const headers = this.authenticationService.newAuthHeader();
    const options = { headers: headers };

    return this.http.get<Response>(url, options);
  }

  getPublicationsStatus(region: string, startDate: Date, endDate: Date): Observable<Response> {
    const url = this.constantsService.getServerUrl() + "bulletins/status/publications?startDate=" + this.constantsService.getISOStringWithTimezoneOffsetUrlEncoded(startDate) + "&endDate=" + this.constantsService.getISOStringWithTimezoneOffsetUrlEncoded(endDate) + "&region=" + region;
    const headers = this.authenticationService.newAuthHeader();
    const options = { headers: headers };

    return this.http.get<Response>(url, options);
  }

  getPublicationStatus(region: string, date: Date): Observable<Response> {
    const url = this.constantsService.getServerUrl() + "bulletins/status/publication?date=" + this.constantsService.getISOStringWithTimezoneOffsetUrlEncoded(date) + "&region=" + region;
    const headers = this.authenticationService.newAuthHeader();
    const options = { headers: headers };

    return this.http.get<Response>(url, options);
  }

  loadBulletins(date: Date, regions: string[]): Observable<Response> {
    let url = this.constantsService.getServerUrl() + "bulletins/edit?date=" + this.constantsService.getISOStringWithTimezoneOffsetUrlEncoded(date);
    if (regions) {
      for (const region of regions) {
        url += "&regions=" + region;
      }
    }
    const headers = this.authenticationService.newAuthHeader();
    const options = { headers: headers };

    return this.http.get<Response>(url, options);
  }

  loadExternalBulletins(date: Date, server: ServerModel): Observable<Response> {
    let url = server.apiUrl + "bulletins/edit?date=" + this.constantsService.getISOStringWithTimezoneOffsetUrlEncoded(date);
    if (server.regions) {
      for (const region of server.regions) {
        if (this.authenticationService.isInternalRegion(region)) {
          continue;
        }
        url += "&regions=" + region;
      }
    }
    const headers = this.authenticationService.newExternalServerAuthHeader(server);
    const options = { headers: headers };
    return this.http.get<Response>(url, options);
  }

  loadCaamlBulletins(date: Date): Observable<any> {
    const url = this.constantsService.getServerUrl() + "bulletins?date=" + this.constantsService.getISOStringWithTimezoneOffsetUrlEncoded(date) + "&lang=" + this.settingsService.getLangString();
    const headers = this.authenticationService.newAuthHeader("application/xml");
    const options : any = { headers: headers, responseType: 'text' as 'text' };

    return this.http.get(url, options);
  }

  loadJsonBulletins(date: Date): Observable<Response> {
    const url = this.constantsService.getServerUrl() + "bulletins?date=" + this.constantsService.getISOStringWithTimezoneOffsetUrlEncoded(date);
    const headers = this.authenticationService.newAuthHeader();
    const options = { headers };

    return this.http.get<Response>(url, options);
  }

  saveBulletins(bulletins, date): Observable<Response> {
    const url = this.constantsService.getServerUrl() + "bulletins?date=" + this.constantsService.getISOStringWithTimezoneOffsetUrlEncoded(date) + "&region=" + this.authenticationService.getActiveRegionId();
    const headers = this.authenticationService.newAuthHeader();
    const jsonBulletins = [];
    for (let i = bulletins.length - 1; i >= 0; i--) {
      jsonBulletins.push(bulletins[i].toJson());
    }
    const body = JSON.stringify(jsonBulletins);
    const options = { headers: headers };

    return this.http.post<Response>(url, body, options);
  }

  createBulletin(bulletin: BulletinModel, date): Observable<Response> {
    const url = this.constantsService.getServerUrl() + "bulletins?date=" + this.constantsService.getISOStringWithTimezoneOffsetUrlEncoded(date) + "&region=" + this.authenticationService.getActiveRegionId();
    const headers = this.authenticationService.newAuthHeader();
    const body = JSON.stringify(bulletin.toJson());
    const options = { headers: headers };

    return this.http.put<Response>(url, body, options);
  }

  updateBulletin(bulletin: BulletinModel, date): Observable<Response> {
    // check if bulletin has ID
    const url = this.constantsService.getServerUrl() + "bulletins/" + bulletin.getId() + "?date=" + this.constantsService.getISOStringWithTimezoneOffsetUrlEncoded(date) + "&region=" + this.authenticationService.getActiveRegionId();
    const headers = this.authenticationService.newAuthHeader();
    const body = JSON.stringify(bulletin.toJson());
    const options = { headers: headers };

    return this.http.post<Response>(url, body, options);
  }

  deleteBulletin(bulletin: BulletinModel, date): Observable<Response> {
    // check if bulletin has ID
    const url = this.constantsService.getServerUrl() + "bulletins/" + bulletin.getId() + "?date=" + this.constantsService.getISOStringWithTimezoneOffsetUrlEncoded(date) + "&region=" + this.authenticationService.getActiveRegionId();
    const headers = this.authenticationService.newAuthHeader();
    const options = { headers: headers };

    return this.http.delete<Response>(url, options);
  }

  submitBulletins(date: Date, region: string): Observable<Response> {
    const url = this.constantsService.getServerUrl() + "bulletins/submit?date=" + this.constantsService.getISOStringWithTimezoneOffsetUrlEncoded(date) + "&region=" + region;
    const headers = this.authenticationService.newAuthHeader();
    const body = JSON.stringify("");
    const options = { headers: headers };

    return this.http.post<Response>(url, body, options);
  }

  publishBulletins(date: Date, region: string): Observable<Response> {
    const url = this.constantsService.getServerUrl() + "bulletins/publish?date=" + this.constantsService.getISOStringWithTimezoneOffsetUrlEncoded(date) + "&region=" + region;
    const headers = this.authenticationService.newAuthHeader();
    const body = JSON.stringify("");
    const options = { headers: headers };

    return this.http.post<Response>(url, body, options);
  }

  changeBulletins(date: Date, region: string): Observable<Response> {
    const url = this.constantsService.getServerUrl() + "bulletins/change?date=" + this.constantsService.getISOStringWithTimezoneOffsetUrlEncoded(date) + "&region=" + region;
    const headers = this.authenticationService.newAuthHeader();
    const jsonBulletins = [];
    const body = JSON.stringify(jsonBulletins);
    const options = { headers: headers };

    return this.http.post<Response>(url, body, options);
  }

  publishAllBulletins(date: Date): Observable<Response> {
    const url = this.constantsService.getServerUrl() + "bulletins/publish/all?date=" + this.constantsService.getISOStringWithTimezoneOffsetUrlEncoded(date);
    const headers = this.authenticationService.newAuthHeader();
    const body = JSON.stringify("");
    const options = { headers: headers };

    return this.http.post<Response>(url, body, options);
  }

  createCaaml(date: Date): Observable<Response> {
    const url = this.constantsService.getServerUrl() + "bulletins/publish/caaml?date=" + this.constantsService.getISOStringWithTimezoneOffsetUrlEncoded(date);
    const headers = this.authenticationService.newAuthHeader();
    const body = JSON.stringify("");
    const options = { headers: headers };

    return this.http.post<Response>(url, body, options);
  }

  createPdf(date: Date): Observable<Response> {
    const url = this.constantsService.getServerUrl() + "bulletins/publish/pdf?date=" + this.constantsService.getISOStringWithTimezoneOffsetUrlEncoded(date);
    const headers = this.authenticationService.newAuthHeader();
    const body = JSON.stringify("");
    const options = { headers: headers };

    return this.http.post<Response>(url, body, options);
  }

  createHtml(date: Date): Observable<Response> {
    const url = this.constantsService.getServerUrl() + "bulletins/publish/html?date=" + this.constantsService.getISOStringWithTimezoneOffsetUrlEncoded(date);
    const headers = this.authenticationService.newAuthHeader();
    const body = JSON.stringify("");
    const options = { headers: headers };

    return this.http.post<Response>(url, body, options);
  }

  createMap(date: Date): Observable<Response> {
    const url = this.constantsService.getServerUrl() + "bulletins/publish/map?date=" + this.constantsService.getISOStringWithTimezoneOffsetUrlEncoded(date);
    const headers = this.authenticationService.newAuthHeader();
    const body = JSON.stringify("");
    const options = { headers: headers };

    return this.http.post<Response>(url, body, options);
  }

  createStaticWidget(date: Date): Observable<Response> {
    const url = this.constantsService.getServerUrl() + "bulletins/publish/staticwidget?date=" + this.constantsService.getISOStringWithTimezoneOffsetUrlEncoded(date);
    const headers = this.authenticationService.newAuthHeader();
    const body = JSON.stringify("");
    const options = { headers: headers };

    return this.http.post<Response>(url, body, options);
  }

  sendEmail(date: Date, region: string, language: string): Observable<Response> {
    var url;
    if (language && language !== "") {
      url = this.constantsService.getServerUrl() + "bulletins/publish/email?date=" + this.constantsService.getISOStringWithTimezoneOffsetUrlEncoded(date) + "&region=" + region + "&lang=" + language;
    } else {
      url = this.constantsService.getServerUrl() + "bulletins/publish/email?date=" + this.constantsService.getISOStringWithTimezoneOffsetUrlEncoded(date) + "&region=" + region;
    }
    const headers = this.authenticationService.newAuthHeader();
    const body = JSON.stringify("");
    const options = { headers: headers };

    return this.http.post<Response>(url, body, options);
  }

  sendTestEmail(date: Date, region: string, language: string): Observable<Response> {
    var url;
    if (language && language !== "") {
      url = this.constantsService.getServerUrl() + "bulletins/publish/email/test?date=" + this.constantsService.getISOStringWithTimezoneOffsetUrlEncoded(date) + "&region=" + region + "&lang=" + language;
    } else {
      url = this.constantsService.getServerUrl() + "bulletins/publish/email/test?date=" + this.constantsService.getISOStringWithTimezoneOffsetUrlEncoded(date) + "&region=" + region;
    }
    const headers = this.authenticationService.newAuthHeader();
    const body = JSON.stringify("");
    const options = { headers: headers };

    return this.http.post<Response>(url, body, options);
  }

  triggerTelegramChannel(date: Date, region: string, language: string): Observable<Response> {
    var url;
    if (language && language !== "") {
      url = this.constantsService.getServerUrl() + "bulletins/publish/telegram?date=" + this.constantsService.getISOStringWithTimezoneOffsetUrlEncoded(date) + "&region=" + region + "&lang=" + language;
    } else {
      url = this.constantsService.getServerUrl() + "bulletins/publish/telegram?date=" + this.constantsService.getISOStringWithTimezoneOffsetUrlEncoded(date) + "&region=" + region;
    }
    const headers = this.authenticationService.newAuthHeader();
    const body = JSON.stringify("");
    const options = { headers: headers };

    return this.http.post<Response>(url, body, options);
  }

  triggerTestTelegramChannel(date: Date, region: string, language: string): Observable<Response> {
    var url;
    if (language && language !== "") {
      url = this.constantsService.getServerUrl() + "bulletins/publish/telegram/test?date=" + this.constantsService.getISOStringWithTimezoneOffsetUrlEncoded(date) + "&region=" + region + "&lang=" + language;
    } else {
      url = this.constantsService.getServerUrl() + "bulletins/publish/telegram/test?date=" + this.constantsService.getISOStringWithTimezoneOffsetUrlEncoded(date) + "&region=" + region;
    }
    const headers = this.authenticationService.newAuthHeader();
    const body = JSON.stringify("");
    const options = { headers: headers };

    return this.http.post<Response>(url, body, options);
  }

  triggerPushNotifications(date: Date, region: string, language: string): Observable<Response> {
    var url;
    if (language && language !== "") {
      url = this.constantsService.getServerUrl() + "bulletins/publish/push?date=" + this.constantsService.getISOStringWithTimezoneOffsetUrlEncoded(date) + "&region=" + region + "&lang=" + language;
    } else {
      url = this.constantsService.getServerUrl() + "bulletins/publish/push?date=" + this.constantsService.getISOStringWithTimezoneOffsetUrlEncoded(date) + "&region=" + region;
    }
    const headers = this.authenticationService.newAuthHeader();
    const body = JSON.stringify("");
    const options = { headers: headers };

    return this.http.post<Response>(url, body, options);
  }

  triggerTestPushNotifications(date: Date, region: string, language: string): Observable<Response> {
    var url;
    if (language && language !== "") {
      url = this.constantsService.getServerUrl() + "bulletins/publish/push/test?date=" + this.constantsService.getISOStringWithTimezoneOffsetUrlEncoded(date) + "&region=" + region + "&lang=" + language;
    } else {
      url = this.constantsService.getServerUrl() + "bulletins/publish/push/test?date=" + this.constantsService.getISOStringWithTimezoneOffsetUrlEncoded(date) + "&region=" + region;
    }
    const headers = this.authenticationService.newAuthHeader();
    const body = JSON.stringify("");
    const options = { headers: headers };

    return this.http.post<Response>(url, body, options);
  }

  checkBulletins(date: Date, region: string): Observable<Response> {
    const url = this.constantsService.getServerUrl() + "bulletins/check?date=" + this.constantsService.getISOStringWithTimezoneOffsetUrlEncoded(date) + "&region=" + region;
    const headers = this.authenticationService.newAuthHeader();
    const options = { headers: headers };

    return this.http.get<Response>(url, options);
  }

  loadLockedBulletins() {
    this.lockedBulletins.clear();

    let url = this.constantsService.getServerUrl() + 'bulletins/locked';
    let headers = this.authenticationService.newAuthHeader();
    let options = { headers: headers };

    this.http.get<Response>(url, options).subscribe(
      data => {
        for (const response of (data as any)) {
          const data = JSON.parse(response.data);
          const bulletinLock = BulletinLockModel.createFromJson(data);
          this.addLockedBulletin(bulletinLock);
        }
      },
      error => {
        console.warn("Locked bulletins could not be loaded!");
      }
    );
  }

  isLocked(bulletinId: string) {
    if (this.lockedBulletins.has(bulletinId) && this.lockedBulletins.get(bulletinId).getUserEmail() !== this.authenticationService.getEmail()) {
      return true;
    }
    return false;
  }

  lockBulletin(date: Date, bulletinId: string) {
    const bulletinLock = new BulletinLockModel();
    bulletinLock.setBulletin(bulletinId);
    bulletinLock.setDate(date);
    bulletinLock.setUserName(this.authenticationService.getUsername());
    bulletinLock.setUserEmail(this.authenticationService.getEmail());
    bulletinLock.setLock(true);

    this.bulletinLocks.next(bulletinLock);

    console.debug("Bulletin lock sent: " + bulletinLock.getDate() + " - " + bulletinLock.getBulletin());
  }

  unlockBulletin(date: Date, bulletinId: string) {
    const bulletinLock = new BulletinLockModel();
    bulletinLock.setBulletin(bulletinId);
    bulletinLock.setDate(date);
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

  removeLockedBulletin(bulletinId) {
    if (this.lockedBulletins.has(bulletinId)) {
      this.lockedBulletins.delete(bulletinId);
    } else {
      console.warn("Bulletin was not locked!");
    }
  }
}
