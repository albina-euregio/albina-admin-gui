import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { ConstantsService } from "../providers/constants-service/constants.service";
import { Observable, of } from "rxjs";
import { catchError, flatMap, last, map } from "rxjs/operators";
import { RegionsService } from "app/providers/regions-service/regions.service";
import { GenericObservation, ObservationType } from "app/observations/models/generic-observation.model";
import { geoJSON, LatLng } from "leaflet";
import { DomSanitizer, SafeResourceUrl } from "@angular/platform-browser";

interface MultimodelPointCsv {
  statnr: string;
  lat: string;
  lon: string;
  elev: string;
  name: string;
  code: string;
}

export interface ZamgFreshSnow {
  hour: number;
  values: number[];
  min: number;
  max: number;
}

export interface SnowpackPlots {
  plotTypes: string[];
  aspects: string[];
  stations: string[];
}

export interface AvalancheWarningServiceObservedProfiles {
  latitude: number;
  longitude: number;
  elevation: number;
  aspect: string;
  eventDate: Date;
  locationName: string;
  $externalURL: string;
}

@Injectable()
export class ModellingService {
  constructor(
    public http: HttpClient,
    public constantsService: ConstantsService,
    public regionsService: RegionsService,
    private sanitizer: DomSanitizer,
  ) {}

  private parseCSV<T>(text: string) {
    const lines = text
      .split(/\r?\n/)
      .filter((line) => !!line && !line.startsWith("#"))
      .map((line) => line.split(/;/));
    const [header, ...rest] = lines;
    return rest.map((row) => {
      const entries = row.map((cell, index) => [header[index], cell]);
      return Object.fromEntries(entries) as T;
    });
  }

  get(type: "multimodel" | "meteogram" | "observed_profile" | "alpsolut_profile"): Observable<GenericObservation[]> {
    if (type === "alpsolut_profile") {
      return this.getAlpsolutDashboardPoints();
    } else if (type === "observed_profile") {
      return this.getObservedProfiles();
    } else if (type === "multimodel") {
      return this.getZamgMultiModelPoints();
    } else if (type === "meteogram") {
      return this.getZamgMeteograms();
    }
  }

  private getZamgMeteograms(): Observable<GenericObservation[]> {
    const observations = this.regionsService
      .getRegionsEuregio()
      .features.filter((f) => /AT-07/.test(f.properties.id))
      .sort((f1, f2) => f1.properties.id.localeCompare(f2.properties.id))
      .map((f): GenericObservation => {
        const center = geoJSON(f).getBounds().getCenter();
        const file = f.properties.id.replace(/AT-07-/, "");
        const $externalURL = `https://wiski.tirol.gv.at/lawine/produkte/meteogramm_R-${file}.png`;
        return {
          $type: ObservationType.TimeSeries,
          $externalURL,
          $source: "meteogram",
          region: f.properties.id,
          locationName: f.properties.name,
          latitude: center.lat,
          longitude: center.lng,
        } as GenericObservation;
      });
    return of(observations);
  }

  private getZamgMultiModelPoints(): Observable<GenericObservation[]> {
    const url = this.constantsService.zamgModelsUrl + "snowgridmultimodel_stationlist.txt";

    return this.http.get(url, { responseType: "text" }).pipe(
      map((response) => this.parseCSV<MultimodelPointCsv>(response.toString().replace(/^#\s*/, ""))),
      map((points) =>
        points
          .map((row: MultimodelPointCsv): GenericObservation => {
            const id = row.statnr;
            const regionCode = row.code;
            const region = this.regionsService.getRegionForId(regionCode);
            const lat = parseFloat(row.lat);
            const lng = parseFloat(row.lon);

            return {
              $source: "multimodel",
              $data: row,
              $id: id,
              region: regionCode,
              locationName: region?.name,
              $extraDialogRows: [
                ...["HN", "HS"].map((type) => ({
                  label: `ECMWF ${type}`,
                  url: `${this.constantsService.zamgModelsUrl}eps_ecmwf/snowgrid_ECMWF_EPS_${id}_${type}.png`,
                })),
                ...["HN", "HS"].map((type) => ({
                  label: `CLAEF ${type}`,
                  url: `${this.constantsService.zamgModelsUrl}eps_claef/snowgrid_C-LAEF_EPS_${id}_${type}.png`,
                })),
              ],
              latitude: lat,
              longitude: lng,
            } as GenericObservation;
          })
          .sort((p1, p2) => p1.region.localeCompare(p2.region)),
      ),
    );
  }

  /**
   * Returns a data structure for the snowpack visualizations.
   */
  getSnowpackPlots(): SnowpackPlots {
    const plotTypes = ["LWC_stratigraphy", "wet_snow_instability", "Sk38_stratigraphy", "stratigraphy"];
    const aspects = ["flat", "north", "south"];
    const stations = [
      "AKLE2",
      "AXLIZ1",
      "BJOE2",
      "GGAL2",
      "GJAM2",
      "INAC2",
      "ISEE2",
      "KAUN2",
      "MIOG2",
      "NGAN2",
      "PESE2",
      "RHAN2",
      "SDAW2",
      "SSON2",
      "TRAU2",
    ];
    return { plotTypes, aspects, stations };
  }

  getSnowpackMeteoPlots(): string[] {
    return [
      "AT-7_new_snow_plot_3day",
      "AT-7_new_snow_plot_7day",
      "AT-7_new_snow_plot_1month",
      "AT-7_new_snow_plot_season",
      "AT-7_new_snow_plot_forecast",
      "AT-7_wet_snow_plot_3day",
      "AT-7_wet_snow_plot_7day",
      "AT-7_wet_snow_plot_1month",
      "AT-7_wet_snow_plot_season",
      "AT-7_wet_snow_plot_forecast",
      "AT-7_HS_table_24h",
      "AT-7_HS_table_72h",
      "AT-7_HS_table_season",
      "AT-7_HS_table_forecast",
      "AT-7_TA_table_24h",
      "AT-7_TA_table_72h",
      "AT-7_TA_table_season",
    ];
  }

  /**
   * SNOWPACK modelled snow profiles
   * https://gitlab.com/avalanche-warning
   */
  getObservedProfiles(): Observable<GenericObservation[]> {
    const url = this.constantsService.observationApi.AvalancheWarningService;
    const regionsService = this.regionsService;
    return this.http.get<AvalancheWarningServiceObservedProfiles[]>(url).pipe(
      map((profiles) => profiles.map((profile) => toPoint(profile))),
      catchError((e) => {
        console.error("Failed to read observed_profiles from " + url, e);
        return [];
      }),
    );

    function toPoint(profile: AvalancheWarningServiceObservedProfiles): GenericObservation {
      return {
        $source: "observed_profile",
        $id: profile.$externalURL,
        eventDate: new Date(profile.eventDate),
        locationName: profile.locationName,
        $externalURL: profile.$externalURL,
        region: regionsService.getRegionForLatLng(new LatLng(profile.latitude, profile.longitude))?.id,
        latitude: profile.latitude,
        longitude: profile.longitude,
      } as GenericObservation;
    }
  }

  /**
   * https://salient.alpsolut.eu/docs
   * https://widget.alpsolut.eu/docs
   */
  getAlpsolutDashboardPoints(): Observable<GenericObservation[]> {
    const regionsService = this.regionsService;
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
        region: regionsService.getRegionForLatLng(new LatLng(latitude, longitude))?.id,
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
