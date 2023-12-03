import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { AuthenticationService } from "../../providers/authentication-service/authentication.service";
import { ConstantsService } from "../../providers/constants-service/constants.service";
import { GenericObservation } from "../models/generic-observation.model";
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
} from "../models/lwdkip.model";
import { merge, Observable } from "rxjs";
import { last, map, mergeMap } from "rxjs/operators";
import { ObservationFilterService } from "../observation-filter.service";

@Injectable()
export class LwdKipObservationsService {
  private lwdKipLayers: Observable<ArcGisLayer[]>;

  constructor(
    private http: HttpClient,
    private filter: ObservationFilterService,
    private authenticationService: AuthenticationService,
    private constantsService: ConstantsService,
  ) {}

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
}
