import type { FeatureProperties } from "../modelling/awsome.component";
import { ConstantsService } from "../providers/constants-service/constants.service";
import { LocalStorageService } from "../providers/local-storage-service/local-storage.service";
import type { FilterSelectionData } from "./filter-selection-data";
import { GenericObservation, ObservationSource } from "./models/generic-observation.model";
import { Injectable, inject } from "@angular/core";
import { ActivatedRoute, Params, Router } from "@angular/router";
import { LatLngBounds } from "leaflet";

@Injectable()
export class ObservationFilterService<
  T extends Partial<Pick<GenericObservation, "$source" | "latitude" | "longitude" | "region" | "eventDate">>,
> {
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);
  private constantsService = inject(ConstantsService);
  private localStorageService = inject(LocalStorageService);

  public dateRange: Date[] = [];
  public regions: Set<string> = new Set<string>();
  public observationSources = {} as Record<ObservationSource, boolean>;
  public filterSelectionData: FilterSelectionData<T>[] = [];
  // 45.0 < latitude && latitude < 48.0 && 9.0 < longitude && longitude < 13.5;
  public mapBounds: LatLngBounds | undefined = new LatLngBounds({ lat: 45.0, lng: 9.0 }, { lat: 48.0, lng: 13.5 });

  set days(days: number) {
    const { isTrainingEnabled, trainingTimestamp } = this.localStorageService;
    const newEndDate = isTrainingEnabled ? new Date(trainingTimestamp) : new Date();
    const newStartDate = isTrainingEnabled ? new Date(trainingTimestamp) : new Date();
    newStartDate.setDate(newStartDate.getDate() - (days - 1));
    newStartDate.setHours(0, 0, 0, 0);
    if (!isTrainingEnabled) newEndDate.setHours(23, 59, 59, 0);
    this.dateRange = [newStartDate, newEndDate];
  }

  updateDateInURL() {
    if (!this.startDate || !this.endDate) {
      return;
    }
    // bsDaterangepicker overwrites the time for endDate with the time from startDate when selecting a new date range.
    // To keep the time from the previous selection, we extract it from the query params.
    const oldStartDate = this.parseQueryParams(this.activatedRoute.snapshot.queryParams)[0];
    const oldEndDate = this.parseQueryParams(this.activatedRoute.snapshot.queryParams)[1];
    if (
      (oldEndDate &&
        this.constantsService.getISODateString(oldEndDate) !== this.constantsService.getISODateString(this.endDate)) ||
      (oldStartDate &&
        this.constantsService.getISODateString(oldStartDate) !== this.constantsService.getISODateString(this.startDate))
    ) {
      this.endDate.setHours(oldEndDate.getHours(), oldEndDate.getMinutes(), oldEndDate.getSeconds());
    }

    this.filterSelectionData.find((filter) => filter.key === "eventDate").setDateRange(this.startDate, this.endDate);
    this.router.navigate([], {
      relativeTo: this.activatedRoute,
      queryParams: {
        startDate: this.constantsService.getISODateTimeString(this.startDate),
        endDate: this.constantsService.getISODateTimeString(this.endDate),
      },
      queryParamsHandling: "merge",
    });
  }

  get dateRangeMaxDate(): Date {
    const { isTrainingEnabled, trainingTimestamp } = this.localStorageService;
    return isTrainingEnabled ? new Date(trainingTimestamp) : new Date();
  }

  parseActivatedRoute() {
    this.activatedRoute.queryParams.subscribe((params) => (this.dateRange = this.parseQueryParams(params)));
  }

  private parseQueryParams({ startDate, endDate }: Params): Date[] {
    if (typeof startDate !== "string" || !startDate || typeof endDate !== "string" || !endDate) {
      return [];
    }
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date
    // When the time zone offset is absent, date-only forms are interpreted as a UTC time and date-time forms are interpreted as a local time.
    if (!startDate.includes("T")) {
      startDate += "T00:00:00";
    }
    if (!endDate.includes("T")) {
      endDate += "T23:59:59";
    }
    return [new Date(startDate), new Date(endDate)];
  }

  get startDate(): Date {
    return this.dateRange[0];
  }

  get endDate(): Date {
    const endDate = this.dateRange[1];
    const { isTrainingEnabled, trainingTimestamp } = this.localStorageService;
    if (isTrainingEnabled && endDate > new Date(trainingTimestamp)) {
      return new Date(trainingTimestamp);
    }
    return endDate;
  }

  get dateRangeParams() {
    return {
      startDate: this.startDate.toISOString(),
      endDate: this.endDate.toISOString(),
    };
  }

  public isSelected(observation: T) {
    return (
      this.inObservationSources(observation.$source) &&
      this.inMapBounds(observation.latitude, observation.longitude) &&
      this.inRegions(observation.region ?? (observation as unknown as FeatureProperties).region_id) &&
      this.filterSelectionData.every((filter) => filter.isIncluded("selected", filter.getValue(observation)))
    );
  }

  public isHighlighted(observation: T & { latitude?: number; longitude?: number }) {
    if (!this.inMapBounds(observation.latitude, observation.longitude)) {
      return false;
    }
    return this.filterSelectionData.some((filter) => filter.isIncluded("highlighted", filter.getValue(observation)));
  }

  inDateRange(eventDate: Date): boolean {
    return this.startDate <= eventDate && eventDate <= this.endDate;
  }

  inMapBounds(latitude?: number, longitude?: number): boolean {
    if (!this.mapBounds || !latitude || !longitude) {
      return true;
    }
    return this.mapBounds.contains({ lat: latitude, lng: longitude });
  }

  inRegions(region: string): boolean {
    return !this.regions.size || (typeof region === "string" && this.regions.has(region));
  }

  inObservationSources($source?: GenericObservation["$source"]): boolean {
    return (
      !Object.values(this.observationSources).some((v) => v) ||
      (typeof $source === "string" && this.observationSources[$source])
    );
  }
}
