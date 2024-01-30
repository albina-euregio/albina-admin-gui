import { Injectable } from "@angular/core";
import { GenericObservation } from "./models/generic-observation.model";
import { Observable, onErrorResumeNext } from "rxjs";
import { AlbinaObservationsService, AwsObservationsService } from "./sources";

@Injectable()
export class ObservationsService {
  constructor(
    private albina: AlbinaObservationsService,
    private aws: AwsObservationsService,
  ) {}
  loadAll(): Observable<GenericObservation<any>> {
    return onErrorResumeNext(this.albina.getObservations(), this.albina.getGenericObservations());
  }

  loadObservers(): Observable<GenericObservation<any>> {
    return this.aws.getObservers();
  }

  loadWebcams() {
    return this.albina.getGenericWebcams();
  }
}
