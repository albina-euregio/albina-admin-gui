import { Component } from "@angular/core";
import { BsModalRef } from "ngx-bootstrap/modal";
import { CreateBulletinComponent } from "./create-bulletin.component";

@Component({
  selector: "app-modal-publish-all",
  templateUrl: "modal-publish-all.component.html",
})
export class ModalPublishAllComponent {
  date;
  component: CreateBulletinComponent;

  constructor(public bsModalRef: BsModalRef) {}

  publishAllModalConfirm(): void {
    this.component.publishAllModalConfirm();
  }

  publishAllModalDecline(): void {
    this.component.publishAllModalDecline();
  }
}
