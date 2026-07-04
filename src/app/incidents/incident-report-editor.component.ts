import { ChangeDetectionStrategy, Component, effect, inject, input, model, OnInit, signal } from "@angular/core";
import { TranslatePipe, TranslateService } from "@ngx-translate/core";
import { AvalancheSize } from "app/enums/enums";
import { Bulletin } from "app/models/CAAMLv6";
import { firstValueFrom } from "rxjs";

import { GeocodingService } from "../observations/geocoding.service";
import { DisplayMode, isEditableDisplayMode, ZodSchemaFormComponent } from "../shared/zod-schema-form.component";
import { isVisibleFieldsValid } from "../shared/zod-util";
import { IncidentReportGeocodeService } from "./incident-report-geocode.service";
import { IncidentReportMapService } from "./incident-report-map.service";
import * as IncidentModels from "./incident-report.model";
import { IncidentReport } from "./incident-report.model";
import { IncidentService } from "./incident.service";

/** Ids of the tabs the editor renders; mirrors the parent's tab list. */
export type IncidentReportTab =
  | "general"
  | "bulletin"
  | "avalanche"
  | "group"
  | "other-damages"
  | "analysis"
  | "attachments";

/**
 * Presentational editor for an incident report: renders the per-tab forms, the
 * location map and the group/victim sub-editors, operating purely on the
 * two-way bound {@link incidentReport} signal. It performs no server I/O — the
 * wrapping {@link IncidentReportComponent} owns loading, saving and attachments.
 */
@Component({
  selector: "app-incident-report-editor",
  templateUrl: "incident-report-editor.component.html",
  standalone: true,
  imports: [TranslatePipe, ZodSchemaFormComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
  providers: [GeocodingService, IncidentReportMapService, IncidentReportGeocodeService],
})
export class IncidentReportEditorComponent implements OnInit {
  readonly mapService = inject(IncidentReportMapService);
  private geocodeService = inject(IncidentReportGeocodeService);
  private translateService = inject(TranslateService);
  private incidentService = inject(IncidentService);

  readonly incidentReport = model.required<IncidentReport>();
  readonly disabled = input<boolean>(false);
  readonly displayMode = input<DisplayMode>(DisplayMode.Edit);
  readonly activeTab = input<IncidentReportTab>("general");

  readonly IncidentModels = IncidentModels;
  readonly DisplayMode = DisplayMode;
  readonly labelI18n = "incidentReport.#";
  readonly helpI18n = "incidentReportHelp.#";

  // The general-information form is split into two sections around the location map: the fields
  // above (the location fields) and everything else below.
  private static readonly LOCATION_FIELDS = {
    sourceOfInformation: true,
    dateTime: true,
    timeAccuracy: true,
    location: true,
  } as const;
  readonly GeneralInformationLocationSchema = IncidentModels.GeneralInformationSchema.pick(
    IncidentReportEditorComponent.LOCATION_FIELDS,
  );
  readonly GeneralInformationRestSchema = IncidentModels.GeneralInformationSchema.omit(
    IncidentReportEditorComponent.LOCATION_FIELDS,
  );
  readonly PersonInvolvementSchema = IncidentModels.IncidentReportSchema.pick({ personInvolvement: true });
  readonly InvolvementsWithoutCommentSchema = IncidentModels.InvolvementsFatalitiesBurialsSchema.omit({
    involvementsFatalitiesBurialsComment: true,
  });
  readonly InvolvementsCommentSchema = IncidentModels.InvolvementsFatalitiesBurialsSchema.pick({
    involvementsFatalitiesBurialsComment: true,
  });

  activeGroupSubTab: "overview" | "groups" | "victims" = "overview";
  activeGroupIndex = 0;
  activeVictimIndex = 0;

  /** Result of the last CAAML bulletin fetch, shown as an inline alert next to the button. */
  readonly fetchBulletinResult = signal<{ type: "success" | "danger"; message: string } | null>(null);

  /** Report id the geocoder's last point was last seeded for (see constructor). */
  private geocodeSeededForId: string | null = null;

  /** True for any read-only preview mode; mirrors the parent's display mode. */
  get displayOnly(): boolean {
    return !isEditableDisplayMode(this.displayMode());
  }

  constructor() {
    // (Re-)initialise and fit the map whenever the location tab becomes active;
    // the map element only exists in the DOM while that tab is rendered.
    effect(() => {
      if (this.activeTab() === "general") {
        setTimeout(() => this.mapService.initLocationMap(), 50);
      }
    });
    // Seed the geocoder's last point when a persisted report first appears so
    // that editing other location fields does not spuriously re-trigger a
    // reverse-geocode of the loaded coordinates.
    effect(() => {
      const report = this.incidentReport();
      if (report.id && report.id !== this.geocodeSeededForId) {
        this.geocodeSeededForId = report.id;
        this.geocodeService.setLastPoint(report.latitude, report.longitude);
      }
    });
  }

  ngOnInit() {
    this.geocodeService.init({ incidentReport: this.incidentReport });
    this.mapService.init({
      incidentReport: this.incidentReport,
      disabled: () => this.disabled(),
      isActive: () => this.activeTab() === "general",
      onPointChange: (lat, lng) => this.geocodeService.reverseGeocode(lat, lng),
    });
  }

  onLocationFormChange(updatedReport: IncidentReport) {
    this.incidentReport.set({ ...updatedReport });
    this.mapService.drawOnMap();
    this.geocodeService.reverseGeocodeIfChanged(updatedReport.latitude, updatedReport.longitude);
  }

  get involvementsFatalitiesBurials() {
    return {
      ...IncidentModels.computeInvolvementsFatalitiesBurials(this.incidentReport()),
      involvementsFatalitiesBurialsComment:
        this.incidentReport().involvementsFatalitiesBurials?.involvementsFatalitiesBurialsComment,
    };
  }

  onInvolvementsCommentChange(val: IncidentModels.InvolvementsFatalitiesBurials) {
    const report = this.incidentReport();
    this.incidentReport.set({
      ...report,
      involvementsFatalitiesBurials: {
        ...this.involvementsFatalitiesBurials,
        involvementsFatalitiesBurialsComment: val.involvementsFatalitiesBurialsComment,
      },
    });
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

  isGroupValid(group: IncidentModels.GroupInformation): boolean {
    return isVisibleFieldsValid(IncidentModels.GroupInformationSchema, group as Record<string, unknown>);
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

  get groupIdentifierOptions(): Record<string, { value: string; label: string }[]> {
    const groups = this.incidentReport().groupInformation ?? [];
    return {
      anonymousGroupIdentifier: groups
        .map((g) => g.anonymousGroupIdentifier)
        .filter((id): id is string => !!id)
        .map((id) => ({ value: id, label: id })),
    };
  }

  addAvalancheProblem() {
    this.incidentReport().avalancheProblems.push({});
  }

  removeAvalancheProblem(p: IncidentModels.AvalancheProblem) {
    this.incidentReport().avalancheProblems = this.incidentReport().avalancheProblems.filter((p0) => p0 !== p);
  }

  async fetchPublishedBulletin() {
    const incidentReport = this.incidentReport();
    const bulletin: Bulletin | undefined = await firstValueFrom(
      this.incidentService.fetchPublishedBulletin(incidentReport),
    ).catch((error) => {
      console.warn("Failed to fetch published bulletin for incident", { error, incidentReport });
      return undefined;
    });
    if (!bulletin) {
      this.fetchBulletinResult.set({
        type: "danger",
        message: this.translateService.instant("incidentReportUI.fetchPublishedBulletinError", {
          region: incidentReport.avalancheRegion,
          date: incidentReport.dateTime?.toLocaleDateString(this.translateService.currentLang() ?? undefined),
        }),
      });
      return;
    }
    console.info("Obtained bulletin for incident", { bulletin, incidentReport });
    this.incidentReport.update((incidentReport) => ({
      ...incidentReport,
      publicAvalancheWarningService: bulletin.source?.provider?.name,
      publicAvalancheWarningServiceOutside: false,
      dangerRating: bulletin.dangerRatings?.[0].mainValue,
      dangerPattern: IncidentModels.IncidentReportSchema.shape.dangerPattern.parse(
        bulletin.customData?.LWD_Tyrol?.dangerPatterns?.map((p: string) => p.toLowerCase()) ?? [],
      ),
      avalancheProblems: (bulletin.avalancheProblems ?? []).map((p) =>
        IncidentModels.AvalancheProblemSchema.parse({
          aspects: p.aspects,
          avalancheSize: [
            undefined,
            AvalancheSize.small,
            AvalancheSize.medium,
            AvalancheSize.large,
            AvalancheSize.very_large,
            AvalancheSize.extreme,
          ][p.avalancheSize],
          elevationLowerBound: p.elevation?.lowerBound,
          elevationUpperBound: p.elevation?.upperBound,
          frequency: p.frequency,
          problemType: p.problemType,
          snowpackStability: p.snowpackStability,
        } satisfies IncidentModels.AvalancheProblem),
      ),
    }));
    const region = bulletin.regions?.find((r) => r.regionID === incidentReport.avalancheRegion);
    this.fetchBulletinResult.set({
      type: "success",
      message: this.translateService.instant("incidentReportUI.fetchPublishedBulletinSuccess", {
        count: this.incidentReport().avalancheProblems.length,
        region: region?.name ?? region?.regionID ?? incidentReport.avalancheRegion,
        date: (bulletin.validTime?.startTime ?? bulletin.publicationTime).toLocaleDateString(
          this.translateService.currentLang() ?? undefined,
        ),
      }),
    });
  }
}
