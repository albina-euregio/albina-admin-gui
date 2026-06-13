import { Routes } from "@angular/router";

import { LoginComponent } from "./login.component";

export default [
  {
    path: "",
    children: [
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
