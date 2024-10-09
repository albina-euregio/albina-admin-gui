import { Component } from "@angular/core";
import { BsModalRef } from "ngx-bootstrap/modal";
import { AuthenticationService } from "../providers/authentication-service/authentication.service";
import { ConstantsService } from "../providers/constants-service/constants.service";
import { TranslateService, TranslateModule } from "@ngx-translate/core";
import { CreateDangerSourcesComponent } from "./create-danger-sources.component";
import { DangerSourcesService } from "./danger-sources.service";
import { DangerSourceModel } from "./models/danger-source.model";
import { FormsModule } from "@angular/forms";
import { DatePipe } from "@angular/common";

@Component({
  selector: "app-modal-edit-danger-source",
  templateUrl: "modal-edit-danger-source.component.html",
  standalone: true,
  imports: [FormsModule, DatePipe, TranslateModule],
})
export class ModalEditDangerSourceComponent {
  dangerSource: DangerSourceModel;
  component: CreateDangerSourcesComponent;

  constructor(
    public bsModalRef: BsModalRef,
    public authenticationService: AuthenticationService,
    public dangerSourcesService: DangerSourcesService,
    public constantsService: ConstantsService,
    public translateService: TranslateService,
  ) {}

  editDangerSourceModalConfirm(): void {
    this.dangerSourcesService.updateDangerSource(this.dangerSource).subscribe(() => {
      console.log("Danger source updated!");
    });
    this.component.editDangerSourceModalConfirm();
  }

  editDangerSourceModalDecline(): void {
    this.component.editDangerSourceModalConfirm();
  }
}
