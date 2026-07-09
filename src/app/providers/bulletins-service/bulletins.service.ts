import { inject, Injectable } from "@angular/core";
import { TranslateService } from "@ngx-translate/core";
import { BulletinPhotoModel, BulletinPhotoSchema } from "app/models/bulletin-photo.model";
import { BulletinModel, BulletinModelAsJSON } from "app/models/bulletin.model";
import {
  PublicationChecklistModel,
  PublicationChecklistSchema,
  PublicationStatusModel,
  PublicationStatusSchema,
} from "app/models/publication-checklist.model";
import { StressLevel } from "app/models/stress-level.model";
import { BehaviorSubject, from, Observable, of, Subject } from "rxjs";
import { map, tap } from "rxjs/operators";

import * as Enums from "../../enums/enums";
import { Bulletin, Bulletins } from "../../models/CAAMLv6";
import { SourceDates } from "../../models/SourceDates";
import { AlbinaLanguage } from "../../models/text.model";
import * as albinaApi from "../albina-api";
import { repeatedArrayQuerySerializer } from "../albina-api.provider";
import { AuthenticationService } from "../authentication-service/authentication.service";
import { ConstantsService } from "../constants-service/constants.service";
import { LocalStorageService } from "../local-storage-service/local-storage.service";
import { UndoRedoState } from "../undo-redo-service/undo-redo.service";
import { UserService } from "../user-service/user.service";

export type PublicationStrategy = albinaApi.PublicationStrategyType;

class TrainingModeError extends Error {}

export type AccordionGroupName =
  | "dangerRating"
  | "avalancheProblem1"
  | "avalancheProblem2"
  | "avalancheProblem3"
  | "avalancheProblem4"
  | "avalancheProblem5"
  | "avalancheProblemForenoon"
  | "avalancheProblemAfternoon"
  | "dangerDescription"
  | "snowpackStructure"
  | "photos"
  | "tendency"
  | "synopsis";

interface AccordionChangeEvent {
  isOpen: boolean;
  groupName: AccordionGroupName;
}

@Injectable({ providedIn: "root" })
export class BulletinsService {
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

  private publicationStatusSubject = new BehaviorSubject<PublicationStatusModel | undefined>(undefined);
  readonly publicationStatus$: Observable<PublicationStatusModel | undefined> =
    this.publicationStatusSubject.asObservable();
  private publicationStatusPollTimeout: ReturnType<typeof setTimeout> | null = null;

  private static readonly PUBLICATION_STATUS_FAST_POLL_MS = 1000;
  private static readonly PUBLICATION_STATUS_SLOW_POLL_MS = 10000;

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
    if (
      this.sourceDates.activeDate &&
      (!startDate ||
        !endDate ||
        this.sourceDates.activeDate[0] < startDate[0] ||
        this.sourceDates.activeDate[0] > endDate[0])
    ) {
      // if active date is outside of loaded date range, load status separately only for the active date and region
      const region = this.authenticationService.getActiveRegionId();
      this.getStatus(region, this.sourceDates.activeDate, this.sourceDates.activeDate).subscribe((data) => {
        const map = this.statusMap.get(region) ?? new Map<number, Enums.BulletinStatus>();
        for (let i = data.length - 1; i >= 0; i--) {
          map.set(Date.parse(data[i].date), Enums.BulletinStatus[data[i].status]);
        }
        this.statusMap.set(region, map);
        this.updateEditable();
      });
      return;
    }
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

  getActiveRegionStatus(date: [Date, Date] = this.sourceDates.activeDate): Enums.BulletinStatus {
    const region = this.authenticationService.getActiveRegionId();
    const regionStatusMap = this.statusMap?.get(region);
    if (date && regionStatusMap) return regionStatusMap.get(date[0].getTime());
    else return Enums.BulletinStatus.missing;
  }

  getRegionStatus(region: string, date: [Date, Date] = this.sourceDates.activeDate) {
    const regionStatusMap = this.statusMap.get(region);
    if (date && regionStatusMap) return regionStatusMap.get(date[0].getTime());
    else return Enums.BulletinStatus.missing;
  }

  setActiveRegionStatus(date: [Date, Date], status: Enums.BulletinStatus) {
    const region = this.authenticationService.getActiveRegionId();
    this.statusMap.get(region).set(date[0].getTime(), status);
  }

  getPreviewPdf(bulletins: BulletinModel[]): Observable<Blob> {
    return from(
      albinaApi.getPreviewPdf({
        query: {
          region: this.authenticationService.getActiveRegionId(),
          lang: this.translateService.getCurrentLang() as albinaApi.LanguageCode,
        },
        body: bulletins as unknown as albinaApi.AvalancheBulletin[],
        headers: { Accept: "application/pdf" },
        responseType: "blob",
        throwOnError: true,
      } as albinaApi.Options<albinaApi.GetPreviewPdfData, true>),
    ).pipe(map((res) => res.data as Blob));
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
    return from(
      albinaApi.getInternalStatus({
        query: {
          startDate: this.constantsService.getISOStringWithTimezoneOffset(startDate[0]),
          endDate: this.constantsService.getISOStringWithTimezoneOffset(endDate[0]),
          region: region,
        },
        throwOnError: true,
      }),
    ).pipe(map((res) => res.data as unknown as { date: string; status: keyof typeof Enums.BulletinStatus }[]));
  }

  getPublicationStatus(
    region: string,
    date: [Date, Date] = this.sourceDates.activeDate,
  ): Observable<PublicationStatusModel> {
    return from(
      albinaApi.getPublicationStatus({
        query: {
          date: this.constantsService.getISOStringWithTimezoneOffset(date[0]),
          region: region,
        },
        throwOnError: true,
      }),
    ).pipe(map((res) => PublicationStatusSchema.parse(res.data)));
  }

  getPublicationChecklists(date: string, region: string): Observable<PublicationChecklistModel[]> {
    return from(albinaApi.getChecklists({ query: { date, region }, throwOnError: true })).pipe(
      map((res) => {
        if (Array.isArray(res.data)) {
          return PublicationChecklistSchema.array().parse(res.data);
        }
        return [];
      }),
    );
  }

  savePublicationChecklist(
    date: string,
    region: string,
    checklist: PublicationChecklistModel,
  ): Observable<PublicationChecklistModel> {
    return from(
      albinaApi.saveChecklist({
        query: { date, region },
        body: checklist as unknown as albinaApi.ChecklistServiceChecklist,
        throwOnError: true,
      }),
    ).pipe(map((res) => PublicationChecklistSchema.parse(res.data)));
  }

  loadBulletinsForDate(date: Temporal.PlainDate, regionCodes: string[], lang: AlbinaLanguage): Observable<Bulletin[]> {
    return from(
      albinaApi.getPublishedCaamlJsonBulletins({
        query: {
          date: date.toZonedDateTime({ plainTime: "17:00:00", timeZone: "Europe/Vienna" }).toString(),
          regions: regionCodes,
          lang: lang as albinaApi.LanguageCode,
          version: "V6_JSON",
        },
        querySerializer: repeatedArrayQuerySerializer,
        throwOnError: true,
      }),
    ).pipe(map((res) => (res.data as unknown as Bulletins).bulletins));
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
    return from(
      albinaApi.getJsonBulletins({
        query: {
          date: this.constantsService.getISOStringWithTimezoneOffset(date[0]),
          regions: regions,
        },
        querySerializer: repeatedArrayQuerySerializer,
        headers: etag ? { "If-None-Match": etag } : undefined,
        throwOnError: true,
      }),
    ).pipe(
      map((res) => ({
        bulletins: res.data as unknown as BulletinModelAsJSON[],
        etag: res.response.headers.get("ETag"),
      })),
    );
  }

  getCaamlJsonBulletins(
    date: [Date, Date] = this.sourceDates.activeDate,
    regions: string[] = this.authenticationService.getInternalRegions(),
  ): Observable<Bulletins> {
    return from(
      albinaApi.getCaamlJsonBulletins({
        query: {
          date: this.constantsService.getISOStringWithTimezoneOffset(date[0]),
          regions: regions,
          lang: this.translateService.getCurrentLang() as albinaApi.LanguageCode,
          version: "V6_JSON",
        },
        querySerializer: repeatedArrayQuerySerializer,
        throwOnError: true,
      }),
    ).pipe(map((res) => res.data as unknown as Bulletins));
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
    return from(
      albinaApi.createJsonBulletins({
        query: {
          date: this.constantsService.getISOStringWithTimezoneOffset(date[0]),
          region: this.authenticationService.getActiveRegionId(),
        },
        body: bulletins as unknown as albinaApi.AvalancheBulletin[],
        throwOnError: true,
      }),
    ).pipe(map((res) => res.data as unknown as BulletinModelAsJSON[]));
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
    return from(
      albinaApi.createJsonBulletin({
        query: {
          date: this.constantsService.getISOStringWithTimezoneOffset(date[0]),
          region: this.authenticationService.getActiveRegionId(),
        },
        body: bulletin as unknown as albinaApi.AvalancheBulletin,
        throwOnError: true,
      }),
    ).pipe(map((res) => res.data as unknown as BulletinModelAsJSON[]));
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
    return from(
      albinaApi.updateJsonBulletin({
        path: { bulletinId: bulletin.id! },
        query: {
          date: this.constantsService.getISOStringWithTimezoneOffset(date[0]),
          region: this.authenticationService.getActiveRegionId(),
        },
        body: bulletin as unknown as albinaApi.AvalancheBulletin,
        throwOnError: true,
      }),
    ).pipe(map((res) => res.data as unknown as BulletinModelAsJSON[]));
  }

  uploadPhoto(file: File): Observable<BulletinPhotoModel> {
    return from(
      albinaApi.uploadBulletinPhoto({
        query: { region: this.authenticationService.getActiveRegionId() },
        body: { file },
        throwOnError: true,
      }),
    ).pipe(map((res) => BulletinPhotoSchema.parse(res.data)));
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
    return from(
      albinaApi.deleteJsonBulletin({
        path: { bulletinId: bulletin.id! },
        query: {
          date: this.constantsService.getISOStringWithTimezoneOffset(date[0]),
          region: this.authenticationService.getActiveRegionId(),
        },
        throwOnError: true,
      }),
    ).pipe(map((res) => res.data as unknown as BulletinModelAsJSON[]));
  }

  submitBulletins(date: [Date, Date], region: string) {
    if (this.localStorageService.isTrainingEnabled) {
      throw new TrainingModeError();
    }
    return from(
      albinaApi.submitBulletins({
        query: {
          date: this.constantsService.getISOStringWithTimezoneOffset(date[0]),
          region: region,
        },
        throwOnError: true,
      }),
    ).pipe(map(() => undefined));
  }

  publishBulletins(date: [Date, Date], region: string, strategy: PublicationStrategy): Observable<void> {
    if (this.localStorageService.isTrainingEnabled) {
      throw new TrainingModeError();
    }
    return from(
      albinaApi.publishBulletins({
        query: {
          date: this.constantsService.getISOStringWithTimezoneOffset(date[0]),
          region: region,
          strategy: strategy,
        },
        throwOnError: true,
      }),
    ).pipe(
      map(() => undefined),
      tap(() => {
        if (this.getActiveRegionStatus(date) === Enums.BulletinStatus.resubmitted) {
          this.setActiveRegionStatus(date, Enums.BulletinStatus.republished);
        } else if (this.getActiveRegionStatus(date) === Enums.BulletinStatus.submitted) {
          this.setActiveRegionStatus(date, Enums.BulletinStatus.published);
        }
      }),
    );
  }

  publishAllBulletins(date: [Date, Date], strategy: PublicationStrategy) {
    if (this.localStorageService.isTrainingEnabled) {
      throw new TrainingModeError();
    }
    return from(
      albinaApi.publishAllBulletins({
        query: {
          date: this.constantsService.getISOStringWithTimezoneOffset(date[0]),
          strategy: strategy,
        },
        throwOnError: true,
      }),
    ).pipe(map(() => undefined));
  }

  triggerPublicationChannel(date: [Date, Date], region: string, language: string, channel: Enums.PublicationChannel) {
    if (this.localStorageService.isTrainingEnabled) {
      throw new TrainingModeError();
    }
    if (language == "all") {
      language = undefined;
    }
    const query = {
      date: this.constantsService.getISOStringWithTimezoneOffset(date[0]),
      region: region,
      lang: language as albinaApi.LanguageCode,
    };
    const trigger = (options: { query: typeof query; throwOnError: true }) => {
      if (channel === Enums.PublicationChannel.Email) return albinaApi.sendEmail(options);
      if (channel === Enums.PublicationChannel.Telegram) return albinaApi.triggerTelegramChannel(options);
      if (channel === Enums.PublicationChannel.WhatsApp) return albinaApi.triggerWhatsAppChannel(options);
      if (channel === Enums.PublicationChannel.Push) return albinaApi.triggerPushNotifications(options);
      throw new Error(`Unsupported publication channel: ${channel}`);
    };
    return from(trigger({ query, throwOnError: true })).pipe(map((res) => res.data));
  }

  checkBulletins(date: [Date, Date], region: string) {
    if (this.localStorageService.isTrainingEnabled) {
      // TODO check bulletins from POST JSON
    }
    return from(
      albinaApi.checkBulletins({
        query: {
          date: this.constantsService.getISOStringWithTimezoneOffset(date[0]),
          region: region,
        },
        throwOnError: true,
      }),
    ).pipe(map((res) => res.data as string[]));
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

  startPublicationStatusPolling() {
    this.pollPublicationStatus();
  }

  stopPublicationStatusPolling() {
    if (this.publicationStatusPollTimeout) {
      clearTimeout(this.publicationStatusPollTimeout);
      this.publicationStatusPollTimeout = null;
    }
  }

  refreshPublicationStatus() {
    this.stopPublicationStatusPolling();
    this.pollPublicationStatus();
  }

  private pollPublicationStatus() {
    const regionId = this.authenticationService.getActiveRegionId();
    if (!regionId) return;
    this.getPublicationStatus(regionId).subscribe({
      next: (data) => {
        this.publicationStatusSubject.next(data);
        const interval = data?.isBeingPublished
          ? BulletinsService.PUBLICATION_STATUS_FAST_POLL_MS
          : BulletinsService.PUBLICATION_STATUS_SLOW_POLL_MS;
        this.publicationStatusPollTimeout = setTimeout(() => this.pollPublicationStatus(), interval);
      },
      error: (error) => {
        console.error("Publication status could not be loaded!", error);
        this.publicationStatusPollTimeout = setTimeout(
          () => this.pollPublicationStatus(),
          BulletinsService.PUBLICATION_STATUS_SLOW_POLL_MS,
        );
      },
    });
  }

  emitAccordionChanged(event: AccordionChangeEvent) {
    this.accordionChangedSubject.next(event);
  }

  updateEditable() {
    this.setIsEditable(
      ((this.getActiveRegionStatus() === Enums.BulletinStatus.missing || this.getActiveRegionStatus() === undefined) &&
        !this.sourceDates.hasBeenPublished5PM()) ||
        this.getActiveRegionStatus() === Enums.BulletinStatus.updated ||
        this.getActiveRegionStatus() === Enums.BulletinStatus.draft,
    );
  }
}
