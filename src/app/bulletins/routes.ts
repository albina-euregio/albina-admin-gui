import { Routes } from "@angular/router";
import { AuthGuard } from "../guards/auth.guard";
import { BulletinsComponent } from "./bulletins.component";
import { CreateBulletinComponent } from "./create-bulletin.component";

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
] satisfies Routes;
