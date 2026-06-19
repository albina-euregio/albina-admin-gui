import { Component, DestroyRef, inject, OnInit, ChangeDetectionStrategy } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { ZodDisplayComponent } from "app/shared/zod-display.component";
import { orderBy } from "es-toolkit";
import { BsDatepickerModule } from "ngx-bootstrap/datepicker";
import "bootstrap";

import { AuthenticationService } from "../providers/authentication-service/authentication.service";
import { IncidentService } from "./incident.service";
import { IncidentReport, IncidentReportSchema } from "./models/incident-report.model";

type IncidentColumn = Extract<keyof IncidentReport, "dateTime" | "location" | "updatedAt" | "reportStatus">;

@Component({
  selector: "app-incidents-overview",
  templateUrl: "incidents-overview.component.html",
  standalone: true,
  imports: [TranslateModule, FormsModule, BsDatepickerModule, ZodDisplayComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
  providers: [IncidentService],
})
export class IncidentsOverviewComponent implements OnInit {
  private incidentService = inject(IncidentService);
  private authenticationService = inject(AuthenticationService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  translateService = inject(TranslateService);

  incidents: IncidentReport[] = [];
  loading = false;

  sortField: IncidentColumn = "updatedAt";
  sortDir: "asc" | "desc" = "desc";
  filterStatus: IncidentReport["reportStatus"] | "" = "";
  filterDateRange: Date[] = [];

  readonly IncidentReportSchema = IncidentReportSchema;

  /** All available columns with their current visibility, toggled via the column-picker dropdown. */
  readonly allColumns: { key: IncidentColumn; visible: boolean }[] = [
    { key: "dateTime", visible: true },
    { key: "location", visible: true },
    { key: "updatedAt", visible: true },
    { key: "reportStatus", visible: true },
  ];

  get columns(): IncidentColumn[] {
    return this.allColumns.filter((col) => col.visible).map((col) => col.key);
  }

  readonly statusOptions: NonNullable<IncidentReport["reportStatus"]>[] = [
    "Draft",
    "Incomplete",
    "InReview",
    "Verified",
  ];

  /** Bootstrap background class for each report status badge. */
  private readonly statusClasses: Record<NonNullable<IncidentReport["reportStatus"]>, string> = {
    Draft: "bg-secondary",
    Incomplete: "bg-warning",
    InReview: "bg-info",
    Verified: "bg-success",
  };

  ngOnInit() {
    // The overview is region-scoped: reload whenever the active region changes.
    this.authenticationService.activeRegion$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.load());
  }

  get displayedIncidents(): IncidentReport[] {
    const [rangeStart, rangeEnd] = this.filterDateRange ?? [];
    const endOfDay = rangeEnd
      ? new Date(rangeEnd.getFullYear(), rangeEnd.getMonth(), rangeEnd.getDate(), 23, 59, 59, 999)
      : undefined;
    const filtered = this.incidents
      .filter((r) => !this.filterStatus || r.reportStatus === this.filterStatus)
      .filter((r) => {
        if (!rangeStart || !endOfDay) return true;
        return !!r.dateTime && r.dateTime >= rangeStart && r.dateTime <= endOfDay;
      });
    return orderBy(filtered, [this.sortField], [this.sortDir]);
  }

  sortBy(field: IncidentColumn) {
    if (this.sortField === field) {
      this.sortDir = this.sortDir === "asc" ? "desc" : "asc";
    } else {
      this.sortField = field;
      this.sortDir = "asc";
    }
  }

  sortIcon(field: IncidentColumn): string {
    if (this.sortField !== field) return "ph-arrows-down-up";
    return this.sortDir === "asc" ? "ph-arrow-up" : "ph-arrow-down";
  }

  private load() {
    const region = this.authenticationService.getActiveRegionId();
    if (!region) {
      this.incidents = [];
      return;
    }
    this.loading = true;
    this.incidentService.getIncidents(region).subscribe({
      next: (incidents) => {
        this.incidents = incidents;
        this.loading = false;
      },
      error: (error) => {
        console.error("Incidents could not be loaded!", error);
        this.incidents = [];
        this.loading = false;
      },
    });
  }

  statusClass(status: IncidentReport["reportStatus"]): string {
    return status ? this.statusClasses[status] : "bg-secondary";
  }

  openIncident(id: string) {
    this.router.navigate(["/incidents", id]);
  }

  newIncident() {
    this.router.navigate(["/incidents", "new"]);
  }

  deleteIncident(incident: IncidentReport) {
    const message = this.translateService.instant("incidentsOverview.deleteConfirm");
    if (!confirm(message)) return;
    this.incidentService.deleteIncident(incident.id).subscribe({
      next: () => this.load(),
      error: (error) => console.error("Incident could not be deleted!", error),
    });
  }
}
