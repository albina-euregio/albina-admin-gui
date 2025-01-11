import { Injectable, inject } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { ConstantsService } from "../constants-service/constants.service";
import { AuthenticationService } from "../authentication-service/authentication.service";
import { Observable } from "rxjs";

export interface RegionConfiguration {
  id: string;
  microRegions: number;
  subRegions: string[];
  superRegions: string[];
  neighborRegions: string[];
  publishBulletins: boolean;
  publishBlogs: boolean;
  createCaamlV5: boolean;
  createCaamlV6: boolean;
  createJson: boolean;
  createMaps: boolean;
  createPdf: boolean;
  sendEmails: boolean;
  createSimpleHtml: boolean;
  sendTelegramMessages: boolean;
  sendPushNotifications: boolean;
  enableMediaFile: boolean;
  enableAvalancheProblemCornices: boolean;
  enableAvalancheProblemNoDistinctAvalancheProblem: boolean;
  enableDangerSources: boolean;
  enableObservations: boolean;
  enableModelling: boolean;
  enableWeatherbox: boolean;
  enableStrategicMindset: boolean;
  enableStressLevel: boolean;
  showMatrix: boolean;
  serverInstance: ServerConfiguration;
  pdfColor: string;
  emailColor: string;
  pdfMapYAmPm: number;
  pdfMapYFd: number;
  pdfMapWidthAmPm: number;
  pdfMapWidthFd: number;
  pdfMapHeight: number;
  pdfFooterLogo: boolean;
  pdfFooterLogoColorPath: string;
  pdfFooterLogoBwPath: string;
  mapXmax: number;
  mapXmin: number;
  mapYmax: number;
  mapYmin: number;
  simpleHtmlTemplateName: string;
  geoDataDirectory: string;
  mapLogoColorPath: string;
  mapLogoBwPath: string;
  mapLogoPosition: string;
  mapCenterLat: number;
  mapCenterLng: number;
  imageColorbarColorPath: string;
  imageColorbarBwPath: string;
  isNew: boolean;
}

export interface ServerConfiguration {
  id: string;
  name: string;
  apiUrl: string;
  userName: string;
  password: string;
  externalServer: boolean;
  publishAt5PM: boolean;
  publishAt8AM: boolean;
  pdfDirectory: string;
  htmlDirectory: string;
  mapsPath: string;
  mediaPath: string;
  mapProductionUrl: string;
  serverImagesUrl: string;
  isNew: boolean;
}

@Injectable()
export class ConfigurationService {
  http = inject(HttpClient);
  private constantsService = inject(ConstantsService);
  private authenticationService = inject(AuthenticationService);

  public loadPublicLocalServerConfiguration(): Observable<ServerConfiguration & { version: string }> {
    const url = this.constantsService.getServerUrl() + "server/info";
    return this.http.get<ServerConfiguration & { version: string }>(url);
  }

  public loadLocalServerConfiguration(): Observable<ServerConfiguration> {
    const url = this.constantsService.getServerUrl() + "server";
    return this.http.get<ServerConfiguration>(url);
  }

  public loadExternalServerConfigurations(): Observable<ServerConfiguration[]> {
    const url = this.constantsService.getServerUrl() + "server/external";
    return this.http.get<ServerConfiguration[]>(url);
  }

  public updateServerConfiguration(json) {
    const url = this.constantsService.getServerUrl() + "server";
    const body = JSON.stringify(json);
    return this.http.put(url, body);
  }

  public createServerConfiguration(json) {
    const url = this.constantsService.getServerUrl() + "server";
    const body = JSON.stringify(json);
    return this.http.post(url, body);
  }

  public loadRegionConfiguration(region): Observable<RegionConfiguration> {
    const url = this.constantsService.getServerUrl() + "regions/region?region=" + region;
    return this.http.get<RegionConfiguration>(url);
  }

  public loadRegionConfigurations(): Observable<RegionConfiguration[]> {
    const url = this.constantsService.getServerUrl() + "regions";
    return this.http.get<RegionConfiguration[]>(url);
  }

  public updateRegionConfiguration(json) {
    const url = this.constantsService.getServerUrl() + "regions";
    const body = JSON.stringify(json);
    return this.http.put(url, body);
  }

  public createRegionConfiguration(json) {
    const url = this.constantsService.getServerUrl() + "regions";
    const body = JSON.stringify(json);
    return this.http.post(url, body);
  }
}
