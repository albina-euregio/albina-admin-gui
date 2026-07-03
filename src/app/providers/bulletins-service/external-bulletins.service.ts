import { HttpClient, HttpHeaders } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { BulletinModelAsJSON } from "app/models/bulletin.model";
import { Observable, of } from "rxjs";
import { map, switchMap } from "rxjs/operators";

import { Bulletins, toAlbinaBulletins } from "../../models/CAAMLv6";
import { ServerModel } from "../../models/server.model";
import { AuthenticationService } from "../authentication-service/authentication.service";
import { ConstantsService } from "../constants-service/constants.service";
import { LocalStorageService } from "../local-storage-service/local-storage.service";

/**
 * Loads bulletins from foreign (external) avalanche warning servers, which are
 * addressed by their own base URL and bearer token rather than the local API,
 * so these requests do not go through the generated hey-api client.
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
    const headers = new HttpHeaders({ Authorization: "Bearer " + server.accessToken });
    if (server.apiUrl.includes("/api/bulletin-preview/caaml/")) {
      const params = { activeAt: new Date(+date0 / 2 + +date1 / 2).toISOString() };
      return this.http.get<Bulletins>(server.apiUrl, { headers, params }).pipe(map((data) => toAlbinaBulletins(data)));
    }
    return this.http
      .get<{ date: string }>(this.constantsService.getExternalServerUrlGET(server, "/bulletins/latest"), { headers })
      .pipe(
        switchMap((latest) => {
          const date = new Date(date0);
          if (latest.date.endsWith("T22:00:00Z") || latest.date.endsWith("T23:00:00Z")) {
            date.setHours(24, 0, 0);
          }
          const url = this.constantsService.getExternalServerUrlGET(server, "/bulletins/edit", {
            date: this.constantsService.getISOStringWithTimezoneOffset(date),
            regions: server.regions.filter((region) => !this.authenticationService.isInternalRegion(region)),
          });
          return this.http.get<BulletinModelAsJSON[]>(url, { headers });
        }),
      );
  }
}
