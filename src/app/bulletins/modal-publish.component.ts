import { CreateBulletinComponent } from "./create-bulletin.component";
import { Component, inject } from "@angular/core";
import { TranslateModule } from "@ngx-translate/core";
import { NgxMousetrapDirective } from "app/shared/mousetrap-directive";
import { BsModalRef } from "ngx-bootstrap/modal";

@Component({
  selector: "app-modal-publish",
  templateUrl: "modal-publish.component.html",
  standalone: true,
  imports: [TranslateModule, NgxMousetrapDirective],
})
export class ModalPublishComponent {
  bsModalRef = inject(BsModalRef);

  text: string;
  date: [Date, Date];
  change: boolean;
  component: CreateBulletinComponent;

  publishBulletinsModalConfirm(): void {
    this.component.publishBulletinsModalConfirm(this.date, this.change);
  }

  publishBulletinsModalDecline(): void {
    this.component.publishBulletinsModalDecline();
  }
}
