import { Routes } from "@angular/router";

import { LoginComponent } from "./login.component";

export default [
  {
    path: "",
    children: [
      {
        path: "login",
        title: "login.title",
        component: LoginComponent,
      },
    ],
  },
] satisfies Routes;
