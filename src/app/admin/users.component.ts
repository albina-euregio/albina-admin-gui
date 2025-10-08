import { UserModel } from "../models/user.model";
import { ConfigurationService } from "../providers/configuration-service/configuration.service";
import { UserService } from "../providers/user-service/user.service";
import { ChangePasswordComponent } from "./change-password.component";
import { UpdateUserComponent } from "./update-user.component";
import { NgFor, NgIf } from "@angular/common";
import { AfterContentInit, Component, viewChild, inject } from "@angular/core";
import { TemplateRef } from "@angular/core";
import { TranslateService, TranslateModule } from "@ngx-translate/core";
import { Alert } from "app/models/Alert";
import { AuthenticationService } from "app/providers/authentication-service/authentication.service";
import { AlertModule } from "ngx-bootstrap/alert";
import { BsModalRef, BsModalService } from "ngx-bootstrap/modal";

@Component({
  templateUrl: "users.component.html",
  selector: "app-users",
  standalone: true,
  imports: [NgFor, AlertModule, NgIf, TranslateModule],
})
export class UsersComponent implements AfterContentInit {
  authenticationService = inject(AuthenticationService);
  private translateService = inject(TranslateService);
  private userService = inject(UserService);
  private modalService = inject(BsModalService);
  configurationService = inject(ConfigurationService);

  public alerts: Alert[] = [];
  public users: UserModel[];

  public deleteUserModalRef: BsModalRef;
  readonly deleteUserTemplate = viewChild<TemplateRef<unknown>>("deleteUserTemplate");

  public config = {
    animated: false,
    keyboard: true,
    class: "modal-sm",
  };
  activeUser: UserModel;

  ngAfterContentInit() {
    this.updateUsers();
  }

  updateUsers() {
    this.userService.getUsers().subscribe(
      (data) => {
        this.users = Array.isArray(data) ? data.sort((a, b) => a.name.localeCompare(b.name)) : [];
      },
      (error) => {
        console.error("Users could not be loaded!", error);
      },
    );
  }

  onClosed(dismissedAlert: Alert): void {
    this.alerts = this.alerts.filter((alert) => alert !== dismissedAlert);
  }

  createUser() {
    this.showUpdateDialog(false);
  }

  showUpdateDialog(update: boolean, user?: UserModel) {
    const dialogRef = this.modalService.show(UpdateUserComponent, {
      class: "modal-xl",
      initialState: update
        ? {
            isAdmin: true,
            user: user,
            update: true,
          }
        : {
            isAdmin: true,
            update: false,
          },
    });
    dialogRef.onHide.subscribe(() => {
      this.updateUsers();
      const data = dialogRef.content.result;
      if (data !== undefined && data !== "") {
        window.scrollTo(0, 0);
        this.alerts.push({
          type: data.type,
          msg: data.msg,
          timeout: 5000,
        });
      }
    });
  }

  editUser(user: UserModel) {
    this.showUpdateDialog(true, user);
  }

  showChangePasswordDialog(user: UserModel) {
    const dialogRef = this.modalService.show(ChangePasswordComponent, {
      initialState: {
        isAdmin: true,
        userId: user.email,
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

  changePassword(user: UserModel) {
    this.showChangePasswordDialog(user);
  }

  deleteUser(user: UserModel) {
    this.activeUser = user;
    this.openDeleteUserModal(this.deleteUserTemplate());
  }

  openDeleteUserModal(template: TemplateRef<unknown>) {
    this.deleteUserModalRef = this.modalService.show(template, this.config);
  }

  deleteUserModalConfirm(event) {
    event.currentTarget.setAttribute("disabled", true);
    this.deleteUserModalRef.hide();
    if (this.activeUser) {
      this.userService.deleteUser(this.activeUser.email).subscribe(
        () => {
          console.debug("User deleted!");
          this.updateUsers();
          window.scrollTo(0, 0);
          this.alerts.push({
            type: "success",
            msg: this.translateService.instant("admin.users.deleteUser.success"),
            timeout: 5000,
          });
        },
        (error) => {
          console.error("Users could not be deleted!", error);
          window.scrollTo(0, 0);
          this.alerts.push({
            type: "danger",
            msg: this.translateService.instant("admin.users.deleteUser.error"),
            timeout: 5000,
          });
        },
      );
    }
    this.activeUser = undefined;
  }

  deleteUserModalDecline(event) {
    event.currentTarget.setAttribute("disabled", true);
    this.deleteUserModalRef.hide();
    this.activeUser = undefined;
  }
}
