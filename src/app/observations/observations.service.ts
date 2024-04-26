import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { AuthenticationService } from "../providers/authentication-service/authentication.service";
import { ConstantsService } from "../providers/constants-service/constants.service";
import { convertObservationToGeneric, Observation } from "./models/observation.model";
import {
  GenericObservation,
  ImportantObservation,
  ObservationSource,
  ObservationType,
} from "./models/generic-observation.model";
import { Observable } from "rxjs";
import { catchError, map, mergeAll } from "rxjs/operators";
import { ObservationFilterService } from "./observation-filter.service";
import { augmentRegion } from "app/providers/regions-service/augmentRegion";

@Injectable()
export class AlbinaObservationsService {
  constructor(
    private http: HttpClient,
    private filter: ObservationFilterService,
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
    const url =
      this.constantsService.getServerUrl() +
      "observations?startDate=" +
      this.filter.startDateString +
      "&endDate=" +
      this.filter.endDateString;
    const headers = this.authenticationService.newAuthHeader();
    return this.http.get<Observation[]>(url, { headers }).pipe(
      mergeAll(),
      map((o) => convertObservationToGeneric(o)),
    );
  }

  getGenericObservations(): Observable<GenericObservation> {
    const url =
      this.constantsService.observationApi.$ +
      "?startDate=" +
      this.filter.startDateString +
      "&endDate=" +
      this.filter.endDateString;
    return this.getGenericObservations0(url);
  }

  /**
   * Calculated snow fall levels from weather stations
   * https://gitlab.com/lwd.met/lwd-internal-projects/snow-fall-level-calculator
   */
  getSnowLineCalculations(): Observable<GenericObservation[]> {
    var date = new Date(this.filter.endDate);
    while (
      !imageExists(
        this.constantsService.observationApi["SnowLine"].replace(
          "{{date}}",
          this.constantsService.getISODateString(date),
        ),
      )
    ) {
      date.setDate(date.getDate() - 1);
      if (date < this.filter.startDate) {
        return new Observable<GenericObservation[]>();
      }
    }
    const dataUrl = this.constantsService.observationApi["SnowLine"].replace(
      "{{date}}",
      this.constantsService.getISODateString(date),
    );
    const plotUrl = this.constantsService.observationWeb["SnowLine"];
    return this.http.get<any>(dataUrl).pipe(
      map((snowLines) => {
        const result: GenericObservation[] = [];
        snowLines.features.forEach((snowLine) => {
          result.push(toPoint(snowLine, this.constantsService.getISODateString(date), plotUrl));
        });
        return result;
      }),
      catchError((e) => {
        console.error("Failed to read calculated snow lines from " + dataUrl, e);
        return [];
      }),
    );

    function toPoint(snowLine, date, url): GenericObservation {
      return {
        $type: ObservationType.SimpleObservation,
        $source: ObservationSource.SnowLine,
        $id: snowLine.properties.station_number,
        eventDate: new Date(date),
        reportDate: new Date(date),
        locationName: snowLine.properties.station_name,
        $externalImg: url.replace("{{date}}", date).replace("{{plot}}", snowLine.properties.plot_name),
        latitude: snowLine.geometry.coordinates[1],
        longitude: snowLine.geometry.coordinates[0],
        elevation: snowLine.properties.snowfall_limit,
        importantObservations: [ImportantObservation.SnowLine],
      } as GenericObservation;
    }

    function imageExists(image_url) {
      var http = new XMLHttpRequest();
      http.open("HEAD", image_url, false);
      http.send();
      return http.status != 404;
    }
  }

  getObservers(): Observable<GenericObservation> {
    const url = this.constantsService.observationApi.Observer;
    return this.getGenericObservations0(url);
  }

  getWeatherStations(): Observable<GenericObservation> {
    const url = this.constantsService.observationApi.AvalancheWarningService;
    return this.getGenericObservations0(url);
  }

  getGenericWebcams(): Observable<GenericObservation> {
    const url = this.constantsService.observationApi.Webcam;
    return this.getGenericObservations0(url);
  }

  private getGenericObservations0(url: string): Observable<GenericObservation> {
    const headers = this.authenticationService.newAuthHeader();
    return this.http.get<GenericObservation[]>(url, { headers }).pipe(
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
}

function getISOString(date: Date) {
  // like Date.toISOString(), but not using UTC
  return (
    date.getFullYear() +
    "-" +
    pad(date.getMonth() + 1) +
    "-" +
    pad(date.getDate()) +
    "T" +
    pad(date.getHours()) +
    ":" +
    pad(date.getMinutes()) +
    ":" +
    pad(date.getSeconds())
  );
  function pad(number: number): string {
    return number < 10 ? `0${number}` : `${number}`;
  }
}
