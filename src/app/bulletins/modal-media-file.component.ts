import { Component, inject } from "@angular/core";
import { BsModalRef } from "ngx-bootstrap/modal";
import { AuthenticationService } from "../providers/authentication-service/authentication.service";
import { ConstantsService } from "../providers/constants-service/constants.service";
import { BulletinsService } from "../providers/bulletins-service/bulletins.service";
import { AlertComponent, AlertModule } from "ngx-bootstrap/alert";
import { TranslateService, TranslateModule } from "@ngx-translate/core";
import { MediaFileService } from "app/providers/media-file-service/media-file.service";
import { CreateBulletinComponent } from "./create-bulletin.component";
import { NgFor, NgIf, DatePipe } from "@angular/common";
import { FormsModule } from "@angular/forms";

@Component({
  selector: "app-modal-media-file",
  templateUrl: "modal-media-file.component.html",
  standalone: true,
  imports: [NgFor, AlertModule, FormsModule, NgIf, DatePipe, TranslateModule],
})
export class ModalMediaFileComponent {
  bsModalRef = inject(BsModalRef);
  authenticationService = inject(AuthenticationService);
  bulletinsService = inject(BulletinsService);
  constantsService = inject(ConstantsService);
  mediaFileService = inject(MediaFileService);
  translateService = inject(TranslateService);

  date: [Date, Date];
  component: CreateBulletinComponent;
  file;
  text;
  important;

  public alerts: any[] = [];

  mediaFileModalConfirm(): void {
    this.uploadFile();
  }

  mediaFileModalDecline(): void {
    this.component.mediaFileModalConfirm();
  }

  selectFile(event) {
    this.file = event.target.files[0];
  }

  uploadFile() {
    if (this.text == null || this.text == "") {
      this.text = "---";
    }
    if (this.file == null) {
      console.log("No file selected!");
      window.scrollTo(0, 0);
      this.alerts.push({
        type: "danger",
        msg: this.translateService.instant("bulletins.table.mediaFileDialog.missingFile"),
        timeout: 5000,
      });
      return;
    }

    this.mediaFileService.uploadFile(this.date, this.file, this.text, this.important).subscribe(
      (data) => {
        console.log("Upload complete!");
        this.component.mediaFileModalConfirm();
      },
      (error) => {
        console.log("Upload Error:", error);
        window.scrollTo(0, 0);
        this.alerts.push({
          type: "danger",
          msg: this.translateService.instant("bulletins.table.mediaFileDialog.uploadError"),
          timeout: 5000,
        });
      },
    );
  }

  onClosed(dismissedAlert: AlertComponent): void {
    this.alerts = this.alerts.filter((alert) => alert !== dismissedAlert);
  }
}
