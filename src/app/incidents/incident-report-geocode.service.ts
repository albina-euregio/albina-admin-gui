import { DestroyRef, Injectable, inject } from "@angular/core";
import type { WritableSignal } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { catchError, debounceTime, forkJoin, of, Subject, switchMap } from "rxjs";

import { GeocodingService } from "../observations/geocoding.service";
import { RegionsService } from "../providers/regions-service/regions.service";
import { IncidentReport } from "./incident-report.model";

export interface IncidentReportGeocodeConfig {
  /** Writable report signal whose address/region fields are filled from the reverse geocode. */
  incidentReport: WritableSignal<IncidentReport>;
}

/**
 * Reverse-geocodes the report point and fills in the address (country/region/municipality)
 * and the matching avalanche region. Lookups are debounced and deduplicated against the last
 * known point so identical coordinates don't re-trigger a request.
 */
@Injectable()
export class IncidentReportGeocodeService {
  private geocodingService = inject(GeocodingService);
  private regionsService = inject(RegionsService);
  private destroyRef = inject(DestroyRef);

  private config?: IncidentReportGeocodeConfig;
  private lastLat: number | null | undefined;
  private lastLng: number | null | undefined;
  private readonly trigger$ = new Subject<[number, number]>();

  init(config: IncidentReportGeocodeConfig) {
    this.config = config;
    this.trigger$
      .pipe(
        debounceTime(800),
        switchMap(([lat, lng]) =>
          forkJoin({
            addr: this.geocodingService.reverseGeocode(lat, lng).pipe(catchError(() => of(null))),
            regionId: this.regionsService.findRegionForCoordinates(lat, lng).pipe(catchError(() => of(null))),
          }),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(({ addr, regionId }) => {
        this.config?.incidentReport.update((r) => ({
          ...r,
          ...(addr && {
            country: addr.country ?? r.country,
            region: addr.state ?? r.region,
            municipality: addr.municipality ?? addr.city ?? addr.town ?? addr.village ?? r.municipality,
          }),
          ...(regionId && { avalancheRegion: regionId }),
        }));
      });
  }

  /** Records the current point without triggering a lookup (e.g. after loading a saved report). */
  setLastPoint(lat: number | null | undefined, lng: number | null | undefined) {
    this.lastLat = lat;
    this.lastLng = lng;
  }

  /** Triggers a reverse geocode for a point placed or moved on the map. */
  reverseGeocode(lat: number, lng: number) {
    this.lastLat = lat;
    this.lastLng = lng;
    this.trigger$.next([lat, lng]);
  }

  /** Triggers a reverse geocode only if the point actually changed via the form inputs. */
  reverseGeocodeIfChanged(lat: number | null | undefined, lng: number | null | undefined) {
    if ((lat !== this.lastLat || lng !== this.lastLng) && lat != null && lng != null) {
      this.trigger$.next([lat, lng]);
    }
    this.lastLat = lat;
    this.lastLng = lng;
  }
}
