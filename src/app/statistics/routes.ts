import { Routes } from "@angular/router";

import { AuthGuard } from "../guards/auth.guard";
import { StatisticsComponent } from "./statistics.component";

export default [
  {
    path: "",
    component: StatisticsComponent,
    canActivate: [AuthGuard],
  },
] satisfies Routes;
