import { Routes } from "@angular/router";

import { AuthGuard } from "../guards/auth.guard";
import { IconComponent } from "./icon.component";

export default [
  {
    path: "",
    data: {
      title: "ICON",
    },
    component: IconComponent,
    canActivate: [AuthGuard],
  },
] satisfies Routes;
