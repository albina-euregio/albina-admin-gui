import { ChangeDetectionStrategy, Component, effect, inject, input, model, OnInit } from "@angular/core";
import { TranslatePipe, TranslateService } from "@ngx-translate/core";
import { uniq } from "es-toolkit";
import { z } from "zod/v4";

import { GeocodingService } from "../observations/geocoding.service";
import { DisplayMode, ZodSchemaFormComponent } from "../shared/zod-schema-form.component";
import { isVisibleFieldsValid } from "../shared/zod-util";
import { IncidentReportGeocodeService } from "./incident-report-geocode.service";
import { IncidentReportMapService } from "./incident-report-map.service";
import * as IncidentModels from "./incident-report.model";
import { IncidentReport } from "./incident-report.model";

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

  readonly incidentReport = model.required<IncidentReport>();
  readonly disabled = input<boolean>(false);
  readonly displayMode = input<DisplayMode>(DisplayMode.Edit);
  readonly showMandatoryOnly = input<boolean>(false);
  readonly activeTab = input<IncidentReportTab>("general");

  readonly IncidentModels = IncidentModels;
  readonly DisplayMode = DisplayMode;
  readonly labelI18n = "incidentReport.#";
  readonly helpI18n = "incidentReportHelp.#";

  activeGroupSubTab: "overview" | "groups" | "victims" = "overview";
  activeGroupIndex = 0;
  activeVictimIndex = 0;

  /** Report id the geocoder's last point was last seeded for (see constructor). */
  private geocodeSeededForId: string | null = null;

  /** True for any read-only preview mode; mirrors the parent's display mode. */
  get displayOnly(): boolean {
    return this.displayMode() !== DisplayMode.Edit;
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

  get groupIdentifiers(): string[] {
    return this.incidentReport().groupInformation?.map((g) => g.anonymousGroupIdentifier) ?? [];
  }
}
