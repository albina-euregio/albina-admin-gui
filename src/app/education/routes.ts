import { AuthGuard } from "../guards/auth.guard";
import { EducationComponent } from "./education.component";
import { Routes } from "@angular/router";

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
