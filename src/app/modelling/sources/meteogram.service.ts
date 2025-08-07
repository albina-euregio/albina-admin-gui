import { Injectable, inject } from "@angular/core";
import { Observable, from, map } from "rxjs";
import { RegionsService } from "app/providers/regions-service/regions.service";
import { GenericObservation, ObservationType } from "app/observations/models/generic-observation.model";
import { GeoJSON } from "leaflet";
import { formatDate } from "@angular/common";

@Injectable()
export class MeteogramSourceService {
  private regionsService = inject(RegionsService);

  getZamgMeteograms(): Observable<GenericObservation[]> {
    return from(this.regionsService.getRegionsAsync()).pipe(
      map((collection) =>
        collection.features
          .filter((f) => /AT-07/.test(f.properties.id))
          .sort((f1, f2) => f1.properties.id.localeCompare(f2.properties.id))
          .map((f): GenericObservation => {
            const center = new GeoJSON(f).getBounds().getCenter();
            const file = f.properties.id.replace(/AT-07-/, "");
            const date = formatDate(Date.now(), "yyyy-MM-dd", "en-US");
            const $externalURL = `https://static.avalanche.report/zamg_ibk/${date}_meteogramm_R-${file}.png`;
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
