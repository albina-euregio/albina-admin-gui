import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { AuthenticationService } from "../providers/authentication-service/authentication.service";
import { ConstantsService } from "../providers/constants-service/constants.service";
import { convertObservationToGeneric, Observation } from "./models/observation.model";
import { GenericObservation } from "./models/generic-observation.model";
import { Observable } from "rxjs";
import { map, mergeAll } from "rxjs/operators";
import { ObservationFilterService } from "./observation-filter.service";
import { environment } from "../../environments/environment";
import { formatDate } from "@angular/common";
import { saveAs } from "file-saver";

@Injectable()
export class AlbinaObservationsService {
  constructor(
    private http: HttpClient,
    private filter: ObservationFilterService<GenericObservation>,
    private authenticationService: AuthenticationService,
    private constantsService: ConstantsService,
  ) {}

  getObservation(id: number): Observable<GenericObservation<Observation>> {
    const url = this.constantsService.getServerUrl() + "observations/" + id;
    const headers = this.authenticationService.newAuthHeader();
    const options = { headers };
    return this.http.get<Observation>(url, options).pipe(map((o) => convertObservationToGeneric(o)));
  }

  getObservations(): Observable<GenericObservation<Observation>> {
    const url = this.constantsService.getServerUrl() + "observations";
    const headers = this.authenticationService.newAuthHeader();
    const params = this.filter.dateRangeParams;
    return this.http.get<Observation[]>(url, { headers, params }).pipe(
      mergeAll(),
      map((o) => convertObservationToGeneric(o)),
    );
  }

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
    const headers = this.authenticationService.newAuthHeader();
    return this.http.get<GenericObservation[]>(url, { headers, params }).pipe(
      mergeAll(),
      map((o) => ({
        ...o,
        eventDate: o.eventDate ? new Date(o.eventDate) : undefined,
        reportDate: o.reportDate ? new Date(o.reportDate) : undefined,
      })),
    );
  }

  postObservation(observation: Observation): Observable<GenericObservation<Observation>> {
    observation = this.serializeObservation(observation);
    const url = this.constantsService.getServerUrl() + "observations";
    const headers = this.authenticationService.newAuthHeader();
    const options = { headers };
    return this.http.post<Observation>(url, observation, options).pipe(map((o) => convertObservationToGeneric(o)));
  }

  putObservation(observation: Observation): Observable<GenericObservation<Observation>> {
    observation = this.serializeObservation(observation);
    const url = this.constantsService.getServerUrl() + "observations/" + observation.id;
    const headers = this.authenticationService.newAuthHeader();
    const options = { headers };
    return this.http.put<Observation>(url, observation, options).pipe(map((o) => convertObservationToGeneric(o)));
  }

  private serializeObservation(observation: Observation): Observation {
    return {
      ...observation,
      eventDate:
        typeof observation.eventDate === "object" ? getISOString(observation.eventDate) : observation.eventDate,
      reportDate:
        typeof observation.reportDate === "object" ? getISOString(observation.reportDate) : observation.reportDate,
    };
  }

  async deleteObservation(observation: Observation): Promise<void> {
    const url = this.constantsService.getServerUrl() + "observations/" + observation.id;
    const headers = this.authenticationService.newAuthHeader();
    const options = { headers };
    await this.http.delete(url, options).toPromise();
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
    const headers = this.authenticationService.newAuthHeader("text/csv");
    this.http.get(url, { headers: headers, responseType: "blob" }).subscribe((blob) => {
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
