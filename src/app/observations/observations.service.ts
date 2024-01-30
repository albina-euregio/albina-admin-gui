import { Injectable } from "@angular/core";
import { GenericObservation } from "./models/generic-observation.model";
import { Observable, onErrorResumeNext } from "rxjs";
import { AlbinaObservationsService } from "./sources";

@Injectable()
export class ObservationsService {
  constructor(private albina: AlbinaObservationsService) {}
  loadAll(): Observable<GenericObservation<any>> {
    return onErrorResumeNext(this.albina.getObservations(), this.albina.getGenericObservations());
  }

  loadObservers(): Observable<GenericObservation<any>> {
    return this.albina.getObservers();
  }

  loadWebcams() {
    return this.albina.getGenericWebcams();
  }
}
