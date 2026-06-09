import { DatePipe } from "@angular/common";
import { Component, DestroyRef, inject, OnInit } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { Router } from "@angular/router";
import { TranslateModule, TranslateService } from "@ngx-translate/core";

import { AuthenticationService } from "../providers/authentication-service/authentication.service";
import { IncidentService, IncidentView } from "../providers/incident-service/incident.service";
import { IncidentReport } from "./models/incident-report.model";

/** A stored incident enriched with the fields the overview table renders. */
interface IncidentRow {
  id: string;
  dateTime: Date | undefined;
  location: string | undefined;
  updatedAt: Date;
  reportStatus: IncidentReport["reportStatus"] | undefined;
}

@Component({
  selector: "app-incidents-overview",
  templateUrl: "incidents-overview.component.html",
  standalone: true,
  imports: [DatePipe, TranslateModule],
})
export class IncidentsOverviewComponent implements OnInit {
  private incidentService = inject(IncidentService);
  private authenticationService = inject(AuthenticationService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  translateService = inject(TranslateService);

  incidents: IncidentRow[] = [];
  loading = false;

  /** Bootstrap background class for each report status badge. */
  private readonly statusClasses: Record<NonNullable<IncidentRow["reportStatus"]>, string> = {
    Draft: "bg-secondary",
    Incomplete: "bg-warning",
    InReview: "bg-info",
    Verified: "bg-success",
  };

  ngOnInit() {
    // The overview is region-scoped: reload whenever the active region changes.
    this.authenticationService.activeRegion$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.load());
  }

  private load() {
    const region = this.authenticationService.getActiveRegionId();
    if (!region) {
      this.incidents = [];
      return;
    }
    this.loading = true;
    this.incidentService.getIncidents(region).subscribe({
      next: (views) => {
        this.incidents = views.map((view) => this.toRow(view)).sort((a, b) => +b.updatedAt - +a.updatedAt);
        this.loading = false;
      },
      error: (error) => {
        console.error("Incidents could not be loaded!", error);
        this.incidents = [];
        this.loading = false;
      },
    });
  }

  private toRow(view: IncidentView): IncidentRow {
    return {
      id: view.id,
      dateTime: view.data.dateTime ? new Date(view.data.dateTime) : undefined,
      location: view.data.location || undefined,
      updatedAt: new Date(view.updatedAt),
      reportStatus: view.data.reportStatus,
    };
  }

  statusClass(status: IncidentRow["reportStatus"]): string {
    return status ? this.statusClasses[status] : "bg-secondary";
  }

  openIncident(id: string) {
    this.router.navigate(["/incidents", id]);
  }

  newIncident() {
    this.router.navigate(["/incidents", "new"]);
  }

  deleteIncident(row: IncidentRow) {
    const message = this.translateService.instant("incidentsOverview.deleteConfirm");
    if (!confirm(message)) return;
    this.incidentService.deleteIncident(row.id).subscribe({
      next: () => this.load(),
      error: (error) => console.error("Incident could not be deleted!", error),
    });
  }
}
