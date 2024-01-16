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
  WikisnowObservationsService,
} from "./sources";

@Injectable()
export class ObservationsService {
  constructor(
    private aws: AwsObservationsService,
    private fotoWebcam: FotoWebcamObservationsService,
    private lawis: LawisObservationsService,
    private lolaKronos: LolaKronosObservationsService,
    private lwdKip: LwdKipObservationsService,
    private albina: AlbinaObservationsService,
    private panomax: PanomaxObservationsService,
    private wikisnow: WikisnowObservationsService,
  ) {}

  loadAll(): Observable<GenericObservation<any>> {
    return onErrorResumeNext(
      // fast
      this.albina.getObservations(),
      this.aws.getObservers(),
      this.lolaKronos.getLoLaKronos(),
      this.wikisnow.getWikisnowECT(),
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
