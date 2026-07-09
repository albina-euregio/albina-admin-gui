import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { BulletinModelAsJSON } from "app/models/bulletin.model";
import { from, Observable, of } from "rxjs";
import { map, switchMap } from "rxjs/operators";

import { Bulletins, toAlbinaBulletins } from "../../models/CAAMLv6";
import { ServerModel } from "../../models/server.model";
import * as albinaApi from "../albina-api";
import { AuthenticationService } from "../authentication-service/authentication.service";
import { ConstantsService } from "../constants-service/constants.service";
import { LocalStorageService } from "../local-storage-service/local-storage.service";

/**
 * Loads bulletins from foreign (external) avalanche warning servers, which run
 * the same ALBINA API but are addressed by their own base URL and bearer token.
 * Requests reuse the generated hey-api client with a per-call `baseUrl` and
 * `Authorization` header instead of the globally configured local API.
 */
@Injectable({ providedIn: "root" })
export class ExternalBulletinsService {
  private http = inject(HttpClient);
  private constantsService = inject(ConstantsService);
  private authenticationService = inject(AuthenticationService);
  private localStorageService = inject(LocalStorageService);

  loadExternalBulletins([date0, date1]: [Date, Date], server: ServerModel): Observable<BulletinModelAsJSON[]> {
    if (this.localStorageService.isTrainingEnabled) {
      return of([]);
    }
    const headers = { Authorization: "Bearer " + server.accessToken };
    if (server.apiUrl.includes("/api/bulletin-preview/caaml/")) {
      const params = { activeAt: new Date(+date0 / 2 + +date1 / 2).toISOString() };
      return this.http.get<Bulletins>(server.apiUrl, { headers, params }).pipe(map((data) => toAlbinaBulletins(data)));
    }
    const baseUrl = server.apiUrl.replace(/\/$/, "");
    return from(albinaApi.getLatest({ baseUrl, headers, throwOnError: true })).pipe(
      switchMap((latest) => {
        const date = new Date(date0);
        if (latest.data.date.endsWith("T22:00:00Z") || latest.data.date.endsWith("T23:00:00Z")) {
          date.setHours(24, 0, 0);
        }
        return from(
          albinaApi.getJsonBulletins({
            baseUrl,
            headers,
            query: {
              date: this.constantsService.getISOStringWithTimezoneOffset(date),
              regions: server.regions.filter((region) => !this.authenticationService.isInternalRegion(region)),
            },
            // external servers expect regions as repeated params (regions=AT-05&regions=AT-06&…)
            querySerializer: { array: { explode: true, style: "form" } },
            throwOnError: true,
          }),
        );
      }),
      map((res) => res.data as unknown as BulletinModelAsJSON[]),
    );
  }
}
