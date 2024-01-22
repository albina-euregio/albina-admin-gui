import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { ConstantsService } from "../../providers/constants-service/constants.service";
import { GenericObservation } from "../models/generic-observation.model";
import { ApiWikisnowECT, convertWikisnow, WikisnowECT } from "../models/wikisnow.model";
import { Observable } from "rxjs";
import { filter, map, mergeMap } from "rxjs/operators";
import { ObservationFilterService } from "../observation-filter.service";
import { AuthenticationService } from "app/providers/authentication-service/authentication.service";

@Injectable()
export class WikisnowObservationsService {
  constructor(
    private http: HttpClient,
    private authenticationService: AuthenticationService,
    private filter: ObservationFilterService,
    private constantsService: ConstantsService,
  ) {}

  getWikisnowECT(): Observable<GenericObservation> {
    const { observationApi: api } = this.constantsService;
    const headers = this.authenticationService.newAuthHeader();
    return this.http.get<ApiWikisnowECT>(api.WikisnowECT, { headers }).pipe(
      mergeMap((api) => api.data),
      map<WikisnowECT, GenericObservation>((wikisnow) => convertWikisnow(wikisnow)),
      filter((observation) => this.filter.inDateRange(observation) && this.filter.inMapBounds(observation)),
    );
  }
}
