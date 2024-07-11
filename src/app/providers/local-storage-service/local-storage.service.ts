import { Injectable } from "@angular/core";
import { environment } from "../../../environments/environment";
import type { RegionConfiguration } from "../configuration-service/configuration.service";
import type { AuthorModel } from "../../models/author.model";
import type { ServerModel } from "../../models/server.model";

@Injectable()
export class LocalStorageService {
  constructor() {}

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
}
