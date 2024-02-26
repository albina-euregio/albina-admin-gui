import { Component } from "@angular/core";
import { BsModalRef } from "ngx-bootstrap/modal";
import { CreateBulletinComponent } from "./create-bulletin.component";

@Component({
  selector: "app-modal-check",
  templateUrl: "modal-check.component.html",
})
export class ModalCheckComponent {
  text: string;
  date;
  component: CreateBulletinComponent;

  constructor(public bsModalRef: BsModalRef) {}

  confirm(): void {
    this.component.checkBulletinsModalConfirm();
  }
}
