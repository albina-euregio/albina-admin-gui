import { Injectable } from "@angular/core";
import { GenericObservation } from "./models/generic-observation.model";
import { Observable, onErrorResumeNext } from "rxjs";
import {
  AlbinaObservationsService,
  AwsObservationsService,
  FotoWebcamObservationsService,
  PanoCloudWebcamObservationsService,
  PanomaxObservationsService,
  RasWebcamObservationsService,
} from "./sources";

@Injectable()
export class ObservationsService {
  constructor(
    private albina: AlbinaObservationsService,
    private aws: AwsObservationsService,
    private fotoWebcam: FotoWebcamObservationsService,
    private panocloud: PanoCloudWebcamObservationsService,
    private panomax: PanomaxObservationsService,
    private rasWebcam: RasWebcamObservationsService,
  ) {}

  loadAll(): Observable<GenericObservation<any>> {
    return onErrorResumeNext(
      this.albina.getObservations(),
      this.albina.getGenericObservations(),
      this.aws.getObservers(),
    );
  }

  loadWebcams() {
    return onErrorResumeNext(
      this.panocloud.getPanoCloudWebcams(),
      this.rasWebcam.getRasWebcams(),
      this.fotoWebcam.getFotoWebcamsEU(),
      this.panomax.getPanomax(),
    );
  }
}
