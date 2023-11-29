import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { AuthenticationService } from "app/providers/authentication-service/authentication.service";
import { ConstantsService } from "app/providers/constants-service/constants.service";
import { convertObservationToGeneric, Observation } from "./models/observation.model";
import { convertLoLaKronos, LolaKronosApi } from "./models/lola-kronos.model";
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
} from "./models/lawis.model";
import { GenericObservation, ObservationSource } from "./models/generic-observation.model";
import {
  ArcGisApi,
  ArcGisLayer,
  convertLwdKipBeobachtung,
  convertLwdKipLawinenabgang,
  convertLwdKipSperren,
  convertLwdKipSprengerfolg,
  LwdKipBeobachtung,
  LwdKipLawinenabgang,
  LwdKipSperren,
  LwdKipSprengerfolg,
} from "./models/lwdkip.model";
import { ApiWikisnowECT, convertWikisnow, WikisnowECT } from "./models/wikisnow.model";
import { getAwsObservers } from "./models/aws-observer.model";
import { TranslateService } from "@ngx-translate/core";
import { from, merge, Observable, of, onErrorResumeNext } from "rxjs";
import { catchError, filter, last, map, mergeAll, mergeMap } from "rxjs/operators";
import { ObservationFilterService } from "./observation-filter.service";
import { RegionsService } from "../providers/regions-service/regions.service";
import { ElevationService } from "../providers/map-service/elevation.service";
import { LatLng } from "leaflet";
import { FotoWebcamEU, FotoWebcamEUResponse, convertFotoWebcamEU, addLolaCadsData } from "./models/foto-webcam.model";
import { PanomaxCamResponse, PanomaxThumbnailResponse, convertPanomax } from "./models/panomax.model";

@Injectable()
export class ObservationsService {
  private lwdKipLayers: Observable<ArcGisLayer[]>;

  constructor(
    public http: HttpClient,
    public filter: ObservationFilterService,
    public authenticationService: AuthenticationService,
    public translateService: TranslateService,
    public constantsService: ConstantsService,
    public regionsService: RegionsService,
    public elevationService: ElevationService,
  ) {}

  loadAll(): Observable<GenericObservation<any>> {
    return onErrorResumeNext(
      this.getObservers(),
      this.getLawisIncidents(),
      this.getLawisProfiles(),
      this.getLoLaKronos(ObservationSource.LoLaKronos),
      this.getLoLaKronos(ObservationSource.LoLaAvalancheFeedbackAT5),
      this.getLoLaKronos(ObservationSource.LoLaAvalancheFeedbackAT8),
      this.getLwdKipObservations(),
      this.getWikisnowECT(),
      this.getObservations(),
      // this.getFotoWebcamsEU(),
      this.getPanomax(),
    );
  }

  getObservation(id: number): Observable<GenericObservation<Observation>> {
    const url = this.constantsService.getServerUrl() + "observations/" + id;
    const headers = this.authenticationService.newAuthHeader();
    const options = { headers };
    return this.http.get<Observation>(url, options).pipe(map((o) => convertObservationToGeneric(o)));
  }

  private getLwdKipLayer<T extends object>(name: string, params: Record<string, string>) {
    if (!this.lwdKipLayers) {
      const url = this.constantsService.getServerUrl() + "observations/lwdkip/layers?f=json";
      const headers = this.authenticationService.newAuthHeader();
      this.lwdKipLayers = this.http.get<ArcGisApi>(url, { headers }).pipe(
        map((data) => {
          if ("error" in data) {
            throw new Error(data.error?.message);
          } else if (!data.layers?.length) {
            throw new Error("No LWDKIP layers found!");
          }
          return data.layers;
        }),
      );
    }
    const lwdKipLayers = this.lwdKipLayers.pipe(last());
    return lwdKipLayers.pipe(
      mergeMap((layers) => {
        const layer = layers.find((l) => l.name.trim() === name && l.type === "Feature Layer");
        if (!layer) {
          throw new Error("No LWDKIP layer for " + name);
        }
        const url = this.constantsService.getServerUrl() + "observations/lwdkip/" + layer.id;
        const headers = this.authenticationService.newAuthHeader();
        return this.http.get<T | { error: { message: string } }>(url, { headers, params }).pipe(
          map((data) => {
            if ("error" in data) {
              console.error("Failed fetching LWDKIP " + name, new Error(data.error?.message));
              return { features: [] };
            }
            return data;
          }),
        );
      }),
    );
  }

  getLwdKipObservations(): Observable<GenericObservation> {
    const startDate = this.filter.startDate.toISOString().slice(0, "2006-01-02T15:04:05".length).replace("T", " ");
    const endDate = this.filter.endDate.toISOString().slice(0, "2006-01-02T15:04:05".length).replace("T", " ");
    const params: Record<string, string> = {
      where: `BEOBDATUM > TIMESTAMP '${startDate}' AND BEOBDATUM < TIMESTAMP '${endDate}'`,
      outFields: "*",
      datumTransformation: "5891",
      f: "geojson",
    };
    const o0 = this.getLwdKipLayer<LwdKipBeobachtung>("Beobachtungen", params).pipe(
      mergeMap((featureCollection) => featureCollection.features),
      map((feature) => convertLwdKipBeobachtung(feature)),
    );
    const o1 = this.getLwdKipLayer<LwdKipSprengerfolg>("Sprengerfolg", params).pipe(
      mergeMap((featureCollection) => featureCollection.features),
      map((feature) => convertLwdKipSprengerfolg(feature)),
    );
    const o2 = this.getLwdKipLayer<LwdKipLawinenabgang>("Lawinenabgänge", params).pipe(
      mergeMap((featureCollection) => featureCollection.features),
      map((feature) => convertLwdKipLawinenabgang(feature)),
    );
    const o3 = this.getLwdKipLayer<LwdKipSperren>("aktive_Sperren", {
      ...params,
      where: "1=1",
    }).pipe(
      mergeMap((featureCollection) => featureCollection.features),
      map((feature) => convertLwdKipSperren(feature)),
    );
    return merge(o0, o1, o2, o3);
  }

  getObservations(): Observable<GenericObservation<Observation>> {
    //    console.log("getObservations ##1", this.startDateString, this.endDateString);
    const url =
      this.constantsService.getServerUrl() +
      "observations?startDate=" +
      this.startDateString +
      "&endDate=" +
      this.endDateString;
    const headers = this.authenticationService.newAuthHeader();
    return this.http.get<Observation[]>(url, { headers }).pipe(
      mergeAll(),
      map((o) => convertObservationToGeneric(o)),
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

  getObservers(): Observable<GenericObservation> {
    return of(...getAwsObservers());
  }

  getLoLaKronos(
    source:
      | ObservationSource.LoLaKronos
      | ObservationSource.LoLaAvalancheFeedbackAT5
      | ObservationSource.LoLaAvalancheFeedbackAT8,
  ): Observable<GenericObservation> {
    const { observationApi: api, observationWeb: web } = this.constantsService;
    const timeframe = this.startDateString + "/" + this.endDateString;
    return this.http
      .get<LolaKronosApi>(api[source] + timeframe)
      .pipe(mergeMap((kronos) => convertLoLaKronos(kronos, web[source])));
  }

  getWikisnowECT(): Observable<GenericObservation> {
    const { observationApi: api } = this.constantsService;
    return this.http.get<ApiWikisnowECT>(api.WikisnowECT).pipe(
      mergeMap((api) => api.data),
      map<WikisnowECT, GenericObservation>((wikisnow) => convertWikisnow(wikisnow)),
      filter((observation) => this.filter.inDateRange(observation) && this.filter.inMapBounds(observation)),
    );
  }

  getLawisProfiles(): Observable<GenericObservation> {
    const { observationApi: api, observationWeb: web } = this.constantsService;
    return this.http
      .get<Profile[]>(
        api.Lawis +
          "profile" +
          "?startDate=" +
          this.startDateString +
          "&endDate=" +
          this.endDateString +
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
          this.startDateString +
          "&endDate=" +
          this.endDateString +
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

  getLolaCads(cam: GenericObservation): Observable<any> {
    const lolaCadsApi = "https://api.avalanche.report/www.lola-cads.info/LWDprocessPhotoURL";
    const token =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJsb2xhQWNjZXNzIjpmYWxzZSwibHdkQWNjZXNzIjp0cnVlLCJpYXQiOjE2Nzk1ODA3NjYsImV4cCI6MTcxMTExNjc2Nn0.IpZ4Nkkmvw0IiEi3Hvh9Pt4RvtJv7KktMLQCwdhVtBU";

    //get url from latest image
    const imgurl = cam.$data["latest"];

    //make url safe
    const imgurlSafe = encodeURIComponent(imgurl);
    const fullUrl = lolaCadsApi + "?imageurl=" + imgurlSafe;

    const headers = new HttpHeaders({
      Authorization: token,
    });

    const options = { headers: headers };

    // console.log(fullUrl);

    //create post request to lolaCadsApi with imageurl: imgurl as parameter and token as authorization header
    return this.http.post<any>(fullUrl, {}, options);
  }

  //get panomax cams and fetch lola cads data for each
  getPanomax(): Observable<GenericObservation> {
    const { observationApi: api } = this.constantsService;

    // make request to observationApi.panomax and make a request to the thumbnail url for each result.instance.id
    return this.http.get<PanomaxCamResponse>(api.Panomax + "/maps/panomaxweb").pipe(
      mergeMap(({ instances }: PanomaxCamResponse) => Object.values(instances)),
      filter(({ cam }) => !!this.regionsService.getRegionForLatLng(new LatLng(cam.latitude, cam.longitude))?.id),
      mergeMap((webcam) =>
        this.http.get<PanomaxThumbnailResponse[]>(api.Panomax + "/instances/thumbnails/" + webcam.id).pipe(
          filter((thumbs) => !!thumbs?.length),
          map((thumbs) => this.augmentRegion(convertPanomax(thumbs[0]))),
        ),
      ),
    );
  }

  augmentRegion(observation: GenericObservation) {
    if (observation.latitude && observation.longitude) {
      const ll = new LatLng(observation.latitude, observation.longitude);
      observation.region = this.regionsService.getRegionForLatLng(ll)?.id;
    }
    return observation;
  }

  getFotoWebcamsEU(): Observable<GenericObservation> {
    const { observationApi: api } = this.constantsService;

    return this.http.get<FotoWebcamEUResponse>(api.FotoWebcamsEU).pipe(
      mergeMap(({ cams }: FotoWebcamEUResponse) =>
        from(
          cams
            .map((webcam: FotoWebcamEU) => this.augmentRegion(convertFotoWebcamEU(webcam)))
            .filter((observation) => observation.$data.offline === false)
            .filter((observation) => observation.region !== undefined),
        ),
      ),
      mergeMap((cam: GenericObservation) => {
        if (cam.$data["latest"].includes("foto-webcam.eu")) {
          return this.getLolaCads(cam).pipe(map((lolaCadsData) => addLolaCadsData(cam, lolaCadsData)));
        } else {
          return of(cam);
        }
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

  private get startDateString(): string {
    return this.constantsService.getISOStringWithTimezoneOffsetUrlEncoded(this.filter.startDate);
  }

  private get endDateString(): string {
    return this.constantsService.getISOStringWithTimezoneOffsetUrlEncoded(this.filter.endDate);
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

function nowWithHourPrecision(): number {
  const now = new Date();
  now.setHours(now.getHours(), 0, 0, 0);
  return +now;
}
