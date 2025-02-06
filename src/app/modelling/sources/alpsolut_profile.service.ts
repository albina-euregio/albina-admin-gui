import { Injectable, inject } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Observable } from "rxjs";
import { flatMap, last, map } from "rxjs/operators";
import { GenericObservation } from "app/observations/models/generic-observation.model";
import { DomSanitizer } from "@angular/platform-browser";
import { AuthenticationService } from "../../providers/authentication-service/authentication.service";
import { environment } from "../../../environments/environment";

@Injectable()
export class AlpsolutProfileService {
  private http = inject(HttpClient);
  private authenticationService = inject(AuthenticationService);
  private sanitizer = inject(DomSanitizer);

  private readonly TOKEN_URL = environment.apiBaseUrl + "../api_ext/widget.alpsolut.eu/";
  private readonly WEB = "https://salient.alpsolut.eu/v1/geo/stations";

  /**
   * https://salient.alpsolut.eu/docs
   * https://widget.alpsolut.eu/docs
   */
  getAlpsolutDashboardPoints(): Observable<GenericObservation[]> {
    const sanitizer = this.sanitizer;
    const params = {
      date: new Date().toISOString().slice(0, "2023-12-01".length),
      stage: "SNOWPACK",
      parameters: "hs_mod",
    };
    const intervals: [string, number, number][] = [
      ["last month + forecast", -31, +3],
      ["last week + forecast", -7, +3],
      ["last three days + forecast", -3, +3],
      ["last three days + long forecast", -3, +15],
    ];
    return this.http
      .get(this.TOKEN_URL, {
        headers: new HttpHeaders({ Accept: "text/plain" }),
        observe: "response",
        responseType: "text",
      })
      .pipe(
        last(),
        flatMap((r) => {
          const apiKey = r.body.trim();
          const headers = { "X-API-KEY": apiKey };
          const url = this.WEB;
          return this.http
            .get<AlpsolutFeatureCollection>(url, { headers, params })
            .pipe(
              map(({ features }) =>
                features.flatMap((f) => [
                  ...Object.values(Aspect).flatMap((aspect) =>
                    intervals.map((interval) => toPoint(f, apiKey, "ALPSCH03", "Stratigraphy", aspect, interval)),
                  ),
                  ...intervals.map((interval) => toPoint(f, apiKey, "ALPSCH06", "LWCIndexWind", Aspect.Main, interval)),
                ]),
              ),
            );
        }),
      );

    function toPoint(
      f: AlpsolutFeatureCollection["features"][0],
      apiKey: string,
      configurationId: string,
      configurationLabel: string,
      aspect: Aspect,
      interval: [string, number, number],
    ): AlpsolutObservation {
      // https://widget.alpsolut.eu/docs/ALPSCH03 Stratigraphy
      // https://widget.alpsolut.eu/docs/ALPSCH06 LWCIndexWind
      const dateStart = new Date();
      dateStart.setHours(dateStart.getHours(), 0, 0, 0); // current hour
      dateStart.setDate(dateStart.getDate() + interval[1]);
      const dateEnd = new Date();
      dateEnd.setHours(dateEnd.getHours(), 0, 0, 0); // current hour
      dateEnd.setDate(dateEnd.getDate() + interval[2]);
      const $externalURL = `https://widget.alpsolut.eu/${configurationId}?${new URLSearchParams({
        token: apiKey,
        aspect,
        station_id: String(f.properties.id),
        date_start: dateStart.toISOString(),
        date_end: dateEnd.toISOString(),
      })}`;
      const [longitude, latitude, ..._] = f.geometry.coordinates;
      return {
        $source: "alpsolut_profile",
        $id: String(f.properties.id),
        $data: {
          configuration: `${configurationLabel}: ${aspect}/${0}° / ${interval[0]}`,
        },
        aspect: aspect as any,
        locationName: f.properties.name,
        latitude,
        longitude,
        $externalURL: sanitizer.bypassSecurityTrustResourceUrl($externalURL),
      } as AlpsolutObservation;
    }
  }
}

type AlpsolutFeatureCollection = GeoJSON.FeatureCollection<GeoJSON.Point, Properties>;

interface Properties {
  id: number;
  type: string;
  code: string;
  name: string;
  timezone: string;
  lastDataUpdate?: string;
  data: DataSet;
}

interface DataSet {
  forecastModel?: string;
  forecastStartsAfter?: string;
  timestamps: string[];
  values: any;
}

enum Aspect {
  East = "EAST",
  Main = "MAIN",
  North = "NORTH",
  South = "SOUTH",
  West = "WEST",
}

export type AlpsolutObservation = GenericObservation<{ configuration: string }>;
