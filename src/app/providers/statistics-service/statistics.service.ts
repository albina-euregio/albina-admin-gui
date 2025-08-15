import { AuthenticationService } from "../authentication-service/authentication.service";
import { ConstantsService } from "../constants-service/constants.service";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";

@Injectable()
export class StatisticsService {
  http = inject(HttpClient);
  private constantsService = inject(ConstantsService);
  private authenticationService = inject(AuthenticationService);

  getBulletinStatisticsCsv(
    startDate: Date,
    endDate: Date,
    lang: string,
    extended: boolean,
    duplicates: boolean,
  ): Observable<Blob> {
    const url =
      this.constantsService.getServerUrl() +
      "statistics?" +
      this.constantsService
        .createSearchParams([
          ["startDate", this.constantsService.getISOStringWithTimezoneOffset(startDate)],
          ["endDate", this.constantsService.getISOStringWithTimezoneOffset(endDate)],
          ["region", this.authenticationService.getActiveRegionId()],
          ["lang", lang],
          ["extended", extended],
          ["duplicates", duplicates],
        ])
        .toString();
    const headers = new HttpHeaders({ Accept: "text/csv" });
    return this.http.get(url, { headers, responseType: "blob" });
  }

  getDangerSourceStatisticsCsv(startDate: Date, endDate: Date): Observable<Blob> {
    const url =
      this.constantsService.getServerUrl() +
      "statistics/danger-sources?" +
      this.constantsService
        .createSearchParams([
          ["startDate", this.constantsService.getISOStringWithTimezoneOffset(startDate)],
          ["endDate", this.constantsService.getISOStringWithTimezoneOffset(endDate)],
        ])
        .toString();
    const headers = new HttpHeaders({ Accept: "text/csv" });
    return this.http.get(url, { headers, responseType: "blob" });
  }
}
