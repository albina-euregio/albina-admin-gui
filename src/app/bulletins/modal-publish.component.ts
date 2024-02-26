import { Component } from "@angular/core";
import { BsModalRef } from "ngx-bootstrap/modal";
import { CreateBulletinComponent } from "./create-bulletin.component";

@Component({
  selector: "app-modal-publish",
  templateUrl: "modal-publish.component.html",
})
export class ModalPublishComponent {
  text: string;
  date;
  change: boolean;
  component: CreateBulletinComponent;

  constructor(public bsModalRef: BsModalRef) {}

  publishBulletinsModalConfirm(): void {
    this.component.publishBulletinsModalConfirm(this.date, this.change);
  }

  publishBulletinsModalDecline(): void {
    this.component.publishBulletinsModalDecline();
  }
}
