import { Routes } from "@angular/router";

import { AuthGuard } from "../guards/auth.guard";
import { AdminComponent } from "./admin.component";

export default [
  {
    path: "",
    component: AdminComponent,
    canActivate: [AuthGuard],
  },
] satisfies Routes;
