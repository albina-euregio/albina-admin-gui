import { Feature, FeatureCollectionSchema } from "@albina-euregio/linea/listing";
import { inject, Injectable } from "@angular/core";
import { TranslateService } from "@ngx-translate/core";
import { DangerSourcesService } from "app/danger-sources/danger-sources.service";
import { TeamStressLevels } from "app/models/stress-level.model";
import { AlbinaLanguage } from "app/models/text.model";
import { AuthenticationService } from "app/providers/authentication-service/authentication.service";
import { BlogData, BlogService } from "app/providers/blog-service/blog.service";
import { BulletinsService } from "app/providers/bulletins-service/bulletins.service";
import { UserService } from "app/providers/user-service/user.service";
import { lastValueFrom } from "rxjs";

@Injectable({ providedIn: "root" })
export class GraphicsService {
  private authentificationService = inject(AuthenticationService);
  private blogService = inject(BlogService);
  private bulletinsService = inject(BulletinsService);
  private dangerSourceService = inject(DangerSourcesService);
  private translateService = inject(TranslateService);
  private userService = inject(UserService);

  async loadLineaStations(): Promise<Feature[]> {
    const stationById = new Map<string, Feature>();
    const response = await fetch("https://static.avalanche.report/eaws_weather_stations/linea.geojson");
    const json = await response.json();
    const collection = FeatureCollectionSchema.parse(json, { reportInput: true });

    for (const feature of collection.features) {
      const id = feature.id;
      if (stationById.has(id)) {
        continue;
      }
      stationById.set(id, feature);
    }

    return [...stationById.values()];
  }

  // ============================================
  // Data Loading - Bulletins, Blogs, Stress
  // ============================================

  async loadBulletins(
    startDate: string,
    endDate: string,
    regionCodes: string[],
    lang: AlbinaLanguage = "de",
  ): Promise<unknown[]> {
    if (!startDate || !endDate) {
      return [];
    }
    const regions = this.normalizeRegionCodes(regionCodes);
    if (!regions.length) {
      return [];
    }
    const dates = this.getDateRange(startDate, endDate);
    const requests = dates.map(
      async (date) => await lastValueFrom(this.bulletinsService.loadBulletinsForDate(date, regionCodes, lang)),
    );
    const results = await Promise.all(requests);
    return results.flat();
  }

  async loadBlogs(startDate: string, endDate: string, regionCodes: string[]): Promise<BlogData[]> {
    const start = Date.parse(`${startDate}T00:00:00.000Z`);
    const end = Date.parse(`${endDate}T23:59:59.999Z`);
    if (Number.isNaN(start) || Number.isNaN(end) || start > end) {
      return [];
    }

    const regions = this.normalizeRegionCodes(regionCodes);
    if (!regions.length) {
      return [];
    }

    const blogsByRegion = await Promise.all(
      regions.map(async (regionCode) => {
        // TODO: This language derivation is a bit hacky, but it works for all current regions. If we ever have a region with a different language than the first two letters of the region code, we should add an explicit language property to the region data.
        // Issue Nr. albina-euregio/albina-admin-gui#457
        const lang: AlbinaLanguage = regionCode
          .slice(0, 2)
          .toLowerCase()
          .replace("at", "de")
          .replace("ch", "de") as AlbinaLanguage;
        const startDate = new Date(start).toISOString();
        const endDate = new Date(end).toISOString();
        return await lastValueFrom(this.blogService.loadBlogsForRegion(regionCode, lang, startDate, endDate));
      }),
    );

    return blogsByRegion.map((regionBlogs) => ({
      ...regionBlogs,
      blogItems: regionBlogs.blogItems.filter((item) => {
        const published = Date.parse(item.published);
        return !Number.isNaN(published) && published >= start && published <= end;
      }),
    }));
  }

  async loadTeamStressLevels(startDate: string, endDate: string): Promise<TeamStressLevels> {
    const start = Date.parse(`${startDate}T00:00:00.000Z`);
    const end = Date.parse(`${endDate}T23:59:59.999Z`);
    if (Number.isNaN(start) || Number.isNaN(end) || start > end) {
      return {};
    }
    return await lastValueFrom(this.userService.getTeamStressLevels([new Date(start), new Date(end)]));
  }

  async loadDangerSourceVariants(startDate: string, endDate: string, region: string): Promise<unknown[]> {
    if (!startDate || !endDate || !region) {
      return [];
    }

    const dates = this.getDateRange(startDate, endDate).map(
      (date) => new Date(date.toZonedDateTime({ plainTime: "17:00:00", timeZone: "Europe/Vienna" }).epochMilliseconds),
    );

    const requests = dates.map((date) =>
      lastValueFrom(this.dangerSourceService.loadDangerSourceVariants([date, undefined], region)),
    );

    const results = await Promise.all(requests);
    return results.flat();
  }

  // ============================================
  // Configuration & Metadata
  // ============================================

  getBulletinLanguage(): AlbinaLanguage {
    return this.translateService.getCurrentLang() as AlbinaLanguage;
  }

  getBulletinRegionCodes(): string[] {
    return this.authentificationService.getInternalRegionsWithoutSuperRegions((r) => r.publishBulletins);
  }

  getBlogRegionCodes(): string[] {
    return this.authentificationService.getInternalRegionsWithoutSuperRegions((r) => r.publishBlogs);
  }

  getCurrentSeason(): { start: string; end: string } {
    let start: string;
    let seasonEnd: string;
    const now = new Date();
    const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (now.getMonth() < 11) {
      start = `${now.getFullYear() - 1}-11-01`;
      seasonEnd = `${now.getFullYear()}-05-31`;
    } else {
      start = `${now.getFullYear()}-11-01`;
      seasonEnd = `${now.getFullYear() + 1}-05-31`;
    }

    const seasonEndDate = new Date(`${seasonEnd}T00:00:00`);
    const effectiveEndDate = seasonEndDate > nowDate ? nowDate : seasonEndDate;
    const end = `${effectiveEndDate.getFullYear()}-${String(effectiveEndDate.getMonth() + 1).padStart(2, "0")}-${String(effectiveEndDate.getDate()).padStart(2, "0")}`;

    return { start, end };
  }

  private getDateRange(startDate: string, endDate: string): Temporal.PlainDate[] {
    let start: Temporal.PlainDate;
    let end: Temporal.PlainDate;

    try {
      start = Temporal.PlainDate.from(startDate);
      end = Temporal.PlainDate.from(endDate);
    } catch {
      return [];
    }

    if (Temporal.PlainDate.compare(start, end) > 0) {
      return [];
    }

    const dates: Temporal.PlainDate[] = [];
    let current = start;
    while (Temporal.PlainDate.compare(current, end) <= 0) {
      dates.push(current);
      current = current.add({ days: 1 });
    }

    return dates;
  }

  private normalizeRegionCodes(regionCodes: string[]): string[] {
    return [...new Set(regionCodes.filter(Boolean))];
  }
}
