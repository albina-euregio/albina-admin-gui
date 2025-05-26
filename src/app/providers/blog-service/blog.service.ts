import { inject, Injectable } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Observable } from "rxjs";
import { ConstantsService } from "../constants-service/constants.service";
import { AuthenticationService } from "../authentication-service/authentication.service";

@Injectable()
export class BlogService {
  http = inject(HttpClient);
  private constantsService = inject(ConstantsService);
  private authenticationService = inject(AuthenticationService);

  sendLatestBlogPost(region: string, language: string, test: boolean): Observable<Response> {
    let url;
    if (test) {
      url = this.constantsService.getServerUrl() + "blogs/publish/latest/test?&region=" + region + "&lang=" + language;
    } else {
      url = this.constantsService.getServerUrl() + "blogs/publish/latest?&region=" + region + "&lang=" + language;
    }
    const body = JSON.stringify("");
    return this.http.post<Response>(url, body);
  }

  sendLatestBlogPostEmail(region: string, language: string, test: boolean): Observable<Response> {
    let url;
    if (test) {
      url =
        this.constantsService.getServerUrl() +
        "blogs/publish/latest/email/test?&region=" +
        region +
        "&lang=" +
        language;
    } else {
      url = this.constantsService.getServerUrl() + "blogs/publish/latest/email?&region=" + region + "&lang=" + language;
    }
    const body = JSON.stringify("");
    return this.http.post<Response>(url, body);
  }

  sendLatestBlogPostTelegram(region: string, language: string, test: boolean): Observable<Response> {
    let url;
    if (test) {
      url =
        this.constantsService.getServerUrl() +
        "blogs/publish/latest/telegram/test?&region=" +
        region +
        "&lang=" +
        language;
    } else {
      url =
        this.constantsService.getServerUrl() + "blogs/publish/latest/telegram?&region=" + region + "&lang=" + language;
    }
    const body = JSON.stringify("");
    return this.http.post<Response>(url, body);
  }

  sendLatestBlogPostPush(region: string, language: string, test: boolean): Observable<Response> {
    let url;
    if (test) {
      url =
        this.constantsService.getServerUrl() + "blogs/publish/latest/push/test?&region=" + region + "&lang=" + language;
    } else {
      url = this.constantsService.getServerUrl() + "blogs/publish/latest/push?&region=" + region + "&lang=" + language;
    }
    const body = JSON.stringify("");
    return this.http.post<Response>(url, body);
  }
}
