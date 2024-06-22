import { CommonModule, formatDate } from "@angular/common";
import { Component, EventEmitter, Input, Output } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { TranslateModule } from "@ngx-translate/core";
import type { FotoWebcamEU } from "../../../observations-api/models/foto-webcam.model";
import type { PanomaxThumbnailResponse } from "../../../observations-api/models/panomax.model";
import { PipeModule } from "../pipes/pipes.module";
import { GenericObservation, ObservationSource, ObservationType } from "./models/generic-observation.model";
import { ObservationEditorComponent } from "./observation-editor.component";

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, ObservationEditorComponent, PipeModule, TranslateModule],
  selector: "app-observation-gallery",
  templateUrl: "observation-gallery.component.html",
})
export class ObservationGalleryComponent {
  @Input() observations: GenericObservation[] = [];
  @Output() observationClick: EventEmitter<GenericObservation> = new EventEmitter<GenericObservation>();
  public webcamDate: string;

  get sortedObservations(): GenericObservation[] {
    return (this.observations || [])
      .filter((o) => o.$type === ObservationType.Webcam)
      .map((o) => {
        if (o.$source == ObservationSource.FotoWebcamsEU) {
          this.mapFotoWebcamsEU(o);
        } else if (o.$source == ObservationSource.Panomax) {
          this.mapPanomax(o);
        }
        return o;
      })
      .filter((o) => o.$externalImg)
      .sort((o1, o2) => {
        // sort north west to south east
        return -o1.latitude + o1.longitude + o2.latitude - o2.longitude;
      });
  }

  private mapFotoWebcamsEU(o: GenericObservation) {
    // https://www.foto-webcam.eu/webcam/innsbruck-uni/current/400.jpg
    // https://www.foto-webcam.eu/webcam/innsbruck-uni/2024/06/11/1300_hd.jpg
    o.$externalImg = (o.$data as FotoWebcamEU).imgurl;
    if (this.webcamDate && o.$externalImg) {
      o.$externalImg = o.$externalImg.replace(
        /current.*/,
        formatDate(this.webcamDate, "yyyy/MM/dd/HHmm", "en-US") + "_hd.jpg",
      );
    }
  }
  private mapPanomax(o: GenericObservation) {
    // https://panodata9.panomax.com/cams/501/2024/06/22/09-50-00_small.jpg
    // https://panodata9.panomax.com/cams/501/2024/06/22/09-00-00_default.jpg
    o.$externalImg = (o.$data as PanomaxThumbnailResponse).latest;
    if (this.webcamDate && o.$externalImg) {
      o.$externalImg = o.$externalImg.replace(
        /20\d\d\/\d\d\/\d\d.*/,
        formatDate(this.webcamDate, "yyyy/MM/dd/HH-mm-ss", "en-US") + "_small.jpg",
      );
    }
  }
}
