import { Component, inject, input, output } from "@angular/core";
import { TranslateModule } from "@ngx-translate/core";
import { RegionsService } from "app/providers/regions-service/regions.service";

import { BulletinPhotoModel } from "../models/bulletin-photo.model";

@Component({
  selector: "app-avalanche-photo-preview",
  templateUrl: "avalanche-photo-preview.component.html",
  standalone: true,
  imports: [TranslateModule],
})
export class AvalanchePhotoPreviewComponent {
  regionsService = inject(RegionsService);

  readonly disabled = input<boolean>(undefined);

  readonly photo = input<BulletinPhotoModel>(undefined);
  readonly deleteAvalanchePhotoEvent = output<void>();

  deleteAvalanchePhoto(event: Event) {
    event.stopPropagation();
    this.deleteAvalanchePhotoEvent.emit();
  }
}
