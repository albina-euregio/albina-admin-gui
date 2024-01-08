import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { catchError, map } from "rxjs/operators";
import { ConstantsService } from "app/providers/constants-service/constants.service";
import { RegionsService } from "app/providers/regions-service/regions.service";
import { GenericObservation } from "app/observations/models/generic-observation.model";
import { LatLng } from "leaflet";

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
  constructor(
    private http: HttpClient,
    private constantsService: ConstantsService,
    private regionsService: RegionsService,
  ) {}

  /**
   * SNOWPACK modelled snow profiles
   * https://gitlab.com/avalanche-warning
   */
  getObservedProfiles(): Observable<GenericObservation[]> {
    const url = this.constantsService.observationApi["observed_profile"];
    return this.http.get<AvalancheWarningServiceObservedProfiles[]>(url).pipe(
      map((profiles) => profiles.map((profile) => this.regionsService.augmentRegion(toPoint(profile)))),
      catchError((e) => {
        console.error("Failed to read observed_profiles from " + url, e);
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
