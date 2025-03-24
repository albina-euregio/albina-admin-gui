import { CommonModule, formatDate } from "@angular/common";
import { Component, input, output } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { TranslateModule } from "@ngx-translate/core";
import type { FotoWebcamEU } from "../../../observations-api/src/fetch/webcams/foto-webcam.model";
import type { PanomaxThumbnailResponse } from "../../../observations-api/src/fetch/webcams/panomax.model";
import { GenericObservation, ObservationSource, ObservationType } from "./models/generic-observation.model";
import { NgxMousetrapDirective } from "../shared/mousetrap-directive";

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, NgxMousetrapDirective],
  selector: "app-observation-gallery",
  templateUrl: "observation-gallery.component.html",
})
export class ObservationGalleryComponent {
  readonly observations = input<GenericObservation[]>([]);
  readonly observationClick = output<GenericObservation>();
  public webcamDate: string;

  constructor() {
    const now = new Date();
    const minutes = now.getMinutes();
    now.setMinutes(Math.floor(minutes / 10) * 10, 0, 0);
    now.setSeconds(0, 0);
    this.webcamDate = formatDate(now, "yyyy-MM-dd'T'HH:mm:ss", "en-US");
  }

  get sortedObservations(): GenericObservation[] {
    return (this.observations() || [])
      .filter((o) => o.$type === ObservationType.Webcam)
      .map((o) => {
        if (o.$source == ObservationSource.FotoWebcamsEU) {
          this.mapFotoWebcamsEU(o);
        } else if (o.$source == ObservationSource.Panomax) {
          this.mapPanomax(o);
        }
        return o;
      })
      .filter((o) => o.$externalImgs)
      .sort((o1, o2) => {
        // sort north west to south east
        return -o1.latitude + o1.longitude + o2.latitude - o2.longitude;
      });
  }

  private mapFotoWebcamsEU(o: GenericObservation) {
    // https://www.foto-webcam.eu/webcam/innsbruck-uni/current/400.jpg
    // https://www.foto-webcam.eu/webcam/innsbruck-uni/2024/06/11/1300_hd.jpg
    let img = (o.$data as FotoWebcamEU).imgurl;
    if (this.webcamDate && img) {
      const date = formatDate(this.webcamDate, "yyyy/MM/dd/HHmm", "en-US") + "_hd.jpg";
      img = img.replace(/current.*/, date);
    }
    o.$externalImgs = [img];
  }

  private mapPanomax(o: GenericObservation) {
    // https://panodata9.panomax.com/cams/501/2024/06/22/09-50-00_small.jpg
    // https://panodata9.panomax.com/cams/501/2024/06/22/09-00-00_default.jpg
    let img = (o.$data as PanomaxThumbnailResponse).latest;
    if (this.webcamDate && img) {
      const date = formatDate(this.webcamDate, "yyyy/MM/dd/HH-mm-ss", "en-US") + "_small.jpg";
      img = img.replace(/20\d\d\/\d\d\/\d\d.*/, date);
    }
    o.$externalImgs = [img];
  }

  public minusOneHour() {
    const newDate = new Date(this.webcamDate);
    newDate.setMinutes(0, 0, 0);
    this.webcamDate = formatDate(newDate.getTime() - 1000 * 60 * 60, "yyyy-MM-dd'T'HH:mm:ss", "en-US");
  }

  public minusTenMinutes() {
    const newDate = new Date(this.webcamDate);
    this.webcamDate = formatDate(newDate.getTime() - 1000 * 60 * 10, "yyyy-MM-dd'T'HH:mm:ss", "en-US");
  }

  public plusOneHour() {
    const newDate = new Date(this.webcamDate);
    const newDateNumber = newDate.setMinutes(0, 0, 0) + 1000 * 60 * 60;
    if (newDateNumber > Date.now()) {
      return;
    }
    this.webcamDate = formatDate(newDateNumber, "yyyy-MM-dd'T'HH:mm:ss", "en-US");
  }

  public plusTenMinutes() {
    const newDate = new Date(this.webcamDate);
    const newDateNumber = newDate.getTime() + 1000 * 60 * 10;
    if (newDateNumber > Date.now()) {
      return;
    }
    this.webcamDate = formatDate(newDateNumber, "yyyy-MM-dd'T'HH:mm:ss", "en-US");
  }
}
