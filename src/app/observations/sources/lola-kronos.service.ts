import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { ConstantsService } from "../../providers/constants-service/constants.service";
import { convertLoLaKronos, LolaKronosApi } from "../models/lola-kronos.model";
import { GenericObservation, ObservationSource } from "../models/generic-observation.model";
import { Observable } from "rxjs";
import { mergeMap } from "rxjs/operators";
import { ObservationFilterService } from "../observation-filter.service";
import { AuthenticationService } from "../../providers/authentication-service/authentication.service";

@Injectable()
export class LolaKronosObservationsService {
  constructor(
    private http: HttpClient,
    private authenticationService: AuthenticationService,
    private filter: ObservationFilterService,
    private constantsService: ConstantsService,
  ) {}

  getLoLaKronos(source = ObservationSource.LoLaKronos): Observable<GenericObservation> {
    const { observationApi: api, observationWeb: web } = this.constantsService;
    const timeframe = this.filter.startDateString + "/" + this.filter.endDateString;
    return this.http
      .get<LolaKronosApi>(api[source] + timeframe, { headers: this.authenticationService.newAuthHeader() })
      .pipe(mergeMap((kronos) => convertLoLaKronos(kronos, web[source])));
  }
}
