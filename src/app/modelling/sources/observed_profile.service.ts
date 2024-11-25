import { Injectable, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { catchError, map } from "rxjs/operators";
import { augmentRegion } from "app/providers/regions-service/augmentRegion";
import { GenericObservation } from "app/observations/models/generic-observation.model";

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
    return this.http.get<AvalancheWarningServiceObservedProfiles[]>(this.URL).pipe(
      map((profiles) => profiles.map((profile) => augmentRegion(toPoint(profile)))),
      catchError((e) => {
        console.error("Failed to read observed_profiles from " + this.URL, e);
        return [];
      }),
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
