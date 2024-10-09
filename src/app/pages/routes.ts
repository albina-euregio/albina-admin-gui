import { Routes } from "@angular/router";
import { AuthGuard } from "../guards/auth.guard";
import { P404Component } from "./404.component";
import { P500Component } from "./500.component";
import { LoginComponent } from "./login.component";

export default [
  {
    path: "",
    data: {
      title: "Example Pages",
    },
    children: [
      {
        path: "404",
        component: P404Component,
        canActivate: [AuthGuard],
        data: {
          title: "Page 404",
        },
      },
      {
        path: "500",
        component: P500Component,
        canActivate: [AuthGuard],
        data: {
          title: "Page 500",
        },
      },
      {
        path: "login",
        component: LoginComponent,
        data: {
          title: "Login Page",
        },
      },
    ],
  },
] satisfies Routes;
