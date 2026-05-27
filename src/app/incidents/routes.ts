import { Routes } from "@angular/router";

import { AuthGuard } from "../guards/auth.guard";
import { IncidentReportComponent } from "./incident-report.component";

export default [
  {
    path: "",
    component: IncidentReportComponent,
    canActivate: [AuthGuard],
  },
] satisfies Routes;
