import { AuthGuard } from "../guards/auth.guard";
import { Routes } from "@angular/router";
import { GraphicsComponent } from "./graphics.component";

export default [
  {
    path: "",
    data: {
      title: "Graphics",
    },
    component: GraphicsComponent,
    canActivate: [AuthGuard],
  },
] satisfies Routes;
