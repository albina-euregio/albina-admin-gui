import { inject, Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { ConstantsService } from "../constants-service/constants.service";

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

  sendLatestBlogPostToChannel(region: string, language: string, channel: PublicationChannel): Observable<Response> {
    const url =
      this.constantsService.getServerUrl() + `blogs/publish/latest/${channel}?&region=${region}&lang=${language}`;
    const body = JSON.stringify("");
    return this.http.post<Response>(url, body);
  }
}
