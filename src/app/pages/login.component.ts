import { Component, OnInit, TemplateRef, viewChild, inject, ChangeDetectionStrategy, DestroyRef } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { DomSanitizer } from "@angular/platform-browser";
import { Router } from "@angular/router";
import { TranslatePipe } from "@ngx-translate/core";
import { ConfigurationService } from "app/providers/configuration-service/configuration.service";
import { ConstantsService } from "app/providers/constants-service/constants.service";
import { isWebAuthnSupported } from "app/shared/webauthn-util";
import { BsModalService, BsModalRef } from "ngx-bootstrap/modal";

import { environment } from "../../environments/environment";
import { ServerVersionInfo } from "../models/server-configuration.model";
import { AuthenticationService } from "../providers/authentication-service/authentication.service";

@Component({
  templateUrl: "login.component.html",
  standalone: true,
  imports: [FormsModule, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.Eager,
  providers: [ConfigurationService],
})
export class LoginComponent implements OnInit {
  private router = inject(Router);
  private authenticationService = inject(AuthenticationService);
  private destroyRef = inject(DestroyRef);
  constantsService = inject(ConstantsService);
  configurationService = inject(ConfigurationService);
  private modalService = inject(BsModalService);
  private sanitizer = inject(DomSanitizer);

  public username: string;
  public password: string;
  public returnUrl: string;
  public loading = false;
  public passkeySupported = isWebAuthnSupported();
  private conditionalPasskeyAbortController?: AbortController;

  public errorModalRef: BsModalRef;
  readonly errorTemplate = viewChild<TemplateRef<unknown>>("errorTemplate");

  public config = {
    animated: false,
    keyboard: true,
    class: "modal-sm",
  };
  serverInfo: ServerVersionInfo;

  ngOnInit() {
    // reset login status
    // this.authenticationService.logout();

    // get return url from route parameters or default to '/'
    // console.log("Return URL: " + this.route.snapshot.queryParams['returnUrl']);
    // this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
    this.returnUrl = "/bulletins";

    this.configurationService.loadPublicLocalServerConfiguration().subscribe((info) => {
      // document.title = info.name;
      this.serverInfo = info;
    });

    this.tryConditionalPasskeyLogin();
  }

  /**
   * Offers passkeys through the browser's native autofill UI (triggered by focusing the username
   * field, thanks to `autocomplete="username webauthn"`) rather than a separate button — see
   * https://developer.mozilla.org/en-US/docs/Web/Security/Authentication/Passkeys#offering_autofill_for_passkeys
   */
  private async tryConditionalPasskeyLogin() {
    if (!this.passkeySupported || !(await PublicKeyCredential.isConditionalMediationAvailable?.())) {
      return;
    }
    this.conditionalPasskeyAbortController = new AbortController();
    this.destroyRef.onDestroy(() => this.conditionalPasskeyAbortController?.abort());
    this.authenticationService
      .loginWithPasskey(undefined, { signal: this.conditionalPasskeyAbortController.signal, mediation: "conditional" })
      .subscribe({
        next: (ok) => {
          if (ok) {
            this.router.navigate([this.returnUrl]);
          }
        },
        // the user dismissed the autofill prompt, or the component was destroyed: nothing to show
        error: () => undefined,
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
        console.error("[" + this.username + "] Login failed: " + JSON.stringify(error._body), error);
        this.openErrorModal(this.errorTemplate());
      },
    );
  }

  loginWithPasskey() {
    // an explicit login and the background conditional one can't run concurrently
    this.conditionalPasskeyAbortController?.abort();
    this.loading = true;

    this.authenticationService.loginWithPasskey(this.username || undefined).subscribe({
      next: (ok) => {
        this.loading = false;
        if (ok) {
          this.router.navigate([this.returnUrl]);
        } else {
          this.openErrorModal(this.errorTemplate());
        }
      },
      error: (error) => {
        console.error("Passkey login failed", error);
        this.loading = false;
        this.openErrorModal(this.errorTemplate());
      },
    });
  }

  openErrorModal(template: TemplateRef<unknown>) {
    this.errorModalRef = this.modalService.show(template, this.config);
    this.modalService.onHide.subscribe(() => {
      this.loading = false;
    });
  }

  errorModalConfirm(): void {
    this.errorModalRef.hide();
    this.loading = false;
  }

  protected readonly environment = environment;
}
