import { UserModel, UserSchema } from "../models/user.model";
import { ConfigurationService } from "../providers/configuration-service/configuration.service";
import { RegionsService } from "../providers/regions-service/regions.service";
import { UserService } from "../providers/user-service/user.service";
import { PasswordMismatchValidatorDirective } from "./password-mismatch.directive";
import { AfterContentInit, Component, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { Alert } from "app/models/Alert";
import { AuthenticationService } from "app/providers/authentication-service/authentication.service";
import { ConstantsService } from "app/providers/constants-service/constants.service";
import { BsModalRef } from "ngx-bootstrap/modal";
import { DOC_ORIENTATION, NgxImageCompressService } from "ngx-image-compress";

type Result =
  | "" // cancel
  | {
      type: "danger" | "success";
      msg: string;
    };

@Component({
  templateUrl: "update-user.component.html",
  selector: "app-update-user",
  standalone: true,
  imports: [FormsModule, TranslateModule, PasswordMismatchValidatorDirective],
})
export class UpdateUserComponent implements AfterContentInit {
  private imageCompress = inject(NgxImageCompressService);
  private translateService = inject(TranslateService);
  private userService = inject(UserService);
  configurationService = inject(ConfigurationService);
  authenticationService = inject(AuthenticationService);
  regionsService = inject(RegionsService);
  private bsModalRef = inject(BsModalRef);
  private constantsService = inject(ConstantsService);

  public updateUserLoading: boolean;
  public update: boolean;
  public isAdmin: boolean;

  public user: UserModel;
  public alerts: Alert[] = [];
  public roles: string[];
  public regions: string[];

  public activeImage: string;
  public activeName: string;
  public activeEmail: string;
  public activePassword: string;
  public activePassword2: string;
  public activeOrganization: string;
  public activeRoles: string[] = [];
  public activeRegions: string[] = [];
  public activeLanguageCode: string;

  public result: Result;

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
    if (this.user.roles.includes(this.constantsService.roleAdmin)) {
      this.userService.getRoles().subscribe(
        (data) => {
          this.roles = data;
        },
        (error) => {
          console.error("Roles could not be loaded!", error);
        },
      );
      this.userService.getRegions().subscribe(
        (data) => {
          this.regions = data.sort((r1, r2) =>
            this.regionsService.getRegionName(r1).localeCompare(this.regionsService.getRegionName(r2)),
          );
        },
        (error) => {
          console.error("Regions could not be loaded!", error);
        },
      );
    }
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
    reader.onload = () => {
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

  public saveUser() {
    this.updateUserLoading = true;

    const user: UserModel = UserSchema.parse({
      image: this.activeImage,
      name: this.activeName,
      email: this.activeEmail,
      organization: this.activeOrganization,
      roles: [...new Set(this.activeRoles)],
      regions: this.activeRegions,
      languageCode: this.activeLanguageCode,
    });

    this.userService.postUser(user).subscribe(
      () => {
        this.updateUserLoading = false;
        console.debug("User saved!");
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
        console.error("User could not be saved!", error);
        this.closeDialog({
          type: "danger",
          msg: this.translateService.instant("admin.users.updateUser.error"),
        });
      },
    );
  }

  closeDialog(result: Result) {
    this.result = result;
    this.bsModalRef.hide();
  }
}
