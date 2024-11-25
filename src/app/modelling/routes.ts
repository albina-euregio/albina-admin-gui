import { Routes } from "@angular/router";

import { AwsomeComponent } from "./awsome.component";
import { ForecastComponent } from "./forecast.component";
import { ZamgWbtComponent } from "./zamg-wbt.component";

import { AuthGuard } from "../guards/auth.guard";

export interface ModellingRouteData {
  title: string;
  modelling: "geosphere" | "snowpack" | "awsome" | "zamg-wbt";
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
  {
    path: "zamg-wbt",
    data: {
      title: "SNOWPACK",
      modelling: "zamg-wbt",
    } satisfies ModellingRouteData,
    component: ZamgWbtComponent,
    canActivate: [], // no authentication
  },
] satisfies Routes;
