import { inject, Injectable } from "@angular/core";
import { from, Observable, Subject } from "rxjs";
import { map } from "rxjs/operators";
import { z } from "zod/v4";

import { SourceDates } from "../models/SourceDates";
import * as albinaApi from "../providers/albina-api";
import { AuthenticationService } from "../providers/authentication-service/authentication.service";
import { ConstantsService } from "../providers/constants-service/constants.service";
import { UndoRedoState } from "../providers/undo-redo-service/undo-redo.service";
import { DangerSourceVariantModel, DangerSourceVariantSchema } from "./models/danger-source-variant.model";
import { DangerSourceModel, DangerSourceSchema } from "./models/danger-source.model";

export type AccordionGroupName =
  | "glide"
  | "loose"
  | "slab"
  | "weakLayer"
  | "matrix"
  | "characteristics"
  | "comment"
  | "uncertainties";

interface AccordionChangeEvent {
  isOpen: boolean;
  groupName: AccordionGroupName;
}

@Injectable({ providedIn: "root" })
export class DangerSourcesService {
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
    return from(
      albinaApi.getInternalStatus1({
        query: {
          startDate: this.constantsService.getISOStringWithTimezoneOffset(startDate[0]),
          endDate: this.constantsService.getISOStringWithTimezoneOffset(endDate[0]),
          region: region,
        },
        throwOnError: true,
      }),
    ).pipe(map((res) => schema.parse(res.data)));
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

  loadDangerSources(date: [Date, Date], region: string): Observable<DangerSourceModel[]> {
    return from(
      albinaApi.getDangerSources({
        query: {
          date: date ? this.constantsService.getISOStringWithTimezoneOffset(date[0]) : "",
          region: region,
        },
        throwOnError: true,
      }),
    ).pipe(
      map((res) =>
        DangerSourceSchema.array()
          .parse(res.data)
          .map((s) => DangerSourceModel.parse(s)),
      ),
    );
  }

  saveDangerSource(dangerSource: DangerSourceModel) {
    return from(
      albinaApi.saveDangerSource({ body: dangerSource as unknown as albinaApi.DangerSource, throwOnError: true }),
    ).pipe(map((res) => DangerSourceModel.parse(res.data)));
  }

  loadDangerSourceVariants(
    date: [Date, Date | undefined],
    region: string,
    dangerSourceId?: string,
  ): Observable<DangerSourceVariantModel[]> {
    const request =
      dangerSourceId && dangerSourceId !== ""
        ? albinaApi.getVariantsForDangerSource({
            path: { dangerSourceId },
            query: { date: this.constantsService.getISOStringWithTimezoneOffset(date[0]), region },
            throwOnError: true,
          })
        : albinaApi.getVariants({
            query: { date: this.constantsService.getISOStringWithTimezoneOffset(date[0]), region },
            throwOnError: true,
          });
    return from(request).pipe(
      map((res) =>
        DangerSourceVariantSchema.array()
          .parse(res.data)
          .map((v) => DangerSourceVariantModel.parse(v)),
      ),
    );
  }

  saveDangerSourceVariant(
    dangerSourceVariant: DangerSourceVariantModel,
    date: [Date, Date],
  ): Observable<DangerSourceVariantModel> {
    return from(
      albinaApi.saveDangerSourceVariant({
        query: {
          date: this.constantsService.getISOStringWithTimezoneOffset(date[0]),
          region: this.authenticationService.getActiveRegionId(),
        },
        body: dangerSourceVariant as unknown as albinaApi.DangerSourceVariant,
        throwOnError: true,
      }),
    ).pipe(map((res) => DangerSourceVariantModel.parse(res.data)));
  }

  deleteDangerSourceVariant(variant: DangerSourceVariantModel, date: [Date, Date]) {
    // check if variant has ID
    return from(
      albinaApi.deleteVariant({
        path: { variantId: variant.id! },
        query: {
          date: this.constantsService.getISOStringWithTimezoneOffset(date[0]),
          region: this.authenticationService.getActiveRegionId(),
        },
        throwOnError: true,
      }),
    ).pipe(map((res) => res.data));
  }

  replaceVariants(variants: DangerSourceVariantModel[], date: [Date, Date]) {
    return from(
      albinaApi.replaceVariants({
        query: {
          date: this.constantsService.getISOStringWithTimezoneOffset(date[0]),
          region: this.authenticationService.getActiveRegionId(),
        },
        body: variants as unknown as albinaApi.DangerSourceVariant[],
        throwOnError: true,
      }),
    ).pipe(map((res) => res.data));
  }

  emitAccordionChanged(event: AccordionChangeEvent) {
    this.accordionChangedSubject.next(event);
  }
}
