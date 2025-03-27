import { Component, inject } from "@angular/core";
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
  bsModalRef = inject(BsModalRef);

  text: string;
  change: boolean;
  component: CreateBulletinComponent;

  publishAllModalConfirm(): void {
    this.component.publishAllModalConfirm(this.change);
  }

  publishAllModalDecline(): void {
    this.component.publishAllModalDecline();
  }
}
