import * as Enums from "../../enums/enums";
import { Bulletins, toAlbinaBulletin } from "../../models/CAAMLv6";
import { BulletinLockModel } from "../../models/bulletin-lock.model";
import { ServerModel } from "../../models/server.model";
import { AuthenticationService } from "../authentication-service/authentication.service";
import { ConstantsService } from "../constants-service/constants.service";
import { LocalStorageService } from "../local-storage-service/local-storage.service";
import { UserService } from "../user-service/user.service";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { TranslateService } from "@ngx-translate/core";
import { BulletinModel, BulletinModelAsJSON } from "app/models/bulletin.model";
import { StressLevel } from "app/models/stress-level.model";
import { Observable, of, Subject } from "rxjs";
import { map, switchMap } from "rxjs/operators";

class TrainingModeError extends Error {}

interface AccordionChangeEvent {
  isOpen: boolean;
  groupName: string;
}

export enum PublicationChannel {
  Email = "email",
  Telegram = "telegram",
  WhatsApp = "whatsapp",
  Push = "push",
}

@Injectable()
export class BulletinsService {
  http = inject(HttpClient);
  private constantsService = inject(ConstantsService);
  private authenticationService = inject(AuthenticationService);
  private translateService = inject(TranslateService);
  private localStorageService = inject(LocalStorageService);
  private userService = inject(UserService);

  private activeDate: [Date, Date];
  private copyDate: [Date, Date];
  private isEditable: boolean;
  private isReadOnly: boolean;

  public lockedBulletins: Map<string, BulletinLockModel>;
  public bulletinLocks: Subject<BulletinLockModel>;

  public stress: Record<StressLevel["date"], StressLevel["stressLevel"]> = {};

  public statusMap: Map<string, Map<number, Enums.BulletinStatus>>;

  public dates: [Date, Date][];

  private accordionChangedSubject = new Subject<AccordionChangeEvent>(); // used to synchronize accordion between compared bulletins
  accordionChanged$: Observable<AccordionChangeEvent> = this.accordionChangedSubject.asObservable();

  init({ days } = { days: 10 }) {
    this.dates = [];
    this.activeDate = undefined;
    this.copyDate = undefined;
    this.isEditable = false;
    this.isReadOnly = false;
    this.lockedBulletins = new Map<string, BulletinLockModel>();

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
    const url = this.constantsService.getServerUrl(
      "/bulletins/preview",
      ["region", this.authenticationService.getActiveRegionId()],
      ["lang", this.translateService.getCurrentLang()],
    );
    const headers = new HttpHeaders({ Accept: "application/pdf" });
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
    const url = this.constantsService.getServerUrl(
      "/bulletins/status/internal",
      ["startDate", this.constantsService.getISOStringWithTimezoneOffset(startDate[0])],
      ["endDate", this.constantsService.getISOStringWithTimezoneOffset(endDate[0])],
      ["region", region],
    );
    return this.http.get<{ date: string; status: keyof typeof Enums.BulletinStatus }[]>(url);
  }

  getPublicationStatus(region: string, date: [Date, Date]) {
    const url = this.constantsService.getServerUrl(
      "/bulletins/status/publication",
      ["date", this.constantsService.getISOStringWithTimezoneOffset(date[0])],
      ["region", region],
    );
    return this.http.get(url);
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
    const url = this.constantsService.getServerUrl(
      "/bulletins/edit",
      ["date", this.constantsService.getISOStringWithTimezoneOffset(date[0])],
      ["regions", regions],
    );
    const headers = etag ? new HttpHeaders({ "If-None-Match": etag }) : undefined;
    return this.http
      .get<BulletinModelAsJSON[]>(url, { headers, observe: "response" })
      .pipe(map((response) => ({ bulletins: response.body, etag: response.headers.get("ETag") })));
  }

  loadExternalBulletins([date0, date1]: [Date, Date], server: ServerModel): Observable<BulletinModelAsJSON[]> {
    if (this.localStorageService.isTrainingEnabled) {
      return of([]);
    }
    const headers = new HttpHeaders({ Authorization: "Bearer " + server.accessToken });
    if (server.apiUrl.includes("/api/bulletin-preview/caaml/")) {
      const params = { activeAt: new Date(+date0 / 2 + +date1 / 2).toISOString() };
      return this.http
        .get<Bulletins>(server.apiUrl, { headers, params })
        .pipe(map((data) => data.bulletins.map((b) => toAlbinaBulletin(b))));
    }
    return this.http
      .get<{ date: string }>(this.constantsService.getExternalServerUrl(server, "/bulletins/latest"), { headers })
      .pipe(
        switchMap((latest) => {
          const date = new Date(date0);
          if (latest.date.endsWith("T22:00:00Z") || latest.date.endsWith("T23:00:00Z")) {
            date.setHours(24, 0, 0);
          }
          const url = this.constantsService.getExternalServerUrl(
            server,
            "/bulletins/edit",
            ["date", this.constantsService.getISOStringWithTimezoneOffset(date)],
            ["regions", server.regions.filter((region) => !this.authenticationService.isInternalRegion(region))],
          );
          return this.http.get<BulletinModelAsJSON[]>(url, { headers });
        }),
      );
  }

  saveBulletins(bulletins: BulletinModel[], date: [Date, Date]): Observable<BulletinModelAsJSON[]> {
    if (this.localStorageService.isTrainingEnabled) {
      const newBulletins = bulletins.map((b) => b.toJson());
      this.localStorageService.setTrainingBulletins(date, newBulletins);
      return of(newBulletins);
    }
    const url = this.constantsService.getServerUrl(
      "/bulletins",
      ["date", this.constantsService.getISOStringWithTimezoneOffset(date[0])],
      ["region", this.authenticationService.getActiveRegionId()],
    );
    const jsonBulletins = [];
    for (let i = bulletins.length - 1; i >= 0; i--) {
      jsonBulletins.push(bulletins[i].toJson());
    }
    const body = JSON.stringify(jsonBulletins);
    return this.http.post<BulletinModelAsJSON[]>(url, body);
  }

  createBulletin(bulletin: BulletinModel, date: [Date, Date]): Observable<BulletinModelAsJSON[]> {
    if (this.localStorageService.isTrainingEnabled) {
      bulletin.id ??= crypto.randomUUID();
      const bulletins = this.localStorageService.getTrainingBulletins(date);
      const newBulletins = [...bulletins, bulletin.toJson()];
      this.localStorageService.setTrainingBulletins(date, newBulletins);
      return of(newBulletins);
    }
    const url = this.constantsService.getServerUrl(
      "/bulletins",
      ["date", this.constantsService.getISOStringWithTimezoneOffset(date[0])],
      ["region", this.authenticationService.getActiveRegionId()],
    );
    const body = JSON.stringify(bulletin.toJson());
    return this.http.put<BulletinModelAsJSON[]>(url, body);
  }

  updateBulletin(bulletin: BulletinModel, date: [Date, Date]): Observable<BulletinModelAsJSON[]> {
    // check if bulletin has ID
    if (this.localStorageService.isTrainingEnabled) {
      const bulletins = this.localStorageService.getTrainingBulletins(date);
      const newBulletins = [...bulletins.filter((b) => b.id !== bulletin.id), bulletin.toJson()];
      this.localStorageService.setTrainingBulletins(date, newBulletins);
      return of(newBulletins);
    }
    const url = this.constantsService.getServerUrl(
      `/bulletins/${bulletin.id}`,
      ["date", this.constantsService.getISOStringWithTimezoneOffset(date[0])],
      ["region", this.authenticationService.getActiveRegionId()],
    );
    const body = JSON.stringify(bulletin.toJson());
    return this.http.post<BulletinModelAsJSON[]>(url, body);
  }

  deleteBulletin(bulletin: BulletinModel, date: [Date, Date]): Observable<BulletinModelAsJSON[]> {
    // check if bulletin has ID
    if (this.localStorageService.isTrainingEnabled) {
      const bulletins = this.localStorageService.getTrainingBulletins(date);
      const newBulletins = bulletins.filter((b) => b.id !== bulletin.id);
      this.localStorageService.setTrainingBulletins(date, newBulletins);
      return of(newBulletins);
    }
    const url = this.constantsService.getServerUrl(
      `/bulletins/${bulletin.id}`,
      ["date", this.constantsService.getISOStringWithTimezoneOffset(date[0])],
      ["region", this.authenticationService.getActiveRegionId()],
    );
    return this.http.delete<BulletinModelAsJSON[]>(url);
  }

  submitBulletins(date: [Date, Date], region: string) {
    if (this.localStorageService.isTrainingEnabled) {
      throw new TrainingModeError();
    }
    const url = this.constantsService.getServerUrl(
      "/bulletins/submit",
      ["date", this.constantsService.getISOStringWithTimezoneOffset(date[0])],
      ["region", region],
    );
    const body = JSON.stringify("");
    return this.http.post<void>(url, body);
  }

  publishBulletins(date: [Date, Date], region: string) {
    if (this.localStorageService.isTrainingEnabled) {
      throw new TrainingModeError();
    }
    const url = this.constantsService.getServerUrl(
      "/bulletins/publish",
      ["date", this.constantsService.getISOStringWithTimezoneOffset(date[0])],
      ["region", region],
    );
    const body = JSON.stringify("");
    return this.http.post<void>(url, body);
  }

  changeBulletins(date: [Date, Date], region: string) {
    if (this.localStorageService.isTrainingEnabled) {
      throw new TrainingModeError();
    }
    const url = this.constantsService.getServerUrl(
      "/bulletins/change",
      ["date", this.constantsService.getISOStringWithTimezoneOffset(date[0])],
      ["region", region],
    );
    const jsonBulletins = [];
    const body = JSON.stringify(jsonBulletins);
    return this.http.post<void>(url, body);
  }

  publishAllBulletins(date: [Date, Date], change: boolean) {
    if (this.localStorageService.isTrainingEnabled) {
      throw new TrainingModeError();
    }
    const url = this.constantsService.getServerUrl(
      "/bulletins/publish/all",
      ["date", this.constantsService.getISOStringWithTimezoneOffset(date[0])],
      ["change", change],
    );
    const body = JSON.stringify("");
    return this.http.post<void>(url, body);
  }

  triggerPublicationChannel(date: [Date, Date], region: string, language: string, channel: PublicationChannel) {
    if (this.localStorageService.isTrainingEnabled) {
      throw new TrainingModeError();
    }
    const url = this.constantsService.getServerUrl(
      `/bulletins/publish/${channel}`,
      ["date", this.constantsService.getISOStringWithTimezoneOffset(date[0])],
      ["region", region],
      ...(language !== "all" ? [["lang", language] as [string, string]] : []),
    );
    const body = JSON.stringify("");
    return this.http.post(url, body);
  }

  checkBulletins(date: [Date, Date], region: string) {
    if (this.localStorageService.isTrainingEnabled) {
      // TODO check bulletins from POST JSON
    }
    const url = this.constantsService.getServerUrl(
      "/bulletins/check",
      ["date", this.constantsService.getISOStringWithTimezoneOffset(date[0])],
      ["region", region],
    );
    return this.http.get(url);
  }

  getStressLevelColor(date: StressLevel["date"]) {
    const stress0 = this.stress[date];
    return !stress0
      ? this.constantsService.getDangerRatingColor(Enums.DangerRating.missing)
      : stress0 < 25
        ? this.constantsService.getDangerRatingColor(Enums.DangerRating.low)
        : stress0 < 50
          ? this.constantsService.getDangerRatingColor(Enums.DangerRating.moderate)
          : stress0 < 75
            ? this.constantsService.getDangerRatingColor(Enums.DangerRating.considerable)
            : this.constantsService.getDangerRatingColor(Enums.DangerRating.high);
  }

  getStressLevelIcon(date: StressLevel["date"]) {
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

  emitAccordionChanged(event: AccordionChangeEvent) {
    this.accordionChangedSubject.next(event);
  }
}
