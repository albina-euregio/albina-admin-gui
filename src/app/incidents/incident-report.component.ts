import { AsyncPipe, DatePipe, Location } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  Injector,
  input,
  model,
  OnDestroy,
  OnInit,
} from "@angular/core";
import { takeUntilDestroyed, toObservable } from "@angular/core/rxjs-interop";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { TranslatePipe, TranslateService } from "@ngx-translate/core";
import { AuthenticationService } from "app/providers/authentication-service/authentication.service";
import { AccordionModule } from "ngx-bootstrap/accordion";
import { BsDropdownModule } from "ngx-bootstrap/dropdown";
import { catchError, concatMap, debounceTime, distinctUntilChanged, EMPTY, map, Observable, tap } from "rxjs";
import { z } from "zod/v4";

import { ToggleBtnGroup } from "../shared/toggle-btn-group";
import { DisplayMode, isEditableDisplayMode, ZodSchemaFormComponent } from "../shared/zod-schema-form.component";
import { IncidentReportEditorComponent } from "./incident-report-editor.component";
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
    IncidentReportEditorComponent,
  ],
  changeDetection: ChangeDetectionStrategy.Eager,
  providers: [IncidentService],
})
export class IncidentReportComponent implements OnInit, OnDestroy {
  authenticationService = inject(AuthenticationService);
  translateService = inject(TranslateService);
  private incidentService = inject(IncidentService);
  private location = inject(Location);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private injector = inject(Injector);

  // used to prevent redundant saves
  private lastSavedData: string | null = null;
  // Status of the automatic server synchronization, exposed for the template.
  // "blocked" means the report has missing required fields and is not persisted.
  saveState: "idle" | "saving" | "saved" | "error" | "blocked" = "idle";
  updatedAt: Date | null = null;

  readonly IncidentModels = IncidentModels;
  readonly JSON = JSON;
  readonly Object = Object;
  readonly prettifyError = z.prettifyError;

  readonly disabled = input<boolean>(false);
  readonly labelI18n = "incidentReport.#";
  readonly helpI18n = "incidentReportHelp.#";

  readonly DisplayMode = DisplayMode;
  displayMode = DisplayMode.Edit;

  /** True for any read-only preview mode; gates the print/preview layout in the template. */
  get displayOnly(): boolean {
    return !isEditableDisplayMode(this.displayMode);
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

  activeTab: (typeof this.allTabs)[number]["id"] = "general";

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

  getTabValidationStatus(tab: (typeof this.allTabs)[number]): z.ZodSafeParseResult<unknown> {
    if (tab.id === "group") {
      return this.getGroupValidationStatus();
    }
    if (!("schema" in tab)) {
      return { success: true, data: null };
    }
    return tab.schema.safeParse(this.incidentReport());
  }

  getGroupValidationStatus(): z.ZodSafeParseResult<unknown> {
    const report = this.incidentReport();
    const personInvolvement = IncidentModels.IncidentReportSchema.shape.personInvolvement.safeParse(
      report.personInvolvement,
    );
    if (!personInvolvement.success) {
      return personInvolvement;
    }
    if (report.personInvolvement !== "Yes") {
      return { success: true, data: null };
    }
    return IncidentModels.IncidentReportSchema.shape.groupInformation.safeParse(report.groupInformation);
  }

  readonly incidentReport = model<IncidentReport>(
    IncidentModels.IncidentReportSchema.partial().parse({
      author: this.authenticationService.getCurrentAuthor()?.email,
      authorAffiliation: this.authenticationService.getCurrentAuthor()?.organization,
      publicAvalancheWarningService: this.authenticationService.getCurrentAuthor()?.organization,
      reportStatus: "Draft",
      personInvolvement: "Unknown",
      groupInformation: [
        {
          anonymousGroupIdentifier: this.translateService.instant("incidentReportUI.groupUnknown"),
        } as IncidentModels.GroupInformation,
      ],
      victimInformation: [],
      attachments: [],
    } satisfies Partial<IncidentReport>) as IncidentReport,
  );

  readonly isReportValid = computed(() => IncidentModels.IncidentReportSchema.safeParse(this.incidentReport()).success);

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

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get("id");
    if (id) {
      this.loadIncident(id);
    }
    this.startAutoSave();
  }

  private loadIncident(id: string) {
    this.incidentService.getIncident(id).subscribe({
      next: (report) => {
        this.incidentReport.set(report);
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
   * the server-managed top-level `id` and `updatedAt` (the latter two so that
   * folding the assigned id/timestamp back into the report after a save does not
   * register as an edit and trigger a redundant save).
   */
  private serializeReport(report: Partial<IncidentReport>): string {
    const involvementsFatalitiesBurials = {
      ...IncidentModels.computeInvolvementsFatalitiesBurials(report),
      involvementsFatalitiesBurialsComment: report.involvementsFatalitiesBurials?.involvementsFatalitiesBurialsComment,
    };
    return JSON.stringify(
      { ...report, involvementsFatalitiesBurials, id: undefined, updatedAt: undefined },
      (key, value) => (key === "file" || key === "$previewUrl" ? undefined : value),
    );
  }

  private saveIncident(data: string): Observable<unknown> {
    if (data === this.lastSavedData) return EMPTY;
    // A report with missing required fields must not be persisted; it stays a
    // local draft until completed. Validity is re-checked on the next change.
    if (!this.isReportValid()) {
      this.saveState = "blocked";
      return EMPTY;
    }
    const region = this.authenticationService.getActiveRegionId();
    if (!region) return EMPTY;
    this.saveState = "saving";
    const id = this.incidentReport().id;
    const request = id
      ? this.incidentService.updateIncident(id, data)
      : this.incidentService.createIncident(region, data);
    return request.pipe(
      tap((view) => {
        this.lastSavedData = data;
        this.saveState = "saved";
        // Fold the server-assigned id and updatedAt into the report so it is the
        // single source of truth for subsequent saves, attachments, publishing,
        // etc. Both are dropped from the serialized payload, so this does not
        // register as an edit and trigger a redundant save.
        this.incidentReport.update((report) => ({ ...report, id: view.id, updatedAt: view.updatedAt }));
        // After the first save of a new report, update the URL from /incidents/new
        // to /incidents/{id} so that F5 reloads the same report.
        if (!id) {
          this.location.replaceState(`/incidents/${view.id}`);
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

  async uploadIncidentAttachment($event: Event) {
    const input = $event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = "";
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
