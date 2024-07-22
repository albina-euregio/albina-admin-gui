import { Component } from "@angular/core";
import { BsModalRef } from "ngx-bootstrap/modal";
import { CreateBulletinComponent } from "./create-bulletin.component";

@Component({
  selector: "app-modal-submit",
  templateUrl: "modal-submit.component.html",
})
export class ModalSubmitComponent {
  text: string;
  date: [Date, Date];
  component: CreateBulletinComponent;

  constructor(public bsModalRef: BsModalRef) {}

  submitBulletinsModalConfirm(): void {
    this.component.submitBulletinsModalConfirm(this.date);
  }

  submitBulletinsModalDecline(): void {
    this.component.submitBulletinsModalDecline();
  }
}
