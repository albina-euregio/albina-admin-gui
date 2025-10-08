import { environment } from "../../environments/environment";
import { GenericObservation } from "./models/generic-observation.model";
import { ObservationFilterService } from "./observation-filter.service";
import { formatDate } from "@angular/common";
import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { firstValueFrom, Observable } from "rxjs";
import { map, mergeAll } from "rxjs/operators";

@Injectable()
export class AlbinaObservationsService {
  private http = inject(HttpClient);
  private filter = inject<ObservationFilterService<GenericObservation>>(ObservationFilterService);

  getGenericObservations(): Observable<GenericObservation> {
    const url = environment.apiBaseUrl + "../api_ext/observations";
    return this.getGenericObservations0(url, this.filter.dateRangeParams);
  }

  getObservers(): Observable<GenericObservation> {
    const url = environment.apiBaseUrl + "../api_ext/observers";
    return this.getGenericObservations0(url);
  }

  getWeatherStations(): Observable<GenericObservation> {
    const url = environment.apiBaseUrl + "../api_ext/weather-stations";
    return this.getGenericObservations0(url, this.filter.dateRangeParams);
  }

  getGenericWebcams(): Observable<GenericObservation> {
    const url = environment.apiBaseUrl + "../api_ext/webcams";
    return this.getGenericObservations0(url);
  }

  private getGenericObservations0(url: string, params = {}): Observable<GenericObservation> {
    return this.http.get<GenericObservation[]>(url, { params }).pipe(
      mergeAll(),
      map((o) => ({
        ...o,
        eventDate: o.eventDate ? new Date(o.eventDate) : undefined,
        reportDate: o.reportDate ? new Date(o.reportDate) : undefined,
      })),
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
