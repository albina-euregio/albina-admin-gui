import { Routes } from "@angular/router";

import { SnowpackComponent } from "./snowpack.component";
import { SnowpackMeteoComponent } from "./snowpack.meteo.component";
import { ForecastComponent } from "./forecast.component";

import { AuthGuard } from "../guards/auth.guard";

export default [
  {
    path: "",
    component: ForecastComponent,
    canActivate: [AuthGuard],
  },
  {
    path: "forecast",
    component: ForecastComponent,
    canActivate: [AuthGuard],
  },
  {
    path: "snowpack",
    component: SnowpackComponent,
    canActivate: [AuthGuard],
  },
  {
    path: "snowpackMeteo",
    component: SnowpackMeteoComponent,
    canActivate: [AuthGuard],
  },
] satisfies Routes;
