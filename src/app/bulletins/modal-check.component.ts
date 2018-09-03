import { Component } from '@angular/core';
import { BsModalRef } from 'ngx-bootstrap/modal/bs-modal-ref.service';

@Component({
  selector: 'modal-check',
  templateUrl: 'modal-check.component.html'
})
 
export class ModalCheckComponent {
  text: string;
  date;
  component;
 
  constructor(public bsModalRef: BsModalRef) {
  }

  confirm(): void {
    this.component.checkBulletinsModalConfirm();
  }
}