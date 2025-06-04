import { Component, inject } from "@angular/core";
import { BsModalRef } from "ngx-bootstrap/modal";
import { AuthenticationService } from "../providers/authentication-service/authentication.service";
import { ConstantsService } from "../providers/constants-service/constants.service";
import { BulletinsService, PublicationChannel } from "../providers/bulletins-service/bulletins.service";
import { AlertComponent, AlertModule } from "ngx-bootstrap/alert";
import { TranslateService, TranslateModule } from "@ngx-translate/core";
import { CreateBulletinComponent } from "./create-bulletin.component";
import { NgFor, DatePipe } from "@angular/common";

interface PublicationInformation {
  publicationChannel: PublicationChannel;
  debugMsg: string;
  debugErrorMsg: string;
  successMsg: string;
  errorMsg: string;
}

@Component({
  selector: "app-modal-publication-status",
  templateUrl: "modal-publication-status.component.html",
  standalone: true,
  imports: [NgFor, AlertModule, DatePipe, TranslateModule],
})
export class ModalPublicationStatusComponent {
  bsModalRef = inject(BsModalRef);
  authenticationService = inject(AuthenticationService);
  bulletinsService = inject(BulletinsService);
  constantsService = inject(ConstantsService);
  translateService = inject(TranslateService);

  json;
  date: [Date, Date];
  component: CreateBulletinComponent;

  languages = ["all", "de", "it", "en"];

  public alerts: any[] = [];

  emailPublication: PublicationInformation = {
    publicationChannel: PublicationChannel.Email,
    debugMsg: "Emails sent for %s in %s",
    debugErrorMsg: "Emails could not be sent for %s in %s!",
    successMsg: this.translateService.instant("bulletins.table.publicationStatusDialog.email.success"),
    errorMsg: this.translateService.instant("bulletins.table.publicationStatusDialog.email.error"),
  };

  telegramPublication: PublicationInformation = {
    publicationChannel: PublicationChannel.Telegram,
    debugMsg: "Telegram channel triggered for %s in %s",
    debugErrorMsg: "Telegram channel could not be triggered for %s in %s!",
    successMsg: this.translateService.instant("bulletins.table.publicationStatusDialog.telegram.success"),
    errorMsg: this.translateService.instant("bulletins.table.publicationStatusDialog.telegram.error"),
  };

  pushPublication: PublicationInformation = {
    publicationChannel: PublicationChannel.Push,
    debugMsg: "Push notifications triggered for %s in %s",
    debugErrorMsg: "Push notifications could not be triggered for %s in %s!",
    successMsg: this.translateService.instant("bulletins.table.publicationStatusDialog.push.success"),
    errorMsg: this.translateService.instant("bulletins.table.publicationStatusDialog.push.error"),
  };

  publicationStatusModalConfirm(): void {
    this.component.publicationStatusModalConfirm();
  }

  triggerPublicationChannel(event, language, publicationInformation: PublicationInformation) {
    event.stopPropagation();
    this.bulletinsService
      .triggerPublicationChannel(
        this.date,
        this.authenticationService.getActiveRegionId(),
        language,
        publicationInformation.publicationChannel,
      )
      .subscribe({
        next: () => {
          console.info(publicationInformation.debugMsg, this.authenticationService.getActiveRegionId(), language);
          window.scrollTo(0, 0);
          this.alerts.push({
            type: "success",
            msg: publicationInformation.successMsg,
            timeout: 5000,
          });
        },
        error: () => {
          console.error(publicationInformation.debugErrorMsg, this.authenticationService.getActiveRegionId(), language);
          window.scrollTo(0, 0);
          this.alerts.push({
            type: "danger",
            msg: publicationInformation.errorMsg,
            timeout: 5000,
          });
        },
      });
  }

  onClosed(dismissedAlert: AlertComponent): void {
    this.alerts = this.alerts.filter((alert) => alert !== dismissedAlert);
  }
}
