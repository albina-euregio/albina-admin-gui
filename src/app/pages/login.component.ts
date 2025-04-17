import { Component, OnInit, TemplateRef, viewChild, inject } from "@angular/core";
import { AuthenticationService } from "../providers/authentication-service/authentication.service";
import { Router } from "@angular/router";
import { BsModalService, BsModalRef } from "ngx-bootstrap/modal";
import { environment } from "../../environments/environment";
import { DomSanitizer } from "@angular/platform-browser";
import { ConstantsService } from "app/providers/constants-service/constants.service";
import { ConfigurationService } from "app/providers/configuration-service/configuration.service";
import { FormsModule } from "@angular/forms";
import { NgIf, NgFor } from "@angular/common";
import { TranslateModule } from "@ngx-translate/core";
import { ServerConfiguration, ServerConfigurationVersion } from "../models/server-configuration.model";

@Component({
  templateUrl: "login.component.html",
  standalone: true,
  imports: [FormsModule, NgIf, NgFor, TranslateModule],
})
export class LoginComponent implements OnInit {
  private router = inject(Router);
  private authenticationService = inject(AuthenticationService);
  constantsService = inject(ConstantsService);
  configurationService = inject(ConfigurationService);
  private modalService = inject(BsModalService);
  private sanitizer = inject(DomSanitizer);

  public username: string;
  public password: string;
  public returnUrl: string;
  public loading = false;

  public errorModalRef: BsModalRef;
  readonly errorTemplate = viewChild<TemplateRef<any>>("errorTemplate");

  public config = {
    animated: false,
    keyboard: true,
    class: "modal-sm",
  };
  serverInfo: ServerConfigurationVersion;

  ngOnInit() {
    // reset login status
    // this.authenticationService.logout();

    // get return url from route parameters or default to '/'
    // console.log("Return URL: " + this.route.snapshot.queryParams['returnUrl']);
    // this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
    this.returnUrl = "/bulletins";

    this.configurationService.loadPublicLocalServerConfiguration().subscribe((info) => {
      document.title = info.name;
      return (this.serverInfo = info);
    });
  }

  getStyle() {
    const style = `background-color: ${environment.headerBgColor}`;
    return this.sanitizer.bypassSecurityTrustStyle(style);
  }

  login() {
    this.loading = true;

    this.authenticationService.login(this.username, this.password).subscribe(
      (data) => {
        if (data === true) {
          console.debug("[" + this.username + "] Logged in!");
          console.debug("Navigate to " + this.returnUrl);
          this.router.navigate([this.returnUrl]);
          this.loading = false;
        } else {
          console.error("[" + this.username + "] Login failed!");
          this.openErrorModal(this.errorTemplate());
        }
      },
      (error) => {
        console.error("[" + this.username + "] Login failed: " + JSON.stringify(error._body));
        this.openErrorModal(this.errorTemplate());
      },
    );
  }

  openErrorModal(template: TemplateRef<any>) {
    this.errorModalRef = this.modalService.show(template, this.config);
    this.modalService.onHide.subscribe((reason: string) => {
      this.loading = false;
    });
  }

  errorModalConfirm(): void {
    this.errorModalRef.hide();
    this.loading = false;
  }
}
