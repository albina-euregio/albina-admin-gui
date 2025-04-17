import { inject, Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { ConstantsService } from "../constants-service/constants.service";
import { AuthenticationService } from "../authentication-service/authentication.service";
import { Observable } from "rxjs";
import { RegionConfiguration } from "../../models/region-configuration.model";
import { ServerConfiguration } from "../../models/server-configuration.model";

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
