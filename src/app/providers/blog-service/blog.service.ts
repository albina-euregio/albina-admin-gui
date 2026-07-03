import { Injectable } from "@angular/core";
import { PublicationChannel } from "app/enums/enums";
import { from, map, Observable } from "rxjs";

import { AlbinaLanguage } from "../../models/text.model";
import * as albinaApi from "../albina-api";

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
  sendLatestBlogPostToChannel(
    region: string,
    language: string,
    channel: Exclude<PublicationChannel, PublicationChannel.All>,
  ): Observable<Response> {
    const query = { region, lang: language as albinaApi.LanguageCode };
    const send = (options: { query: typeof query; throwOnError: true }) => {
      if (channel === PublicationChannel.Email) return albinaApi.sendLatestBlogPostEmail(options);
      if (channel === PublicationChannel.Telegram) return albinaApi.sendLatestBlogPostTelegram(options);
      if (channel === PublicationChannel.WhatsApp) return albinaApi.sendLatestBlogPostWhatsApp(options);
      if (channel === PublicationChannel.Push) return albinaApi.sendLatestBlogPostPush(options);
      return albinaApi.sendLatestBlogPost(options);
    };
    return from(send({ query, throwOnError: true })).pipe(map((res) => res.data as unknown as Response));
  }

  loadBlogsForRegion(
    regionCode: string,
    lang: AlbinaLanguage,
    startDate: string,
    endDate: string,
  ): Observable<BlogData> {
    return from(
      albinaApi.getBlogPosts({
        query: {
          region: regionCode,
          lang: lang as albinaApi.LanguageCode,
          startDate,
          endDate,
          searchCategory: "",
          searchText: "",
        },
        throwOnError: true,
      }),
    ).pipe(map((res) => ({ regionCode, lang, blogItems: res.data as unknown as BlogItem[] }) as BlogData));
  }
}
