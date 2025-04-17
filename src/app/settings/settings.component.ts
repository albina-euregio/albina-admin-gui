import { Component, inject } from "@angular/core";
import { TranslateModule } from "@ngx-translate/core";
import { AuthenticationService } from "../providers/authentication-service/authentication.service";
import { ConstantsService } from "../providers/constants-service/constants.service";
import { LocalStorageService } from "../providers/local-storage-service/local-storage.service";
import { AlertComponent, AlertModule } from "ngx-bootstrap/alert";
import { UpdateUserComponent } from "app/admin/update-user.component";
import { ChangePasswordComponent } from "app/admin/change-password.component";
import { UserModel } from "app/models/user.model";
import { BsModalService } from "ngx-bootstrap/modal";
import { NgFor } from "@angular/common";
import { FormsModule } from "@angular/forms";

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

  public alerts: any[] = [];

  showUpdateDialog() {
    const user = new UserModel();
    user.email = this.authenticationService.getCurrentAuthor().email;
    user.name = this.authenticationService.getCurrentAuthor().name;
    user.organization = this.authenticationService.getCurrentAuthor().organization;
    user.image = this.authenticationService.getCurrentAuthor().image;
    user.roles = this.authenticationService.getCurrentAuthor().roles;
    user.regions = this.authenticationService.getCurrentAuthor().regions.map((region) => region.id);

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

  editUser(event) {
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

  changePassword(event) {
    this.showChangePasswordDialog();
  }

  onClosed(dismissedAlert: AlertComponent): void {
    this.alerts = this.alerts.filter((alert) => alert !== dismissedAlert);
  }

  isAdmin() {
    return this.authenticationService.isCurrentUserInRole(this.constantsService.roleAdmin);
  }
}
