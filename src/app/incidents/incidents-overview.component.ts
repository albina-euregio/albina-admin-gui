import { Component, DestroyRef, inject, OnInit, ChangeDetectionStrategy } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { TranslatePipe, TranslateService } from "@ngx-translate/core";
import { ZodDisplayComponent } from "app/shared/zod-display.component";
import { orderBy } from "es-toolkit";
import { BsDatepickerModule } from "ngx-bootstrap/datepicker";
import "bootstrap";

import { AuthenticationService } from "../providers/authentication-service/authentication.service";
import { LocalStorageService } from "../providers/local-storage-service/local-storage.service";
import { IncidentService } from "./incident.service";
import { IncidentReport, IncidentReportSchema } from "./models/incident-report.model";

type IncidentColumn = keyof IncidentReport;

@Component({
  selector: "app-incidents-overview",
  templateUrl: "incidents-overview.component.html",
  standalone: true,
  imports: [TranslatePipe, FormsModule, BsDatepickerModule, ZodDisplayComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
  providers: [IncidentService],
})
export class IncidentsOverviewComponent implements OnInit {
  private incidentService = inject(IncidentService);
  private authenticationService = inject(AuthenticationService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private localStorageService = inject(LocalStorageService);
  translateService = inject(TranslateService);

  incidents: IncidentReport[] = [];
  loading = false;

  sortField: IncidentColumn = "updatedAt";
  sortDir: "asc" | "desc" = "desc";
  filterStatus: IncidentReport["reportStatus"] | "" = "";
  filterDateRange: Date[] = [];

  readonly IncidentReportSchema = IncidentReportSchema;

  readonly allColumns: IncidentColumn[] = [
    "dateTime",
    "location",
    "updatedAt",
    "reportStatus",
    "avalancheLength",
    "avalancheProblem",
    "avalancheRegion",
    "avalancheSize",
    "avalancheType",
  ];
  readonly columnVisibility: Partial<Record<IncidentColumn, boolean>> = {
    dateTime: true,
    location: true,
    updatedAt: true,
    reportStatus: true,
  };

  get columns(): IncidentColumn[] {
    return this.allColumns.filter((col) => this.columnVisibility[col]);
  }

  readonly statusOptions: NonNullable<IncidentReport["reportStatus"]>[] = [
    "Draft",
    "Incomplete",
    "InReview",
    "Verified",
  ];

  ngOnInit() {
    const visibility = this.localStorageService.getIncidentColumnVisibility();
    this.allColumns.forEach((col) => {
      if (typeof visibility[col] === "boolean") {
        this.columnVisibility[col] = visibility[col];
      }
    });
    // The overview is region-scoped: reload whenever the active region changes.
    this.authenticationService.activeRegion$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.load());
  }

  saveColumnVisibility() {
    this.localStorageService.setIncidentColumnVisibility(this.columnVisibility);
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
