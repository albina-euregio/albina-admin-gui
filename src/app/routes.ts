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
    component: FullLayoutComponent,
    canActivate: [AuthGuard],
    runGuardsAndResolvers: "always",
    loadChildren: () => import("./bulletins/routes"),
  },
  {
    path: "danger-sources",
    component: FullLayoutComponent,
    canActivate: [AuthGuard],
    runGuardsAndResolvers: "always",
    loadChildren: () => import("./danger-sources/routes"),
  },
  {
    path: "observations",
    component: FullLayoutComponent,
    canActivate: [AuthGuard],
    loadChildren: () => import("./observations/routes"),
  },
  {
    path: "admin",
    component: FullLayoutComponent,
    canActivate: [AuthGuard],
    loadChildren: () => import("./admin/routes"),
  },
  {
    path: "education",
    component: FullLayoutComponent,
    canActivate: [AuthGuard],
    loadChildren: () => import("./education/routes"),
  },
  {
    path: "modelling",
    component: FullLayoutComponent,
    canActivate: [], // no authentication (partially)
    loadChildren: () => import("./modelling/routes"),
  },
  {
    path: "statistics",
    component: FullLayoutComponent,
    canActivate: [AuthGuard],
    loadChildren: () => import("./statistics/routes"),
  },
  {
    path: "settings",
    component: FullLayoutComponent,
    canActivate: [AuthGuard],
    loadChildren: () => import("./settings/routes"),
  },
  {
    path: "pages",
    component: SimpleLayoutComponent,
    data: {
      title: "Pages",
    },
    children: [
      {
        path: "",
        loadChildren: () => import("./pages/routes"),
      },
    ],
  },
] satisfies Routes;
