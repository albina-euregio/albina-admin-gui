import { Injectable } from "@angular/core";
import { HttpClient, HttpResponse } from "@angular/common/http";
import { Observable, of, Subject } from "rxjs";
import { map } from "rxjs/operators";
import { ConstantsService } from "../constants-service/constants.service";
import { AuthenticationService } from "../authentication-service/authentication.service";
import { WsBulletinService } from "../ws-bulletin-service/ws-bulletin.service";
import { LocalStorageService } from "../local-storage-service/local-storage.service";
import { BulletinLockModel } from "../../models/bulletin-lock.model";
import { ServerModel } from "../../models/server.model";
import * as Enums from "../../enums/enums";
import { BulletinModel, BulletinModelAsJSON } from "app/models/bulletin.model";
import { DateIsoString } from "app/models/stress-level.model";
import { UserService } from "../user-service/user.service";
import { TranslateService } from "@ngx-translate/core";

class TrainingModeError extends Error {}

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
    private translateService: TranslateService,
    private localStorageService: LocalStorageService,
    private userService: UserService,
    private wsBulletinService: WsBulletinService,
  ) {}

  init({ days } = { days: 10 }) {
    this.dates = [];
    this.activeDate = undefined;
    this.copyDate = undefined;
    this.isEditable = false;
    this.isReadOnly = false;
    this.lockedBulletins = new Map<string, BulletinLockModel>();

    // connect to websockets
    this.wsBulletinConnect();

    const { isTrainingEnabled, trainingTimestamp } = this.localStorageService;
    const startDate = isTrainingEnabled ? new Date(trainingTimestamp) : new Date();
    startDate.setDate(startDate.getDate() - 7);
    startDate.setHours(0, 0, 0, 0);

    const endDate = isTrainingEnabled ? new Date(trainingTimestamp) : new Date();
    endDate.setDate(endDate.getDate() + 3);
    endDate.setHours(0, 0, 0, 0);

    for (let i = 0; i <= days; i++) {
      const date = new Date(endDate.valueOf());
      date.setDate(endDate.getDate() - i);
      this.dates.push(this.getValidFromUntil(date));
    }

    this.loadStressLevels();
    this.loadStatus();
  }

  private loadStressLevels() {
    if (this.localStorageService.isTrainingEnabled) {
      return;
    }
    this.userService.getStressLevels([this.dates.at(-1)[0], this.dates.at(0)[1]]).subscribe((stressLevels) => {
      this.stress = Object.fromEntries(stressLevels.map((s) => [s.date, s.stressLevel]));
    });
  }

  public loadStatus() {
    const startDate = this.dates[this.dates.length - 1];
    const endDate = this.dates[0];
    this.statusMap = new Map<string, Map<number, Enums.BulletinStatus>>();
    this.getStatus(this.authenticationService.getActiveRegionId(), startDate, endDate).subscribe(
      (data) => {
        const map = new Map<number, Enums.BulletinStatus>();
        for (let i = (data as any).length - 1; i >= 0; i--) {
          map.set(Date.parse((data as any)[i].date), Enums.BulletinStatus[(data as any)[i].status as string]);
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
          const map = new Map<number, Enums.BulletinStatus>();
          for (let i = (data as any).length - 1; i >= 0; i--) {
            map.set(Date.parse((data as any)[i].date), Enums.BulletinStatus[(data as any)[i].status as string]);
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
    this.bulletinLocks = this.wsBulletinService
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
      ) as Subject<BulletinLockModel>;

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
    return new Date().getTime() >= published.getTime();
  }

  hasBeenPublished8AM(date: [Date, Date]): boolean {
    // date[1] = validUntil = 17:00
    // date[1] at 08:00 = updated at
    const updated = new Date(date[1]);
    updated.setHours(8, 0, 0, 0);
    return new Date().getTime() >= updated.getTime();
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
   * @param offset - Number of days to offset. Can be negative (future) or positive (past).
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
    return this.getDateOffset(-1);
  }

  getPreviousDate(): [Date, Date] | null {
    return this.getDateOffset(1);
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

  getPreviewPdf(bulletins: BulletinModel[]): Observable<Blob> {
    const body = JSON.stringify(bulletins.map((b) => b.toJson()));
    const url =
      this.constantsService.getServerUrl() +
      "bulletins/preview?" +
      this.constantsService
        .createSearchParams([
          ["region", this.authenticationService.getActiveRegionId()],
          ["lang", this.translateService.currentLang],
        ])
        .toString();
    const headers = this.authenticationService.newAuthHeader("application/pdf");
    return this.http.post(url, body, { headers, responseType: "blob" });
  }

  getStatus(
    region: string,
    startDate: [Date, Date],
    endDate: [Date, Date],
  ): Observable<{ date: string; status: keyof typeof Enums.BulletinStatus }[]> {
    if (this.localStorageService.isTrainingEnabled) {
      return of(
        this.dates.map((date) => {
          return {
            date: date[0].toISOString(),
            status: this.localStorageService.getTrainingBulletins(date)?.length ? "draft" : undefined,
          } as const;
        }),
      );
    }
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
    return this.http.get<any>(url, { headers });
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

  loadBulletins(
    date: [Date, Date],
    regions: string[],
    etag?: string,
  ): Observable<{ bulletins: BulletinModelAsJSON[]; etag: string | null }> {
    if (this.localStorageService.isTrainingEnabled) {
      const bulletins = this.localStorageService.getTrainingBulletins(date);
      return of({ bulletins, etag: null });
    }
    return this.loadBulletinsFromServer(date, regions, etag);
  }

  loadBulletinsFromServer(
    date: [Date, Date],
    regions: string[],
    etag?: string,
  ): Observable<{ bulletins: BulletinModelAsJSON[]; etag: string | null }> {
    const url =
      this.constantsService.getServerUrl() +
      "bulletins/edit?" +
      this.constantsService
        .createSearchParams([
          ["date", this.constantsService.getISOStringWithTimezoneOffset(date[0])],
          ["regions", regions],
        ])
        .toString();
    const headers = this.authenticationService.newAuthHeader();
    if (etag) headers.set("If-None-Match", etag);
    return this.http
      .get<BulletinModelAsJSON[]>(url, { headers, observe: "response" })
      .pipe(map((response) => ({ bulletins: response.body, etag: response.headers.get("ETag") })));
  }

  loadExternalBulletins(date: [Date, Date], server: ServerModel): Observable<BulletinModelAsJSON[]> {
    if (this.localStorageService.isTrainingEnabled) {
      return of([]);
    }
    const url =
      server.apiUrl +
      "bulletins/edit?" +
      this.constantsService
        .createSearchParams([
          ["date", this.constantsService.getISOStringWithTimezoneOffset(date[0])],
          ["regions", server.regions.filter((region) => !this.authenticationService.isInternalRegion(region))],
        ])
        .toString();
    const headers = this.authenticationService.newExternalServerAuthHeader(server);
    return this.http.get<BulletinModelAsJSON[]>(url, { headers });
  }

  loadCaamlBulletins(date: [Date, Date]): Observable<any> {
    if (this.localStorageService.isTrainingEnabled) {
      throw new TrainingModeError();
    }
    const url =
      this.constantsService.getServerUrl() +
      "bulletins?" +
      this.constantsService
        .createSearchParams([
          ["date", this.constantsService.getISOStringWithTimezoneOffset(date[0])],
          ["lang", this.translateService.currentLang],
        ])
        .toString();
    const headers = this.authenticationService.newAuthHeader("application/xml");
    return this.http.get(url, { headers, responseType: "text" });
  }

  loadJsonBulletins(date: [Date, Date]) {
    if (this.localStorageService.isTrainingEnabled) {
      throw new TrainingModeError();
    }
    const url =
      this.constantsService.getServerUrl() +
      "bulletins?" +
      this.constantsService
        .createSearchParams([["date", this.constantsService.getISOStringWithTimezoneOffset(date[0])]])
        .toString();
    const headers = this.authenticationService.newAuthHeader();
    return this.http.get(url, { headers });
  }

  saveBulletins(bulletins: BulletinModel[], date: [Date, Date]): Observable<BulletinModelAsJSON[]> {
    if (this.localStorageService.isTrainingEnabled) {
      const newBulletins = bulletins.map((b) => b.toJson());
      this.localStorageService.setTrainingBulletins(date, newBulletins);
      return of(newBulletins);
    }
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
    return this.http.post<BulletinModelAsJSON[]>(url, body, { headers });
  }

  createBulletin(bulletin: BulletinModel, date: [Date, Date]): Observable<BulletinModelAsJSON[]> {
    if (this.localStorageService.isTrainingEnabled) {
      bulletin.id ??= crypto.randomUUID();
      const bulletins = this.localStorageService.getTrainingBulletins(date);
      const newBulletins = [...bulletins, bulletin.toJson()];
      this.localStorageService.setTrainingBulletins(date, newBulletins);
      return of(newBulletins);
    }
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
    return this.http.put<BulletinModelAsJSON[]>(url, body, { headers });
  }

  updateBulletin(bulletin: BulletinModel, date: [Date, Date]): Observable<BulletinModelAsJSON[]> {
    // check if bulletin has ID
    if (this.localStorageService.isTrainingEnabled) {
      const bulletins = this.localStorageService.getTrainingBulletins(date);
      const newBulletins = [...bulletins.filter((b) => b.id !== bulletin.id), bulletin.toJson()];
      this.localStorageService.setTrainingBulletins(date, newBulletins);
      return of(newBulletins);
    }
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
    return this.http.post<BulletinModelAsJSON[]>(url, body, { headers });
  }

  deleteBulletin(bulletin: BulletinModel, date: [Date, Date]): Observable<BulletinModelAsJSON[]> {
    // check if bulletin has ID
    if (this.localStorageService.isTrainingEnabled) {
      const bulletins = this.localStorageService.getTrainingBulletins(date);
      const newBulletins = bulletins.filter((b) => b.id !== bulletin.id);
      this.localStorageService.setTrainingBulletins(date, newBulletins);
      return of(newBulletins);
    }
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
    return this.http.delete<BulletinModelAsJSON[]>(url, { headers });
  }

  submitBulletins(date: [Date, Date], region: string) {
    if (this.localStorageService.isTrainingEnabled) {
      throw new TrainingModeError();
    }
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
    return this.http.post<void>(url, body, { headers });
  }

  publishBulletins(date: [Date, Date], region: string) {
    if (this.localStorageService.isTrainingEnabled) {
      throw new TrainingModeError();
    }
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
    return this.http.post<void>(url, body, { headers });
  }

  changeBulletins(date: [Date, Date], region: string) {
    if (this.localStorageService.isTrainingEnabled) {
      throw new TrainingModeError();
    }
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
    return this.http.post<void>(url, body, { headers });
  }

  publishAllBulletins(date: [Date, Date]) {
    if (this.localStorageService.isTrainingEnabled) {
      throw new TrainingModeError();
    }
    const url =
      this.constantsService.getServerUrl() +
      "bulletins/publish/all?" +
      this.constantsService
        .createSearchParams([["date", this.constantsService.getISOStringWithTimezoneOffset(date[0])]])
        .toString();
    const headers = this.authenticationService.newAuthHeader();
    const body = JSON.stringify("");
    return this.http.post<void>(url, body, { headers });
  }

  createCaaml(date: [Date, Date]) {
    if (this.localStorageService.isTrainingEnabled) {
      throw new TrainingModeError();
    }
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
    if (this.localStorageService.isTrainingEnabled) {
      throw new TrainingModeError();
    }
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
    if (this.localStorageService.isTrainingEnabled) {
      throw new TrainingModeError();
    }
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
    if (this.localStorageService.isTrainingEnabled) {
      throw new TrainingModeError();
    }
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
    if (this.localStorageService.isTrainingEnabled) {
      throw new TrainingModeError();
    }
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
    if (this.localStorageService.isTrainingEnabled) {
      throw new TrainingModeError();
    }
    let url: string;
    if (language) {
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
    if (this.localStorageService.isTrainingEnabled) {
      throw new TrainingModeError();
    }
    let url: string;
    if (language) {
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
    if (this.localStorageService.isTrainingEnabled) {
      throw new TrainingModeError();
    }
    let url: string;
    if (language) {
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
    if (this.localStorageService.isTrainingEnabled) {
      throw new TrainingModeError();
    }
    let url: string;
    if (language) {
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
    if (this.localStorageService.isTrainingEnabled) {
      throw new TrainingModeError();
    }
    let url: string;
    if (language) {
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
    if (this.localStorageService.isTrainingEnabled) {
      throw new TrainingModeError();
    }
    let url: string;
    if (language) {
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
    if (this.localStorageService.isTrainingEnabled) {
      // TODO check bulletins from POST JSON
    }
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
    const url = this.constantsService.getServerUrl() + "bulletins/locked";
    const headers = this.authenticationService.newAuthHeader();
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
    return !stress0
      ? this.constantsService.colorDangerRatingMissing
      : stress0 < 25
        ? this.constantsService.colorDangerRatingLow
        : stress0 < 50
          ? this.constantsService.colorDangerRatingModerate
          : stress0 < 75
            ? this.constantsService.colorDangerRatingConsiderable
            : this.constantsService.colorDangerRatingHigh;
  }

  getStressLevelIcon(date: DateIsoString) {
    const stress0 = this.stress[date];
    return stress0 < 25
      ? "ph-smiley"
      : stress0 < 50
        ? "ph-smiley-meh"
        : stress0 < 75
          ? "ph-smiley-nervous"
          : stress0 <= 100
            ? "ph-smiley-x-eyes"
            : "ph-circle-dashed";
  }
}
