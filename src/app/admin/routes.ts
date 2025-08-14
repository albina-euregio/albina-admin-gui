import { AuthGuard } from "../guards/auth.guard";
import { AdminComponent } from "./admin.component";
import { Routes } from "@angular/router";

export default [
  {
    path: "",
    component: AdminComponent,
    canActivate: [AuthGuard],
    data: {
      title: "Admin",
    },
  },
] satisfies Routes;
