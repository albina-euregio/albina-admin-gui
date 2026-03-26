import { Component, inject } from "@angular/core";
import { TranslateModule } from "@ngx-translate/core";
import { BsModalRef } from "ngx-bootstrap/modal";

import { CreateBulletinComponent } from "./create-bulletin.component";

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
