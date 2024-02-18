import { Routes } from "@angular/router";

import { AwesomeComponent } from "./awesome.component";
import { ForecastComponent } from "./forecast.component";

import { AuthGuard } from "../guards/auth.guard";

export type ModellingRouteData = {
  title: string;
  modelling: "geosphere" | "snowpack" | "awesome";
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
    path: "awesome",
    data: {
      title: "AWESOME",
      modelling: "awesome",
    } satisfies ModellingRouteData,
    component: AwesomeComponent,
    canActivate: [], // no authentication
  },
] satisfies Routes;
