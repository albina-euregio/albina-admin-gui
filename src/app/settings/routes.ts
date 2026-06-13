import { Routes } from "@angular/router";

import { AuthGuard } from "../guards/auth.guard";
import { SettingsComponent } from "./settings.component";

export default [
  {
    path: "",
    component: SettingsComponent,
    canActivate: [AuthGuard],
  },
] satisfies Routes;
