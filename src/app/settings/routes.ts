import { AuthGuard } from "../guards/auth.guard";
import { SettingsComponent } from "./settings.component";
import { Routes } from "@angular/router";

export default [
  {
    path: "",
    component: SettingsComponent,
    canActivate: [AuthGuard],
    data: {
      title: "Settings",
    },
  },
] satisfies Routes;
