import { Component, inject } from "@angular/core";
import { BsModalRef } from "ngx-bootstrap/modal";
import { CreateBulletinComponent } from "./create-bulletin.component";
import { TranslateModule } from "@ngx-translate/core";

@Component({
  selector: "app-modal-submit",
  templateUrl: "modal-submit.component.html",
  standalone: true,
  imports: [TranslateModule],
})
export class ModalSubmitComponent {
  bsModalRef = inject(BsModalRef);

  text: string;
  date: [Date, Date];
  component: CreateBulletinComponent;

  submitBulletinsModalConfirm(): void {
    this.component.submitBulletinsModalConfirm(this.date);
  }

  submitBulletinsModalDecline(): void {
    this.component.submitBulletinsModalDecline();
  }
}
