import { StatusInformationModel, StatusInformationSchema } from "../../models/status-information.model";
import { ConstantsService } from "../constants-service/constants.service";
import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { map, Observable } from "rxjs";

export enum StatusChannel {
  Telegram = "Telegram",
  WhatsApp = "WhatsApp",
  Blog = "Blog",
}

@Injectable()
export class StatusService {
  http = inject(HttpClient);
  private constantsService = inject(ConstantsService);

  getStatusInformation(region: string, channel: StatusChannel | string): Observable<StatusInformationModel> {
    const url = this.constantsService.getServerUrl(`/status/${channel.toLowerCase()}`, ["region", region]);
    return this.http.get(url).pipe(map((json) => StatusInformationSchema.parse(json)));
  }
}
