import { Injectable } from "@angular/core";
import { GenericObservation, ObservationSource } from "./models/generic-observation.model";
import { castArray } from "lodash";
import { ActivatedRoute, Params, Router } from "@angular/router";
import { TranslateService } from "@ngx-translate/core";
import { ConstantsService } from "../providers/constants-service/constants.service";
import { type Dataset, FilterSelectionData } from "./filter-selection-data";
import { observationFilters } from "./filter-selection-data-data";

@Injectable()
export class ObservationFilterService {
  public dateRange: Date[] = [];
  public regions = {} as Record<string, boolean>;
  public observationSources = {} as Record<ObservationSource, boolean>;

  public filterSelectionData: FilterSelectionData[] = observationFilters((message) =>
    this.translateService.instant(message),
  );

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private translateService: TranslateService,
    private constantsService: ConstantsService,
  ) {
    this.activatedRoute.queryParams.subscribe((params) => this.parseQueryParams(params));
  }

  set days(days: number) {
    this.endDate = new Date();
    const newStartDate = new Date(this.endDate);
    newStartDate.setDate(newStartDate.getDate() - (days - 1));
    newStartDate.setHours(0, 0, 0, 0);

    this.startDate = newStartDate;
    this.setDateRange();
  }

  setDateRange() {
    if (this.startDate) this.startDate.setHours(0, 0, 0, 0);
    if (this.endDate) this.endDate.setHours(23, 59, 59, 999);
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

  public isSelected(observation: GenericObservation) {
    return (
      this.inObservationSources(observation) &&
      this.inMapBounds(observation) &&
      this.inRegions(observation.region) &&
      (observation.$source === ObservationSource.SnowLine ? this.isLastDayInDateRange(observation) : true) &&
      this.filterSelectionData.every((filter) => filter.isIncluded("selected", observation[filter.key]))
    );
  }

  public isWeatherStationSelected(observation: GenericObservation) {
    return (
      this.inMapBounds(observation) &&
      this.inRegions(observation.region) &&
      this.filterSelectionData
        .find((filter) => filter.key === "elevation")
        .isIncluded("selected", observation.elevation)
    );
  }

  public isHighlighted(observation: GenericObservation) {
    if (!this.inMapBounds(observation)) {
      return false;
    }
    return this.filterSelectionData.some((filter) => filter.isIncluded("highlighted", observation[filter.key]));
  }

  public buildChartsData(observations: GenericObservation[], markerClassify: FilterSelectionData) {
    this.filterSelectionData.forEach((filter) => this.buildChartsData0(observations, filter, markerClassify));
  }

  private buildChartsData0(
    observations: GenericObservation[],
    filter: FilterSelectionData,
    markerClassify: FilterSelectionData,
  ) {
    filter.nan = 0;
    const dataRaw = filter.values.map((value) => ({
      value,
      data: {
        all: 0,
        available: 0,
        0: 0,
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
        6: 0,
        7: 0,
        8: 0,
        9: 0,
        10: 0,
      },
    }));
    observations.forEach((observation) => {
      const value: number | string | string[] = observation[filter.key];
      if (value === undefined || value === null) {
        filter.nan++;
        return;
      }
      castArray(value).forEach((v) => {
        const data = dataRaw.find((f) => FilterSelectionData.testFilterSelection(f.value, v))?.data;
        if (!data) {
          return;
        }
        data.all++;
        if (!this.isSelected(observation)) {
          return;
        }
        if (!markerClassify || markerClassify.type === filter.type) {
          data[0]++;
          return;
        }
        const value2: number | string | string[] = observation[markerClassify.key];
        if (value2 === undefined || value2 === null) {
          data[0]++;
          return;
        }
        castArray(value2).forEach((v) => {
          data[markerClassify.values.findIndex((f) => FilterSelectionData.testFilterSelection(f, v)) + 1]++;
        });
      });
    });

    const header = [
      "category",
      "max",
      "all",
      "highlighted",
      "available",
      "selected",
      "0",
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      "10",
    ];

    const data: Dataset = dataRaw.map((f) => {
      const key = f.value.value;
      const values = f.data;
      const highlighted = filter.highlighted.has(key) ? values.all : 0;
      const available = !filter.selected.has(key) ? values.available : 0;
      const selected = filter.selected.has(key) ? values.available : 0;
      const max = values.all;
      const all = available > 0 ? available : selected;
      return [
        key,
        max ? all : max,
        all,
        highlighted ? all : highlighted,
        available,
        selected,
        values["0"],
        values["1"],
        values["2"],
        values["3"],
        values["4"],
        values["5"],
        values["6"],
        values["7"],
        values["8"],
        values["9"],
        values["10"],
      ];
    });

    filter.dataset = [header, ...data];
  }

  inDateRange({ $source, eventDate }: GenericObservation): boolean {
    return this.startDate <= eventDate && eventDate <= this.endDate;
  }

  isLastDayInDateRange({ $source, eventDate }: GenericObservation): boolean {
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

  inMapBounds({ latitude, longitude }: GenericObservation): boolean {
    if (!latitude || !longitude) {
      return true;
    }
    return 45.0 < latitude && latitude < 48.0 && 9.0 < longitude && longitude < 13.5;
  }

  inRegions(region: string): boolean {
    return !Object.values(this.regions).some((v) => v) || (typeof region === "string" && this.regions[region]);
  }

  inObservationSources({ $source }: GenericObservation): boolean {
    return (
      !Object.values(this.observationSources).some((v) => v) ||
      (typeof $source === "string" && this.observationSources[$source])
    );
  }
}
