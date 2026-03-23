import { AuthGuard } from "../guards/auth.guard";
import { AwsomeComponent } from "./awsome.component";
import { ForecastComponent } from "./forecast.component";
import { LineaExportComponent } from "../graphics/lineaexport.component";
import { AwsstatsComponent } from "../graphics/awsstats.component";
import { ZamgWbtComponent } from "./zamg-wbt.component";
import { GraphicsComponent } from "../graphics/graphics.component";
import { Routes } from "@angular/router";

export interface ModellingRouteData {
  title: string;
  modelling: "geosphere" | "snowpack" | "awsome" | "zamg-wbt" | "graphics";
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
  {
    path: "graphics",
    data: {
      title: "Graphics",
      modelling: "graphics",
    } satisfies ModellingRouteData,
    component: GraphicsComponent,
    canActivate: [], // no authentication
  },
] satisfies Routes;
