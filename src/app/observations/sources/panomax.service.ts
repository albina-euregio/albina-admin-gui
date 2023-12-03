import { Injectable } from "@angular/core";
import { type HttpClient } from "@angular/common/http";
import { type ConstantsService } from "../../providers/constants-service/constants.service";
import { type GenericObservation } from "../models/generic-observation.model";
import { type Observable } from "rxjs";
import { filter, map, mergeMap } from "rxjs/operators";
import { type RegionsService } from "../../providers/regions-service/regions.service";
import { LatLng } from "leaflet";
import { type PanomaxCamResponse, type PanomaxThumbnailResponse, convertPanomax } from "../models/panomax.model";

@Injectable()
export class PanomaxObservationsService {
  constructor(
    private http: HttpClient,
    private constantsService: ConstantsService,
    private regionsService: RegionsService,
  ) {}

  getPanomax(): Observable<GenericObservation> {
    const { observationApi: api } = this.constantsService;

    // make request to observationApi.panomax and make a request to the thumbnail url for each result.instance.id
    return this.http.get<PanomaxCamResponse>(api.Panomax + "/maps/panomaxweb").pipe(
      mergeMap(({ instances }: PanomaxCamResponse) => Object.values(instances)),
      filter(({ cam }) => !!this.regionsService.getRegionForLatLng(new LatLng(cam.latitude, cam.longitude))?.id),
      mergeMap((webcam) =>
        this.http.get<PanomaxThumbnailResponse[]>(api.Panomax + "/instances/thumbnails/" + webcam.id).pipe(
          filter((thumbs) => !!thumbs?.length),
          map((thumbs) => convertPanomax(thumbs[0])),
          map((obs) => this.regionsService.augmentRegion<GenericObservation>(obs)),
        ),
      ),
    );
  }
}
