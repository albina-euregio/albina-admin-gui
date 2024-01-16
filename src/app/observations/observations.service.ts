import { Injectable } from "@angular/core";
import { GenericObservation } from "./models/generic-observation.model";
import { Observable, onErrorResumeNext } from "rxjs";
import {
  AlbinaObservationsService,
  AwsObservationsService,
  FotoWebcamObservationsService,
  LawisObservationsService,
  LolaKronosObservationsService,
  LwdKipObservationsService,
  PanomaxObservationsService,
  RasWebcamObservationsService,
  WikisnowObservationsService,
} from "./sources";

@Injectable()
export class ObservationsService {
  constructor(
    private albina: AlbinaObservationsService,
    private aws: AwsObservationsService,
    private fotoWebcam: FotoWebcamObservationsService,
    private lawis: LawisObservationsService,
    private lolaKronos: LolaKronosObservationsService,
    private lwdKip: LwdKipObservationsService,
    private panomax: PanomaxObservationsService,
    private rasWebcam: RasWebcamObservationsService,
    private wikisnow: WikisnowObservationsService,
  ) {}

  loadAll(): Observable<GenericObservation<any>> {
    return onErrorResumeNext(
      // fast
      this.albina.getObservations(),
      this.aws.getObservers(),
      this.lolaKronos.getLoLaKronos(),
      this.wikisnow.getWikisnowECT(),
      this.rasWebcam.getRasWebcams(),
      // medium
      this.lwdKip.getLwdKipObservations(),
      // slow
      this.lawis.getLawisIncidents(),
      this.lawis.getLawisProfiles(),
      this.fotoWebcam.getFotoWebcamsEU(),
      this.panomax.getPanomax(),
    );
  }
}
