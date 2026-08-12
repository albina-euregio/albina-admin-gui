import { formatDate } from "@angular/common";
import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { rxResource } from "@angular/core/rxjs-interop";
import { RegionsService } from "app/providers/regions-service/regions.service";
import { firstValueFrom, Observable } from "rxjs";
import { map, mergeAll, toArray } from "rxjs/operators";

import { environment } from "../../environments/environment";
import { GenericObservation, toGeoJSON } from "./models/generic-observation.model";

export interface DateRangeParams {
  startDate: string;
  endDate: string;
}

@Injectable()
export class AlbinaObservationsService {
  private http = inject(HttpClient);
  private region = inject(RegionsService);

  /**
   * Observations for the given date range, reloading automatically whenever
   * `dateRangeParams` changes (idle while it is `undefined`).
   *
   * Call from an injection context (e.g. a component field initializer); the
   * returned resource is tied to that context's lifecycle.
   */
  genericObservationsResource(dateRangeParams: () => DateRangeParams | undefined) {
    return this.observationsResource(environment.apiBaseUrl + "../api_ext/observations", dateRangeParams);
  }

  /** Weather stations for the given date range, see {@link genericObservationsResource}. */
  weatherStationsResource(dateRangeParams: () => DateRangeParams | undefined) {
    return this.observationsResource(environment.apiBaseUrl + "../api_ext/weather-stations", dateRangeParams);
  }

  /** Observers, loaded once. See {@link genericObservationsResource}. */
  observersResource() {
    return this.observationsResource(environment.apiBaseUrl + "../api_ext/observers", () => ({}));
  }

  /** Webcams, loaded once. See {@link genericObservationsResource}. */
  genericWebcamsResource() {
    return this.observationsResource(environment.apiBaseUrl + "../api_ext/webcams", () => ({}));
  }

  private observationsResource(url: string, params: () => DateRangeParams | Record<string, never> | undefined) {
    return rxResource({
      params,
      stream: ({ params }) => this.getGenericObservations0(url, params).pipe(toArray()),
      defaultValue: [] as GenericObservation[],
    });
  }

  getGenericObservationsGeoJSON(dateRangeParams: DateRangeParams): Observable<GeoJSON.FeatureCollection> {
    const url = environment.apiBaseUrl + "../api_ext/observations";
    return this.getGenericObservations0(url, dateRangeParams).pipe(
      toArray(),
      map((observations) => toGeoJSON(observations)),
    );
  }

  private getGenericObservations0(url: string, params = {}): Observable<GenericObservation> {
    return this.http.get<GenericObservation[]>(url, { params }).pipe(
      mergeAll(),
      map((o) => {
        if (!o.region) {
          this.region.findRegionForCoordinates(o.latitude, o.longitude).subscribe((region) => {
            if (!region) return;
            console.info(o.$id, region, "//", o.locationName);
            Object.assign(o, { region } satisfies Partial<GenericObservation>);
          });
        }
        return {
          ...o,
          eventDate: o.eventDate ? new Date(o.eventDate) : undefined,
          reportDate: o.reportDate ? new Date(o.reportDate) : undefined,
        };
      }),
    );
  }

  postObservation(observation: GenericObservation): Observable<GenericObservation> {
    const body = this.serializeObservation(observation);
    const url = environment.apiBaseUrl + "../api_ext/observations";
    return this.http.post<GenericObservation>(url, body);
  }

  private serializeObservation(observation: GenericObservation) {
    return {
      ...observation,
      eventDate: observation.eventDate instanceof Date ? getISOString(observation.eventDate) : observation.eventDate,
      reportDate:
        observation.reportDate instanceof Date ? getISOString(observation.reportDate) : observation.reportDate,
    };
  }

  async deleteObservation(observation: GenericObservation): Promise<void> {
    const body = this.serializeObservation(observation);
    const url = environment.apiBaseUrl + "../api_ext/observations";
    await firstValueFrom(this.http.delete(url, { body }));
  }
}

function getISOString(date: Date) {
  // like Date.toISOString(), but not using UTC
  return formatDate(date, "yyyy-MM-ddTHH:mm:ss", "en-US");
}
