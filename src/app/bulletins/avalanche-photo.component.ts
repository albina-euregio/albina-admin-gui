import { Component, inject, input, OnChanges, output, SimpleChanges } from "@angular/core";
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
export class AvalanchePhotoComponent implements OnChanges {
  bulletinsService = inject(BulletinsService);
  regionsService = inject(RegionsService);

  readonly bulletin = input<BulletinModel>(undefined);
  readonly disabled = input<boolean>(undefined);
  readonly newPhoto = input<BulletinPhotoModel | undefined>(undefined);
  readonly updateBulletinOnServer = output();

  private openPhotos = new Set<BulletinPhotoModel>();

  ngOnChanges(changes: SimpleChanges) {
    const newPhoto = changes.newPhoto?.currentValue as BulletinPhotoModel | undefined;
    if (newPhoto) {
      this.openPhotos.add(newPhoto);
    }
  }

  changeAvalanchePhotoDetail() {
    this.updateBulletinOnServer.emit();
  }

  changeAvalanchePhotoPreview() {
    this.updateBulletinOnServer.emit();
  }

  accordionChanged(isOpen: boolean, photo: BulletinPhotoModel) {
    if (isOpen) {
      this.openPhotos.add(photo);
    } else {
      this.openPhotos.delete(photo);
    }
    this.bulletinsService.emitAccordionChanged({ isOpen, groupName: `photo-${photo.id ?? "new"}` });
  }

  isPhotoOpen(photo: BulletinPhotoModel): boolean {
    return this.openPhotos.has(photo);
  }

  deletePhoto(photo: BulletinPhotoModel) {
    const photoIndex = this.bulletin().photos.indexOf(photo);
    if (photoIndex !== -1) {
      this.openPhotos.delete(photo);
      this.bulletin().photos.splice(photoIndex, 1);
      this.updateBulletinOnServer.emit();
    }
  }
}
