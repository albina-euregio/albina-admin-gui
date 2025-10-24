import { AuthenticationService } from "../providers/authentication-service/authentication.service";
import { ConstantsService } from "../providers/constants-service/constants.service";
import { CreateDangerSourcesComponent } from "./create-danger-sources.component";
import { DangerSourcesService } from "./danger-sources.service";
import { DangerSourceModel } from "./models/danger-source.model";
import { DatePipe } from "@angular/common";
import { Component, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { TranslateService, TranslateModule } from "@ngx-translate/core";
import { BsModalRef } from "ngx-bootstrap/modal";

@Component({
  selector: "app-modal-create-danger-source",
  templateUrl: "modal-create-danger-source.component.html",
  standalone: true,
  imports: [FormsModule, DatePipe, TranslateModule],
})
export class ModalCreateDangerSourceComponent {
  bsModalRef = inject(BsModalRef);
  authenticationService = inject(AuthenticationService);
  dangerSourcesService = inject(DangerSourcesService);
  constantsService = inject(ConstantsService);
  translateService = inject(TranslateService);

  dangerSource: DangerSourceModel;
  component: CreateDangerSourcesComponent;

  constructor() {
    this.dangerSource = new DangerSourceModel({
      ownerRegion: this.authenticationService.getActiveRegionId(),
      creationDate: this.dangerSourcesService.getActiveDate()[0],
    });
  }

  createDangerSourceModalConfirm(): void {
    this.dangerSourcesService.updateDangerSource(this.dangerSource).subscribe(() => {
      console.log("Danger source created!");
    });
    this.component.createDangerSourceModalConfirm(this.dangerSource);
  }

  createDangerSourceModalDecline(): void {
    this.component.createDangerSourceModalDecline();
  }
}
