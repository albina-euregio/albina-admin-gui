import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { map, Observable } from "rxjs";

import { StatusInformationModel, StatusInformationSchema } from "../../models/status-information.model";
import { ConstantsService } from "../constants-service/constants.service";

@Injectable()
export class StatusService {
  http = inject(HttpClient);
  private constantsService = inject(ConstantsService);

  getStatusInformation(): Observable<StatusInformationModel[]> {
    const url = this.constantsService.getServerUrlGET(`/status/channels`);
    return this.http.get(url).pipe(map((json) => StatusInformationSchema.array().parse(json)));
  }

  triggerStatusChecks(): Observable<StatusInformationModel[]> {
    const url = this.constantsService.getServerUrlPOST(`/status/channels`);
    return this.http.post(url, null).pipe(map((json) => StatusInformationSchema.array().parse(json)));
  }
}
