import { Routes } from "@angular/router";

import { AuthGuard } from "../guards/auth.guard";
import { GraphicsComponent } from "./graphics.component";

export default [
  {
    path: ":tab",
    data: {
      title: "Graphics",
    },
    component: GraphicsComponent,
    canActivate: [AuthGuard],
  },
  {
    path: "",
    data: {
      title: "Graphics",
    },
    component: GraphicsComponent,
    canActivate: [AuthGuard],
  },
] satisfies Routes;
