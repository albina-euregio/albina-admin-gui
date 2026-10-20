import { Routes } from "@angular/router";

import { AuthGuard } from "../guards/auth.guard";
import { roleGuard } from "../guards/role.guard";
import { AdminComponent } from "./admin.component";

export default [
  {
    path: "",
    component: AdminComponent,
    canActivate: [AuthGuard, roleGuard("ADMIN")],
    runGuardsAndResolvers: "always",
  },
] satisfies Routes;
