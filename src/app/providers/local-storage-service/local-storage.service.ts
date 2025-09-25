import { environment } from "../../../environments/environment";
import { BulletinModel, BulletinModelAsJSON } from "../../models/bulletin.model";
import { RegionConfiguration } from "../../models/region-configuration.model";
import type { ServerModel } from "../../models/server.model";
import { AuthenticationResponse, AuthenticationResponseSchema } from "../authentication-service/authentication.service";
import { Injectable, inject } from "@angular/core";
import { TranslateService } from "@ngx-translate/core";
import { Map as LeafletMap } from "leaflet";
import { filter, fromEventPattern, map, Observable } from "rxjs";
import * as z from "zod/v4";

export const MapCenterSchema = z.object({
  lat: z.number(),
  lng: z.number(),
  zoom: z.number(),
});
type MapCenter = z.infer<typeof MapCenterSchema>;

@Injectable()
export class LocalStorageService {
  private translateService = inject(TranslateService);

  key(key: string): string {
    return environment.apiBaseUrl + "_" + key;
  }

  private get<T>(key: string): T {
    try {
      const value = localStorage.getItem(this.key(key));
      return JSON.parse(value);
    } catch {
      localStorage.removeItem(this.key(key));
      return undefined;
    }
  }

  private set<T>(key: string, value: T): void {
    if (value === undefined) {
      localStorage.removeItem(this.key(key));
    } else {
      localStorage.removeItem(key); // migration: remove keys without prefix
      localStorage.setItem(this.key(key), JSON.stringify(value));
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

  getCurrentAuthor(): AuthenticationResponse {
    return AuthenticationResponseSchema.parse(this.get("currentAuthor"));
  }

  setCurrentAuthor(currentAuthor: AuthenticationResponse): void {
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

  getMapCenter(): MapCenter {
    return this.get("mapCenter");
  }

  setMapCenter(mapCenter: LeafletMap | MapCenter) {
    this.set(
      "mapCenter",
      mapCenter instanceof LeafletMap ? { ...mapCenter.getCenter(), zoom: mapCenter.getZoom() } : mapCenter,
    );
  }

  observeMapCenter(): Observable<MapCenter> {
    return fromEventPattern<StorageEvent>(
      (handler) => window.addEventListener("storage", handler),
      (handler) => window.removeEventListener("storage", handler),
    ).pipe(
      filter((event) => event.key === this.key("mapCenter")),
      map(() => this.getMapCenter()),
    );
  }
}
