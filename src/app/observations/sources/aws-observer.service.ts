import { Injectable } from "@angular/core";
import { type GenericObservation } from "../models/generic-observation.model";
import { getAwsObservers } from "../models/aws-observer.model";
import { type Observable, of } from "rxjs";

@Injectable()
export class AwsObservationsService {
  getObservers(): Observable<GenericObservation> {
    return of(...getAwsObservers());
  }
}
