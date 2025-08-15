import { environment } from "../../../environments/environment";
import type { AuthorModel } from "../../models/author.model";
import { BulletinModel, BulletinModelAsJSON } from "../../models/bulletin.model";
import { RegionConfiguration } from "../../models/region-configuration.model";
import type { ServerModel } from "../../models/server.model";
import { Injectable, inject } from "@angular/core";
import { TranslateService } from "@ngx-translate/core";

@Injectable()
export class LocalStorageService {
  private translateService = inject(TranslateService);

  private get<T>(key: string): T {
    try {
      const value = localStorage.getItem(environment.apiBaseUrl + "_" + key);
      return JSON.parse(value);
    } catch (e) {
      localStorage.removeItem(environment.apiBaseUrl + "_" + key);
      return undefined;
    }
  }

  private set<T>(key: string, value: T): void {
    if (value === undefined) {
      localStorage.removeItem(environment.apiBaseUrl + "_" + key);
    } else {
      localStorage.removeItem(key); // migration: remove keys without prefix
      localStorage.setItem(environment.apiBaseUrl + "_" + key, JSON.stringify(value));
    }
  }

  getLanguage(): string {
    return this.get("language");
  }

  setLanguage(language: string): void {
    if (!language) {
      return;
    }
    if (!this.translateService.langs.includes(language)) {
      language = "en";
    }
    document.documentElement.setAttribute("lang", language);
    this.translateService.use(language);
    return this.set("language", language);
  }

  getCurrentAuthor(): AuthorModel {
    return this.get("currentAuthor");
  }

  setCurrentAuthor(currentAuthor: AuthorModel): void {
    return this.set("currentAuthor", currentAuthor);
  }

  getActiveRegion(): RegionConfiguration {
    return this.get("activeRegion");
  }

  setActiveRegion(activeRegion: RegionConfiguration): void {
    return this.set("activeRegion", activeRegion);
  }

  getInternalRegions(): RegionConfiguration[] {
    return this.get("internalRegions");
  }

  setInternalRegions(internalRegions: RegionConfiguration[]): void {
    return this.set("internalRegions", internalRegions);
  }

  getExternalServers(): ServerModel[] {
    return this.get("externalServers");
  }

  setExternalServers(externalServers: ServerModel[]): void {
    return this.set("externalServers", externalServers);
  }

  getCompactMapLayout(): boolean {
    return this.get("compactMapLayout");
  }

  setCompactMapLayout(compactMapLayout: boolean): void {
    return this.set("compactmapLayout", compactMapLayout);
  }

  get isTrainingEnabled(): boolean {
    return !!this.trainingTimestamp;
  }

  get trainingTimestamp(): string {
    return this.get("trainingTimestamp");
  }

  set trainingTimestamp(trainingTimestamp: string) {
    this.set("trainingTimestamp", trainingTimestamp);
  }

  getTrainingBulletins(date: [Date, Date]): BulletinModelAsJSON[] {
    return this.get("trainingBulletins_" + date[0].toISOString()) ?? [];
  }

  setTrainingBulletins(date: [Date, Date], bulletins: BulletinModelAsJSON[]): void {
    if (bulletins.some((b) => b instanceof BulletinModel)) {
      throw new Error("Provide bulletins as JSON via BulletinModel.toJson!");
    }
    return this.set("trainingBulletins_" + date[0].toISOString(), bulletins);
  }
}
