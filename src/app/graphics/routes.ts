import { Routes } from "@angular/router";

import { AuthGuard } from "../guards/auth.guard";
import { GraphicsComponent } from "./graphics.component";

export default [
  {
    path: ":tab",
    component: GraphicsComponent,
    canActivate: [AuthGuard],
  },
  {
    path: "",
    component: GraphicsComponent,
    canActivate: [AuthGuard],
  },
] satisfies Routes;
