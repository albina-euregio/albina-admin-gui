import { AuthenticationService } from "../providers/authentication-service/authentication.service";
import { ConstantsService } from "../providers/constants-service/constants.service";
import { UndoRedoState } from "../providers/undo-redo-service/undo-redo.service";
import {
  DangerSourceVariantModel,
  DangerSourceVariantSchema,
  DangerSourceVariantType,
} from "./models/danger-source-variant.model";
import { DangerSourceModel, DangerSourceSchema } from "./models/danger-source.model";
import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Observable, Subject } from "rxjs";
import { map } from "rxjs/operators";
import { z } from "zod/v4";
import { SourceDates } from "../models/SourceDates";

interface AccordionChangeEvent {
  isOpen: boolean;
  groupName: string;
}

@Injectable()
export class DangerSourcesService {
  http = inject(HttpClient);
  private constantsService = inject(ConstantsService);
  private authenticationService = inject(AuthenticationService);

  private isEditable: boolean;
  private isReadOnly: boolean;

  public forecastStatusMap: Map<number, boolean>;
  public analysisStatusMap: Map<number, boolean>;
  public readonly sourceDates = new SourceDates();

  private accordionChangedSubject = new Subject<AccordionChangeEvent>(); // used to synchronize accordion between compared variants
  accordionChanged$: Observable<AccordionChangeEvent> = this.accordionChangedSubject.asObservable();

  readonly undoRedo = new UndoRedoState<DangerSourceVariantModel>(
    (bulletin) => bulletin,
    (json) => DangerSourceVariantModel.parse(json),
  );

  constructor() {
    this.init();
  }

  init({ days } = { days: 10 }) {
    this.isEditable = false;
    this.isReadOnly = false;
    this.sourceDates.init(days);
    this.loadStatus();
  }

  public loadStatus() {
    const { startDate, endDate } = this.sourceDates.getLoadDate();
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
    const url = this.constantsService.getServerUrlGET("/danger-sources/status", {
      startDate: this.constantsService.getISOStringWithTimezoneOffset(startDate[0]),
      endDate: this.constantsService.getISOStringWithTimezoneOffset(endDate[0]),
      region: region,
    });
    return this.http.get(url).pipe(map((o) => schema.parse(o)));
  }

  hasBeenPublished5PM(date: [Date, Date]): boolean {
    // date[0] = validFrom = 17:00 = published at
    const published = date[0];
    return Date.now() >= published.getTime();
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
    if (this.hasBeenPublished5PM(this.sourceDates.activeDate)) {
      return DangerSourceVariantType.analysis;
    } else {
      return DangerSourceVariantType.forecast;
    }
  }

  loadDangerSources(date: [Date, Date], region: string): Observable<DangerSourceModel[]> {
    const url = this.constantsService.getServerUrlGET("/danger-sources", {
      date: date ? this.constantsService.getISOStringWithTimezoneOffset(date[0]) : "",
      region: region,
    });
    return this.http.get<unknown>(url).pipe(
      map((ss) =>
        DangerSourceSchema.array()
          .parse(ss)
          .map((s) => DangerSourceModel.parse(s)),
      ),
    );
  }

  saveDangerSource(dangerSource: DangerSourceModel) {
    const url = this.constantsService.getServerUrlPOST("/danger-sources");
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
      url = this.constantsService.getServerUrlGET(
        `/danger-sources/{dangerSourceId}/edit`,
        {
          date: this.constantsService.getISOStringWithTimezoneOffset(date[0]),
          region: region,
        },
        {
          dangerSourceId,
        },
      );
    } else {
      url = this.constantsService.getServerUrlGET("/danger-sources/edit", {
        date: this.constantsService.getISOStringWithTimezoneOffset(date[0]),
        region: region,
      });
    }
    return this.http.get<unknown>(url).pipe(
      map((vs) =>
        DangerSourceVariantSchema.array()
          .parse(vs)
          .map((v) => DangerSourceVariantModel.parse(v)),
      ),
    );
  }

  saveDangerSourceVariant(
    dangerSourceVariant: DangerSourceVariantModel,
    date: [Date, Date],
  ): Observable<DangerSourceVariantModel> {
    const url = this.constantsService.getServerUrlPOST("/danger-sources/variants", {
      date: this.constantsService.getISOStringWithTimezoneOffset(date[0]),
      region: this.authenticationService.getActiveRegionId(),
    });
    const body = JSON.stringify(dangerSourceVariant);
    return this.http.post<unknown>(url, body).pipe(map((v) => DangerSourceVariantModel.parse(v)));
  }

  deleteDangerSourceVariant(variant: DangerSourceVariantModel, date: [Date, Date]) {
    // check if variant has ID
    const url = this.constantsService.getServerUrlDELETE(
      `/danger-sources/variants/{variantId}`,
      {
        date: this.constantsService.getISOStringWithTimezoneOffset(date[0]),
        region: this.authenticationService.getActiveRegionId(),
      },
      { variantId: variant.id },
    );
    return this.http.delete<unknown>(url);
  }

  replaceVariants(variants: DangerSourceVariantModel[], date: [Date, Date]) {
    const url = this.constantsService.getServerUrlPOST("/danger-sources/variants/replace", {
      date: this.constantsService.getISOStringWithTimezoneOffset(date[0]),
      region: this.authenticationService.getActiveRegionId(),
    });
    const body = JSON.stringify(variants);
    return this.http.post<unknown>(url, body);
  }

  emitAccordionChanged(event: AccordionChangeEvent) {
    this.accordionChangedSubject.next(event);
  }
}
