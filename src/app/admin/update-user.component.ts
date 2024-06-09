import { Component, AfterContentInit } from "@angular/core";
import { TranslateService } from "@ngx-translate/core";
import { ConfigurationService } from "../providers/configuration-service/configuration.service";
import { RegionsService } from "../providers/regions-service/regions.service";
import { UserService } from "../providers/user-service/user.service";
import { UserModel } from "../models/user.model";

import { AuthenticationService } from "app/providers/authentication-service/authentication.service";
import { DOC_ORIENTATION, NgxImageCompressService } from "ngx-image-compress";
import { BsModalRef } from "ngx-bootstrap/modal";

type Result =
  | "" // cancel
  | {
      type: "danger" | "success";
      msg: string;
    };

@Component({
  templateUrl: "update-user.component.html",
  selector: "app-update-user",
})
export class UpdateUserComponent implements AfterContentInit {
  public updateUserLoading: boolean;
  public update: boolean;
  public isAdmin: boolean;

  public user: UserModel;
  public alerts: any[] = [];
  public roles: any;
  public regions: any;

  public activeImage: string;
  public activeName: string;
  public activeEmail: string;
  public activePassword: string;
  public activePassword2: string;
  public activeOrganization: string;
  public activeRoles: any[] = [];
  public activeRegions: any[] = [];
  public activeLanguageCode: string;

  public result: Result;

  constructor(
    private imageCompress: NgxImageCompressService,
    private translateService: TranslateService,
    private userService: UserService,
    public configurationService: ConfigurationService,
    public authenticationService: AuthenticationService,
    public regionsService: RegionsService,
    private bsModalRef: BsModalRef,
  ) {}

  ngAfterContentInit() {
    if (this.user) {
      this.activeImage = this.user.image;
      this.activeName = this.user.name;
      this.activeEmail = this.user.email;
      this.activeOrganization = this.user.organization;
      if (this.user.roles) {
        this.activeRoles = this.user.roles;
      }
      if (this.user.regions) {
        this.activeRegions = this.user.regions;
      }
      this.activeLanguageCode = this.user.languageCode;
    }
    this.userService.getRoles().subscribe(
      (data) => {
        this.roles = data;
      },
      (error) => {
        console.error("Roles could not be loaded!");
      },
    );
    this.userService.getRegions().subscribe(
      (data) => {
        this.regions = data;
      },
      (error) => {
        console.error("Regions could not be loaded!");
      },
    );
  }

  onImageChanged(event) {
    const files = event.target.files;
    if (files.length === 0) return;

    const mimeType = files[0].type;
    if (mimeType.match(/image\/*/) == null) {
      console.error("Only images are supported.");
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(files[0]);
    reader.onload = (_event) => {
      this.activeImage = reader.result.toString();

      this.imageCompress
        .compressFile(reader.result.toString(), DOC_ORIENTATION.Default, 100, 100, 150, 150)
        .then((compressedImage) => {
          this.activeImage = compressedImage;
        });
    };
  }

  onRoleSelectionChange(Role) {
    if (this.activeRoles.includes(Role)) {
      this.activeRoles.splice(this.activeRoles.indexOf(Role), 1);
    } else {
      this.activeRoles.push(Role);
    }
  }

  onRegionSelectionChange(region) {
    if (this.activeRegions.includes(region)) {
      this.activeRegions.splice(this.activeRegions.indexOf(region), 1);
    } else {
      this.activeRegions.push(region);
    }
  }

  public createUser() {
    this.updateUserLoading = true;

    const user = new UserModel();
    user.setImage(this.activeImage);
    user.setName(this.activeName);
    user.setEmail(this.activeEmail);
    user.setOrganization(this.activeOrganization);
    user.setPassword(this.activePassword);
    user.setRoles([...new Set(this.activeRoles)]);
    user.setRegions(this.activeRegions);

    this.userService.createUser(user).subscribe(
      (data) => {
        this.updateUserLoading = false;
        console.debug("User created!");
        this.closeDialog({
          type: "success",
          msg: this.translateService.instant("admin.users.createUser.success"),
        });
      },
      (error) => {
        this.updateUserLoading = false;
        console.error("User could not be created!");
        window.scrollTo(0, 0);
        this.closeDialog({
          type: "danger",
          msg: this.translateService.instant("admin.users.createUser.error"),
        });
      },
    );
  }

  public updateUser() {
    this.updateUserLoading = true;

    const user = new UserModel();
    user.setImage(this.activeImage);
    user.setName(this.activeName);
    user.setEmail(this.activeEmail);
    user.setOrganization(this.activeOrganization);
    user.setRoles([...new Set(this.activeRoles)]);
    user.setRegions(this.activeRegions);
    user.setLanguageCode(this.activeLanguageCode);

    if (this.isAdmin) {
      this.userService.updateUser(user).subscribe(
        (data) => {
          this.updateUserLoading = false;
          console.debug("User updated!");
          if (this.authenticationService.getCurrentAuthor().email === user.email) {
            this.authenticationService.getCurrentAuthor().name = user.name;
            this.authenticationService.getCurrentAuthor().image = user.image;
            this.authenticationService.getCurrentAuthor().organization = user.organization;
          }
          this.closeDialog({
            type: "success",
            msg: this.translateService.instant("admin.users.updateUser.success"),
          });
        },
        (error) => {
          this.updateUserLoading = false;
          console.error("User could not be updated!");
          this.closeDialog({
            type: "danger",
            msg: this.translateService.instant("admin.users.updateUser.error"),
          });
        },
      );
    } else {
      this.userService.updateOwnUser(user).subscribe(
        (data) => {
          this.updateUserLoading = false;
          console.debug("User updated!");
          if (this.authenticationService.getCurrentAuthor().email === user.email) {
            this.authenticationService.getCurrentAuthor().name = user.name;
            this.authenticationService.getCurrentAuthor().image = user.image;
            this.authenticationService.getCurrentAuthor().organization = user.organization;
          }
          this.closeDialog({
            type: "success",
            msg: this.translateService.instant("admin.users.updateUser.success"),
          });
        },
        (error) => {
          this.updateUserLoading = false;
          console.error("User could not be updated!");
          this.closeDialog({
            type: "danger",
            msg: this.translateService.instant("admin.users.updateUser.error"),
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
