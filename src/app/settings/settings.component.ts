import { Alert } from "../models/Alert";
import { AuthenticationService } from "../providers/authentication-service/authentication.service";
import { ConstantsService } from "../providers/constants-service/constants.service";
import { LocalStorageService } from "../providers/local-storage-service/local-storage.service";
import { NgFor } from "@angular/common";
import { Component, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { TranslateModule } from "@ngx-translate/core";
import { ChangePasswordComponent } from "app/admin/change-password.component";
import { UpdateUserComponent } from "app/admin/update-user.component";
import { UserModel, UserSchema } from "app/models/user.model";
import { AlertModule } from "ngx-bootstrap/alert";
import { BsModalService } from "ngx-bootstrap/modal";

@Component({
  templateUrl: "settings.component.html",
  standalone: true,
  imports: [NgFor, AlertModule, FormsModule, TranslateModule],
})
export class SettingsComponent {
  authenticationService = inject(AuthenticationService);
  localStorageService = inject(LocalStorageService);
  private modalService = inject(BsModalService);
  private constantsService = inject(ConstantsService);

  public oldPassword: string;
  public newPassword1: string;
  public newPassword2: string;

  public alerts: Alert[] = [];

  showUpdateDialog() {
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

  editUser() {
    this.showUpdateDialog();
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

  changePassword() {
    this.showChangePasswordDialog();
  }

  onClosed(dismissedAlert: Alert): void {
    this.alerts = this.alerts.filter((alert) => alert !== dismissedAlert);
  }

  isAdmin() {
    return this.authenticationService.isCurrentUserInRole(this.constantsService.roleAdmin);
  }
}
