import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { from, map, Observable } from "rxjs";

import { RegionConfiguration } from "../../models/region-configuration.model";
import {
  LocalServerConfiguration,
  LocalServerConfigurationSchema,
  ServerConfiguration,
  ServerConfigurationSchema,
  ServerVersionInfo,
  ServerVersionInfoSchema,
} from "../../models/server-configuration.model";
import * as albinaApi from "../albina-api";
import { client } from "../albina-api/client.gen";
import { AuthenticationService } from "../authentication-service/authentication.service";
import { ConstantsService } from "../constants-service/constants.service";

@Injectable()
export class ConfigurationService {
  http = inject(HttpClient);
  private constantsService = inject(ConstantsService);
  private authenticationService = inject(AuthenticationService);

  constructor() {
    // Point the generated hey-api client at the configured API base URL and let
    // it reuse Angular's HttpClient, so the `httpHeaders` interceptor keeps
    // adding the bearer token and requests resolve outside injection contexts.
    client.setConfig({
      baseUrl: this.constantsService.getServerUrlGET("/"),
      httpClient: this.http,
    });
  }

  public loadPublicLocalServerConfiguration(): Observable<ServerVersionInfo> {
    return from(albinaApi.getServerVersionInfo({ throwOnError: true })).pipe(
      map((res) => ServerVersionInfoSchema.parse(res.data)),
    );
  }

  public loadLocalServerConfiguration(): Observable<LocalServerConfiguration> {
    return from(albinaApi.getLocalServerConfiguration({ throwOnError: true })).pipe(
      map((res) => LocalServerConfigurationSchema.parse(res.data)),
    );
  }

  public loadExternalServerConfigurations(): Observable<ServerConfiguration[]> {
    return from(albinaApi.getExternalServerConfigurations({ throwOnError: true })).pipe(
      map((res) => ServerConfigurationSchema.array().parse(res.data)),
    );
  }

  public postServerConfiguration(json: ServerConfiguration) {
    return from(
      albinaApi.saveServerConfiguration({ body: json as unknown as albinaApi.ServerInstance, throwOnError: true }),
    ).pipe(map((res) => ServerConfigurationSchema.parse(res.data)));
  }

  public loadRegionConfiguration(region): Observable<RegionConfiguration> {
    return from(albinaApi.getRegion({ query: { region }, throwOnError: true })).pipe(
      map((res) => res.data as unknown as RegionConfiguration),
    );
  }

  public loadRegionConfigurations(): Observable<RegionConfiguration[]> {
    return from(albinaApi.getRegions({ throwOnError: true })).pipe(
      map((res) => res.data as unknown as RegionConfiguration[]),
    );
  }

  public postRegionConfiguration(json) {
    // Convert empty strings to null, matching the server's expectations.
    const body = JSON.stringify(json, (_, v) => (v === "" ? null : v));
    return from(albinaApi.saveRegion({ body, throwOnError: true })).pipe(map((res) => res.data));
  }
}
