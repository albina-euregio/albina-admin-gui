import { AuthGuard } from "../guards/auth.guard";
import { ObservationsComponent } from "./observations.component";
import { Routes } from "@angular/router";

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
