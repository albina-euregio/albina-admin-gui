import { Injectable, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { ConstantsService } from "../constants-service/constants.service";
import { AuthenticationService } from "../authentication-service/authentication.service";

@Injectable()
export class StatisticsService {
  http = inject(HttpClient);
  private constantsService = inject(ConstantsService);
  private authenticationService = inject(AuthenticationService);

  getStatisticsCsv(
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
    const headers = this.authenticationService.newAuthHeader("text/csv");

    return this.http.get(url, { headers: headers, responseType: "blob" });
  }
}
