import { inject, Injectable } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { AuthenticationService } from "../providers/authentication-service/authentication.service";
import { ConstantsService } from "../providers/constants-service/constants.service";
import { GenericObservation } from "./models/generic-observation.model";
import { Observable } from "rxjs";
import { map, mergeAll } from "rxjs/operators";
import { ObservationFilterService } from "./observation-filter.service";
import { environment } from "../../environments/environment";
import { formatDate } from "@angular/common";
import { saveAs } from "file-saver";

@Injectable()
export class AlbinaObservationsService {
  private http = inject(HttpClient);
  private filter = inject<ObservationFilterService<GenericObservation>>(ObservationFilterService);
  private authenticationService = inject(AuthenticationService);
  private constantsService = inject(ConstantsService);

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
    await this.http.delete(url, { body }).toPromise();
  }

  getStatistics() {
    if (!this.filter.startDate || !this.filter.endDate) {
      return;
    }
    const url =
      this.constantsService.getServerUrl() +
      "observations/export?" +
      this.constantsService
        .createSearchParams([
          ["startDate", this.constantsService.getISOStringWithTimezoneOffset(this.filter.startDate)],
          ["endDate", this.constantsService.getISOStringWithTimezoneOffset(this.filter.endDate)],
        ])
        .toString();
    const headers = new HttpHeaders({ Accept: "text/csv" });
    this.http.get(url, { headers, responseType: "blob" }).subscribe((blob) => {
      const startDate = this.constantsService.getISODateString(this.filter.startDate);
      const endDate = this.constantsService.getISODateString(this.filter.endDate);
      const filename = `observations_${startDate}_${endDate}.csv`;
      saveAs(blob, filename);
      console.log("Observations loaded.");
    });
  }
}

function getISOString(date: Date) {
  // like Date.toISOString(), but not using UTC
  return formatDate(date, "yyyy-MM-ddTHH:mm:ss", "en-US");
}
