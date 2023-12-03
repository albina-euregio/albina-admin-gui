import { Injectable } from "@angular/core";
import { type HttpClient } from "@angular/common/http";
import { type ConstantsService } from "../../providers/constants-service/constants.service";
import { type GenericObservation } from "../models/generic-observation.model";
import { type ApiWikisnowECT, type WikisnowECT, convertWikisnow } from "../models/wikisnow.model";
import { type Observable } from "rxjs";
import { filter, map, mergeMap } from "rxjs/operators";
import { type ObservationFilterService } from "../observation-filter.service";

@Injectable()
export class WikisnowObservationsService {
  constructor(
    private http: HttpClient,
    private filter: ObservationFilterService,
    private constantsService: ConstantsService,
  ) {}

  getWikisnowECT(): Observable<GenericObservation> {
    const { observationApi: api } = this.constantsService;
    return this.http.get<ApiWikisnowECT>(api.WikisnowECT).pipe(
      mergeMap((api) => api.data),
      map<WikisnowECT, GenericObservation>((wikisnow) => convertWikisnow(wikisnow)),
      filter((observation) => this.filter.inDateRange(observation) && this.filter.inMapBounds(observation)),
    );
  }
}
