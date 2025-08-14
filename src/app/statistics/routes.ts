import { AuthGuard } from "../guards/auth.guard";
import { StatisticsComponent } from "./statistics.component";
import { Routes } from "@angular/router";

export default [
  {
    path: "",
    component: StatisticsComponent,
    canActivate: [AuthGuard],
    data: {
      title: "Statistics",
    },
  },
] satisfies Routes;
