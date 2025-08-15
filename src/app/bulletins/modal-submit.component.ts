import { NgxMousetrapDirective } from "../shared/mousetrap-directive";
import { CreateBulletinComponent } from "./create-bulletin.component";
import { Component, inject } from "@angular/core";
import { TranslateModule } from "@ngx-translate/core";
import { BsModalRef } from "ngx-bootstrap/modal";

@Component({
  selector: "app-modal-submit",
  templateUrl: "modal-submit.component.html",
  standalone: true,
  imports: [TranslateModule, NgxMousetrapDirective],
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
