import { Component, inject, input, output, ChangeDetectionStrategy } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { TranslatePipe } from "@ngx-translate/core";
import { RegionsService } from "app/providers/regions-service/regions.service";
import z from "zod/v4";

import { BulletinPhotoModel } from "../models/bulletin-photo.model";
import { BulletinModel } from "../models/bulletin.model";

@Component({
  selector: "app-avalanche-photo-detail",
  templateUrl: "avalanche-photo-detail.component.html",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [TranslatePipe, FormsModule],
})
export class AvalanchePhotoDetailComponent {
  regionsService = inject(RegionsService);

  readonly bulletin = input<BulletinModel>(undefined);
  readonly photo = input<BulletinPhotoModel>(undefined);
  readonly disabled = input<boolean>(undefined);
  readonly changeAvalanchePhotoDetailEvent = output();

  isPhotoUrlInvalid(): boolean {
    const photo = this.photo();
    return photo !== undefined && !z.url().safeParse(photo.url).success;
  }
}
