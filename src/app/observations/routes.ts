import { Routes } from "@angular/router";

import { ObservationsComponent } from "./observations.component";

import { AuthGuard } from "../guards/auth.guard";

export default [
  {
    path: "",
    component: ObservationsComponent,
    canActivate: [AuthGuard],
    data: {
      title: "Observations",
    },
  },
] satisfies Routes;
