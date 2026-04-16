import { Component, inject } from "@angular/core";
import { TranslateModule } from "@ngx-translate/core";
import { AuthenticationService } from "app/providers/authentication-service/authentication.service";
import { BulletinsService } from "app/providers/bulletins-service/bulletins.service";
import { NgxMousetrapDirective } from "app/shared/mousetrap-directive";
import { BsModalRef } from "ngx-bootstrap/modal";

interface PublishModalCallbacks {
  onSuccess?: () => void;
  onError?: (error: unknown, change: boolean) => void;
  onDecline?: () => void;
}

@Component({
  selector: "app-modal-publish",
  templateUrl: "modal-publish.component.html",
  standalone: true,
  imports: [TranslateModule, NgxMousetrapDirective],
})
export class ModalPublishComponent {
  bsModalRef = inject(BsModalRef);
  private bulletinsService = inject(BulletinsService);
  private authenticationService = inject(AuthenticationService);

  text: string;
  date: [Date, Date];
  change: boolean;
  callbacks?: PublishModalCallbacks;

  publishBulletinsModalConfirm(): void {
    this.bsModalRef.hide();
    this.bulletinsService
      .publishOrChangeBulletins(this.date, this.authenticationService.getActiveRegionId(), this.change)
      .subscribe(
        () => {
          this.callbacks?.onSuccess?.();
        },
        (error) => {
          this.callbacks?.onError?.(error, this.change);
        },
      );
  }

  publishBulletinsModalDecline(): void {
    this.bsModalRef.hide();
    this.callbacks?.onDecline?.();
  }
}
