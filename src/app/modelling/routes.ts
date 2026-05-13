import { Routes } from "@angular/router";

import { AuthGuard } from "../guards/auth.guard";
import { AwsomeComponent } from "./awsome.component";
import { ForecastComponent } from "./forecast.component";

export interface ModellingRouteData {
  title: string;
  modelling: "geosphere" | "snowpack" | "awsome" | "graphics";
}

export default [
  {
    path: "geosphere",
    data: {
      title: "GeoSphere",
      modelling: "geosphere",
    } satisfies ModellingRouteData,
    component: ForecastComponent,
    canActivate: [AuthGuard],
  },
  {
    path: "awsome",
    data: {
      title: "AWSOME",
      modelling: "awsome",
    } satisfies ModellingRouteData,
    component: AwsomeComponent,
    canActivate: [], // no authentication
  },
] satisfies Routes;
