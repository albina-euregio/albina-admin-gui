import { AfterContentInit, Component, ViewChild } from "@angular/core";
import { TranslateService } from "@ngx-translate/core";
import { ConfigurationService } from "../providers/configuration-service/configuration.service";
import { AlertComponent } from "ngx-bootstrap/alert";
import { BsModalRef, BsModalService } from "ngx-bootstrap/modal";
import { UserService } from "../providers/user-service/user.service";
import { TemplateRef } from "@angular/core";
import { UpdateUserComponent } from "./update-user.component";

import { MatDialog, MatDialogRef, MatDialogConfig } from "@angular/material/dialog";
import { ChangePasswordComponent } from "./change-password.component";
import { AuthenticationService } from "app/providers/authentication-service/authentication.service";

@Component({
  templateUrl: "users.component.html",
  selector: "app-users",
})
export class UsersComponent implements AfterContentInit {
  public alerts: any[] = [];
  public users: any;

  public deleteUserModalRef: BsModalRef;
  @ViewChild("deleteUserTemplate") deleteUserTemplate: TemplateRef<any>;

  public config = {
    keyboard: true,
    class: "modal-sm",
  };
  activeUser: any;

  constructor(
    public authenticationService: AuthenticationService,
    private translateService: TranslateService,
    private dialog: MatDialog,
    private userService: UserService,
    private modalService: BsModalService,
    public configurationService: ConfigurationService,
  ) {}

  ngAfterContentInit() {
    this.updateUsers();
  }

  updateUsers() {
    this.userService.getUsers().subscribe(
      (data) => {
        this.users = data;
      },
      (error) => {
        console.error("Users could not be loaded!");
      },
    );
  }

  onClosed(dismissedAlert: AlertComponent): void {
    this.alerts = this.alerts.filter((alert) => alert !== dismissedAlert);
  }

  createUser(event) {
    this.showUpdateDialog(false);
  }

  showUpdateDialog(update, user?) {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.width = "calc(100% - 10px)";
    dialogConfig.maxHeight = "100%";
    dialogConfig.maxWidth = "100%";
    if (update) {
      dialogConfig.data = {
        isAdmin: true,
        user: user,
        update: true,
      };
    } else {
      dialogConfig.data = {
        isAdmin: true,
        update: false,
      };
    }

    const dialogRef = this.dialog.open(UpdateUserComponent, dialogConfig);
    dialogRef.afterClosed().subscribe((data) => {
      this.updateUsers();
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

  editUser(event, user) {
    this.showUpdateDialog(true, user);
  }

  showChangePasswordDialog(user) {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.width = "calc(100% - 10px)";
    dialogConfig.maxHeight = "100%";
    dialogConfig.maxWidth = "100%";
    dialogConfig.data = {
      isAdmin: true,
      userId: user.email,
    };

    const dialogRef = this.dialog.open(ChangePasswordComponent, dialogConfig);
    dialogRef.afterClosed().subscribe((data) => {
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

  changePassword(event, user) {
    this.showChangePasswordDialog(user);
  }

  deleteUser(event, user) {
    this.activeUser = user;
    this.openDeleteUserModal(this.deleteUserTemplate);
  }

  openDeleteUserModal(template: TemplateRef<any>) {
    this.deleteUserModalRef = this.modalService.show(template, this.config);
  }

  deleteUserModalConfirm(event) {
    event.currentTarget.setAttribute("disabled", true);
    this.deleteUserModalRef.hide();
    if (this.activeUser) {
      this.userService.deleteUser(this.activeUser.email).subscribe(
        (data) => {
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
          console.error("Users could not be deleted!");
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
