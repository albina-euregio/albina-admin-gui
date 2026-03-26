import { Component, inject, input, output } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { TranslateModule } from "@ngx-translate/core";
import { RegionsService } from "app/providers/regions-service/regions.service";
import z from "zod";

import { BulletinPhotoModel } from "../models/bulletin-photo.model";
import { BulletinModel } from "../models/bulletin.model";

@Component({
  selector: "app-avalanche-photo-detail",
  templateUrl: "avalanche-photo-detail.component.html",
  standalone: true,
  imports: [TranslateModule, FormsModule],
})
export class AvalanchePhotoDetailComponent {
  regionsService = inject(RegionsService);

  readonly bulletin = input<BulletinModel>(undefined);
  readonly photo = input<BulletinPhotoModel>(undefined);
  readonly disabled = input<boolean>(undefined);
  readonly changeAvalanchePhotoDetailEvent = output();

  onPhotoFieldChange<K extends keyof BulletinPhotoModel>(field: K, value: BulletinPhotoModel[K]) {
    this.photo()[field] = value;
    this.changeAvalanchePhotoDetailEvent.emit();
  }

  isPhotoUrlInvalid(): boolean {
    const photo = this.photo();
    return photo !== undefined && !z.url().safeParse(photo.url).success;
  }
}
