import { formatDate } from "@angular/common";
import { Injectable, inject } from "@angular/core";
import { GenericObservation, ObservationType } from "app/observations/models/generic-observation.model";
import { RegionsService } from "app/providers/regions-service/regions.service";
import { Feature } from "geojson";
import { Observable, from, map, of } from "rxjs";

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

/**
 * Stations of the reduced C-LAEF meteograms (files are named by WMO station number).
 * @see https://static.avalanche.report/zamg_meteo_red/zamg_meteo_red/
 */
const reducedMeteogramStations: { wmo: number; name: string; elevation: number; lat: number; lng: number }[] = [
  { wmo: 105882, name: "Ahornboden", elevation: 1400, lat: 47.41, lng: 11.52 },
  { wmo: 16020, name: "Bozen", elevation: 239, lat: 46.47, lng: 11.33 },
  { wmo: 11318, name: "Brunnenkogel", elevation: 3430, lat: 46.91, lng: 10.86 },
  { wmo: 99933, name: "Dreizinnen", elevation: 2800, lat: 46.64, lng: 12.34 },
  { wmo: 11110, name: "Galzig", elevation: 2084, lat: 47.13, lng: 10.23 },
  { wmo: 11135, name: "Hahnenkamm", elevation: 1794, lat: 47.41833, lng: 12.35917 },
  { wmo: 99934, name: "Hochgall", elevation: 3400, lat: 46.92, lng: 12.15 },
  { wmo: 114900, name: "Hochgasser", elevation: 2900, lat: 47.15, lng: 12.52 },
  { wmo: 99927, name: "Hohe Salve", elevation: 1800, lat: 47.47, lng: 12.21 },
  { wmo: 11121, name: "Innsbruck", elevation: 579, lat: 47.267, lng: 11.433 },
  { wmo: 119412, name: "Kalkwand (Gschnitz)", elevation: 2580, lat: 47.06, lng: 11.35 },
  { wmo: 11204, name: "Lienz", elevation: 659, lat: 46.83, lng: 12.81 },
  { wmo: 11337, name: "Loferer Alm", elevation: 1620, lat: 47.6, lng: 12.65 },
  { wmo: 99930, name: "Monte Adamello", elevation: 3400, lat: 46.16, lng: 10.53 },
  { wmo: 99931, name: "Monte Baldo", elevation: 2000, lat: 45.7, lng: 10.83 },
  { wmo: 99925, name: "Muttekopf", elevation: 2500, lat: 47.26, lng: 10.64 },
  { wmo: 11113, name: "Nauders", elevation: 1330, lat: 46.88, lng: 10.5 },
  { wmo: 10948, name: "Nebelhorn", elevation: 2100, lat: 47.42, lng: 10.34 },
  { wmo: 11127, name: "Obergurgl", elevation: 1942, lat: 46.86, lng: 11.02 },
  { wmo: 44442, name: "Paganella", elevation: 2000, lat: 46.14, lng: 11.04 },
  { wmo: 44443, name: "Passo Rolle", elevation: 2000, lat: 46.29, lng: 11.79 },
  { wmo: 11126, name: "Patscherkofel", elevation: 2251, lat: 47.21, lng: 11.46 },
  { wmo: 44441, name: "Rittner Horn", elevation: 2280, lat: 46.62, lng: 11.46 },
  { wmo: 102988, name: "Schlegeis", elevation: 1800, lat: 47.01, lng: 11.72 },
  { wmo: 99929, name: "Silvrettahorn", elevation: 3200, lat: 46.86, lng: 10.09 },
  { wmo: 11343, name: "Sonnblick", elevation: 3109, lat: 47.05, lng: 12.96 },
  { wmo: 31000, name: "Stilfser Joch", elevation: 2700, lat: 46.53, lng: 10.47 },
  { wmo: 99900, name: "Timmelsalm", elevation: 2250, lat: 46.9, lng: 11.13 },
  { wmo: 99926, name: "Zischgeles", elevation: 3000, lat: 47.12, lng: 11.09 },
  { wmo: 109610, name: "Zugspitze", elevation: 2960, lat: 47.42, lng: 10.99 },
];

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

  getZamgReducedMeteograms(): Observable<GenericObservation[]> {
    return of(
      reducedMeteogramStations.map(
        ({ wmo, name, elevation, lat, lng }): GenericObservation =>
          ({
            $type: ObservationType.TimeSeries,
            $externalURL: `https://static.avalanche.report/zamg_meteo_red/zamg_meteo_red/claefmeteogramm_06_${wmo}.png`,
            $source: "meteogramReduced",
            locationName: name,
            elevation,
            latitude: lat,
            longitude: lng,
          }) as GenericObservation,
      ),
    );
  }
}
