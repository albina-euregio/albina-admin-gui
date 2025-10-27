import { AuthenticationService } from "../providers/authentication-service/authentication.service";
import { ConstantsService } from "../providers/constants-service/constants.service";
import {
  DangerSourceVariantModel,
  DangerSourceVariantSchema,
  DangerSourceVariantType,
} from "./models/danger-source-variant.model";
import { DangerSourceModel, DangerSourceSchema } from "./models/danger-source.model";
import { HttpClient } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { Observable, Subject } from "rxjs";
import { map } from "rxjs/operators";
import { z } from "zod/v4";

interface AccordionChangeEvent {
  isOpen: boolean;
  groupName: string;
}

@Injectable()
export class DangerSourcesService {
  http = inject(HttpClient);
  private constantsService = inject(ConstantsService);
  private authenticationService = inject(AuthenticationService);

  private activeDate: [Date, Date];
  private isEditable: boolean;
  private isReadOnly: boolean;

  public forecastStatusMap: Map<number, boolean>;
  public analysisStatusMap: Map<number, boolean>;

  public dates: [Date, Date][];

  private accordionChangedSubject = new Subject<AccordionChangeEvent>(); // used to synchronize accordion between compared variants
  accordionChanged$: Observable<AccordionChangeEvent> = this.accordionChangedSubject.asObservable();

  constructor() {
    this.init();
  }

  init({ days } = { days: 10 }) {
    this.dates = [];
    this.isEditable = false;
    this.isReadOnly = false;

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
    this.loadStatus();
  }

  public loadStatus() {
    const startDate = this.dates[this.dates.length - 1];
    const endDate = this.dates[0];
    this.forecastStatusMap = new Map<number, boolean>();
    this.analysisStatusMap = new Map<number, boolean>();
    this.getStatus(this.authenticationService.getActiveRegionId(), startDate, endDate).subscribe(
      (data) => {
        for (let i = data.length - 1; i >= 0; i--) {
          this.forecastStatusMap.set(data[i].date.getTime(), data[i].forecast);
          this.analysisStatusMap.set(data[i].date.getTime(), data[i].analysis);
        }
      },
      () => {
        console.error("Danger source variants status could not be loaded!");
      },
    );
  }

  hasDangerSourceVariants(date: [Date, Date]): Observable<boolean> {
    return new Observable<boolean>((observer) => {
      this.getStatus(this.authenticationService.getActiveRegionId(), date, date).subscribe({
        next: (data) => {
          observer.next(data[0].forecast || data[0].analysis);
          observer.complete();
        },
        error: () => {
          console.error("Danger source variants status could not be loaded!");
          observer.next(false);
          observer.complete();
        },
      });
    });
  }

  getStatus(region: string, startDate: [Date, Date], endDate: [Date, Date]) {
    const schema = z
      .object({
        date: z.coerce.date(),
        forecast: z.boolean(),
        analysis: z.boolean(),
      })
      .array();
    const url = this.constantsService.getServerUrl(
      "/danger-sources/status",
      ["startDate", this.constantsService.getISOStringWithTimezoneOffset(startDate[0])],
      ["endDate", this.constantsService.getISOStringWithTimezoneOffset(endDate[0])],
      ["region", region],
    );
    return this.http.get(url).pipe(map((o) => schema.parse(o)));
  }

  getActiveDate(): [Date, Date] {
    return this.activeDate;
  }

  setActiveDate(date: [Date, Date]) {
    this.activeDate = date;
  }

  getValidFromUntil(date: Date): [Date, Date] {
    const validFrom = new Date(date);
    validFrom.setTime(validFrom.getTime() - 7 * 60 * 60 * 1000);
    const validUntil = new Date(date);
    validUntil.setTime(validUntil.getTime() + 17 * 60 * 60 * 1000);
    return [validFrom, validUntil];
  }

  hasBeenPublished5PM(date: [Date, Date]): boolean {
    // date[0] = validFrom = 17:00 = published at
    const published = date[0];
    return Date.now() >= published.getTime();
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

  getDangerSourceVariantType() {
    if (this.hasBeenPublished5PM(this.activeDate)) {
      return DangerSourceVariantType.analysis;
    } else {
      return DangerSourceVariantType.forecast;
    }
  }

  loadDangerSources(date: [Date, Date], region: string): Observable<DangerSourceModel[]> {
    const url = this.constantsService.getServerUrl(
      "/danger-sources",
      ["date", date ? this.constantsService.getISOStringWithTimezoneOffset(date[0]) : ""],
      ["region", region],
    );
    return this.http.get<unknown>(url).pipe(
      map((ss) =>
        DangerSourceSchema.array()
          .parse(ss)
          .map((s) => DangerSourceModel.parse(s)),
      ),
    );
  }

  saveDangerSource(dangerSource: DangerSourceModel) {
    const url = this.constantsService.getServerUrl("/danger-sources");
    const body = JSON.stringify(dangerSource);
    return this.http.post<unknown>(url, body).pipe(map((s) => DangerSourceModel.parse(s)));
  }

  loadDangerSourceVariants(
    date: [Date, Date],
    region: string,
    dangerSourceId?: string,
  ): Observable<DangerSourceVariantModel[]> {
    let url;
    if (dangerSourceId && dangerSourceId !== "") {
      url = this.constantsService.getServerUrl(
        `/danger-sources/${dangerSourceId}/edit`,
        ["date", this.constantsService.getISOStringWithTimezoneOffset(date[0])],
        ["region", region],
      );
    } else {
      url = this.constantsService.getServerUrl(
        "/danger-sources/edit",
        ["date", this.constantsService.getISOStringWithTimezoneOffset(date[0])],
        ["region", region],
      );
    }
    return this.http.get<unknown>(url).pipe(
      map((vs) =>
        DangerSourceVariantSchema.array()
          .parse(vs)
          .map((v) => DangerSourceVariantModel.parse(v)),
      ),
    );
  }

  createDangerSourceVariant(dangerSourceVariant: DangerSourceVariantModel, date: [Date, Date]) {
    const url = this.constantsService.getServerUrl(
      "/danger-sources/variants",
      ["date", this.constantsService.getISOStringWithTimezoneOffset(date[0])],
      ["region", this.authenticationService.getActiveRegionId()],
    );
    const body = JSON.stringify(dangerSourceVariant);
    return this.http.put<unknown>(url, body);
  }

  updateDangerSourceVariant(dangerSourceVariant: DangerSourceVariantModel, date: [Date, Date]) {
    // check if danger source has ID
    const url = this.constantsService.getServerUrl(
      `/danger-sources/variants/${dangerSourceVariant.id}`,
      ["date", this.constantsService.getISOStringWithTimezoneOffset(date[0])],
      ["region", this.authenticationService.getActiveRegionId()],
    );
    const body = JSON.stringify(dangerSourceVariant);
    return this.http.post<unknown>(url, body);
  }

  deleteDangerSourceVariant(variant: DangerSourceVariantModel, date: [Date, Date]) {
    // check if variant has ID
    const url = this.constantsService.getServerUrl(
      `/danger-sources/variants/${variant.id}`,
      ["date", this.constantsService.getISOStringWithTimezoneOffset(date[0])],
      ["region", this.authenticationService.getActiveRegionId()],
    );
    return this.http.delete<unknown>(url);
  }

  saveVariants(variants: DangerSourceVariantModel[], date: [Date, Date]) {
    const url = this.constantsService.getServerUrl(
      "/danger-sources",
      ["date", this.constantsService.getISOStringWithTimezoneOffset(date[0])],
      ["region", this.authenticationService.getActiveRegionId()],
    );
    const body = JSON.stringify(variants);
    return this.http.post<unknown>(url, body);
  }

  emitAccordionChanged(event: AccordionChangeEvent) {
    this.accordionChangedSubject.next(event);
  }
}
