import { Injectable } from "@angular/core";
import { type HttpClient } from "@angular/common/http";
import { type ConstantsService } from "../../providers/constants-service/constants.service";
import { type LolaKronosApi, convertLoLaKronos } from "../models/lola-kronos.model";
import { type GenericObservation, ObservationSource } from "../models/generic-observation.model";
import { type Observable } from "rxjs";
import { mergeMap } from "rxjs/operators";
import { type ObservationFilterService } from "../observation-filter.service";

@Injectable()
export class LolaKronosObservationsService {
  constructor(
    private http: HttpClient,
    private filter: ObservationFilterService,
    private constantsService: ConstantsService,
  ) {}
  getLoLaKronos(source = ObservationSource.LoLaKronos): Observable<GenericObservation> {
    const { observationApi: api, observationWeb: web } = this.constantsService;
    const timeframe = this.filter.startDateString + "/" + this.filter.endDateString;
    return this.http
      .get<LolaKronosApi>(api[source] + timeframe)
      .pipe(mergeMap((kronos) => convertLoLaKronos(kronos, web[source])));
  }
}
