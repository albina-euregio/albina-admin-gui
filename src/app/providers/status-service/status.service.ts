import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { from, map, Observable } from "rxjs";

import { StatusInformationModel, StatusInformationSchema } from "../../models/status-information.model";
import * as albinaApi from "../albina-api";
import { client } from "../albina-api/client.gen";
import { ConstantsService } from "../constants-service/constants.service";

@Injectable()
export class StatusService {
  http = inject(HttpClient);
  private constantsService = inject(ConstantsService);

  constructor() {
    // Point the generated hey-api client at the configured API base URL and let
    // it reuse Angular's HttpClient, so the `httpHeaders` interceptor keeps
    // adding the bearer token and requests resolve outside injection contexts.
    client.setConfig({
      baseUrl: this.constantsService.getServerUrlGET("/"),
      httpClient: this.http,
    });
  }

  getStatusInformation(): Observable<StatusInformationModel[]> {
    return from(albinaApi.getStatus1({ throwOnError: true })).pipe(
      map((res) => StatusInformationSchema.array().parse(res.data)),
    );
  }

  triggerStatusChecks(): Observable<StatusInformationModel[]> {
    return from(albinaApi.triggerStatusChecks({ throwOnError: true })).pipe(
      map((res) => StatusInformationSchema.array().parse(res.data)),
    );
  }
}
