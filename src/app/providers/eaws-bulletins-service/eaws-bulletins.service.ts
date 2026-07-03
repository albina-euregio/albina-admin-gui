import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Bulletin, Bulletins, BulletinsSchema } from "app/models/CAAMLv6";
import { map, Observable } from "rxjs";

import { AuthenticationService } from "../authentication-service/authentication.service";
import { ConstantsService } from "../constants-service/constants.service";

@Injectable({ providedIn: "root" })
export class EawsBulletinsService {
  private http = inject(HttpClient);
  private constantsService = inject(ConstantsService);
  private authenticationService = inject(AuthenticationService);

  /**
   * Fetch the published EAWS bulletin for the given date and avalanche region
   * from the static bulletins host.
   */
  fetchPublishedBulletin({
    dateTime,
    avalancheRegion,
  }: {
    dateTime: Date;
    avalancheRegion?: string | null;
  }): Observable<Bulletin> {
    const region = this.authenticationService.getActiveRegionId();
    const date = this.constantsService.getISODateString(dateTime);
    return this.http
      .get<Bulletins>(`https://static.avalanche.report/eaws_bulletins/${date}/${date}-${region}.json`)
      .pipe(
        map((bulletins) =>
          BulletinsSchema.parse(bulletins).bulletins.find((b) => b.regions.some((r) => r.regionID === avalancheRegion)),
        ),
      );
  }
}
