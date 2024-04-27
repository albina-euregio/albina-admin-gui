import { Component } from "@angular/core";
import { TranslateService } from "@ngx-translate/core";
import { AuthenticationService } from "../providers/authentication-service/authentication.service";
import { ConstantsService } from "../providers/constants-service/constants.service";
import { SettingsService } from "../providers/settings-service/settings.service";
import { AlertComponent } from "ngx-bootstrap/alert";
import { UserService } from "app/providers/user-service/user.service";
import { UpdateUserComponent } from "app/admin/update-user.component";
import { MatDialog, MatDialogConfig } from "@angular/material/dialog";
import { ChangePasswordComponent } from "app/admin/change-password.component";
import { UserModel } from "app/models/user.model";
import { BsModalService } from "ngx-bootstrap/modal";

@Component({
  templateUrl: "settings.component.html",
})
export class SettingsComponent {
  public oldPassword: string;
  public newPassword1: string;
  public newPassword2: string;

  public alerts: any[] = [];

  constructor(
    private translateService: TranslateService,
    public authenticationService: AuthenticationService,
    private userService: UserService,
    private dialog: MatDialog,
    private modalService: BsModalService,
    private settingsService: SettingsService,
    private constantsService: ConstantsService,
  ) {}

  showUpdateDialog() {
    const user = new UserModel();
    user.setEmail(this.authenticationService.getCurrentAuthor().email);
    user.setName(this.authenticationService.getCurrentAuthor().name);
    user.setOrganization(this.authenticationService.getCurrentAuthor().organization);
    user.setImage(this.authenticationService.getCurrentAuthor().image);
    user.setRoles(this.authenticationService.getCurrentAuthor().roles);
    user.setRegions(this.authenticationService.getCurrentAuthor().regions.map((region) => region.id));

    const dialogConfig = new MatDialogConfig();
    dialogConfig.width = "calc(100% - 10px)";
    dialogConfig.maxHeight = "100%";
    dialogConfig.maxWidth = "100%";
    dialogConfig.data = {
      user: user,
      update: true,
      isAdmin: false,
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
    if (this.authenticationService.isCurrentUserInRole(this.constantsService.roleAdmin)) {
      return true;
    } else {
      return false;
    }
  }
}
