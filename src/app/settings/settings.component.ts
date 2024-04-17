import { Component, OnInit } from "@angular/core";
import { TranslateService } from "@ngx-translate/core";
import { AuthenticationService } from "../providers/authentication-service/authentication.service";
import { ConstantsService } from "../providers/constants-service/constants.service";
import { SettingsService } from "../providers/settings-service/settings.service";
import { AlertComponent } from "ngx-bootstrap/alert";
import { UserService } from "app/providers/user-service/user.service";
import { UpdateUserComponent } from "app/admin/update-user.component";
import { MatDialog, MatDialogConfig } from "@angular/material/dialog";
import { ChangePasswordComponent } from "app/admin/change-password.component";

@Component({
  templateUrl: "settings.component.html",
})
export class SettingsComponent {
  public changePasswordLoading: boolean;

  public oldPassword: string;
  public newPassword1: string;
  public newPassword2: string;

  public alerts: any[] = [];

  constructor(
    private translateService: TranslateService,
    public authenticationService: AuthenticationService,
    private userService: UserService,
    private dialog: MatDialog,
    private settingsService: SettingsService,
    private constantsService: ConstantsService,
  ) {
    this.changePasswordLoading = false;
  }

  showUpdateDialog() {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.width = "calc(100% - 10px)";
    dialogConfig.maxHeight = "100%";
    dialogConfig.maxWidth = "100%";
    dialogConfig.data = {
      user: this.authenticationService.getCurrentAuthor(),
      update: true,
    };

    const dialogRef = this.dialog.open(UpdateUserComponent, dialogConfig);
    dialogRef.afterClosed().subscribe((data) => {
      window.scrollTo(0, 0);
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
    const dialogConfig = new MatDialogConfig();
    dialogConfig.width = "calc(100% - 10px)";
    dialogConfig.maxHeight = "100%";
    dialogConfig.maxWidth = "100%";
    dialogConfig.data = {
      user: this.authenticationService.getCurrentAuthor(),
    };

    const dialogRef = this.dialog.open(ChangePasswordComponent, dialogConfig);
    dialogRef.afterClosed().subscribe((data) => {
      window.scrollTo(0, 0);
      if (data !== undefined && data !== "") {
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
    if (this.authenticationService.isCurrentUserInRole(this.constantsService.roleAdmin)) {
      return true;
    } else {
      return false;
    }
  }
}
