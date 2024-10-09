import { Routes } from "@angular/router";
import { AuthGuard } from "../guards/auth.guard";
import { BulletinsComponent } from "./bulletins.component";
import { CaamlComponent } from "./caaml.component";
import { CreateBulletinComponent } from "./create-bulletin.component";
import { JsonComponent } from "./json.component";

export default [
  {
    path: "",
    component: BulletinsComponent,
    canActivate: [AuthGuard],
    data: {
      title: "Bulletins",
    },
  },
  {
    path: ":date",
    component: CreateBulletinComponent,
    canActivate: [AuthGuard],
    data: {
      title: "New Bulletin",
    },
  },
  {
    path: "caaml",
    component: CaamlComponent,
    canActivate: [AuthGuard],
    data: {
      title: "CAAML",
    },
  },
  {
    path: "json",
    component: JsonComponent,
    canActivate: [AuthGuard],
    data: {
      title: "JSON",
    },
  },
] satisfies Routes;
