import { inject, Injectable } from "@angular/core";
import { from, map, Observable } from "rxjs";

import * as albinaApi from "../albina-api";
import { repeatedArrayQuerySerializer } from "../albina-api.provider";
import { AuthenticationService } from "../authentication-service/authentication.service";
import { ConstantsService } from "../constants-service/constants.service";

@Injectable()
export class StatisticsService {
  private constantsService = inject(ConstantsService);
  private authenticationService = inject(AuthenticationService);

  getBulletinStatisticsCsv(
    startDate: Date,
    endDate: Date,
    lang: string,
    extended: boolean,
    duplicates: boolean,
  ): Observable<Blob> {
    return from(
      albinaApi.getBulletinCsv({
        query: {
          startDate: this.constantsService.getISOStringWithTimezoneOffset(startDate),
          endDate: this.constantsService.getISOStringWithTimezoneOffset(endDate),
          regions: [this.authenticationService.getActiveRegionId()],
          lang: lang as albinaApi.LanguageCode,
          extended: extended ?? false,
          duplicate: duplicates ?? false,
          obsoleteMatrix: false,
        },
        querySerializer: repeatedArrayQuerySerializer,
        headers: { Accept: "text/csv" },
        // `responseType` is not part of the typed options, but Angular's HttpClient
        // honours it so the CSV is returned as a Blob instead of parsed JSON.
        responseType: "blob",
        throwOnError: true,
      } as albinaApi.Options<albinaApi.GetBulletinCsvData, true>),
    ).pipe(map((res) => res.data as Blob));
  }

  getDangerSourceStatisticsCsv(startDate: Date, endDate: Date): Observable<Blob> {
    return from(
      albinaApi.getDangerSourceCsv({
        query: {
          startDate: this.constantsService.getISOStringWithTimezoneOffset(startDate),
          endDate: this.constantsService.getISOStringWithTimezoneOffset(endDate),
        },
        headers: { Accept: "text/csv" },
        // `responseType` is not part of the typed options, but Angular's HttpClient
        // honours it so the CSV is returned as a Blob instead of parsed JSON.
        responseType: "blob",
        throwOnError: true,
      } as albinaApi.Options<albinaApi.GetDangerSourceCsvData, true>),
    ).pipe(map((res) => res.data as Blob));
  }
}
