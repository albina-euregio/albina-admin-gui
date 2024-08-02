import { Injectable } from "@angular/core";
import {
  GenericObservation,
  ImportantObservation,
  ObservationSource,
  ObservationType,
} from "./models/generic-observation.model";
import { castArray } from "lodash";
import { ActivatedRoute, Params, Router } from "@angular/router";
import { TranslateService } from "@ngx-translate/core";
import { Aspect, AvalancheProblem, DangerPattern, SnowpackStability } from "../enums/enums";
import { ConstantsService } from "../providers/constants-service/constants.service";
import { type Dataset, FilterSelectionData } from "./filter-selection-data";

@Injectable()
export class ObservationFilterService {
  public dateRange: Date[] = [];
  public regions = {} as Record<string, boolean>;
  public observationSources = {} as Record<ObservationSource, boolean>;

  public filterSelectionData: FilterSelectionData[] = [
    new FilterSelectionData({
      type: "Aspect",
      label: this.translateService.instant("admin.observations.charts.aspect.caption"),
      key: "aspect",
      chartType: "rose",
      chartRichLabel: "label",
      values: [
        // FATMAP
        { value: Aspect.N, color: "#2f74f9", label: Aspect.N, legend: this.translateService.instant("aspect.N") },
        { value: Aspect.NE, color: "#96c0fc", label: Aspect.NE, legend: this.translateService.instant("aspect.NE") },
        { value: Aspect.E, color: "#b3b3b3", label: Aspect.E, legend: this.translateService.instant("aspect.E") },
        { value: Aspect.SE, color: "#f6ba91", label: Aspect.SE, legend: this.translateService.instant("aspect.SE") },
        { value: Aspect.S, color: "#ef6d25", label: Aspect.S, legend: this.translateService.instant("aspect.S") },
        { value: Aspect.SW, color: "#6c300b", label: Aspect.SW, legend: this.translateService.instant("aspect.SW") },
        { value: Aspect.W, color: "#000000", label: Aspect.W, legend: this.translateService.instant("aspect.W") },
        { value: Aspect.NW, color: "#113570", label: Aspect.NW, legend: this.translateService.instant("aspect.NW") },
      ],
    }),
    new FilterSelectionData({
      type: "Days",
      label: this.translateService.instant("admin.observations.charts.days.caption"),
      key: "eventDate",
      chartType: "bar",
      chartRichLabel: "label",
      values: [],
    }),
    new FilterSelectionData({
      type: "Elevation",
      label: this.translateService.instant("admin.observations.charts.elevation.caption"),
      key: "elevation",
      chartType: "bar",
      chartRichLabel: "label",
      values: [
        { value: "4000 – ∞", numericRange: [4000, 9999], color: "#CC0CE8", label: "40", legend: "4000 – ∞" },
        { value: "3500 – 4000", numericRange: [3500, 4000], color: "#784BFF", label: "35", legend: "3500 – 4000" },
        { value: "3000 – 3500", numericRange: [3000, 3500], color: "#035BBE", label: "30", legend: "3000 – 3500" },
        { value: "2500 – 3000", numericRange: [2500, 3000], color: "#0481FF", label: "25", legend: "2500 – 3000" },
        { value: "2000 – 2500", numericRange: [2000, 2500], color: "#03CDFF", label: "20", legend: "2000 – 2500" },
        { value: "1500 – 2000", numericRange: [1500, 2000], color: "#8CFFFF", label: "15", legend: "1500 – 2000" },
        { value: "1000 – 1500", numericRange: [1000, 1500], color: "#B0FFBC", label: "10", legend: "1000 – 1500" },
        { value: "500 – 1000", numericRange: [500, 1000], color: "#FFFFB3", label: "5", legend: "500 – 1000" },
        { value: "0 – 500", numericRange: [0, 500], color: "#FFFFFE", label: "0", legend: "0 – 500" },
      ],
    }),
    new FilterSelectionData({
      type: "Stability",
      label: this.translateService.instant("admin.observations.charts.stability.caption"),
      key: "stability",
      chartType: "bar",
      chartRichLabel: "symbol",
      values: [
        // https://colorbrewer2.org/#type=diverging&scheme=RdYlGn&n=5
        {
          value: SnowpackStability.very_poor,
          color: "#d7191c",
          label: "🔴",
          legend: this.translateService.instant("snowpackStability.very_poor"),
        },
        {
          value: SnowpackStability.poor,
          color: "#fdae61",
          label: "🟠",
          legend: this.translateService.instant("snowpackStability.poor"),
        },
        {
          value: SnowpackStability.fair,
          color: "#ffffbf",
          label: "🟡",
          legend: this.translateService.instant("snowpackStability.fair"),
        },
        {
          value: SnowpackStability.good,
          color: "#a6d96a",
          label: "🟢",
          legend: this.translateService.instant("snowpackStability.good"),
        },
      ],
    }),
    new FilterSelectionData({
      type: "ObservationType",
      label: this.translateService.instant("admin.observations.charts.observationType.caption"),
      key: "$type",
      chartType: "bar",
      chartRichLabel: "symbol",
      values: [
        // https://colorbrewer2.org/#type=qualitative&scheme=Set1&n=9
        {
          value: ObservationType.SimpleObservation,
          color: "#e41a1c",
          label: "👁",
          legend: this.translateService.instant("observationType.SimpleObservation"),
        },
        {
          value: ObservationType.Evaluation,
          color: "#377eb8",
          label: "✓",
          legend: this.translateService.instant("observationType.Evaluation"),
        },
        {
          value: ObservationType.Avalanche,
          color: "#4daf4a",
          label: "⛰",
          legend: this.translateService.instant("observationType.Avalanche"),
        },
        {
          value: ObservationType.Blasting,
          color: "#984ea3",
          label: "⁜",
          legend: this.translateService.instant("observationType.Blasting"),
        },
        {
          value: ObservationType.Closure,
          color: "#ff7f00",
          label: "𐄂",
          legend: this.translateService.instant("observationType.Closure"),
        },
        {
          value: ObservationType.Profile,
          color: "#ffff33",
          label: "⌇",
          legend: this.translateService.instant("observationType.Profile"),
        },
      ],
    }),
    new FilterSelectionData({
      type: "ImportantObservation",
      label: this.translateService.instant("admin.observations.charts.importantObservation.caption"),
      key: "importantObservations",
      chartType: "bar",
      chartRichLabel: "grainShape",
      values: [
        // https://colorbrewer2.org/#type=qualitative&scheme=Set1&n=9
        {
          value: ImportantObservation.SnowLine,
          color: "#e41a1c",
          label: "S",
          legend: this.translateService.instant("importantObservation.SnowLine"),
        },
        {
          value: ImportantObservation.SurfaceHoar,
          color: "#377eb8",
          label: "g",
          legend: this.translateService.instant("importantObservation.SurfaceHoar"),
        },
        {
          value: ImportantObservation.Graupel,
          color: "#4daf4a",
          label: "o",
          legend: this.translateService.instant("importantObservation.Graupel"),
        },
        {
          value: ImportantObservation.StabilityTest,
          color: "#984ea3",
          label: "k",
          legend: this.translateService.instant("importantObservation.StabilityTest"),
        },
        {
          value: ImportantObservation.IceFormation,
          color: "#ff7f00",
          label: "i",
          legend: this.translateService.instant("importantObservation.IceFormation"),
        },
        {
          value: ImportantObservation.VeryLightNewSnow,
          color: "#ffff33",
          label: "m",
          legend: this.translateService.instant("importantObservation.VeryLightNewSnow"),
        },
      ],
    }),
    new FilterSelectionData({
      type: "AvalancheProblem",
      label: this.translateService.instant("admin.observations.charts.avalancheProblem.caption"),
      key: "avalancheProblems",
      chartType: "bar",
      chartRichLabel: "symbol",
      values: [
        // The international classification for seasonal snow on the ground
        // (except for gliding snow - no definition there)
        {
          value: AvalancheProblem.new_snow,
          color: "#00ff00",
          label: "🌨",
          legend: this.translateService.instant("avalancheProblem.new_snow"),
        },
        {
          value: AvalancheProblem.wind_slab,
          color: "#229b22",
          label: "🚩",
          legend: this.translateService.instant("avalancheProblem.wind_slab"),
        },
        {
          value: AvalancheProblem.persistent_weak_layers,
          color: "#0000ff",
          label: "❗",
          legend: this.translateService.instant("avalancheProblem.persistent_weak_layers"),
        },
        {
          value: AvalancheProblem.wet_snow,
          color: "#ff0000",
          label: "☀️",
          legend: this.translateService.instant("avalancheProblem.wet_snow"),
        },
        {
          value: AvalancheProblem.gliding_snow,
          color: "#aa0000",
          label: "🐟",
          legend: this.translateService.instant("avalancheProblem.gliding_snow"),
        },
      ],
    }),
    new FilterSelectionData({
      type: "DangerPattern",
      label: this.translateService.instant("admin.observations.charts.dangerPattern.caption"),
      key: "dangerPatterns",
      chartType: "bar",
      chartRichLabel: "label",
      values: [
        // https://colorbrewer2.org/#type=qualitative&scheme=Set1&n=9
        {
          value: DangerPattern.dp1,
          color: "#e41a1c",
          label: "1",
          legend: this.translateService.instant("dangerPattern.dp1"),
        },
        {
          value: DangerPattern.dp2,
          color: "#377eb8",
          label: "2",
          legend: this.translateService.instant("dangerPattern.dp2"),
        },
        {
          value: DangerPattern.dp3,
          color: "#4daf4a",
          label: "3",
          legend: this.translateService.instant("dangerPattern.dp3"),
        },
        {
          value: DangerPattern.dp4,
          color: "#984ea3",
          label: "4",
          legend: this.translateService.instant("dangerPattern.dp4"),
        },
        {
          value: DangerPattern.dp5,
          color: "#ff7f00",
          label: "5",
          legend: this.translateService.instant("dangerPattern.dp5"),
        },
        {
          value: DangerPattern.dp6,
          color: "#ffff33",
          label: "6",
          legend: this.translateService.instant("dangerPattern.dp6"),
        },
        {
          value: DangerPattern.dp7,
          color: "#a65628",
          label: "7",
          legend: this.translateService.instant("dangerPattern.dp7"),
        },
        {
          value: DangerPattern.dp8,
          color: "#f781bf",
          label: "8",
          legend: this.translateService.instant("dangerPattern.dp8"),
        },
        {
          value: DangerPattern.dp9,
          color: "#999999",
          label: "9",
          legend: this.translateService.instant("dangerPattern.dp9"),
        },
        {
          value: DangerPattern.dp10,
          color: "#e41a1c",
          label: "10",
          legend: this.translateService.instant("dangerPattern.dp10"),
        },
      ],
    }),
  ];

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
