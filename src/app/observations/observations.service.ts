import { Injectable } from "@angular/core";
import { GenericObservation } from "./models/generic-observation.model";
import { Observable, onErrorResumeNext } from "rxjs";
import {
  AlbinaObservationsService,
  AwsObservationsService,
  // FotoWebcamObservationsService,
  LawisObservationsService,
  LolaKronosObservationsService,
  LwdKipObservationsService,
  PanomaxObservationsService,
  WikisnowObservationsService,
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
      // this.aws.getObservers(),
      // this.lawis.getLawisIncidents(),
      // this.lawis.getLawisProfiles(),
      this.lolaKronos.getLoLaKronos(),
      // this.lwdKip.getLwdKipObservations(),
      // this.wikisnow.getWikisnowECT(),
      // this.albina.getObservations(),
      // // // this.fotoWebcam.getFotoWebcamsEU(),
      // this.panomax.getPanomax(),
    );
  }
}
