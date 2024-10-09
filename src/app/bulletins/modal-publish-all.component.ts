import { Component } from "@angular/core";
import { BsModalRef } from "ngx-bootstrap/modal";
import { CreateBulletinComponent } from "./create-bulletin.component";
import { TranslateModule } from "@ngx-translate/core";

@Component({
  selector: "app-modal-publish-all",
  templateUrl: "modal-publish-all.component.html",
  standalone: true,
  imports: [TranslateModule],
})
export class ModalPublishAllComponent {
  component: CreateBulletinComponent;

  constructor(public bsModalRef: BsModalRef) {}

  publishAllModalConfirm(): void {
    this.component.publishAllModalConfirm();
  }

  publishAllModalDecline(): void {
    this.component.publishAllModalDecline();
  }
}
