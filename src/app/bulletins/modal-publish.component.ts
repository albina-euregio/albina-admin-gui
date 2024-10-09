import { Component } from "@angular/core";
import { BsModalRef } from "ngx-bootstrap/modal";
import { CreateBulletinComponent } from "./create-bulletin.component";
import { TranslateModule } from "@ngx-translate/core";

@Component({
  selector: "app-modal-publish",
  templateUrl: "modal-publish.component.html",
  standalone: true,
  imports: [TranslateModule],
})
export class ModalPublishComponent {
  text: string;
  date: [Date, Date];
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
