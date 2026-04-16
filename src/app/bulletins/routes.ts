import { Routes } from "@angular/router";

import { AuthGuard } from "../guards/auth.guard";
import { BulletinsComponent } from "./bulletins.component";
import { CreateBulletinComponent } from "./create-bulletin.component";
import { PublicationChecklistComponent } from "./publication-checklist.component";

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
    path: ":date/publication",
    component: PublicationChecklistComponent,
    canActivate: [AuthGuard],
    data: {
      title: "Publication Checklist",
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
