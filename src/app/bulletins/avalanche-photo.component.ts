import { Component, inject, input, output } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { TranslateModule } from "@ngx-translate/core";
import { BulletinsService } from "app/providers/bulletins-service/bulletins.service";
import { RegionsService } from "app/providers/regions-service/regions.service";
import { AccordionModule } from "ngx-bootstrap/accordion";

import { BulletinPhotoModel } from "../models/bulletin-photo.model";
import { BulletinModel } from "../models/bulletin.model";
import { AvalanchePhotoDetailComponent } from "./avalanche-photo-detail.component";
import { AvalanchePhotoPreviewComponent } from "./avalanche-photo-preview.component";

@Component({
  selector: "app-avalanche-photo",
  templateUrl: "avalanche-photo.component.html",
  standalone: true,
  imports: [
    AccordionModule,
    TranslateModule,
    FormsModule,
    AvalanchePhotoPreviewComponent,
    AvalanchePhotoDetailComponent,
  ],
})
export class AvalanchePhotoComponent {
  bulletinsService = inject(BulletinsService);
  regionsService = inject(RegionsService);

  readonly bulletin = input<BulletinModel>(undefined);
  readonly disabled = input<boolean>(undefined);
  readonly updateBulletinOnServer = output();

  private openPhotoIds = new Set<string>();

  changeAvalanchePhotoDetail() {
    this.updateBulletinOnServer.emit();
  }

  changeAvalanchePhotoPreview() {
    this.updateBulletinOnServer.emit();
  }

  accordionChanged(isOpen: boolean, groupName: string) {
    if (isOpen) {
      this.openPhotoIds.add(groupName);
    } else {
      this.openPhotoIds.delete(groupName);
    }
    this.bulletinsService.emitAccordionChanged({ isOpen, groupName });
  }

  isPhotoOpen(photoId: string): boolean {
    return this.openPhotoIds.has(`photo-${photoId}`);
  }

  deletePhoto(photo: BulletinPhotoModel) {
    const photoIndex = this.bulletin().photos.indexOf(photo);
    if (photoIndex !== -1) {
      this.bulletin().photos.splice(photoIndex, 1);
      this.updateBulletinOnServer.emit();
    }
  }
}
