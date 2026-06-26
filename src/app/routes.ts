import { Routes } from "@angular/router";

import { AuthGuard } from "./guards/auth.guard";
import { FullLayoutComponent } from "./layouts/full-layout.component";
import { SimpleLayoutComponent } from "./layouts/simple-layout.component";

export default [
  {
    path: "",
    redirectTo: "bulletins",
    pathMatch: "full",
  },
  {
    path: "bulletins",
    title: "sidebar.bulletins",
    component: FullLayoutComponent,
    canActivate: [AuthGuard],
    runGuardsAndResolvers: "always",
    loadChildren: () => import("./bulletins/routes"),
  },
  {
    path: "danger-sources",
    title: "sidebar.dangerSources",
    component: FullLayoutComponent,
    canActivate: [AuthGuard],
    runGuardsAndResolvers: "always",
    loadChildren: () => import("./danger-sources/routes"),
  },
  {
    path: "incidents",
    title: "sidebar.incidents",
    component: FullLayoutComponent,
    canActivate: [AuthGuard],
    runGuardsAndResolvers: "always",
    loadChildren: () => import("./incidents/routes"),
  },
  {
    path: "observations",
    title: "sidebar.observations",
    component: FullLayoutComponent,
    canActivate: [AuthGuard],
    loadChildren: () => import("./observations/routes"),
  },
  {
    path: "admin",
    title: "menu.admin",
    component: FullLayoutComponent,
    canActivate: [AuthGuard],
    loadChildren: () => import("./admin/routes"),
  },
  {
    path: "education",
    title: "menu.education",
    component: FullLayoutComponent,
    canActivate: [AuthGuard],
    loadChildren: () => import("./education/routes"),
  },
  {
    path: "modelling",
    title: "sidebar.modelling",
    component: FullLayoutComponent,
    canActivate: [], // no authentication (partially)
    loadChildren: () => import("./modelling/routes"),
  },
  {
    path: "graphics",
    title: "sidebar.graphics",
    component: FullLayoutComponent,
    canActivate: [AuthGuard],
    loadChildren: () => import("./graphics/routes"),
  },
  {
    path: "icon",
    title: "sidebar.icon",
    component: FullLayoutComponent,
    canActivate: [AuthGuard],
    loadChildren: () => import("./icon/routes"),
  },
  {
    path: "statistics",
    title: "menu.statistics",
    component: FullLayoutComponent,
    canActivate: [AuthGuard],
    loadChildren: () => import("./statistics/routes"),
  },
  {
    path: "settings",
    title: "menu.settings",
    component: FullLayoutComponent,
    canActivate: [AuthGuard],
    loadChildren: () => import("./settings/routes"),
  },
  {
    path: "pages",
    component: SimpleLayoutComponent,
    children: [
      {
        path: "",
        loadChildren: () => import("./pages/routes"),
      },
    ],
  },
] satisfies Routes;
