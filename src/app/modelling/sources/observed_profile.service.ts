import { HttpClient } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { GenericObservation } from "app/observations/models/generic-observation.model";
import { augmentRegion, initAugmentRegion } from "app/providers/regions-service/augmentRegion";
import { from, Observable } from "rxjs";
import { catchError, last, map, mergeMap } from "rxjs/operators";

export interface AvalancheWarningServiceObservedProfiles {
  latitude: number;
  longitude: number;
  elevation: number;
  aspect: string;
  eventDate: Date;
  locationName: string;
  $externalURL: string;
}

@Injectable()
export class ObservedProfileSourceService {
  private http = inject(HttpClient);

  private readonly URL = "https://models.avalanche.report/profiles/observed-profiles/observed_profiles.json";

  /**
   * SNOWPACK modelled snow profiles
   * https://gitlab.com/avalanche-warning
   */
  getObservedProfiles(): Observable<GenericObservation[]> {
    return from(initAugmentRegion()).pipe(
      last(),
      mergeMap(() =>
        this.http.get<AvalancheWarningServiceObservedProfiles[]>(this.URL).pipe(
          map((profiles) => profiles.map((profile) => augmentRegion(toPoint(profile)))),
          catchError((e) => {
            console.error("Failed to read observed_profiles from " + this.URL, e);
            return [];
          }),
        ),
      ),
    );

    function toPoint(profile: AvalancheWarningServiceObservedProfiles): GenericObservation {
      return {
        $source: "observed_profile",
        $id: profile.$externalURL,
        eventDate: new Date(profile.eventDate),
        locationName: profile.locationName,
        $externalURL: profile.$externalURL,
        latitude: profile.latitude,
        longitude: profile.longitude,
      } as GenericObservation;
    }
  }
}
