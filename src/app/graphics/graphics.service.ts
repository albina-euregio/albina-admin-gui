import { FeatureCollectionSchema } from "@albina-euregio/linea/listing";
import { FeatureCollectionSchema as LegacyFeatureCollectionSchema } from "@albina-euregio/linea/listing-legacy";
import { Injectable } from "@angular/core";

import awsstatsconfig from "../../assets/config/awsstats.json";
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

type BlogUrlConfig = {
  regionCode: string;
  label: string;
  url: string;
};

type BulletinApiResponse = {
  bulletins?: unknown[];
};

@Injectable({ providedIn: "root" })
export class GraphicsService {
  private readonly bulletinApiUrl = "https://api.avalanche.report/albina/api/bulletins/caaml/json";

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

  blogUrls: BlogUrlConfig[] = Array.isArray(awsstatsconfig.blogUrls)
    ? awsstatsconfig.blogUrls.filter((item): item is BlogUrlConfig => {
        if (typeof item !== "object" || !item) return false;
        const entry = item as Partial<BlogUrlConfig>;
        return typeof entry.regionCode === "string" && typeof entry.label === "string" && typeof entry.url === "string";
      })
    : [];

  getBulletinLanguage(): string {
    const htmlLang = document.documentElement.lang?.trim().toLowerCase();
    if (htmlLang) {
      return htmlLang.split("-")[0] || "de";
    }

    const browserLang = navigator.language?.trim().toLowerCase();
    return browserLang ? browserLang.split("-")[0] || "de" : "de";
  }

  getBulletinRegionCodes(): string[] {
    return ["AT-07", "IT-32-BZ", "IT-32-TN"];
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
    const merged = results.flat();

    // API data can overlap on adjacent days, so keep only one copy per bulletin id + timestamp.
    const seen = new Set<string>();
    const deduped: unknown[] = [];
    for (const bulletin of merged) {
      const key = this.getBulletinDedupeKey(bulletin);
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      deduped.push(bulletin);
    }

    return deduped;
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

  private async loadBulletinsForDate(date: string, regionCodes: string[], lang: string): Promise<unknown[]> {
    const params = new URLSearchParams({
      date: `${date}T16:00:00Z`,
      regions: regionCodes.join(","),
      lang,
      version: "V6_JSON",
    });
    const response = await fetch(`${this.bulletinApiUrl}?${params.toString()}`);
    if (!response.ok) {
      throw new Error(`Failed to load bulletins for ${date}: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as BulletinApiResponse;
    return Array.isArray(data?.bulletins) ? data.bulletins : [];
  }

  private getBulletinDedupeKey(bulletin: unknown): string {
    if (typeof bulletin !== "object" || bulletin === null) {
      return JSON.stringify(bulletin);
    }

    const maybe = bulletin as Record<string, unknown>;
    const bulletinId = typeof maybe.bulletinID === "string" ? maybe.bulletinID : "";
    const publicationTime = typeof maybe.publicationTime === "string" ? maybe.publicationTime : "";
    const regionIds = Array.isArray(maybe.regions)
      ? (maybe.regions as Record<string, unknown>[])
          .map((region) => (typeof region.regionID === "string" ? region.regionID : ""))
          .filter(Boolean)
          .sort()
      : [];

    return `${bulletinId}|${publicationTime}|${regionIds.join(",")}`;
  }
}
