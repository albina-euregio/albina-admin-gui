import { Injectable } from "@angular/core";
import { GenericObservation } from "../models/generic-observation.model";
import { from, Observable } from "rxjs";
import { convertPanoCloudWebcam, webcams } from "../models/panocloud-webcam.mode";

@Injectable()
export class PanoCloudWebcamObservationsService {
  getPanoCloudWebcams(): Observable<GenericObservation> {
    return from(webcams.map((marker) => convertPanoCloudWebcam(marker)));
  }
}
