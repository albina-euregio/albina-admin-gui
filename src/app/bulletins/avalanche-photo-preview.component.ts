import { Component, inject, input, output, signal, ChangeDetectionStrategy } from "@angular/core";
import { TranslateModule } from "@ngx-translate/core";
import { BulletinsService } from "app/providers/bulletins-service/bulletins.service";
import { RegionsService } from "app/providers/regions-service/regions.service";
import { finalize } from "rxjs";

import { BulletinPhotoModel } from "../models/bulletin-photo.model";

@Component({
  selector: "app-avalanche-photo-preview",
  templateUrl: "avalanche-photo-preview.component.html",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [TranslateModule],
})
export class AvalanchePhotoPreviewComponent {
  regionsService = inject(RegionsService);
  bulletinsService = inject(BulletinsService);

  readonly disabled = input<boolean>(undefined);
  readonly photo = input<BulletinPhotoModel>(undefined);
  readonly deleteAvalanchePhotoEvent = output<void>();
  readonly uploadAvalanchePhotoEvent = output<void>();
  readonly uploading = signal(false);

  deleteAvalanchePhoto(event: Event) {
    event.stopPropagation();
    this.deleteAvalanchePhotoEvent.emit();
  }

  uploadAvalanchePhoto(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = "";
    if (!file) {
      return;
    }
    this.uploading.set(true);
    this.bulletinsService
      .uploadPhoto(file)
      .pipe(finalize(() => this.uploading.set(false)))
      .subscribe({
        next: (uploaded) => {
          this.photo().url = uploaded.url;
          this.uploadAvalanchePhotoEvent.emit();
        },
        error: (error) => console.error("Failed to upload avalanche photo", error),
      });
  }
}
