import { UserService } from "../providers/user-service/user.service";
import { NgIf } from "@angular/common";
import { Component, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { TranslateService, TranslateModule } from "@ngx-translate/core";
import { BsModalRef } from "ngx-bootstrap/modal";

type Result =
  | "" // cancel
  | {
      type: "danger" | "success";
      msg: string;
    };

@Component({
  templateUrl: "change-password.component.html",
  selector: "app-change-password",
  standalone: true,
  imports: [FormsModule, NgIf, TranslateModule],
})
export class ChangePasswordComponent {
  private translateService = inject(TranslateService);
  private userService = inject(UserService);
  private bsModalRef = inject(BsModalRef);

  public changePasswordLoading = false;

  public oldPassword: string;
  public newPassword1: string;
  public newPassword2: string;

  public isAdmin: boolean;
  public userId: string;

  public result: Result;

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

  closeDialog(result: Result) {
    this.result = result;
    this.bsModalRef.hide();
  }
}
