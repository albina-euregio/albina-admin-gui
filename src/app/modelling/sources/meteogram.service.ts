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
 * Stations of the reduced C-LAEF meteograms, with coordinates as printed in the plot headers.
 * @see https://static.avalanche.report/zamg_meteo_red/zamg_meteo_red/
 */
const reducedMeteogramStations: { file: string; name: string; elevation: number; lat: string; lng: string }[] = [
  { file: "AHORNBODEN", name: "Ahornboden", elevation: 1400, lat: "47°25'", lng: "11°31'" },
  { file: "BOZEN", name: "Bozen", elevation: 239, lat: "46°28'", lng: "11°20'" },
  { file: "BRUNNENKOGEL", name: "Brunnenkogel", elevation: 3430, lat: "46°55'", lng: "10°52'" },
  { file: "DREIZINNEN", name: "Dreizinnen", elevation: 2800, lat: "46°38'", lng: "12°20'" },
  { file: "GALZIG", name: "Galzig", elevation: 2084, lat: "47°08'", lng: "10°14'" },
  { file: "HAHNENKAMM_EHRENBACHHOEHE", name: "Hahnenkamm", elevation: 1794, lat: "47°25'", lng: "12°22'" },
  { file: "HOCHGALL", name: "Hochgall", elevation: 3400, lat: "46°55'", lng: "12°09'" },
  { file: "HOCHGASSER", name: "Hochgasser", elevation: 2900, lat: "47°09'", lng: "12°31'" },
  { file: "HOHE_SALVE", name: "Hohe Salve", elevation: 1800, lat: "47°28'", lng: "12°13'" },
  { file: "INNSBRUCK", name: "Innsbruck", elevation: 579, lat: "47°16'", lng: "11°21'" },
  { file: "KALKWAND(GSCHNITZ)", name: "Kalkwand (Gschnitz)", elevation: 2580, lat: "47°04'", lng: "11°21'" },
  { file: "LIENZ", name: "Lienz", elevation: 659, lat: "46°50'", lng: "12°49'" },
  { file: "LOFERER_ALM", name: "Loferer Alm", elevation: 1620, lat: "47°36'", lng: "12°39'" },
  { file: "MONTE_ADAMELLO", name: "Monte Adamello", elevation: 3400, lat: "46°10'", lng: "10°32'" },
  { file: "MONTE_BALDO", name: "Monte Baldo", elevation: 2000, lat: "45°42'", lng: "10°50'" },
  { file: "MUTTEKOPF", name: "Muttekopf", elevation: 2500, lat: "47°16'", lng: "10°38'" },
  { file: "NAUDERS", name: "Nauders", elevation: 1330, lat: "46°53'", lng: "10°30'" },
  { file: "NEBELHORN", name: "Nebelhorn", elevation: 2100, lat: "47°25'", lng: "10°20'" },
  { file: "OBERGURGL", name: "Obergurgl", elevation: 1942, lat: "46°52'", lng: "11°01'" },
  { file: "PAGANELLA", name: "Paganella", elevation: 2000, lat: "46°08'", lng: "11°02'" },
  { file: "PASSO_ROLLE", name: "Passo Rolle", elevation: 2000, lat: "46°17'", lng: "11°47'" },
  { file: "PATSCHERKOFEL", name: "Patscherkofel", elevation: 2251, lat: "47°13'", lng: "11°28'" },
  { file: "RITTNER_HORN", name: "Rittner Horn", elevation: 2280, lat: "46°37'", lng: "11°28'" },
  { file: "SCHLEGEIS", name: "Schlegeis", elevation: 1800, lat: "47°01'", lng: "11°43'" },
  { file: "SILVRETTAHORN", name: "Silvrettahorn", elevation: 3200, lat: "46°52'", lng: "10°05'" },
  { file: "SONNBLICK", name: "Sonnblick", elevation: 3109, lat: "47°03'", lng: "12°58'" },
  { file: "STILFSER_JOCH", name: "Stilfser Joch", elevation: 2700, lat: "46°32'", lng: "10°28'" },
  { file: "TIMMELSALM", name: "Timmelsalm", elevation: 2250, lat: "46°54'", lng: "11°08'" },
  { file: "ZISCHGELES", name: "Zischgeles", elevation: 3000, lat: "47°07'", lng: "11°05'" },
  { file: "ZUGSPITZE", name: "Zugspitze", elevation: 2960, lat: "47°25'", lng: "10°59'" },
];

/** Converts degrees/minutes such as `47°25'` to decimal degrees. */
function parseDegreesMinutes(value: string): number {
  const [, degrees, minutes] = /(\d+)°(\d+)'/.exec(value);
  return +degrees + +minutes / 60;
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

  getZamgReducedMeteograms(): Observable<GenericObservation[]> {
    return of(
      reducedMeteogramStations.map(
        ({ file, name, elevation, lat, lng }): GenericObservation =>
          ({
            $type: ObservationType.TimeSeries,
            $externalURL: `https://static.avalanche.report/zamg_meteo_red/zamg_meteo_red/claefmeteogramm_06_${file}.png`,
            $source: "meteogramReduced",
            locationName: name,
            elevation,
            latitude: parseDegreesMinutes(lat),
            longitude: parseDegreesMinutes(lng),
          }) as GenericObservation,
      ),
    );
  }
}
