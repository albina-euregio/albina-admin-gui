import { HttpClient, HttpHeaders } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { TranslateService } from "@ngx-translate/core";
import { BulletinModel, BulletinModelAsJSON } from "app/models/bulletin.model";
import { StressLevel } from "app/models/stress-level.model";
import { Observable, of, Subject } from "rxjs";
import { map, switchMap } from "rxjs/operators";

import * as Enums from "../../enums/enums";
import { Bulletins, toAlbinaBulletins } from "../../models/CAAMLv6";
import { ServerModel } from "../../models/server.model";
import { SourceDates } from "../../models/SourceDates";
import { AlbinaLanguage } from "../../models/text.model";
import { AuthenticationService } from "../authentication-service/authentication.service";
import { ConstantsService } from "../constants-service/constants.service";
import { LocalStorageService } from "../local-storage-service/local-storage.service";
import { UndoRedoState } from "../undo-redo-service/undo-redo.service";
import { UserService } from "../user-service/user.service";

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

type BulletinApiResponse = {
  bulletins?: BulletinModelAsJSON[];
};

@Injectable()
export class BulletinsService {
  http = inject(HttpClient);
  private constantsService = inject(ConstantsService);
  private authenticationService = inject(AuthenticationService);
  private translateService = inject(TranslateService);
  private localStorageService = inject(LocalStorageService);
  private userService = inject(UserService);

  public readonly sourceDates = new SourceDates();
  private copyDate: [Date, Date];
  private isEditable: boolean;
  private isReadOnly: boolean;

  public stress: Record<StressLevel["date"], StressLevel["stressLevel"]> = {};

  public statusMap: Map<string, Map<number, Enums.BulletinStatus>>;

  private accordionChangedSubject = new Subject<AccordionChangeEvent>(); // used to synchronize accordion between compared bulletins
  accordionChanged$: Observable<AccordionChangeEvent> = this.accordionChangedSubject.asObservable();

  readonly undoRedo = new UndoRedoState<BulletinModel>(
    (bulletin) => bulletin,
    (json) => BulletinModel.parse(json),
  );

  init({ days } = { days: 10 }) {
    this.copyDate = undefined;
    this.isEditable = false;
    this.isReadOnly = false;

    const { isTrainingEnabled, trainingTimestamp } = this.localStorageService;
    if (isTrainingEnabled) {
      const endDate = Temporal.PlainDateTime.from(trainingTimestamp).toPlainDate().add({ days: 3 });
      this.sourceDates.init(days, endDate);
    } else {
      this.sourceDates.init(days);
    }

    this.loadStressLevels();
    this.loadStatus();
  }

  private loadStressLevels() {
    if (this.localStorageService.isTrainingEnabled) {
      return;
    }
    this.userService.getStressLevels(this.sourceDates.getLoadDateArray()).subscribe((stressLevels) => {
      this.stress = Object.fromEntries(stressLevels.map((s) => [s.date, s.stressLevel]));
    });
  }

  public loadStatus() {
    const { startDate, endDate } = this.sourceDates.getLoadDate();
    this.statusMap = new Map<string, Map<number, Enums.BulletinStatus>>();
    this.getStatus(this.authenticationService.getActiveRegionId(), startDate, endDate).subscribe(
      (data) => {
        const map = new Map<number, Enums.BulletinStatus>();
        for (let i = data.length - 1; i >= 0; i--) {
          map.set(Date.parse(data[i].date), Enums.BulletinStatus[data[i].status]);
        }
        const region = this.authenticationService.getActiveRegionId();
        this.statusMap.set(region, map);
        this.updateEditable();
      },
      () => {
        console.error("Status {} could not be loaded!", this.authenticationService.getActiveRegionId());
      },
    );
    this.authenticationService.getActiveRegion()?.neighborRegions.forEach((neighborRegion) => {
      this.getStatus(neighborRegion, startDate, endDate).subscribe(
        (data) => {
          const map = new Map<number, Enums.BulletinStatus>();
          for (let i = data.length - 1; i >= 0; i--) {
            map.set(Date.parse(data[i].date), Enums.BulletinStatus[data[i].status]);
          }
          this.statusMap.set(neighborRegion, map);
          this.updateEditable();
        },
        () => {
          console.error("Status {} could not be loaded!", neighborRegion);
        },
      );
    });
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

  getUserRegionStatus(date: [Date, Date] = this.sourceDates.activeDate): Enums.BulletinStatus {
    const region = this.authenticationService.getActiveRegionId();
    const regionStatusMap = this.statusMap.get(region);
    if (date && regionStatusMap) return regionStatusMap.get(date[0].getTime());
    else return Enums.BulletinStatus.missing;
  }

  setUserRegionStatus(date: [Date, Date], status: Enums.BulletinStatus) {
    const region = this.authenticationService.getActiveRegionId();
    this.statusMap.get(region).set(date[0].getTime(), status);
  }

  getPreviewPdf(bulletins: BulletinModel[]): Observable<Blob> {
    const body = JSON.stringify(bulletins.map((b) => b));
    const url = this.constantsService.getServerUrlPOST("/bulletins/preview", {
      region: this.authenticationService.getActiveRegionId(),
      lang: this.translateService.getCurrentLang() as AlbinaLanguage,
    });
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
        this.sourceDates.dates.map((date) => {
          return {
            date: date[0].toISOString(),
            status: this.localStorageService.getTrainingBulletins(date)?.length ? "draft" : undefined,
          } as const;
        }),
      );
    }
    const url = this.constantsService.getServerUrlGET("/bulletins/status/internal", {
      startDate: this.constantsService.getISOStringWithTimezoneOffset(startDate[0]),
      endDate: this.constantsService.getISOStringWithTimezoneOffset(endDate[0]),
      region: region,
    });
    return this.http.get<{ date: string; status: keyof typeof Enums.BulletinStatus }[]>(url);
  }

  getPublicationStatus(region: string, date: [Date, Date] = this.sourceDates.activeDate) {
    const url = this.constantsService.getServerUrlGET("/bulletins/status/publication", {
      date: this.constantsService.getISOStringWithTimezoneOffset(date[0]),
      region: region,
    });
    return this.http.get(url);
  }

  async loadBulletinsForDate(
    date: string,
    regionCodes: string[],
    lang: AlbinaLanguage,
  ): Promise<BulletinModelAsJSON[]> {
    const url = this.constantsService.getServerUrlGET("/bulletins/caaml/json", {
      date: `${date}T16:00:00Z`,
      regions: regionCodes,
      lang: lang,
      version: "V6_JSON",
    });
    const data = await this.http.get<BulletinApiResponse>(url).toPromise();
    return Array.isArray(data?.bulletins) ? data.bulletins : [];
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
    const url = this.constantsService.getServerUrlGET("/bulletins/edit", {
      date: this.constantsService.getISOStringWithTimezoneOffset(date[0]),
      regions: regions,
    });
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
      return this.http.get<Bulletins>(server.apiUrl, { headers, params }).pipe(map((data) => toAlbinaBulletins(data)));
    }
    return this.http
      .get<{ date: string }>(this.constantsService.getExternalServerUrlGET(server, "/bulletins/latest"), { headers })
      .pipe(
        switchMap((latest) => {
          const date = new Date(date0);
          if (latest.date.endsWith("T22:00:00Z") || latest.date.endsWith("T23:00:00Z")) {
            date.setHours(24, 0, 0);
          }
          const url = this.constantsService.getExternalServerUrlGET(server, "/bulletins/edit", {
            date: this.constantsService.getISOStringWithTimezoneOffset(date),
            regions: server.regions.filter((region) => !this.authenticationService.isInternalRegion(region)),
          });
          return this.http.get<BulletinModelAsJSON[]>(url, { headers });
        }),
      );
  }

  getCaamlJsonBulletins(
    date: [Date, Date] = this.sourceDates.activeDate,
    regions: string[] = this.authenticationService.getInternalRegions(),
  ): Observable<Bulletins> {
    const url = this.constantsService.getServerUrlGET("/bulletins/edit/caaml/json", {
      date: this.constantsService.getISOStringWithTimezoneOffset(date[0]),
      regions: regions,
      lang: this.translateService.getCurrentLang() as AlbinaLanguage,
      version: "V6_JSON",
    });
    return this.http.get<Bulletins>(url);
  }

  saveBulletins(
    bulletins: BulletinModel[],
    date: [Date, Date] = this.sourceDates.activeDate,
  ): Observable<BulletinModelAsJSON[]> {
    if (this.localStorageService.isTrainingEnabled) {
      const newBulletins = bulletins.map((b) => b);
      this.localStorageService.setTrainingBulletins(date, newBulletins);
      return of(newBulletins);
    }
    const url = this.constantsService.getServerUrlPOST("/bulletins", {
      date: this.constantsService.getISOStringWithTimezoneOffset(date[0]),
      region: this.authenticationService.getActiveRegionId(),
    });
    const body = JSON.stringify(bulletins);
    return this.http.post<BulletinModelAsJSON[]>(url, body);
  }

  createBulletin(
    bulletin: BulletinModel,
    date: [Date, Date] = this.sourceDates.activeDate,
  ): Observable<BulletinModelAsJSON[]> {
    if (this.localStorageService.isTrainingEnabled) {
      bulletin.id ??= crypto.randomUUID();
      const bulletins = this.localStorageService.getTrainingBulletins(date);
      const newBulletins = [...bulletins, bulletin];
      this.localStorageService.setTrainingBulletins(date, newBulletins);
      return of(newBulletins);
    }
    const url = this.constantsService.getServerUrlPUT("/bulletins", {
      date: this.constantsService.getISOStringWithTimezoneOffset(date[0]),
      region: this.authenticationService.getActiveRegionId(),
    });
    const body = JSON.stringify(bulletin);
    return this.http.put<BulletinModelAsJSON[]>(url, body);
  }

  updateBulletin(
    bulletin: BulletinModel,
    date: [Date, Date] = this.sourceDates.activeDate,
  ): Observable<BulletinModelAsJSON[]> {
    // check if bulletin has ID
    if (this.localStorageService.isTrainingEnabled) {
      const bulletins = this.localStorageService.getTrainingBulletins(date);
      const newBulletins = [...bulletins.filter((b) => b.id !== bulletin.id), bulletin];
      this.localStorageService.setTrainingBulletins(date, newBulletins);
      return of(newBulletins);
    }
    const url = this.constantsService.getServerUrlPOST(
      `/bulletins/{bulletinId}`,
      {
        date: this.constantsService.getISOStringWithTimezoneOffset(date[0]),
        region: this.authenticationService.getActiveRegionId(),
      },
      { bulletinId: bulletin.id },
    );
    const body = JSON.stringify(bulletin);
    return this.http.post<BulletinModelAsJSON[]>(url, body);
  }

  deleteBulletin(
    bulletin: BulletinModel,
    date: [Date, Date] = this.sourceDates.activeDate,
  ): Observable<BulletinModelAsJSON[]> {
    // check if bulletin has ID
    if (this.localStorageService.isTrainingEnabled) {
      const bulletins = this.localStorageService.getTrainingBulletins(date);
      const newBulletins = bulletins.filter((b) => b.id !== bulletin.id);
      this.localStorageService.setTrainingBulletins(date, newBulletins);
      return of(newBulletins);
    }
    const url = this.constantsService.getServerUrlDELETE(
      `/bulletins/{bulletinId}`,
      {
        date: this.constantsService.getISOStringWithTimezoneOffset(date[0]),
        region: this.authenticationService.getActiveRegionId(),
      },
      { bulletinId: bulletin.id },
    );
    return this.http.delete<BulletinModelAsJSON[]>(url);
  }

  submitBulletins(date: [Date, Date], region: string) {
    if (this.localStorageService.isTrainingEnabled) {
      throw new TrainingModeError();
    }
    const url = this.constantsService.getServerUrlPOST("/bulletins/submit", {
      date: this.constantsService.getISOStringWithTimezoneOffset(date[0]),
      region: region,
    });
    const body = JSON.stringify("");
    return this.http.post<void>(url, body);
  }

  publishBulletins(date: [Date, Date], region: string) {
    if (this.localStorageService.isTrainingEnabled) {
      throw new TrainingModeError();
    }
    const url = this.constantsService.getServerUrlPOST("/bulletins/publish", {
      date: this.constantsService.getISOStringWithTimezoneOffset(date[0]),
      region: region,
    });
    const body = JSON.stringify("");
    return this.http.post<void>(url, body);
  }

  changeBulletins(date: [Date, Date], region: string) {
    if (this.localStorageService.isTrainingEnabled) {
      throw new TrainingModeError();
    }
    const url = this.constantsService.getServerUrlPOST("/bulletins/change", {
      date: this.constantsService.getISOStringWithTimezoneOffset(date[0]),
      region: region,
    });
    const jsonBulletins = [];
    const body = JSON.stringify(jsonBulletins);
    return this.http.post<void>(url, body);
  }

  publishAllBulletins(date: [Date, Date], change: boolean) {
    if (this.localStorageService.isTrainingEnabled) {
      throw new TrainingModeError();
    }
    const url = this.constantsService.getServerUrlPOST("/bulletins/publish/all", {
      date: this.constantsService.getISOStringWithTimezoneOffset(date[0]),
      change: change,
    });
    const body = JSON.stringify("");
    return this.http.post<void>(url, body);
  }

  triggerPublicationChannel(date: [Date, Date], region: string, language: string, channel: PublicationChannel) {
    if (this.localStorageService.isTrainingEnabled) {
      throw new TrainingModeError();
    }
    if (language == "all") {
      language = undefined;
    }
    const url = this.constantsService.getServerUrlPOST(`/bulletins/publish/${channel}` as `/bulletins/publish/email`, {
      date: this.constantsService.getISOStringWithTimezoneOffset(date[0]),
      region: region,
      lang: language as AlbinaLanguage,
    });
    const body = JSON.stringify("");
    return this.http.post(url, body);
  }

  checkBulletins(date: [Date, Date], region: string) {
    if (this.localStorageService.isTrainingEnabled) {
      // TODO check bulletins from POST JSON
    }
    const url = this.constantsService.getServerUrlGET("/bulletins/check", {
      date: this.constantsService.getISOStringWithTimezoneOffset(date[0]),
      region: region,
    });
    return this.http.get<string[]>(url);
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

  updateEditable() {
    this.setIsEditable(
      ((this.getUserRegionStatus() === Enums.BulletinStatus.missing || this.getUserRegionStatus() === undefined) &&
        !this.sourceDates.hasBeenPublished5PM()) ||
        this.getUserRegionStatus() === Enums.BulletinStatus.updated ||
        this.getUserRegionStatus() === Enums.BulletinStatus.draft,
    );
  }
}
