import { Routes } from "@angular/router";

import { AwsomeComponent } from "./awsome.component";
import { ForecastComponent } from "./forecast.component";

import { AuthGuard } from "../guards/auth.guard";

export type ModellingRouteData = {
  title: string;
  modelling: "geosphere" | "snowpack" | "awsome";
};

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
    path: "snowpack",
    data: {
      title: "SNOWPACK",
      modelling: "snowpack",
    } satisfies ModellingRouteData,
    component: ForecastComponent,
    canActivate: [], // no authentication
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
