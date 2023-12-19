import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { flatMap, last, map } from "rxjs/operators";
import { GenericObservation } from "app/observations/models/generic-observation.model";
import { DomSanitizer } from "@angular/platform-browser";

@Injectable()
export class AlpsolutProfileService {
  constructor(
    private http: HttpClient,
    private sanitizer: DomSanitizer,
  ) {}

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
    return this.http
      .get("https://admin.avalanche.report/widget.alpsolut.eu/", {
        observe: "response",
        responseType: "text",
      })
      .pipe(
        last(),
        flatMap((r) => {
          const apiKey = r.headers.get("X-API-KEY");
          const headers = { "X-API-KEY": apiKey };
          const url = "https://salient.alpsolut.eu/v1/geo/stations";
          return this.http
            .get<AlpsolutFeatureCollection>(url, { headers, params })
            .pipe(
              map(({ features }) =>
                features.flatMap((f) => [
                  ...Object.values(Aspect).map((aspect) => toPoint(f, apiKey, "ALPSCH03", "Stratigraphy", aspect)),
                  toPoint(f, apiKey, "ALPSCH06", "LWCIndexWind", Aspect.Main),
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
    ): AlpsolutObservation {
      // https://widget.alpsolut.eu/docs/ALPSCH03 Stratigraphy
      // https://widget.alpsolut.eu/docs/ALPSCH06 LWCIndexWind
      const dateStart = new Date();
      dateStart.setHours(dateStart.getHours(), 0, 0, 0); // current hour
      dateStart.setDate(dateStart.getDate() - 7); // 7 days in the past
      const dateEnd = new Date();
      dateEnd.setHours(dateEnd.getHours(), 0, 0, 0); // current hour
      dateEnd.setDate(dateEnd.getDate() + 3); // 3 days in the future
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
          configuration: `${configurationLabel}: ${aspect}/${0}°`,
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

export interface AlpsolutFeature {
  id: number;
  code: string;
  name: string;
  type: string;
  latitude: number;
  longitude: number;
  altitude: number;
  timezone: string;
  nwm: string;
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
