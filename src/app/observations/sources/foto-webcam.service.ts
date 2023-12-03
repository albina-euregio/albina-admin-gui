import { Injectable } from "@angular/core";
import { type HttpClient, HttpHeaders } from "@angular/common/http";
import { type ConstantsService } from "../../providers/constants-service/constants.service";
import { type GenericObservation } from "../models/generic-observation.model";
import { type Observable, from, of } from "rxjs";
import { map, mergeMap } from "rxjs/operators";
import { type RegionsService } from "../../providers/regions-service/regions.service";
import { type FotoWebcamEU, type FotoWebcamEUResponse, addLolaCadsData, convertFotoWebcamEU } from "../models/foto-webcam.model";

@Injectable()
export class FotoWebcamObservationsService {
  constructor(
    private http: HttpClient,
    private constantsService: ConstantsService,
    private regionsService: RegionsService,
  ) {}

  getLolaCads(cam: GenericObservation): Observable<any> {
    const lolaCadsApi = "https://api.avalanche.report/www.lola-cads.info/LWDprocessPhotoURL";
    const token =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJsb2xhQWNjZXNzIjpmYWxzZSwibHdkQWNjZXNzIjp0cnVlLCJpYXQiOjE2Nzk1ODA3NjYsImV4cCI6MTcxMTExNjc2Nn0.IpZ4Nkkmvw0IiEi3Hvh9Pt4RvtJv7KktMLQCwdhVtBU";

    //get url from latest image
    const imgurl = cam.$data["latest"];

    //make url safe
    const imgurlSafe = encodeURIComponent(imgurl);
    const fullUrl = lolaCadsApi + "?imageurl=" + imgurlSafe;

    const headers = new HttpHeaders({
      Authorization: token,
    });

    const options = { headers: headers };

    // console.log(fullUrl);

    //create post request to lolaCadsApi with imageurl: imgurl as parameter and token as authorization header
    return this.http.post<any>(fullUrl, {}, options);
  }

  getFotoWebcamsEU(): Observable<GenericObservation> {
    const { observationApi: api } = this.constantsService;

    return this.http.get<FotoWebcamEUResponse>(api.FotoWebcamsEU).pipe(
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
