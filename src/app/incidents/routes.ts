import { CanDeactivateFn, Routes } from "@angular/router";

import { AuthGuard } from "../guards/auth.guard";
import { IncidentReportComponent } from "./incident-report.component";
import { IncidentsOverviewComponent } from "./incidents-overview.component";

const confirmStagedAttachments: CanDeactivateFn<IncidentReportComponent> = (component) => component.canDeactivate();

export default [
  {
    path: "",
    component: IncidentsOverviewComponent,
    canActivate: [],
  },
  {
    path: "new",
    component: IncidentReportComponent,
    canActivate: [AuthGuard],
    canDeactivate: [confirmStagedAttachments],
  },
  {
    path: ":id",
    component: IncidentReportComponent,
    canActivate: [],
    canDeactivate: [confirmStagedAttachments],
  },
] satisfies Routes;
