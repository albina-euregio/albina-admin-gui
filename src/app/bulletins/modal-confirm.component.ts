import { Component, inject } from "@angular/core";
import { TranslateModule } from "@ngx-translate/core";
import { NgxMousetrapDirective } from "app/shared/mousetrap-directive";
import { BsModalRef } from "ngx-bootstrap/modal";

@Component({
  selector: "app-modal-confirm",
  standalone: true,
  imports: [TranslateModule, NgxMousetrapDirective],
  template: `
    <div class="modal-body text-center">
      <p class="fw-bold" [innerHTML]="text"></p>
    </div>
    <div class="modal-footer">
      <button type="button" class="btn btn-primary" (click)="confirm()" ngxMousetrapKey="enter">
        {{ "bulletins.table.publishBulletinsDialog.accept" | translate }}
      </button>
      <button type="button" class="btn btn-default" (click)="decline()">
        {{ "bulletins.table.publishBulletinsDialog.reject" | translate }}
      </button>
    </div>
  `,
})
export class ModalConfirmTriggerComponent {
  bsModalRef = inject(BsModalRef);

  text: string;
  onConfirm?: () => void;

  confirm(): void {
    this.bsModalRef.hide();
    this.onConfirm?.();
  }

  decline(): void {
    this.bsModalRef.hide();
  }
}
