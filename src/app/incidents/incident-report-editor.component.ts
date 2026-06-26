import { AsyncPipe, DatePipe } from "@angular/common";
import {
  Component,
  computed,
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
import { ActivatedRoute, Router } from "@angular/router";
import { TranslatePipe, TranslateService } from "@ngx-translate/core";
import { AuthenticationService } from "app/providers/authentication-service/authentication.service";
import { uniq } from "es-toolkit";
import { AccordionModule } from "ngx-bootstrap/accordion";
import { BsDropdownModule } from "ngx-bootstrap/dropdown";
import { catchError, concatMap, debounceTime, distinctUntilChanged, EMPTY, map, Observable, tap } from "rxjs";
import { z } from "zod/v4";

import { GeocodingService } from "../observations/geocoding.service";
import { ConstantsService } from "../providers/constants-service/constants.service";
import { ToggleBtnGroup } from "../shared/toggle-btn-group";
import { DisplayMode, ZodSchemaFormComponent } from "../shared/zod-schema-form.component";
import { isFieldValid, isVisibleFieldsValid, safeParseVisibleFields } from "../shared/zod-util";
import { IncidentReportGeocodeService } from "./incident-report-geocode.service";
import { IncidentReportMapService } from "./incident-report-map.service";
import * as IncidentModels from "./incident-report.model";
import { IncidentReport } from "./incident-report.model";
import { IncidentService } from "./incident.service";

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
    TranslatePipe,
    ToggleBtnGroup,
    ZodSchemaFormComponent,
  ],
  changeDetection: ChangeDetectionStrategy.Eager,
  providers: [GeocodingService, IncidentService, IncidentReportMapService, IncidentReportGeocodeService],
})
export class IncidentReportComponent implements OnInit, OnDestroy {
  constantsService = inject(ConstantsService);
  authenticationService = inject(AuthenticationService);
  translateService = inject(TranslateService);
  private incidentService = inject(IncidentService);
  readonly mapService = inject(IncidentReportMapService);
  private geocodeService = inject(IncidentReportGeocodeService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private injector = inject(Injector);

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
  readonly DisplayMode = DisplayMode;
  displayMode = DisplayMode.Edit;

  /** True for any read-only preview mode; gates the print/preview layout in the template. */
  get displayOnly(): boolean {
    return this.displayMode !== DisplayMode.Edit;
  }
  /** Tabs visible to the current user; the analysis tab is forecaster-only. */
  get allTabs() {
    return [
      { id: "general", label: "incidentReport.generalInformation", schema: IncidentModels.GeneralInformationSchema },
      { id: "bulletin", label: "incidentReport.bulletinInformation", schema: IncidentModels.BulletinInformationSchema },
      {
        id: "avalanche",
        label: "incidentReport.avalancheInformation",
        schema: IncidentModels.AvalancheInformationSchema,
      },
      { id: "group", label: "incidentReport.personInvolvement" },
      { id: "other-damages", label: "incidentReport.otherDamages", schema: IncidentModels.OtherDamagesSchema },
      // The incident analysis is forecaster-only.
      ...(this.userCan("VIEW_ANALYSIS")
        ? ([
            { id: "analysis", label: "incidentReport.incidentAnalysis", schema: IncidentModels.IncidentAnalysisSchema },
          ] as const)
        : ([] as const)),
      { id: "attachments", label: "incidentReport.incidentAttachments" },
    ] as const;
  }

  private _activeTab: (typeof this.allTabs)[number]["id"] = "general";
  get activeTab(): (typeof this.allTabs)[number]["id"] {
    return this._activeTab;
  }
  set activeTab(tab: (typeof this.allTabs)[number]["id"]) {
    this._activeTab = tab;
    if (tab === "general") {
      setTimeout(() => this.mapService.initLocationMap(), 50);
    }
  }

  get prevTab(): (typeof this.allTabs)[number]["id"] {
    const tabs = this.allTabs;
    const index = tabs.findIndex((tab) => tab.id === this.activeTab);
    return tabs[Math.max(index - 1, 0)].id;
  }

  get nextTab(): (typeof this.allTabs)[number]["id"] {
    const tabs = this.allTabs;
    const index = tabs.findIndex((tab) => tab.id === this.activeTab);
    return tabs[Math.min(index + 1, tabs.length - 1)].id;
  }

  /**
   * Whether the current user may perform a report action, combining role and report status.
   */
  userCan(
    op:
      | "DELETE"
      | "PUBLISH"
      | "REPUBLISH"
      | "UNPUBLISH"
      | "CHANGE_STATUS"
      | "CHANGE_STATUS_TO_REVIEW"
      | "CHANGE_STATUS_TO_VERIFIED"
      | "VIEW_ANALYSIS",
    reportStatus = this.incidentReport().reportStatus,
  ): boolean {
    const isForecaster = this.authenticationService.isCurrentUserInRole("FORECASTER");
    const inReview = reportStatus === "InReview" || reportStatus === "Verified";
    const isPublished = !!this.incidentReport().publishedAt;
    switch (op) {
      case "PUBLISH":
        return isForecaster && reportStatus !== "Draft" && this.isReportValid() && !isPublished;
      case "REPUBLISH":
        return isForecaster && reportStatus !== "Draft" && this.isReportValid() && isPublished;
      case "UNPUBLISH":
        return isForecaster && isPublished;
      case "CHANGE_STATUS":
        return isForecaster || !inReview;
      case "CHANGE_STATUS_TO_REVIEW":
        return isForecaster;
      case "CHANGE_STATUS_TO_VERIFIED":
        return isForecaster;
      case "VIEW_ANALYSIS":
        return isForecaster;
      case "DELETE":
        return isForecaster || inReview;
    }
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

  /**
   * True when the full (non-partial) report schema parses successfully, i.e. no required field is
   * missing. While invalid, the report stays a "Draft" and cannot be published.
   *
   * FIXME: this parses against the raw schema and ignores `showIf` visibility. Fields that are
   * required but hidden in some configurations — `dangerRating`, `avalancheProblem` and
   * `dangerPattern`, which are hidden when `publicAvalancheWarningServiceOutside` is set — must
   * still be filled in for the report to count as valid here.
   */
  readonly reportSafeParseVisibleFields = computed(() =>
    safeParseVisibleFields(IncidentModels.IncidentReportSchema, this.incidentReport()),
  );
  readonly isReportValid = computed(() => this.reportSafeParseVisibleFields().success);
  readonly reportPrettyError = computed(() =>
    this.reportSafeParseVisibleFields().error ? z.prettifyError(this.reportSafeParseVisibleFields().error) : "",
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

  ngOnInit() {
    this.geocodeService.init({ incidentReport: this.incidentReport });
    this.mapService.init({
      incidentReport: this.incidentReport,
      disabled: () => this.disabled(),
      isActive: () => this.activeTab === "general",
      onPointChange: (lat, lng) => this.geocodeService.reverseGeocode(lat, lng),
    });
    if (this.activeTab === "general") {
      setTimeout(() => this.mapService.initLocationMap(), 50);
    }
    const id = this.route.snapshot.paramMap.get("id");
    if (id) {
      this.loadIncident(id);
    }
    this.startAutoSave();
  }

  private loadIncident(id: string) {
    this.incidentService.getIncident(id).subscribe({
      next: (report) => {
        this.updatedAt = new Date(report.updatedAt);
        this.incidentReport.set(report);
        this.geocodeService.setLastPoint(report.latitude, report.longitude);
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

  /**
   * Serialize the report to JSON, dropping in-memory-only attachment fields and
   * the server-managed top-level `id` (the latter so that folding the assigned
   * id back into the report after a create does not register as an edit and
   * trigger a redundant save).
   */
  private serializeReport(report: Partial<IncidentReport>): string {
    return JSON.stringify({ ...report, id: undefined }, (key, value) =>
      key === "file" || key === "$previewUrl" ? undefined : value,
    );
  }

  private saveIncident(data: string): Observable<unknown> {
    if (data === this.lastSavedData) return EMPTY;
    const region = this.authenticationService.getActiveRegionId();
    if (!region) return EMPTY;
    this.saveState = "saving";
    const id = this.incidentReport().id;
    const request = id
      ? this.incidentService.updateIncident(id, data)
      : this.incidentService.createIncident(region, data);
    return request.pipe(
      tap((view) => {
        this.updatedAt = new Date(view.updatedAt);
        this.lastSavedData = data;
        this.saveState = "saved";
        // Fold the server-assigned id into the report so it is the single source
        // of truth for subsequent saves, attachments, publishing, etc.
        if (this.incidentReport().id !== view.id) {
          this.incidentReport.update((report) => ({ ...report, id: view.id }));
        }
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
    this.geocodeService.reverseGeocodeIfChanged(updatedReport.latitude, updatedReport.longitude);
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
    const attachment = await this.incidentService
      .uploadIncidentAttachment(this.incidentReport().id, attachment0)
      .toPromise();
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
    await this.incidentService.deleteIncidentAttachment(this.incidentReport().id, attachment).toPromise();
    this.attachments[attachment.id]?.then((url) => URL.revokeObjectURL(url));
    attachments.splice(index, 1);
    this.incidentReport.set({ ...this.incidentReport(), attachments });
  }

  deleteIncident() {
    if (!this.userCan("DELETE")) return;
    const message = this.translateService.instant("incidentReportUI.deleteIncidentConfirm");
    if (!confirm(message)) return;
    this.incidentService.deleteIncident(this.incidentReport().id).subscribe({
      next: () => this.router.navigate(["/incidents"]),
      error: (error) => console.error("Incident could not be deleted!", error),
    });
  }

  async publishIncident(confirmMessageKey: string) {
    if (!this.userCan("PUBLISH") && !this.userCan("REPUBLISH")) return;
    if (!confirm(this.translateService.instant(confirmMessageKey))) return;
    const publicReport = IncidentModels.toPublicIncidentReport(this.incidentReport());
    console.info("Publishing report", publicReport);
    const data = this.serializeReport(publicReport);
    const report = await this.incidentService.publishIncident(this.incidentReport().id, data).toPromise();
    this.incidentReport.set(report);
    alert(this.translateService.instant("incidentReportUI.publishIncidentSuccess"));
  }

  async unpublishIncident() {
    if (!this.userCan("UNPUBLISH")) return;
    if (!confirm(this.translateService.instant("incidentReportUI.unpublishIncidentConfirm"))) return;
    await this.incidentService.unpublishIncident(this.incidentReport().id).toPromise();
    this.incidentReport.update((report) => ({ ...report, publishedAt: undefined }));
    alert(this.translateService.instant("incidentReportUI.unpublishIncidentSuccess"));
  }

  attachments: Record<IncidentModels.IncidentAttachment["id"], Promise<ReturnType<typeof URL.createObjectURL>>> = {};

  getAttachmentPreviewUrl(
    attachment: IncidentModels.IncidentAttachment,
  ): Promise<ReturnType<typeof URL.createObjectURL>> {
    if (!attachment?.id) return;
    if (!attachment.mediaType?.startsWith("image/")) return;
    return (this.attachments[attachment.id] ??= this.incidentService
      .getIncidentAttachment(this.incidentReport().id, attachment)
      .toPromise()
      .then((blob) => {
        const typedBlob = new Blob([blob], { type: attachment.mediaType });
        return URL.createObjectURL(typedBlob);
      }));
  }
}
