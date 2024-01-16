import { Injectable } from "@angular/core";
import { GenericObservation } from "../models/generic-observation.model";
import { from, Observable } from "rxjs";
import { convertRasWebcam, webcams } from "../models/ras-webcam.model";

@Injectable()
export class RasWebcamObservationsService {
  getRasWebcams(): Observable<GenericObservation> {
    return from(webcams.map((marker) => convertRasWebcam(marker)));
  }
}
