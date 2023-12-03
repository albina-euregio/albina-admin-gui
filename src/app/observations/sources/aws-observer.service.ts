import { Injectable } from "@angular/core";
import { GenericObservation } from "../models/generic-observation.model";
import { getAwsObservers } from "../models/aws-observer.model";
import { Observable, of } from "rxjs";

@Injectable()
export class AwsObservationsService {
  getObservers(): Observable<GenericObservation> {
    return of(...getAwsObservers());
  }
}
