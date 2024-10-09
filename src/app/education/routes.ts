import { Routes } from "@angular/router";
import { AuthGuard } from "../guards/auth.guard";
import { EducationComponent } from "./education.component";

export default [
  {
    path: "",
    component: EducationComponent,
    canActivate: [AuthGuard],
    data: {
      title: "Education",
    },
  },
] satisfies Routes;
