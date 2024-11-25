import { Injectable, inject } from "@angular/core";
import { HttpClient, HttpParams, HttpRequest, HttpEvent } from "@angular/common/http";
import { ConstantsService } from "../constants-service/constants.service";
import { AuthenticationService } from "../authentication-service/authentication.service";
import { Observable } from "rxjs";
import { TranslateService } from "@ngx-translate/core";

@Injectable()
export class MediaFileService {
  http = inject(HttpClient);
  private constantsService = inject(ConstantsService);
  private translateService = inject(TranslateService);
  private authenticationService = inject(AuthenticationService);

  uploadFile(date: [Date, Date], file: File, text: string, important: boolean): Observable<HttpEvent<any>> {
    const url =
      this.constantsService.getServerUrl() +
      "media?" +
      this.constantsService
        .createSearchParams([
          ["date", this.constantsService.getISOStringWithTimezoneOffset(date[1])],
          ["region", this.authenticationService.getActiveRegionId()],
          ["lang", this.translateService.currentLang],
          ["important", important],
        ])
        .toString();
    const formData = new FormData();
    formData.append("file", file);
    formData.append("text", text);

    const params = new HttpParams();

    const headers = this.authenticationService.newFileAuthHeader("multipart/form-data");
    const options = {
      params: params,
      headers: headers,
    };

    const req = new HttpRequest("POST", url, formData, options);
    return this.http.request(req);
  }
}
