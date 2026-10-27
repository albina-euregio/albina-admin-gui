import { Routes } from "@angular/router";

import { AuthGuard } from "../guards/auth.guard";
import { roleGuard } from "../guards/role.guard";
import { StatisticsComponent } from "./statistics.component";

export default [
  {
    path: "",
    component: StatisticsComponent,
    canActivate: [AuthGuard, roleGuard("FORECASTER")],
    runGuardsAndResolvers: "always",
  },
] satisfies Routes;
