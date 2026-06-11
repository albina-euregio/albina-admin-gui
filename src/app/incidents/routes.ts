import { Routes } from "@angular/router";

import { AuthGuard } from "../guards/auth.guard";
import { IncidentReportComponent } from "./incident-report.component";
import { IncidentsOverviewComponent } from "./incidents-overview.component";

export default [
  {
    path: "",
    component: IncidentsOverviewComponent,
    canActivate: [AuthGuard],
  },
  {
    path: "new",
    component: IncidentReportComponent,
    canActivate: [AuthGuard],
  },
  {
    path: ":id",
    component: IncidentReportComponent,
    canActivate: [AuthGuard],
  },
] satisfies Routes;
