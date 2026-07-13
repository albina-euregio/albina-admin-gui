import { formatDate } from "@angular/common";
import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { RegionsService } from "app/providers/regions-service/regions.service";
import { firstValueFrom, Observable } from "rxjs";
import { map, mergeAll, toArray } from "rxjs/operators";

import { environment } from "../../environments/environment";
import { GenericObservation, toGeoJSON } from "./models/generic-observation.model";

interface DateRangeParams {
  startDate: string;
  endDate: string;
}

@Injectable()
export class AlbinaObservationsService {
  private http = inject(HttpClient);
  private region = inject(RegionsService);

  getGenericObservations(dateRangeParams: DateRangeParams): Observable<GenericObservation> {
    const url = environment.apiBaseUrl + "../api_ext/observations";
    return this.getGenericObservations0(url, dateRangeParams);
  }

  getGenericObservationsGeoJSON(dateRangeParams: DateRangeParams): Observable<GeoJSON.FeatureCollection> {
    const url = environment.apiBaseUrl + "../api_ext/observations";
    return this.getGenericObservations0(url, dateRangeParams).pipe(
      toArray(),
      map((observations) => toGeoJSON(observations)),
    );
  }

  getObservers(): Observable<GenericObservation> {
    const url = environment.apiBaseUrl + "../api_ext/observers";
    return this.getGenericObservations0(url);
  }

  getWeatherStations(dateRangeParams: DateRangeParams): Observable<GenericObservation> {
    const url = environment.apiBaseUrl + "../api_ext/weather-stations";
    return this.getGenericObservations0(url, dateRangeParams);
  }

  getGenericWebcams(): Observable<GenericObservation> {
    const url = environment.apiBaseUrl + "../api_ext/webcams";
    return this.getGenericObservations0(url);
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
