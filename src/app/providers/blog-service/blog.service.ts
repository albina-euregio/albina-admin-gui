import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { PublicationChannel } from "app/enums/enums";
import { map, Observable } from "rxjs";

import { AlbinaLanguage } from "../../models/text.model";
import { ConstantsService } from "../constants-service/constants.service";

export interface BlogItem {
  id: number;
  title: string;
  published: string;
  categories: string[];
}

export interface BlogData {
  regionCode: string;
  lang: string;
  blogItems: BlogItem[];
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

  loadBlogsForRegion(
    regionCode: string,
    lang: AlbinaLanguage,
    startDate: string,
    endDate: string,
  ): Observable<BlogData> {
    const url = this.constantsService.getServerUrlGET("/blogs/posts" as `/blogs/posts`, {
      region: regionCode,
      lang,
      startDate,
      endDate,
      searchCategory: "",
      searchText: "",
    });
    return this.http
      .get<BlogItem[]>(url)
      .pipe(map((response) => ({ regionCode, lang, blogItems: response as BlogItem[] }) as BlogData));
  }
}
