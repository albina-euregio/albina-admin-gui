import { Component, inject } from "@angular/core";
import { BsModalRef } from "ngx-bootstrap/modal";
import { AuthenticationService } from "../providers/authentication-service/authentication.service";
import { ConstantsService } from "../providers/constants-service/constants.service";
import { BulletinsService, PublicationChannel } from "../providers/bulletins-service/bulletins.service";
import { AlertComponent, AlertModule } from "ngx-bootstrap/alert";
import { TranslateService, TranslateModule } from "@ngx-translate/core";
import { CreateBulletinComponent } from "./create-bulletin.component";
import { NgFor, DatePipe } from "@angular/common";

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

  publicationStatusModalConfirm(): void {
    this.component.publicationStatusModalConfirm();
  }

  sendEmail(event, language) {
    event.stopPropagation();
    this.bulletinsService
      .triggerPublicationChannel(
        this.date,
        this.authenticationService.getActiveRegionId(),
        language,
        PublicationChannel.Email,
      )
      .subscribe(
        (data) => {
          console.info("Emails sent for %s in %s", this.authenticationService.getActiveRegionId(), language);
          window.scrollTo(0, 0);
          this.alerts.push({
            type: "success",
            msg: this.translateService.instant("bulletins.table.publicationStatusDialog.email.success", { prefix: "" }),
            timeout: 5000,
          });
        },
        (error) => {
          console.error(
            "Emails could not be sent for %s in %s!",
            this.authenticationService.getActiveRegionId(),
            language,
          );
          window.scrollTo(0, 0);
          this.alerts.push({
            type: "danger",
            msg: this.translateService.instant("bulletins.table.publicationStatusDialog.email.error", { prefix: "" }),
            timeout: 5000,
          });
        },
      );
  }

  triggerTelegramChannel(event, language) {
    event.stopPropagation();
    this.bulletinsService
      .triggerPublicationChannel(
        this.date,
        this.authenticationService.getActiveRegionId(),
        language,
        PublicationChannel.Telegram,
      )
      .subscribe(
        (data) => {
          console.info(
            "Telegram channel triggered for %s in %s",
            this.authenticationService.getActiveRegionId(),
            language,
          );
          window.scrollTo(0, 0);
          this.alerts.push({
            type: "success",
            msg: this.translateService.instant("bulletins.table.publicationStatusDialog.telegram.success", {
              prefix: "",
            }),
            timeout: 5000,
          });
        },
        (error) => {
          console.error(
            "Telegram channel could not be triggered for %s in %s!",
            this.authenticationService.getActiveRegionId(),
            language,
          );
          window.scrollTo(0, 0);
          this.alerts.push({
            type: "danger",
            msg: this.translateService.instant("bulletins.table.publicationStatusDialog.telegram.error", {
              prefix: "",
            }),
            timeout: 5000,
          });
        },
      );
  }

  triggerPushNotifications(event, language) {
    event.stopPropagation();

    this.bulletinsService
      .triggerPublicationChannel(
        this.date,
        this.authenticationService.getActiveRegionId(),
        language,
        PublicationChannel.Push,
      )
      .subscribe(
        (data) => {
          console.info(
            "Push notifications triggered for %s in %s",
            this.authenticationService.getActiveRegionId(),
            language,
          );
          window.scrollTo(0, 0);
          this.alerts.push({
            type: "success",
            msg: this.translateService.instant("bulletins.table.publicationStatusDialog.push.success", { prefix: "" }),
            timeout: 5000,
          });
        },
        (error) => {
          console.error(
            "Push notifications could not be triggered for %s in %s!",
            this.authenticationService.getActiveRegionId(),
            language,
          );
          window.scrollTo(0, 0);
          this.alerts.push({
            type: "danger",
            msg: this.translateService.instant("bulletins.table.publicationStatusDialog.push.error", { prefix: "" }),
            timeout: 5000,
          });
        },
      );
  }

  onClosed(dismissedAlert: AlertComponent): void {
    this.alerts = this.alerts.filter((alert) => alert !== dismissedAlert);
  }
}
