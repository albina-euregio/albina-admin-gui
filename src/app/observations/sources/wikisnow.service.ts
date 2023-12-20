import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { ConstantsService } from "../../providers/constants-service/constants.service";
import { GenericObservation } from "../models/generic-observation.model";
import { ApiWikisnowECT, convertWikisnow, WikisnowECT } from "../models/wikisnow.model";
import { Observable } from "rxjs";
import { filter, map, mergeMap } from "rxjs/operators";
import { ObservationFilterService } from "../observation-filter.service";

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
