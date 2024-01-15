import { Routes } from "@angular/router";

import { ForecastComponent } from "./forecast.component";

import { AuthGuard } from "../guards/auth.guard";

export default [
  {
    path: "",
    component: ForecastComponent,
    canActivate: [AuthGuard],
  }
] satisfies Routes;
