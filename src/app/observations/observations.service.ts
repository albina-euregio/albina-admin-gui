import { Injectable } from "@angular/core";
import { type GenericObservation } from "./models/generic-observation.model";
import { type Observable, onErrorResumeNext } from "rxjs";
import {
  type AlbinaObservationsService,
  type AwsObservationsService,
  // FotoWebcamObservationsService,
  type LawisObservationsService,
  type LolaKronosObservationsService,
  type LwdKipObservationsService,
  type PanomaxObservationsService,
  type WikisnowObservationsService,
} from "./sources";

@Injectable()
export class ObservationsService {
  constructor(
    private aws: AwsObservationsService,
    // // private fotoWebcam: FotoWebcamObservationsService,
    private lawis: LawisObservationsService,
    private lolaKronos: LolaKronosObservationsService,
    private lwdKip: LwdKipObservationsService,
    private albina: AlbinaObservationsService,
    private panomax: PanomaxObservationsService,
    private wikisnow: WikisnowObservationsService,
  ) {}

  loadAll(): Observable<GenericObservation<any>> {
    return onErrorResumeNext(
      this.aws.getObservers(),
      this.lawis.getLawisIncidents(),
      this.lawis.getLawisProfiles(),
      this.lolaKronos.getLoLaKronos(),
      this.lwdKip.getLwdKipObservations(),
      this.wikisnow.getWikisnowECT(),
      this.albina.getObservations(),
      // // this.fotoWebcam.getFotoWebcamsEU(),
      this.panomax.getPanomax(),
    );
  }
}
