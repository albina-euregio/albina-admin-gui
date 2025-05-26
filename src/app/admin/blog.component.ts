import { Component, inject } from "@angular/core";
import { TranslateService, TranslateModule } from "@ngx-translate/core";
import { RegionsService } from "../providers/regions-service/regions.service";
import { AuthenticationService } from "../providers/authentication-service/authentication.service";
import { BlogService } from "../providers/blog-service/blog.service";
import { AlertComponent, AlertModule } from "ngx-bootstrap/alert";
import { NgFor, NgIf } from "@angular/common";
import { ConstantsService } from "app/providers/constants-service/constants.service";

@Component({
  templateUrl: "blog.component.html",
  selector: "app-blog",
  standalone: true,
  imports: [NgFor, NgIf, AlertModule, TranslateModule],
})
export class BlogComponent {
  blogService = inject(BlogService);
  regionsService = inject(RegionsService);
  authenticationService = inject(AuthenticationService);
  constantsService = inject(ConstantsService);
  translateService = inject(TranslateService);

  public alerts: any[] = [];

  sendLatestBlogPost(event, region, language, test) {
    event.stopPropagation();
    const prefix = test ? "[TEST] " : "";
    this.blogService.sendLatestBlogPost(region, language, test).subscribe(
      (data) => {
        console.debug("Email, telegram and push sent!");
        window.scrollTo(0, 0);
        this.alerts.push({
          type: "success",
          msg: this.translateService.instant("admin.blog.all.success", { prefix: prefix }),
          timeout: 5000,
        });
      },
      (error) => {
        console.error("Email, telegram and push could not be sent!");
        window.scrollTo(0, 0);
        this.alerts.push({
          type: "danger",
          msg: this.translateService.instant("admin.blog.all.error", { prefix: prefix }),
          timeout: 5000,
        });
      },
    );
  }

  sendLatestBlogPostEmail(event, region, language, test) {
    event.stopPropagation();
    const prefix = test ? "[TEST] " : "";
    this.blogService.sendLatestBlogPostEmail(region, language, test).subscribe(
      (data) => {
        console.debug("Email sent!");
        window.scrollTo(0, 0);
        this.alerts.push({
          type: "success",
          msg: this.translateService.instant("admin.blog.email.success", { prefix: prefix }),
          timeout: 5000,
        });
      },
      (error) => {
        console.error("Email could not be sent!");
        window.scrollTo(0, 0);
        this.alerts.push({
          type: "danger",
          msg: this.translateService.instant("admin.blog.email.error", { prefix: prefix }),
          timeout: 5000,
        });
      },
    );
  }

  sendLatestBlogPostTelegram(event, region, language, test) {
    event.stopPropagation();
    const prefix = test ? "[TEST] " : "";
    this.blogService.sendLatestBlogPostTelegram(region, language, test).subscribe(
      (data) => {
        console.debug("Telegram sent!");
        window.scrollTo(0, 0);
        this.alerts.push({
          type: "success",
          msg: this.translateService.instant("admin.blog.telegram.success", { prefix: prefix }),
          timeout: 5000,
        });
      },
      (error) => {
        console.error("Telegram could not be sent!");
        window.scrollTo(0, 0);
        this.alerts.push({
          type: "danger",
          msg: this.translateService.instant("admin.blog.telegram.error", { prefix: prefix }),
          timeout: 5000,
        });
      },
    );
  }

  sendLatestBlogPostPush(event, region, language, test) {
    event.stopPropagation();
    const prefix = test ? "[TEST] " : "";
    this.blogService.sendLatestBlogPostPush(region, language, test).subscribe(
      (data) => {
        console.debug("Push sent!");
        window.scrollTo(0, 0);
        this.alerts.push({
          type: "success",
          msg: this.translateService.instant("admin.blog.push.success", { prefix: prefix }),
          timeout: 5000,
        });
      },
      (error) => {
        console.error("Push could not be sent!");
        window.scrollTo(0, 0);
        this.alerts.push({
          type: "danger",
          msg: this.translateService.instant("admin.blog.push.error", { prefix: prefix }),
          timeout: 5000,
        });
      },
    );
  }

  onClosed(dismissedAlert: AlertComponent): void {
    this.alerts = this.alerts.filter((alert) => alert !== dismissedAlert);
  }
}
