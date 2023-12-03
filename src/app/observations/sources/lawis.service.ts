import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { ConstantsService } from "../../providers/constants-service/constants.service";
import {
  Profile,
  Incident,
  IncidentDetails,
  ProfileDetails,
  LAWIS_FETCH_DETAILS,
  toLawisIncident,
  toLawisIncidentDetails,
  toLawisProfileDetails,
  toLawisProfile,
} from "../models/lawis.model";
import { GenericObservation } from "../models/generic-observation.model";
import { from, Observable, of } from "rxjs";
import { catchError, filter, map, mergeAll, mergeMap } from "rxjs/operators";
import { ObservationFilterService } from "../observation-filter.service";

@Injectable()
export class LawisObservationsService {
  constructor(
    private http: HttpClient,
    private filter: ObservationFilterService,
    private constantsService: ConstantsService,
  ) {}

  getLawisProfiles(): Observable<GenericObservation> {
    const { observationApi: api, observationWeb: web } = this.constantsService;
    return this.http
      .get<Profile[]>(
        api.Lawis +
          "profile" +
          "?startDate=" +
          this.filter.startDateString +
          "&endDate=" +
          this.filter.endDateString +
          "&_=" +
          nowWithHourPrecision(),
      )
      .pipe(
        mergeAll(),
        map<Profile, GenericObservation<Profile>>((lawis) => toLawisProfile(lawis, web["Lawis-Profile"])),
        filter((observation) => this.filter.inMapBounds(observation)),
        mergeMap((profile) => {
          if (!LAWIS_FETCH_DETAILS) {
            return of(profile);
          }
          return from(this.getCachedOrFetchLowPriority<ProfileDetails>(api.Lawis + "profile/" + profile.$data.id)).pipe(
            map<ProfileDetails, GenericObservation>((lawisDetails) => toLawisProfileDetails(profile, lawisDetails)),
            catchError(() => of(profile)),
          );
        }),
      );
  }

  getLawisIncidents(): Observable<GenericObservation> {
    const { observationApi: api, observationWeb: web } = this.constantsService;
    return this.http
      .get<Incident[]>(
        api.Lawis +
          "incident" +
          "?startDate=" +
          this.filter.startDateString +
          "&endDate=" +
          this.filter.endDateString +
          "&_=" +
          nowWithHourPrecision(),
      )
      .pipe(
        mergeAll(),
        map<Incident, GenericObservation<Incident>>((lawis) => toLawisIncident(lawis, web["Lawis-Incident"])),
        filter((observation) => this.filter.inMapBounds(observation)),
        mergeMap((incident) => {
          if (!LAWIS_FETCH_DETAILS) {
            return of(incident);
          }
          return from(
            this.getCachedOrFetchLowPriority<IncidentDetails>(api.Lawis + "incident/" + incident.$data.id),
          ).pipe(
            map<IncidentDetails, GenericObservation>((lawisDetails) => toLawisIncidentDetails(incident, lawisDetails)),
            catchError(() => of(incident)),
          );
        }),
      );
  }

  async getCachedOrFetchLowPriority<T>(url: string): Promise<T> {
    let cache: Cache;
    try {
      cache = await caches.open("observations");
      const cached = await cache.match(url);
      if (cached) {
        return cached.json();
      }
    } catch (ignore) {}
    const response = await fetch(url, {
      mode: "cors",
      priority: "low",
      // https://developer.mozilla.org/en-US/docs/Web/API/Request/priority
    } as RequestInit & { priority: "high" | "low" | "auto" });
    if (!response.ok) {
      throw Error(response.statusText);
    }
    if (cache) {
      cache.put(url, response);
    }
    return response.json();
  }
}

function nowWithHourPrecision(): number {
  const now = new Date();
  now.setHours(now.getHours(), 0, 0, 0);
  return +now;
}
