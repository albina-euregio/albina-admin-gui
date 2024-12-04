import { Injectable, inject } from "@angular/core";
import { GenericObservation, ObservationSource } from "./models/generic-observation.model";
import { ActivatedRoute, Params, Router } from "@angular/router";
import { ConstantsService } from "../providers/constants-service/constants.service";
import { LocalStorageService } from "../providers/local-storage-service/local-storage.service";
import { FilterSelectionData, ValueType } from "./filter-selection-data";

@Injectable()
export class ObservationFilterService<
  T extends Partial<Pick<GenericObservation, "$source" | "latitude" | "longitude" | "region" | "eventDate">>,
> {
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);
  private constantsService = inject(ConstantsService);
  private localStorageService = inject(LocalStorageService);

  public dateRange: Date[] = [];
  public regions = {} as Record<string, boolean>;
  public observationSources = {} as Record<ObservationSource, boolean>;
  public filterSelectionData: FilterSelectionData<T>[] = [];

  set days(days: number) {
    const { isTrainingEnabled, trainingTimestamp } = this.localStorageService;
    this.endDate = isTrainingEnabled ? new Date(trainingTimestamp) : new Date();
    const newStartDate = new Date(this.endDate);
    newStartDate.setDate(newStartDate.getDate() - (days - 1));
    newStartDate.setHours(0, 0, 0, 0);

    this.startDate = newStartDate;
    this.setDateRange();
  }

  setDateRange() {
    const { isTrainingEnabled, trainingTimestamp } = this.localStorageService;
    if (this.startDate) this.startDate.setHours(0, 0, 0, 0);
    if (this.endDate) this.endDate.setHours(23, 59, 59, 999);
    if (isTrainingEnabled && this.endDate > new Date(trainingTimestamp)) {
      // update existing endDate to avoid recursion via `set endDate`
      this.endDate.setTime(+new Date(trainingTimestamp));
    }
    if (this.startDate && this.endDate) {
      this.filterSelectionData.find((filter) => filter.key === "eventDate").setDateRange(this.startDate, this.endDate);
      this.router.navigate([], {
        relativeTo: this.activatedRoute,
        queryParams: {
          startDate: this.constantsService.getISODateString(this.startDate),
          endDate: this.constantsService.getISODateString(this.endDate),
        },
        queryParamsHandling: "merge",
      });
    }
    this.dateRange = [this.startDate, this.endDate];
  }

  get dateRangeMaxDate(): Date | undefined {
    const { isTrainingEnabled, trainingTimestamp } = this.localStorageService;
    return isTrainingEnabled ? new Date(trainingTimestamp) : undefined;
  }

  parseActivatedRoute() {
    this.activatedRoute.queryParams.subscribe((params) => this.parseQueryParams(params));
  }

  private parseQueryParams(params: Params) {
    if (!(params.startDate && params.endDate)) {
      return;
    }
    this.startDate = new Date(params.startDate);
    this.endDate = new Date(params.endDate);
    this.setDateRange();
  }

  get startDate(): Date {
    return this.dateRange[0];
  }

  set startDate(date: Date) {
    this.dateRange[0] = date;
    this.setDateRange();
  }

  get endDate(): Date {
    return this.dateRange[1];
  }

  set endDate(date: Date) {
    this.dateRange[1] = date;
    this.setDateRange();
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
      this.inRegions(observation.region) &&
      (observation.$source === ObservationSource.SnowLine ? this.isLastDayInDateRange(observation.eventDate) : true) &&
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

  isLastDayInDateRange(eventDate: Date): boolean {
    const selectedData: string[] = Array.from(
      this.filterSelectionData.find((filter) => filter.key === "eventDate").selected,
    )
      .filter((element) => element !== "nan")
      .sort();
    if (selectedData.length < 1) {
      return eventDate.getDate() === this.endDate.getDate();
    } else {
      return selectedData.indexOf(this.constantsService.getISODateString(eventDate)) === selectedData.length - 1;
    }
  }

  inMapBounds(latitude?: number, longitude?: number): boolean {
    if (!latitude || !longitude) {
      return true;
    }
    return 45.0 < latitude && latitude < 48.0 && 9.0 < longitude && longitude < 13.5;
  }

  inRegions(region: string): boolean {
    return !Object.values(this.regions).some((v) => v) || (typeof region === "string" && this.regions[region]);
  }

  inObservationSources($source?: GenericObservation["$source"]): boolean {
    return (
      !Object.values(this.observationSources).some((v) => v) ||
      (typeof $source === "string" && this.observationSources[$source])
    );
  }
}
