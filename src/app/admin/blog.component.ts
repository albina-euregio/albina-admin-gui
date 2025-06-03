import { Component, inject } from "@angular/core";
import { TranslateService, TranslateModule } from "@ngx-translate/core";
import { RegionsService } from "../providers/regions-service/regions.service";
import { BlogService, PublicationChannel } from "../providers/blog-service/blog.service";
import { AlertComponent, AlertModule } from "ngx-bootstrap/alert";
import { NgFor } from "@angular/common";

interface PublicationInformation {
  publicationChannel: PublicationChannel;
  debugMsg: string;
  debugErrorMsg: string;
  successMsg: string;
  errorMsg: string;
}

@Component({
  templateUrl: "blog.component.html",
  selector: "app-blog",
  standalone: true,
  imports: [NgFor, AlertModule, TranslateModule],
})
export class BlogComponent {
  blogService = inject(BlogService);
  regionsService = inject(RegionsService);
  translateService = inject(TranslateService);

  public alerts: any[] = [];

  sendAll: PublicationInformation = {
    publicationChannel: PublicationChannel.All,
    debugMsg: "Email, telegram, whatsapp and push sent!",
    debugErrorMsg: "Email, telegram, whatsapp and push could not be sent!",
    successMsg: this.translateService.instant("admin.blog.all.success"),
    errorMsg: this.translateService.instant("admin.blog.all.error"),
  };

  sendEmail: PublicationInformation = {
    publicationChannel: PublicationChannel.Email,
    debugMsg: "Email sent!",
    successMsg: this.translateService.instant("admin.blog.email.success"),
    debugErrorMsg: "Email could not be sent!",
    errorMsg: this.translateService.instant("admin.blog.email.error"),
  };

  sendTelegram: PublicationInformation = {
    publicationChannel: PublicationChannel.Telegram,
    debugMsg: "Telegram sent!",
    debugErrorMsg: "Telegram could not be sent!",
    successMsg: this.translateService.instant("admin.blog.telegram.success"),
    errorMsg: this.translateService.instant("admin.blog.telegram.error"),
  };

  sendWhatsapp: PublicationInformation = {
    publicationChannel: PublicationChannel.WhatsApp,
    debugMsg: "WhatsApp sent!",
    debugErrorMsg: "WhatsApp could not be sent!",
    successMsg: this.translateService.instant("admin.blog.whatsapp.success"),
    errorMsg: this.translateService.instant("admin.blog.whatsapp.error"),
  };

  sendPush: PublicationInformation = {
    publicationChannel: PublicationChannel.Push,
    debugMsg: "Push sent!",
    debugErrorMsg: "Push could not be sent!",
    successMsg: this.translateService.instant("admin.blog.push.success"),
    errorMsg: this.translateService.instant("admin.blog.push.error"),
  };

  sendLatestBlogPost(event, region, language, publicationInformation: PublicationInformation) {
    event.stopPropagation();
    this.blogService
      .sendLatestBlogPostToChannel(region, language, publicationInformation.publicationChannel)
      .subscribe({
        next: () => {
          console.debug(publicationInformation.debugMsg);
          window.scrollTo(0, 0);
          this.alerts.push({
            type: "success",
            msg: publicationInformation.successMsg,
            timeout: 5000,
          });
        },
        error: () => {
          console.error(publicationInformation.debugErrorMsg);
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
