import { Injectable } from "@angular/core";
import { from, map, Observable } from "rxjs";

import { StatusInformationModel, StatusInformationSchema } from "../../models/status-information.model";
import * as albinaApi from "../albina-api";

@Injectable()
export class StatusService {
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
