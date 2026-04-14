import { Component, inject, input } from "@angular/core";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { PublicationChannel } from "app/enums/enums";
import { AlertModule } from "ngx-bootstrap/alert";

import { Alert } from "../models/Alert";
import { BulletinsService } from "../providers/bulletins-service/bulletins.service";

@Component({
  selector: "app-publication-trigger-notifications",
  standalone: true,
  imports: [AlertModule, TranslateModule],
  template: `
    <div class="d-flex flex-wrap gap-2 align-items-center mt-2">
      @for (language of languages; track language) {
        <button
          type="button"
          class="btn btn-secondary btn-sm"
          (click)="triggerPublicationChannel($event, language)"
          [title]="'bulletins.table.publicationStatusDialog.title.language.' + language | translate"
        >
          <i class="mx-1" [class]="iconClass()"></i>
          {{ "bulletins.table.publicationStatusDialog.title.language." + language | translate }}
        </button>
      }
    </div>

    @for (alert of alerts; track alert) {
      <div class="mt-2">
        <alert [type]="alert.type" [dismissOnTimeout]="alert.timeout" (onClosed)="onClosed(alert)">
          {{ alert.msg }}
        </alert>
      </div>
    }
  `,
})
export class PublicationTriggerNotificationsComponent {
  private bulletinsService = inject(BulletinsService);
  private translateService = inject(TranslateService);

  readonly date = input.required<[Date, Date]>();
  readonly regionId = input.required<string>();
  readonly publicationChannel = input.required<PublicationChannel>();
  readonly iconClass = input.required<string>();

  readonly languages = ["de", "it", "en", "all"];

  alerts: Alert[] = [];

  triggerPublicationChannel(event: Event, language: string) {
    event.stopPropagation();

    this.bulletinsService
      .triggerPublicationChannel(this.date(), this.regionId(), language, this.publicationChannel())
      .subscribe({
        next: () => {
          this.alerts.push({
            type: "success",
            msg: this.translateService.instant(this.getSuccessTranslationKey()),
            timeout: 5000,
          });
        },
        error: () => {
          this.alerts.push({
            type: "danger",
            msg: this.translateService.instant(this.getErrorTranslationKey()),
            timeout: 5000,
          });
        },
      });
  }

  onClosed(dismissedAlert: Alert): void {
    this.alerts = this.alerts.filter((alert) => alert !== dismissedAlert);
  }

  private getSuccessTranslationKey() {
    switch (this.publicationChannel()) {
      case PublicationChannel.Email:
        return "bulletins.table.publicationStatusDialog.email.success";
      case PublicationChannel.Telegram:
        return "bulletins.table.publicationStatusDialog.telegram.success";
      case PublicationChannel.WhatsApp:
        return "bulletins.table.publicationStatusDialog.whatsapp.success";
      default:
        return "bulletins.table.publicationStatusDialog.push.success";
    }
  }

  private getErrorTranslationKey() {
    switch (this.publicationChannel()) {
      case PublicationChannel.Email:
        return "bulletins.table.publicationStatusDialog.email.error";
      case PublicationChannel.Telegram:
        return "bulletins.table.publicationStatusDialog.telegram.error";
      case PublicationChannel.WhatsApp:
        return "bulletins.table.publicationStatusDialog.whatsapp.error";
      default:
        return "bulletins.table.publicationStatusDialog.push.error";
    }
  }
}
