import { FeatureCollectionSchema } from "@albina-euregio/linea/listing";
import { FeatureCollectionSchema as LegacyFeatureCollectionSchema } from "@albina-euregio/linea/listing-legacy";
import { inject, Injectable } from "@angular/core";
import { AuthenticationService } from "app/providers/authentication-service/authentication.service";
import { ConstantsService } from "app/providers/constants-service/constants.service";

import sources from "../../assets/config/stations.json";

interface LineaStationSource {
  stations: string;
  smetOperators: string;
  smet: string[];
}

export interface LineaStationFeature {
  id: string;
  name: string;
  shortName: string;
  smetId: string;
  smet: string[];
  latitude: number;
  longitude: number;
  hasPsum: boolean;
}

export interface BlogData {
  regionCode: string;
  lang: string;
  blogItems: BlogItem[];
}

export interface BlogItem {
  id: number;
  title: string;
  published: string;
  categories: string[];
}

type BulletinApiResponse = {
  bulletins?: unknown[];
};

type BlogApiResponse = BlogItem[];

@Injectable({ providedIn: "root" })
export class GraphicsService {
  private readonly bulletinApiUrl = "https://api.avalanche.report/albina/api/bulletins/caaml/json";
  private readonly blogApiUrl = "https://api.avalanche.report/albina_dev/api/blogs/posts";

  private authentificationService = inject(AuthenticationService);
  private constantsService = inject(ConstantsService);

  async loadLineaStations(): Promise<LineaStationFeature[]> {
    const stationById = new Map<string, LineaStationFeature>();

    let source: LineaStationSource;
    for (source of sources) {
      const response = await fetch(source.stations);
      const json = await response.json();
      const searchParams = new URL(source.stations, location.href).searchParams;
      const isLegacy = searchParams.get("v") === "legacy";
      const schema = isLegacy ? LegacyFeatureCollectionSchema : FeatureCollectionSchema;
      const collection = schema.parse(json, { reportInput: true });

      for (const feature of collection.features) {
        if (!new RegExp(source.smetOperators).test(feature.properties.operator)) {
          continue;
        }

        const id = feature.id;
        if (stationById.has(id)) {
          continue;
        }

        stationById.set(id, {
          id,
          name: feature.properties?.name,
          shortName: feature.properties?.shortName ?? feature.properties?.name ?? id,
          smetId: feature.properties?.shortName ?? id,
          smet: source.smet,
          latitude: feature.geometry.coordinates[1],
          longitude: feature.geometry.coordinates[0],
          hasPsum: feature.properties.PSUM_6.value != undefined,
        });
      }
    }

    return [...stationById.values()];
  }

  getBulletinLanguage(): string {
    const htmlLang = document.documentElement.lang?.trim().toLowerCase();
    if (htmlLang) {
      return htmlLang.split("-")[0] || "de";
    }

    const browserLang = navigator.language?.trim().toLowerCase();
    return browserLang ? browserLang.split("-")[0] || "de" : "de";
  }

  getBulletinRegionCodes(): string[] {
    return this.authentificationService.getInternalRegionsWithoutSuperRegions((r) => r.publishBulletins);
  }

  getBlogRegionCodes(): string[] {
    return this.authentificationService.getInternalRegionsWithoutSuperRegions((r) => r.publishBlogs);
  }

  async loadBulletins(
    startDate: string,
    endDate: string,
    regionCodes: string[],
    lang: string = "de",
  ): Promise<unknown[]> {
    if (!startDate || !endDate) {
      return [];
    }
    const regions = [...new Set(regionCodes.filter(Boolean))];
    if (!regions.length) {
      return [];
    }
    const dates = this.getDateRange(startDate, endDate);
    const requests = dates.map((date) => this.loadBulletinsForDate(date, regions, lang));
    const results = await Promise.all(requests);
    return results.flat();
  }

  async loadBlogs(startDate: string, endDate: string, regionCodes: string[]): Promise<BlogData[]> {
    const start = Date.parse(`${startDate}T00:00:00.000Z`);
    const end = Date.parse(`${endDate}T23:59:59.999Z`);
    if (Number.isNaN(start) || Number.isNaN(end) || start > end) {
      return [];
    }

    const regions = [...new Set(regionCodes.filter(Boolean))];
    if (!regions.length) {
      return [];
    }

    const blogsByRegion = await Promise.all(regions.map((regionCode) => this.loadBlogsForRegion(regionCode)));

    return blogsByRegion.map((regionBlogs) => ({
      ...regionBlogs,
      blogItems: regionBlogs.blogItems.filter((item) => {
        const published = Date.parse(item.published);
        return !Number.isNaN(published) && published >= start && published <= end;
      }),
    }));
  }

  getSmetUrl(station: Pick<LineaStationFeature, "smet" | "smetId"> | undefined, index: number): string | undefined {
    const template = station?.smet?.[index];
    const smetId = station?.smetId;
    return template && smetId ? template.replace(/\{id\}/g, smetId) : undefined;
  }

  getSmetUrlsByIds(
    ids: string[],
    stations: Pick<LineaStationFeature, "id" | "smet" | "smetId">[],
    index: number,
  ): string[] {
    const stationById = new Map(stations.map((station) => [station.id, station]));
    return ids.map((id) => this.getSmetUrl(stationById.get(id), index)).filter((url): url is string => !!url);
  }

  resolveStationSrc(
    station: Pick<LineaStationFeature, "smet" | "smetId"> | undefined,
    preferredIndexes: number[],
    fallback: string,
  ): string {
    for (const index of preferredIndexes) {
      const url = this.getSmetUrl(station, index);
      if (url) {
        return url;
      }
    }
    return fallback;
  }

  private getDateRange(startDate: string, endDate: string): string[] {
    const start = new Date(`${startDate}T00:00:00Z`);
    const end = new Date(`${endDate}T00:00:00Z`);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
      return [];
    }

    const dates: string[] = [];
    const current = new Date(start);
    while (current <= end) {
      dates.push(current.toISOString().slice(0, 10));
      current.setUTCDate(current.getUTCDate() + 1);
    }

    return dates;
  }

  private async loadBlogsForRegion(regionCode: string): Promise<BlogData> {
    const lang: string = regionCode.slice(0, 2).toLowerCase().replace("at", "de");
    const params = new URLSearchParams({ region: regionCode, lang });
    const response = await fetch(`${this.blogApiUrl}?${params.toString()}`);
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

  private async loadBulletinsForDate(date: string, regionCodes: string[], lang: string): Promise<unknown[]> {
    const url = this.constantsService.getServerUrlGET("/bulletins/caaml/json", {
      date: `${date}T16:00:00Z`,
      regions: regionCodes,
      lang: lang as "de" | "it" | "fr" | "en" | "es" | "oc" | "ca",
      version: "V6_JSON",
    });
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to load bulletins for ${date}: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as BulletinApiResponse;
    return Array.isArray(data?.bulletins) ? data.bulletins : [];
  }
}
