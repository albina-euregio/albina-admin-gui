import { RegionConfiguration } from "../../models/region-configuration.model";
import {
  ServerConfiguration,
  ServerConfigurationSchema,
  ServerConfigurationVersion,
  ServerConfigurationVersionSchema,
} from "../../models/server-configuration.model";
import { AuthenticationService } from "../authentication-service/authentication.service";
import { ConstantsService } from "../constants-service/constants.service";
import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { map, Observable } from "rxjs";

@Injectable()
export class ConfigurationService {
  http = inject(HttpClient);
  private constantsService = inject(ConstantsService);
  private authenticationService = inject(AuthenticationService);

  public loadPublicLocalServerConfiguration(): Observable<ServerConfigurationVersion> {
    const url = this.constantsService.getServerUrl("/server/info");
    return this.http.get(url).pipe(map((json) => ServerConfigurationVersionSchema.parse(json)));
  }

  public loadLocalServerConfiguration(): Observable<ServerConfiguration> {
    const url = this.constantsService.getServerUrl("/server");
    return this.http.get(url).pipe(map((json) => ServerConfigurationSchema.parse(json)));
  }

  public loadExternalServerConfigurations(): Observable<ServerConfiguration[]> {
    const url = this.constantsService.getServerUrl("/server/external");
    return this.http.get(url).pipe(map((json) => ServerConfigurationSchema.array().parse(json)));
  }

  public updateServerConfiguration(json: ServerConfiguration) {
    const url = this.constantsService.getServerUrl("/server");
    const body = JSON.stringify(json);
    return this.http.put(url, body);
  }

  public createServerConfiguration(json: ServerConfiguration) {
    const url = this.constantsService.getServerUrl("/server");
    const body = JSON.stringify(json);
    return this.http.post(url, body);
  }

  public loadRegionConfiguration(region): Observable<RegionConfiguration> {
    const url = this.constantsService.getServerUrl("/regions/region", ["region", region]);
    return this.http.get<RegionConfiguration>(url);
  }

  public loadRegionConfigurations(): Observable<RegionConfiguration[]> {
    const url = this.constantsService.getServerUrl("/regions");
    return this.http.get<RegionConfiguration[]>(url);
  }

  public updateRegionConfiguration(json) {
    const url = this.constantsService.getServerUrl("/regions");
    const body = JSON.stringify(json);
    return this.http.put(url, body);
  }

  public createRegionConfiguration(json) {
    const url = this.constantsService.getServerUrl("/regions");
    const body = JSON.stringify(json);
    return this.http.post(url, body);
  }
}
