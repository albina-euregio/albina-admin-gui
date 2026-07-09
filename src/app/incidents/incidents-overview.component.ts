import { Component, inject, OnInit, ChangeDetectionStrategy } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { TranslatePipe } from "@ngx-translate/core";
import { ZodDisplayComponent } from "app/shared/zod-display.component";
import { unwrap, zEnumValues } from "app/shared/zod-util";
import { orderBy } from "es-toolkit";
import "bootstrap";
import { BsDatepickerModule } from "ngx-bootstrap/datepicker";

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

  // Server-side date filter, owned by the service; reloads the resource on change.
  readonly dateRange = this.incidentService.dateRange;
  readonly incidentsResource = this.incidentService.incidentsForActiveRegion();

  sortField: IncidentColumn = "updatedAt";
  sortDir: "asc" | "desc" = "desc";
  filterStatus: IncidentReport["reportStatus"] | "" = "";

  readonly IncidentReportSchema = IncidentReportSchema;

  readonly allColumns: IncidentColumn[] = Object.entries(IncidentReportSchema.shape).flatMap(([k, v]) =>
    unwrap(v).type !== "array" ? [k as IncidentColumn] : [],
  );
  readonly columnVisibility: Partial<Record<IncidentColumn, boolean>> = {
    dateTime: true,
    location: true,
    updatedAt: true,
    reportStatus: true,
    publishedAt: true,
  };

  get columns(): IncidentColumn[] {
    return this.allColumns.filter((col) => this.columnVisibility[col]);
  }

  readonly statusOptions = zEnumValues(IncidentReportSchema.shape.reportStatus);

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
    const field = this.sortField;
    // Sort missing values to the end explicitly and compare dates by timestamp so both directions work consistently.
    return orderBy(
      filtered,
      [(r) => r[field] == null, (r) => (r[field] instanceof Date ? r[field].getTime() : r[field])],
      ["asc", this.sortDir],
    );
  }

  sortBy(field: IncidentColumn) {
    if (this.sortField === field) {
      this.sortDir = this.sortDir === "asc" ? "desc" : "asc";
    } else {
      this.sortField = field;
      this.sortDir = "asc";
    }
  }

  downloadGeoJSON() {
    const featureCollection: GeoJSON.FeatureCollection = {
      type: "FeatureCollection",
      features: this.displayedIncidents
        .filter((incident) => incident.latitude && incident.longitude)
        .map(
          (incident): GeoJSON.Feature<GeoJSON.Point> => ({
            type: "Feature",
            // Stored coordinates are [lat, lng]; GeoJSON requires [lng, lat].
            geometry: { type: "Point", coordinates: [incident.longitude, incident.latitude] },
            properties: Object.fromEntries(
              Object.entries(incident).filter(
                ([, value]) => value == null || typeof value !== "object" || value instanceof Date,
              ),
            ),
          }),
        ),
    };
    const blob = new Blob([JSON.stringify(featureCollection, null, 2)], { type: "application/geo+json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "incidents.geojson";
    link.click();
    URL.revokeObjectURL(url);
  }

  openIncident(id: string) {
    this.router.navigate(["/incidents", id]);
  }

  viewIncident(id: string) {
    this.router.navigate(["/incidents", id], { queryParams: { readOnly: true } });
  }

  newIncident() {
    this.router.navigate(["/incidents", "new"]);
  }
}
