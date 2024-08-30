import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";

import { DangerSourcesComponent } from "./danger-sources.component";
import { CreateDangerSourcesComponent } from "./create-danger-sources.component";

import { AuthGuard } from "../guards/auth.guard";

const routes: Routes = [
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
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DangerSourcesRoutingModule {}
