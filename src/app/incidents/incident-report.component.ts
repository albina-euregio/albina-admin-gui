import { AsyncPipe, DatePipe } from "@angular/common";
import {
  Component,
  DestroyRef,
  inject,
  Injector,
  input,
  model,
  OnDestroy,
  OnInit,
  ChangeDetectionStrategy,
} from "@angular/core";
import { takeUntilDestroyed, toObservable } from "@angular/core/rxjs-interop";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute } from "@angular/router";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { AuthenticationService } from "app/providers/authentication-service/authentication.service";
import { uniq } from "es-toolkit";
import { AccordionModule } from "ngx-bootstrap/accordion";
import { BsDropdownModule } from "ngx-bootstrap/dropdown";
import {
  catchError,
  concatMap,
  debounceTime,
  distinctUntilChanged,
  EMPTY,
  forkJoin,
  map,
  Observable,
  of,
  Subject,
  switchMap,
  tap,
} from "rxjs";
import { z } from "zod/v4";

import { GeocodingService } from "../observations/geocoding.service";
import { ConstantsService } from "../providers/constants-service/constants.service";
import { RegionsService } from "../providers/regions-service/regions.service";
import { ZodSchemaFormComponent } from "../shared/zod-schema-form.component";
import { isFieldValid, isVisibleFieldsValid } from "../shared/zod-util";
import { IncidentReportMapService } from "./incident-report-map.service";
import { IncidentService } from "./incident.service";
import * as IncidentModels from "./models/incident-report.model";
import { IncidentReport } from "./models/incident-report.model";

@Component({
  selector: "app-incident-report",
  templateUrl: "incident-report.component.html",
  standalone: true,
  imports: [
    AsyncPipe,
    DatePipe,
    AccordionModule,
    BsDropdownModule,
    FormsModule,
    TranslateModule,
    ZodSchemaFormComponent,
  ],
  changeDetection: ChangeDetectionStrategy.Eager,
  providers: [GeocodingService, IncidentService, IncidentReportMapService],
})
export class IncidentReportComponent implements OnInit, OnDestroy {
  constantsService = inject(ConstantsService);
  authenticationService = inject(AuthenticationService);
  regionsService = inject(RegionsService);
  translateService = inject(TranslateService);
  private incidentService = inject(IncidentService);
  private geocodingService = inject(GeocodingService);
  readonly mapService = inject(IncidentReportMapService);
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);
  private injector = inject(Injector);

  // Server id of the persisted incident, once it has been created.
  private incidentId: string | null = null;
  // used to prevent redundant saves
  private lastSavedData: string | null = null;
  // Status of the automatic server synchronization, exposed for the template.
  saveState: "idle" | "saving" | "saved" | "error" = "idle";
  updatedAt: Date | null = null;

  readonly IncidentModels = IncidentModels;
  readonly JSON = JSON;
  readonly Object = Object;

  readonly disabled = input<boolean>(false);
  readonly labelI18n = "incidentReport.#";
  readonly helpI18n = "incidentReportHelp.#";

  showMandatoryOnly = false;
  displayOnly = false;
  readonly allTabs = [
    { id: "general", label: "incidentReport.generalInformation", schema: IncidentModels.GeneralInformationSchema },
    { id: "bulletin", label: "incidentReport.bulletinInformation", schema: IncidentModels.BulletinInformationSchema },
    { id: "location", label: "incidentReport.locationInformation", schema: IncidentModels.LocationInformationSchema },
    {
      id: "avalanche",
      label: "incidentReport.avalancheInformation",
      schema: IncidentModels.AvalancheInformationSchema,
    },
    { id: "group", label: "incidentReport.personInvolvement" },
    { id: "other-damages", label: "incidentReport.otherDamages", schema: IncidentModels.OtherDamagesSchema },
    { id: "analysis", label: "incidentReport.incidentAnalysis", schema: IncidentModels.IncidentAnalysisSchema },
    { id: "attachments", label: "incidentReport.incidentAttachments" },
  ] as const;

  private _activeTab: (typeof this.allTabs)[number]["id"] = "general";
  get activeTab(): (typeof this.allTabs)[number]["id"] {
    return this._activeTab;
  }
  set activeTab(tab: (typeof this.allTabs)[number]["id"]) {
    this._activeTab = tab;
    if (tab === "location") {
      setTimeout(() => this.mapService.initLocationMap(), 50);
    }
  }

  get prevTab(): (typeof this.allTabs)[number]["id"] {
    const index = this.allTabs.findIndex((tab) => tab.id === this.activeTab);
    return this.allTabs[Math.max(index - 1, 0)].id;
  }

  get nextTab(): (typeof this.allTabs)[number]["id"] {
    const index = this.allTabs.findIndex((tab) => tab.id === this.activeTab);
    return this.allTabs[Math.min(index + 1, this.allTabs.length - 1)].id;
  }

  getValidationStatus(schema: z.ZodObject): "valid" | "invalid" {
    return isVisibleFieldsValid(schema, this.incidentReport() as Record<string, unknown>) ? "valid" : "invalid";
  }

  getTabValidationStatus(tab: (typeof this.allTabs)[number]): "valid" | "invalid" {
    if (tab.id === "group") return this.getGroupValidationStatus();
    return "schema" in tab ? this.getValidationStatus(tab.schema) : "valid";
  }

  getGroupValidationStatus(): "valid" | "invalid" {
    const report = this.incidentReport();
    if (!isFieldValid(IncidentModels.IncidentReportSchema.shape.personInvolvement, report.personInvolvement))
      return "invalid";
    if (
      report.personInvolvement === "Yes" &&
      !(report.groupInformation ?? []).every((g) =>
        isVisibleFieldsValid(IncidentModels.GroupInformationSchema, g as Record<string, unknown>),
      )
    )
      return "invalid";
    return "valid";
  }

  readonly incidentReport = model<IncidentReport>(
    IncidentModels.PartialIncidentReportSchema.parse({
      author: this.authenticationService.getCurrentAuthor()?.email,
      authorAffiliation: this.authenticationService.getCurrentAuthor()?.organization,
      publicAvalancheWarningService: this.authenticationService.getCurrentAuthor()?.organization,
      reportStatus: "Draft",
      groupInformation: [
        {
          anonymousGroupIdentifier: this.translateService.instant("incidentReportUI.groupUnknown"),
        } as IncidentModels.GroupInformation,
      ],
      victimInformation: [],
      attachments: [],
    } satisfies Partial<IncidentReport>) as IncidentReport,
  );

  get involvementsFatalitiesBurials() {
    const groups = this.incidentReport().groupInformation ?? [];
    const victims = this.incidentReport().victimInformation ?? [];
    const caughtOnly = victims.filter(
      (v) => v.caught === "Involved" && (!v.burialDegree || v.burialDegree === "NotBuried"),
    ).length;
    const fullyBuried = victims.filter((v) => v.burialDegree === "FullyBuried").length;
    const partlyBuriedHeadCovered = victims.filter((v) => v.burialDegree === "PartlyBuriedHeadCovered").length;
    const partlyBuriedHeadUncovered = victims.filter((v) => v.burialDegree === "PartlyBuriedHeadUncovered").length;
    const partlyBuried = victims.filter((v) => v.burialDegree === "PartlyBuried").length;
    return IncidentModels.InvolvementsFatalitiesBurialsSchema.parse({
      numberOfGroups: groups.length,
      numberInvolved: caughtOnly + fullyBuried + partlyBuriedHeadCovered + partlyBuriedHeadUncovered + partlyBuried,
      incidentActivity: uniq(groups.map((g) => g.incidentActivity).filter(Boolean)),
      incidentTerrainType: uniq(groups.map((g) => g.incidentTerrainType).filter(Boolean)),
      fatalities: victims.filter((v) => v.fatalInjured === "Fatal").length,
      injuredSurvivors: victims.filter((v) => v.fatalInjured === "Injured").length,
      uninjuredSurvivors: victims.filter((v) => v.fatalInjured === "Uninjured").length,
      caughtOnly,
      fullyBuried,
      partlyBuriedHeadCovered,
      partlyBuriedHeadUncovered,
      partlyBuried,
    } satisfies z.infer<typeof IncidentModels.InvolvementsFatalitiesBurialsSchema>);
  }

  newGroupInformation() {
    const anonymousGroupIdentifier = this.translateService.instant("incidentReportUI.groupName", {
      name: Math.random(),
    });
    const groupInformation = { anonymousGroupIdentifier: anonymousGroupIdentifier } as IncidentModels.GroupInformation;
    const report = this.incidentReport();
    const groups = [...(report.groupInformation ?? []), groupInformation];
    this.incidentReport.set({ ...report, groupInformation: groups });
    this.activeGroupIndex = groups.length - 1;
  }

  removeGroupInformation(index: number) {
    if (index === 0) return;
    const message = this.translateService.instant("incidentReportUI.dropGroup", { number: index + 1 });
    if (!confirm(message)) return;
    const report = this.incidentReport();
    const groups = (report.groupInformation ?? []).filter((_, i) => i !== index);
    this.incidentReport.set({ ...report, groupInformation: groups });
    if (this.activeGroupIndex >= groups.length) {
      this.activeGroupIndex = groups.length - 1;
    }
  }

  updateGroupInformation(index: number, updatedGroup: IncidentModels.GroupInformation) {
    const report = this.incidentReport();
    const groups = (report.groupInformation ?? []).map((g, i) => (i === index ? updatedGroup : g));
    this.incidentReport.set({ ...report, groupInformation: groups });
  }

  activeGroupSubTab: "overview" | "groups" | "victims" = "overview";
  activeGroupIndex = 0;
  activeVictimIndex = 0;

  isGroupValid(group: IncidentModels.GroupInformation): boolean {
    return isVisibleFieldsValid(IncidentModels.GroupInformationSchema, group as Record<string, unknown>);
  }

  collapsedAttachments: Record<string, boolean> = {};

  toggleAttachmentCollapse(fileName: string) {
    this.collapsedAttachments[fileName] = !this.collapsedAttachments[fileName];
  }

  isAttachmentCollapsed(fileName: string): boolean {
    return !!this.collapsedAttachments[fileName];
  }

  isAttachmentValid(attachment: any): boolean {
    return IncidentModels.IncidentAttachmentSchema.safeParse(attachment).success;
  }

  newVictimInformation() {
    const anonymousVictimIdentifier = this.translateService.instant("incidentReportUI.victimName", {
      name: Math.random(),
    });
    const victimInformation = { anonymousVictimIdentifier } as IncidentModels.VictimInformation;
    const report = this.incidentReport();
    const victims = [...(report.victimInformation ?? []), victimInformation];
    this.incidentReport.set({ ...report, victimInformation: victims });
    this.activeVictimIndex = victims.length - 1;
  }

  removeVictimInformation(index: number) {
    const message = this.translateService.instant("incidentReportUI.dropVictim", { number: index + 1 });
    if (!confirm(message)) return;
    const report = this.incidentReport();
    const victims = (report.victimInformation ?? []).filter((_, i) => i !== index);
    this.incidentReport.set({ ...report, victimInformation: victims });
    if (this.activeVictimIndex >= victims.length) {
      this.activeVictimIndex = Math.max(0, victims.length - 1);
    }
  }

  updateVictimInformation(index: number, updatedVictim: IncidentModels.VictimInformation) {
    const report = this.incidentReport();
    const victims = (report.victimInformation ?? []).map((v, i) => (i === index ? updatedVictim : v));
    this.incidentReport.set({ ...report, victimInformation: victims });
  }

  isVictimValid(victim: IncidentModels.VictimInformation): boolean {
    return isVisibleFieldsValid(IncidentModels.VictimInformationSchema, victim as Record<string, unknown>);
  }

  get groupIdentifiers(): string[] {
    return this.incidentReport().groupInformation?.map((g) => g.anonymousGroupIdentifier) ?? [];
  }

  get hasPointData(): boolean {
    const report = this.incidentReport();
    return report.latitude != null || report.longitude != null;
  }

  get hasLineData(): boolean {
    return !!this.incidentReport().lineCoordinatesText?.trim();
  }

  get hasPolygonData(): boolean {
    return !!this.incidentReport().polygonCoordinatesText?.trim();
  }

  private _lastLat: number | null | undefined;
  private _lastLng: number | null | undefined;
  private readonly reverseGeocodeTrigger$ = new Subject<[number, number]>();

  ngOnInit() {
    this.mapService.init({
      incidentReport: this.incidentReport,
      disabled: () => this.disabled(),
      isActive: () => this.activeTab === "location",
      onPointChange: (lat, lng) => {
        this._lastLat = lat;
        this._lastLng = lng;
        this.reverseGeocodeTrigger$.next([lat, lng]);
      },
    });
    if (this.activeTab === "location") {
      setTimeout(() => this.mapService.initLocationMap(), 50);
    }
    const id = this.route.snapshot.paramMap.get("id");
    if (id) {
      this.loadIncident(id);
    }
    this.startAutoSave();
    this.reverseGeocodeTrigger$
      .pipe(
        debounceTime(800),
        switchMap(([lat, lng]) =>
          forkJoin({
            addr: this.geocodingService.reverseGeocode(lat, lng).pipe(catchError(() => of(null))),
            regionId: this.regionsService.findRegionForCoordinates(lat, lng).pipe(catchError(() => of(null))),
          }),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(({ addr, regionId }) => {
        this.incidentReport.update((r) => ({
          ...r,
          ...(addr && {
            country: addr.country ?? r.country,
            region: addr.state ?? r.region,
            municipality: addr.municipality ?? addr.city ?? addr.town ?? addr.village ?? r.municipality,
          }),
          ...(regionId && { avalancheRegion: regionId }),
        }));
      });
  }

  private loadIncident(id: string) {
    this.incidentService.getIncident(id).subscribe({
      next: (report) => {
        this.incidentId = report.id;
        this.updatedAt = new Date(report.updatedAt);
        this.incidentReport.set(report);
        this._lastLat = report.latitude;
        this._lastLng = report.longitude;
      },
      error: (error) => console.error("Failed to load incident", error),
    });
  }

  private startAutoSave() {
    this.lastSavedData = this.serializeReport(this.incidentReport());
    toObservable(this.incidentReport, { injector: this.injector })
      .pipe(
        map((report) => this.serializeReport(report)),
        distinctUntilChanged(),
        debounceTime(1000),
        concatMap((data) => this.saveIncident(data)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  /** Serialize the report to JSON, dropping in-memory-only attachment fields. */
  private serializeReport(report: IncidentReport): string {
    return JSON.stringify(report, (key, value) => (key === "file" || key === "$previewUrl" ? undefined : value));
  }

  private saveIncident(data: string): Observable<unknown> {
    if (data === this.lastSavedData) return EMPTY;
    const region = this.authenticationService.getActiveRegionId();
    if (!region) return EMPTY;
    this.saveState = "saving";
    const request = this.incidentId
      ? this.incidentService.updateIncident(this.incidentId, data)
      : this.incidentService.createIncident(region, data);
    return request.pipe(
      tap((view) => {
        this.incidentId = view.id;
        this.updatedAt = new Date(view.updatedAt);
        this.lastSavedData = data;
        this.saveState = "saved";
      }),
      catchError((error) => {
        console.error("Failed to save incident", error);
        this.saveState = "error";
        return EMPTY;
      }),
    );
  }

  ngOnDestroy() {
    Object.values(this.attachments).forEach(async (url) => URL.revokeObjectURL(await url));
  }

  onReportStatusChange() {
    const currentAuthor = this.authenticationService.getCurrentAuthor();
    this.incidentReport.set({
      ...this.incidentReport(),
      author: currentAuthor?.email ?? this.incidentReport().author,
      authorAffiliation: currentAuthor?.organization ?? this.incidentReport().authorAffiliation,
    });
  }

  onLocationFormChange(updatedReport: IncidentReport) {
    this.incidentReport.set({ ...updatedReport });
    this.mapService.drawOnMap();
    if (
      (updatedReport.latitude !== this._lastLat || updatedReport.longitude !== this._lastLng) &&
      updatedReport.latitude != null &&
      updatedReport.longitude != null
    ) {
      this.reverseGeocodeTrigger$.next([updatedReport.latitude, updatedReport.longitude]);
    }
    this._lastLat = updatedReport.latitude;
    this._lastLng = updatedReport.longitude;
  }

  onLatLngInputChange() {
    const report = this.incidentReport();
    if (report.latitude != null) report.latitude = Number(report.latitude);
    if (report.longitude != null) report.longitude = Number(report.longitude);
    this.incidentReport.set({ ...report });
    this.mapService.drawOnMap();
  }

  onLineCoordinatesTextChange(text: string) {
    const report = this.incidentReport();
    report.lineCoordinatesText = text;
    this.incidentReport.set({ ...report });
    this.mapService.drawOnMap();
  }

  onPolygonCoordinatesTextChange(text: string) {
    const report = this.incidentReport();
    report.polygonCoordinatesText = text;
    this.incidentReport.set({ ...report });
    this.mapService.drawOnMap();
  }

  clearPoint() {
    const report = this.incidentReport();
    report.latitude = null;
    report.longitude = null;
    report.locationAccuracy = null;
    this.incidentReport.set({ ...report });
    this.mapService.drawOnMap();
  }

  clearLine() {
    const report = this.incidentReport();
    report.lineCoordinatesText = "";
    this.incidentReport.set({ ...report });
    this.mapService.drawOnMap();
  }

  clearPolygon() {
    const report = this.incidentReport();
    report.polygonCoordinatesText = "";
    this.incidentReport.set({ ...report });
    this.mapService.drawOnMap();
  }

  clearAllDrawing() {
    const report = this.incidentReport();
    report.latitude = null;
    report.longitude = null;
    report.locationAccuracy = null;
    report.lineCoordinatesText = "";
    report.polygonCoordinatesText = "";
    this.incidentReport.set({ ...report });
    this.mapService.drawOnMap();
  }

  async uploadIncidentAttachment($event: Event) {
    const input = $event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = "";
    console.log();
    if (!file) {
      return;
    }
    const attachment0: IncidentModels.IncidentAttachment = {
      dateAdded: new Date(),
      dateCreated: undefined as unknown as Date,
      file,
      fileName: file.name,
      mediaType: file.type,
      credit: "",
    };
    const attachment = await this.incidentService.uploadIncidentAttachment(this.incidentId, attachment0).toPromise();
    this.attachments[attachment.id] = Promise.resolve(URL.createObjectURL(file));
    const attachments = this.incidentReport().attachments ?? [];
    attachments.push(attachment);
    this.incidentReport.set({ ...this.incidentReport(), attachments });
  }

  updateAttachment(index: number, updatedAttachment: z.infer<typeof IncidentModels.IncidentAttachmentSchema>) {
    const attachments = this.incidentReport().attachments ?? [];
    attachments.splice(index, 1, updatedAttachment);
    this.incidentReport.set({ ...this.incidentReport(), attachments });
  }

  async removeAttachment(index: number) {
    const attachments = this.incidentReport().attachments;
    const message = this.translateService.instant("incidentReportUI.dropAttachment", {
      fileName: attachments[index].fileName,
    });
    if (!confirm(message)) return;
    const attachment = attachments[index];
    await this.incidentService.deleteIncidentAttachment(this.incidentId, attachment).toPromise();
    this.attachments[attachment.id]?.then((url) => URL.revokeObjectURL(url));
    attachments.splice(index, 1);
    this.incidentReport.set({ ...this.incidentReport(), attachments });
  }

  attachments: Record<IncidentModels.IncidentAttachment["id"], Promise<ReturnType<typeof URL.createObjectURL>>> = {};

  getAttachmentPreviewUrl(
    attachment: IncidentModels.IncidentAttachment,
  ): Promise<ReturnType<typeof URL.createObjectURL>> {
    if (!attachment?.id) return;
    if (!attachment.mediaType?.startsWith("image/")) return;
    return (this.attachments[attachment.id] ??= this.incidentService
      .getIncidentAttachment(this.incidentId, attachment)
      .toPromise()
      .then((blob) => {
        const typedBlob = new Blob([blob], { type: attachment.mediaType });
        return URL.createObjectURL(typedBlob);
      }));
  }
}
