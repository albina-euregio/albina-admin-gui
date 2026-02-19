import { ConstantsService } from "../constants-service/constants.service";
import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { AlbinaLanguage } from "../../models/text.model";

export enum PublicationChannel {
  Email = "email",
  Telegram = "telegram",
  WhatsApp = "whatsapp",
  Push = "push",
  All = "",
}

@Injectable()
export class BlogService {
  http = inject(HttpClient);
  private constantsService = inject(ConstantsService);

  sendLatestBlogPostToChannel(
    region: string,
    language: string,
    channel: Exclude<PublicationChannel, PublicationChannel.All>,
  ): Observable<Response> {
    const url = this.constantsService.getServerUrlPOST(
      `/blogs/publish/latest/${channel}` as `/blogs/publish/latest/email`,
      {
        region: region,
        lang: language as AlbinaLanguage,
      },
    );
    const body = JSON.stringify("");
    return this.http.post<Response>(url, body);
  }
}
