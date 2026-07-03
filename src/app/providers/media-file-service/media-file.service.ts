import { inject, Injectable } from "@angular/core";
import { TranslateService } from "@ngx-translate/core";
import { from, map } from "rxjs";

import * as albinaApi from "../albina-api";
import { AuthenticationService } from "../authentication-service/authentication.service";
import { ConstantsService } from "../constants-service/constants.service";

@Injectable()
export class MediaFileService {
  private constantsService = inject(ConstantsService);
  private translateService = inject(TranslateService);
  private authenticationService = inject(AuthenticationService);

  uploadFile(date: [Date, Date], file: File, text: string, important: boolean) {
    return from(
      albinaApi.saveMediaFile({
        query: {
          date: this.constantsService.getISOStringWithTimezoneOffset(date[1]),
          region: this.authenticationService.getActiveRegionId(),
          lang: this.translateService.getCurrentLang() as albinaApi.LanguageCode,
          important: important,
        },
        body: { file, text },
        throwOnError: true,
      }),
    ).pipe(map((res) => res.data));
  }
}
