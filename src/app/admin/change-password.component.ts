import { Component, Inject } from "@angular/core";
import { TranslateService } from "@ngx-translate/core";
import { UserService } from "../providers/user-service/user.service";
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";

@Component({
  templateUrl: "change-password.component.html",
  selector: "app-change-password",
})
export class ChangePasswordComponent {
  public changePasswordLoading: boolean;

  public oldPassword: string;
  public newPassword1: string;
  public newPassword2: string;

  public isAdmin: boolean;
  public userId: string;

  constructor(
    private translateService: TranslateService,
    private userService: UserService,
    private dialogRef: MatDialogRef<ChangePasswordComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {
    this.changePasswordLoading = false;
    if (data) {
      this.isAdmin = data.isAdmin;
      this.userId = data.userId;
    }
  }

  changePassword() {
    this.changePasswordLoading = true;
    if (!this.isAdmin) {
      this.userService.checkPassword(this.oldPassword).subscribe(
        (data) => {
          this.userService.changePassword(this.oldPassword, this.newPassword1).subscribe(
            (data2) => {
              this.oldPassword = "";
              this.newPassword1 = "";
              this.newPassword2 = "";
              this.changePasswordLoading = false;
              this.closeDialog({
                type: "success",
                msg: this.translateService.instant("settings.changePassword.passwordChanged"),
              });
            },
            (error) => {
              console.error("Password could not be changed: " + JSON.stringify(error._body));
              this.changePasswordLoading = false;
              this.closeDialog({
                type: "danger",
                msg: this.translateService.instant("settings.changePassword.passwordChangeError"),
              });
            },
          );
        },
        (error) => {
          console.warn("Password incorrect: " + JSON.stringify(error._body));
          this.changePasswordLoading = false;
          this.closeDialog({
            type: "danger",
            msg: this.translateService.instant("settings.changePassword.passwordIncorrect"),
          });
        },
      );
    } else {
      this.userService.resetPassword(this.userId, this.newPassword1).subscribe(
        (data2) => {
          this.oldPassword = "";
          this.newPassword1 = "";
          this.newPassword2 = "";
          this.changePasswordLoading = false;
          this.closeDialog({
            type: "success",
            msg: this.translateService.instant("settings.changePassword.passwordChanged"),
          });
        },
        (error) => {
          console.error("Password could not be changed: " + JSON.stringify(error._body));
          this.changePasswordLoading = false;
          this.closeDialog({
            type: "danger",
            msg: this.translateService.instant("settings.changePassword.passwordChangeError"),
          });
        },
      );
    }
  }

  closeDialog(data) {
    this.dialogRef.close(data);
  }
}
