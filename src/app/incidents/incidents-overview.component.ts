import { Component, inject, OnInit, ChangeDetectionStrategy } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { TranslatePipe, TranslateService } from "@ngx-translate/core";
import { ZodDisplayComponent } from "app/shared/zod-display.component";
import { orderBy } from "es-toolkit";
import { BsDatepickerModule } from "ngx-bootstrap/datepicker";
import "bootstrap";

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
  readonly incidentsResource = this.incidentService.incidentsForActiveRegion();
  private router = inject(Router);
  private localStorageService = inject(LocalStorageService);
  translateService = inject(TranslateService);

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
  }

  saveColumnVisibility() {
    this.localStorageService.setIncidentColumnVisibility(this.columnVisibility);
  }

  get displayedIncidents(): IncidentReport[] {
    const [rangeStart, rangeEnd] = this.filterDateRange ?? [];
    const endOfDay = rangeEnd
      ? new Date(rangeEnd.getFullYear(), rangeEnd.getMonth(), rangeEnd.getDate(), 23, 59, 59, 999)
      : undefined;
    const filtered = this.incidentsResource
      .value()
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
