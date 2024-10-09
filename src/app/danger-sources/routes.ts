import { Routes } from "@angular/router";
import { AuthGuard } from "../guards/auth.guard";
import { CreateDangerSourcesComponent } from "./create-danger-sources.component";
import { DangerSourcesComponent } from "./danger-sources.component";

export default [
  {
    path: "",
    component: DangerSourcesComponent,
    canActivate: [AuthGuard],
    data: {
      title: "Danger Sources",
    },
  },
  {
    path: ":date",
    component: CreateDangerSourcesComponent,
    canActivate: [AuthGuard],
    data: {
      title: "Create Danger Sources",
    },
  },
] satisfies Routes;
