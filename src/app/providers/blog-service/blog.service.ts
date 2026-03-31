import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";

import { AlbinaLanguage } from "../../models/text.model";
import { ConstantsService } from "../constants-service/constants.service";

export enum PublicationChannel {
  Email = "email",
  Telegram = "telegram",
  WhatsApp = "whatsapp",
  Push = "push",
  All = "",
}

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

type BlogApiResponse = BlogItem[];

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

  async loadBlogsForRegion(regionCode: string, lang: AlbinaLanguage): Promise<BlogData> {
    const url = this.constantsService.getServerUrlGET("/blogs/posts" as `/blogs/posts`, {
      region: regionCode,
      lang,
      searchCategory: "",
      searchText: "",
      year: "",
    });
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to load blogs for ${regionCode}: ${response.status} ${response.statusText}`);
    }

    const blogItems = (await response.json()) as BlogApiResponse;

    return {
      regionCode,
      lang,
      blogItems,
    };
  }
}
