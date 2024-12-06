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
    const newEndDate = isTrainingEnabled ? new Date(trainingTimestamp) : new Date();
    const newStartDate = isTrainingEnabled ? new Date(trainingTimestamp) : new Date();
    newStartDate.setDate(newStartDate.getDate() - (days - 1));
    newStartDate.setHours(0, 0, 0, 0);
    this.dateRange = [newStartDate, newEndDate];
  }

  updateDateInURL() {
    if (!this.startDate || !this.endDate) {
      return;
    }
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

  get dateRangeMaxDate(): Date | undefined {
    const { isTrainingEnabled, trainingTimestamp } = this.localStorageService;
    return isTrainingEnabled ? new Date(trainingTimestamp) : undefined;
  }

  parseActivatedRoute() {
    this.activatedRoute.queryParams.subscribe((params) => this.parseQueryParams(params));
  }

  private parseQueryParams({ startDate, endDate }: Params) {
    if (typeof startDate !== "string" || !startDate || typeof endDate !== "string" || !endDate) {
      return;
    }
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date
    // When the time zone offset is absent, date-only forms are interpreted as a UTC time and date-time forms are interpreted as a local time.
    if (!startDate.includes("T")) {
      startDate += "T00:00:00";
    }
    if (!endDate.includes("T")) {
      endDate += "T23:59:59";
    }
    this.dateRange = [new Date(startDate), new Date(endDate)];
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
