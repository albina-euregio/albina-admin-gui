import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { ConstantsService } from "../../providers/constants-service/constants.service";
import { GenericObservation } from "../models/generic-observation.model";
import { from, Observable, of } from "rxjs";
import { map, mergeMap } from "rxjs/operators";
import { RegionsService } from "../../providers/regions-service/regions.service";
import { addLolaCadsData, convertFotoWebcamEU, FotoWebcamEU, FotoWebcamEUResponse } from "../models/foto-webcam.model";
import { AuthenticationService } from "../../providers/authentication-service/authentication.service";

@Injectable()
export class FotoWebcamObservationsService {
  constructor(
    private http: HttpClient,
    private authenticationService: AuthenticationService,
    private constantsService: ConstantsService,
    private regionsService: RegionsService,
  ) {}

  getLolaCads(cam: GenericObservation): Observable<any> {
    const lolaCadsApi = this.constantsService.observationApi["lola-cads.info"];
    const headers = this.authenticationService.newAuthHeader();
    const imgurl = cam.$data["latest"];
    const imgurlSafe = encodeURIComponent(imgurl);
    const fullUrl = lolaCadsApi + "?imageurl=" + imgurlSafe;
    return this.http.post<any>(fullUrl, {}, { headers });
  }

  getFotoWebcamsEU(): Observable<GenericObservation> {
    const { observationApi: api } = this.constantsService;
    const headers = this.authenticationService.newAuthHeader();

    return this.http.get<FotoWebcamEUResponse>(api.FotoWebcamsEU, { headers }).pipe(
      mergeMap(({ cams }: FotoWebcamEUResponse) =>
        from(
          cams
            .map((webcam: FotoWebcamEU) => this.regionsService.augmentRegion(convertFotoWebcamEU(webcam)))
            .filter((observation) => observation.$data.offline === false)
            .filter((observation) => observation.region !== undefined),
        ),
      ),
      mergeMap((cam: GenericObservation) => {
        if (cam.$data["latest"].includes("foto-webcam.eu")) {
          return this.getLolaCads(cam).pipe(map((lolaCadsData) => addLolaCadsData(cam, lolaCadsData)));
        } else {
          return of(cam);
        }
      }),
    );
  }
}
