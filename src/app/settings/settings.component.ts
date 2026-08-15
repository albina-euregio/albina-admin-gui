import { DatePipe } from "@angular/common";
import { Component, inject, ChangeDetectionStrategy, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { TranslateService, TranslatePipe } from "@ngx-translate/core";
import { browserSupportsWebAuthn } from "@simplewebauthn/browser";
import { ChangePasswordComponent } from "app/admin/change-password.component";
import { UpdateUserComponent } from "app/admin/update-user.component";
import { UserModel, UserSchema } from "app/models/user.model";
import { PasskeyServicePasskeyInfo } from "app/providers/albina-api";
import { AlertModule } from "ngx-bootstrap/alert";
import { BsModalService } from "ngx-bootstrap/modal";

import { Alert } from "../models/Alert";
import { AuthenticationService } from "../providers/authentication-service/authentication.service";
import { ConstantsService } from "../providers/constants-service/constants.service";
import { LocalStorageService } from "../providers/local-storage-service/local-storage.service";

@Component({
  templateUrl: "settings.component.html",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [AlertModule, DatePipe, FormsModule, TranslatePipe],
})
export class SettingsComponent implements OnInit {
  authenticationService = inject(AuthenticationService);
  localStorageService = inject(LocalStorageService);
  private modalService = inject(BsModalService);
  private constantsService = inject(ConstantsService);
  private translateService = inject(TranslateService);

  public alerts: Alert[] = [];

  public passkeySupported = browserSupportsWebAuthn();
  public passkeys: PasskeyServicePasskeyInfo[] = [];
  public newPasskeyName = "";
  public passkeyBusy = false;

  ngOnInit() {
    this.loadPasskeys();
  }

  private loadPasskeys() {
    if (!this.passkeySupported) {
      return;
    }
    this.authenticationService.listPasskeys().subscribe({
      next: (passkeys) => (this.passkeys = passkeys),
      error: (error) => console.error("Could not load passkeys", error),
    });
  }

  addPasskey() {
    this.passkeyBusy = true;
    this.authenticationService.registerPasskey(this.newPasskeyName || undefined).subscribe({
      next: () => {
        this.passkeyBusy = false;
        this.newPasskeyName = "";
        this.loadPasskeys();
        this.alerts.push({
          type: "success",
          msg: this.translateService.instant("settings.passkeys.added"),
          timeout: 5000,
        });
      },
      error: (error) => {
        console.error("Could not add passkey", error);
        this.passkeyBusy = false;
        this.alerts.push({
          type: "danger",
          msg: this.translateService.instant("settings.passkeys.addError"),
          timeout: 5000,
        });
      },
    });
  }

  deletePasskey(passkey: PasskeyServicePasskeyInfo) {
    this.authenticationService.deletePasskey(passkey.id).subscribe({
      next: () => this.loadPasskeys(),
      error: (error) => {
        console.error("Could not delete passkey", error);
        this.alerts.push({
          type: "danger",
          msg: this.translateService.instant("settings.passkeys.deleteError"),
          timeout: 5000,
        });
      },
    });
  }

  showUpdateUserDialog() {
    const author = this.authenticationService.getCurrentAuthor();
    const user: UserModel = UserSchema.parse({
      email: author.email,
      name: author.name,
      organization: author.organization,
      image: author.image,
      roles: author.roles,
      regions: author.regions,
    });

    const dialogRef = this.modalService.show(UpdateUserComponent, {
      class: "modal-xl",
      initialState: {
        user: user,
        update: true,
        isAdmin: false,
      },
    });
    dialogRef.onHide.subscribe(() => {
      window.scrollTo(0, 0);
      const data = dialogRef.content.result;
      if (data !== undefined && data !== "") {
        this.alerts.push({
          type: data.type,
          msg: data.msg,
          timeout: 5000,
        });
      }
    });
  }

  showChangePasswordDialog() {
    const dialogRef = this.modalService.show(ChangePasswordComponent, {
      initialState: {
        isAdmin: false,
      },
    });
    dialogRef.onHide.subscribe(() => {
      const data = dialogRef.content.result;
      if (data) {
        window.scrollTo(0, 0);
        this.alerts.push({
          type: data.type,
          msg: data.msg,
          timeout: 5000,
        });
      }
    });
  }

  onClosed(dismissedAlert: Alert): void {
    this.alerts = this.alerts.filter((alert) => alert !== dismissedAlert);
  }

  isAdmin() {
    return this.authenticationService.isCurrentUserInRole("ADMIN");
  }

  /** The roles granted to the current user, selectable as the effective role. */
  get roles() {
    return this.authenticationService.getCurrentAuthor()?.roles ?? [];
  }
}
