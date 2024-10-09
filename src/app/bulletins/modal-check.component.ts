import { Component } from "@angular/core";
import { BsModalRef } from "ngx-bootstrap/modal";
import { CreateBulletinComponent } from "./create-bulletin.component";
import { TranslateModule } from "@ngx-translate/core";

@Component({
  selector: "app-modal-check",
  templateUrl: "modal-check.component.html",
  standalone: true,
  imports: [TranslateModule],
})
export class ModalCheckComponent {
  text: string;
  component: CreateBulletinComponent;

  constructor(public bsModalRef: BsModalRef) {}

  confirm(): void {
    this.component.checkBulletinsModalConfirm();
  }
}
