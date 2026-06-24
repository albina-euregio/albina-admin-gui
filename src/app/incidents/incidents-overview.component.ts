import { Component, inject, OnInit, ChangeDetectionStrategy } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { TranslatePipe, TranslateService } from "@ngx-translate/core";
import { ZodDisplayComponent } from "app/shared/zod-display.component";
import { orderBy } from "es-toolkit";
import { BsDatepickerModule } from "ngx-bootstrap/datepicker";
import "bootstrap";

import { LocalStorageService } from "../providers/local-storage-service/local-storage.service";
import { IncidentReport, IncidentReportSchema } from "./incident-report.model";
import { IncidentService } from "./incident.service";

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
  private router = inject(Router);
  private localStorageService = inject(LocalStorageService);
  translateService = inject(TranslateService);

  // Server-side date filter, owned by the service; reloads the resource on change.
  readonly dateRange = this.incidentService.dateRange;
  readonly incidentsResource = this.incidentService.incidentsForActiveRegion();

  sortField: IncidentColumn = "updatedAt";
  sortDir: "asc" | "desc" = "desc";
  filterStatus: IncidentReport["reportStatus"] | "" = "";

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
  }

  saveColumnVisibility() {
    this.localStorageService.setIncidentColumnVisibility(this.columnVisibility);
  }

  get displayedIncidents(): IncidentReport[] {
    // The date range is applied server-side; only status is filtered client-side.
    const filtered = this.incidentsResource
      .value()
      .filter((r) => !this.filterStatus || r.reportStatus === this.filterStatus);
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
      next: () => this.incidentsResource.reload(),
      error: (error) => console.error("Incident could not be deleted!", error),
    });
  }
}
