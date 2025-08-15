import { CreateBulletinComponent } from "./create-bulletin.component";
import { Component, inject } from "@angular/core";
import { TranslateModule } from "@ngx-translate/core";
import { BsModalRef } from "ngx-bootstrap/modal";

@Component({
  selector: "app-modal-check",
  templateUrl: "modal-check.component.html",
  standalone: true,
  imports: [TranslateModule],
})
export class ModalCheckComponent {
  bsModalRef = inject(BsModalRef);

  text: string;
  component: CreateBulletinComponent;

  confirm(): void {
    this.component.checkBulletinsModalConfirm();
  }
}
