import { AuthenticationService } from "../authentication-service/authentication.service";
import { ConstantsService } from "../constants-service/constants.service";
import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { TranslateService } from "@ngx-translate/core";

@Injectable()
export class MediaFileService {
  http = inject(HttpClient);
  private constantsService = inject(ConstantsService);
  private translateService = inject(TranslateService);
  private authenticationService = inject(AuthenticationService);

  uploadFile(date: [Date, Date], file: File, text: string, important: boolean) {
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

    return this.http.post(url, formData, {});
  }
}
