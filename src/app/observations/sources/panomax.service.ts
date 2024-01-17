import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { ConstantsService } from "../../providers/constants-service/constants.service";
import { GenericObservation } from "../models/generic-observation.model";
import { Observable } from "rxjs";
import { filter, map, mergeMap } from "rxjs/operators";
import { augmentRegion, getRegionForLatLng } from "../../providers/regions-service/augmentRegion";
import { LatLng } from "leaflet";
import { PanomaxCamResponse, PanomaxThumbnailResponse, convertPanomax } from "../models/panomax.model";
import {AuthenticationService} from "../../providers/authentication-service/authentication.service";

@Injectable()
export class PanomaxObservationsService {
  constructor(
    private http: HttpClient,
    private authenticationService: AuthenticationService,
    private constantsService: ConstantsService,
  ) {}

  getPanomax(): Observable<GenericObservation> {
    const { observationApi: api } = this.constantsService;
    const headers = this.authenticationService.newAuthHeader();

    // make request to observationApi.panomax and make a request to the thumbnail url for each result.instance.id
    return this.http.get<PanomaxCamResponse>(api.Panomax + "/maps/panomaxweb", {headers}).pipe(
      mergeMap(({ instances }: PanomaxCamResponse) => Object.values(instances)),
      filter(({ cam }) => !!getRegionForLatLng(cam)),
      mergeMap((webcam) =>
        this.http.get<PanomaxThumbnailResponse[]>(api.Panomax + "/instances/thumbnails/" + webcam.id, {headers}).pipe(
          filter((thumbs) => !!thumbs?.length),
          map((thumbs) => convertPanomax(thumbs[0])),
          map((obs) => augmentRegion<GenericObservation>(obs)),
        ),
      ),
    );
  }
}
