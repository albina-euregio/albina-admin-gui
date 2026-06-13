import { Routes } from "@angular/router";

import { AuthGuard } from "../guards/auth.guard";
import { IconComponent } from "./icon.component";

export default [
  {
    path: "",
    component: IconComponent,
    canActivate: [AuthGuard],
  },
] satisfies Routes;
