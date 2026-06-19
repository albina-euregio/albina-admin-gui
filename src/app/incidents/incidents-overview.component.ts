import { DatePipe } from "@angular/common";
import { Component, DestroyRef, inject, OnInit, ChangeDetectionStrategy } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { BsDatepickerModule } from "ngx-bootstrap/datepicker";

import { AuthenticationService } from "../providers/authentication-service/authentication.service";
import { IncidentService } from "./incident.service";
import { IncidentReport } from "./models/incident-report.model";

type SortableField = "dateTime" | "updatedAt" | "reportStatus";

@Component({
  selector: "app-incidents-overview",
  templateUrl: "incidents-overview.component.html",
  standalone: true,
  imports: [DatePipe, TranslateModule, FormsModule, BsDatepickerModule],
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

  sortField: SortableField = "updatedAt";
  sortDir: "asc" | "desc" = "desc";
  filterStatus: IncidentReport["reportStatus"] | "" = "";
  filterDateRange: Date[] = [];

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
    return this.incidents
      .filter((r) => !this.filterStatus || r.reportStatus === this.filterStatus)
      .filter((r) => {
        if (!rangeStart || !endOfDay) return true;
        return !!r.dateTime && r.dateTime >= rangeStart && r.dateTime <= endOfDay;
      })
      .sort((a, b) => {
        const av = a[this.sortField];
        const bv = b[this.sortField];
        if (av == null && bv == null) return 0;
        if (av == null) return 1;
        if (bv == null) return -1;
        let cmp: number;
        if (av instanceof Date && bv instanceof Date) {
          cmp = av.getTime() - bv.getTime();
        } else {
          cmp = String(av).localeCompare(String(bv));
        }
        return this.sortDir === "asc" ? cmp : -cmp;
      });
  }

  sortBy(field: SortableField) {
    if (this.sortField === field) {
      this.sortDir = this.sortDir === "asc" ? "desc" : "asc";
    } else {
      this.sortField = field;
      this.sortDir = "asc";
    }
  }

  sortIcon(field: SortableField): string {
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
