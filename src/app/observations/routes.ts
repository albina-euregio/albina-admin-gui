import { Routes } from "@angular/router";

import { AuthGuard } from "../guards/auth.guard";
import { ObservationsComponent } from "./observations.component";

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
