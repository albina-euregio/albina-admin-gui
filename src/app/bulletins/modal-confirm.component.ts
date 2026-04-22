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
      <p [innerHTML]="text"></p>
    </div>
    <div class="modal-footer">
      <button type="button" class="btn btn-primary" (click)="confirm()" ngxMousetrapKey="enter">
        {{ acceptKey | translate }}
      </button>
      @if (rejectKey) {
        <button type="button" class="btn btn-default" (click)="decline()">
          {{ rejectKey | translate }}
        </button>
      }
    </div>
  `,
})
export class ModalConfirmComponent {
  bsModalRef = inject(BsModalRef);

  text: string;
  acceptKey = "button.ok";
  rejectKey: string | undefined = "button.no";
  onConfirm?: () => void;

  confirm(): void {
    this.bsModalRef.hide();
    this.onConfirm?.();
  }

  decline(): void {
    this.bsModalRef.hide();
  }
}
