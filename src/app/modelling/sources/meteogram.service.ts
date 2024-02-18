import { Injectable } from "@angular/core";
import { Observable, from, map } from "rxjs";
import { RegionsService } from "app/providers/regions-service/regions.service";
import { GenericObservation, ObservationType } from "app/observations/models/generic-observation.model";
import { geoJSON } from "leaflet";

@Injectable()
export class MeteogramSourceService {
  constructor(private regionsService: RegionsService) {}

  getZamgMeteograms(): Observable<GenericObservation[]> {
    return from(this.regionsService.getActiveRegion("AT-07")).pipe(
      map((collection) =>
        collection.features
          .filter((f) => /AT-07/.test(f.properties.id))
          .sort((f1, f2) => f1.properties.id.localeCompare(f2.properties.id))
          .map((f): GenericObservation => {
            const center = geoJSON(f).getBounds().getCenter();
            const file = f.properties.id.replace(/AT-07-/, "");
            const $externalURL = `https://wiski.tirol.gv.at/lawine/produkte/meteogramm_R-${file}.png`;
            return {
              $type: ObservationType.TimeSeries,
              $externalURL,
              $source: "meteogram",
              region: f.properties.id,
              locationName: f.properties.name,
              latitude: center.lat,
              longitude: center.lng,
            } as GenericObservation;
          }),
      ),
    );
  }
}
