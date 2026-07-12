import { formatDate } from "@angular/common";
import { Injectable, inject } from "@angular/core";
import { GenericObservation, ObservationType } from "app/observations/models/generic-observation.model";
import { RegionsService } from "app/providers/regions-service/regions.service";
import { Feature } from "geojson";
import { Observable, from, map } from "rxjs";

/** Center of a feature's bounding box, in {lat, lng}. */
function bboxCenter(feature: Feature): { lat: number; lng: number } {
  let minLng = Infinity;
  let minLat = Infinity;
  let maxLng = -Infinity;
  let maxLat = -Infinity;
  const walk = (coords: unknown): void => {
    if (Array.isArray(coords) && typeof coords[0] === "number" && typeof coords[1] === "number") {
      minLng = Math.min(minLng, coords[0]);
      maxLng = Math.max(maxLng, coords[0]);
      minLat = Math.min(minLat, coords[1]);
      maxLat = Math.max(maxLat, coords[1]);
    } else if (Array.isArray(coords)) {
      coords.forEach(walk);
    }
  };
  if (feature.geometry && "coordinates" in feature.geometry) walk(feature.geometry.coordinates);
  return { lat: (minLat + maxLat) / 2, lng: (minLng + maxLng) / 2 };
}

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
            const center = bboxCenter(f);
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
