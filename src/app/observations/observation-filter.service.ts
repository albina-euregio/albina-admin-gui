import { Injectable } from "@angular/core";
import {
  GenericObservation,
  ImportantObservation,
  LocalFilterTypes,
  ObservationSource,
  ObservationType,
} from "./models/generic-observation.model";
import { formatDate } from "@angular/common";
import { castArray } from "lodash";
import { ActivatedRoute, Params, Router } from "@angular/router";
import { TranslateService } from "@ngx-translate/core";
import { Aspect, AvalancheProblem, DangerPattern, SnowpackStability } from "../enums/enums";
import { ConstantsService } from "../providers/constants-service/constants.service";

interface Dataset {
  source: Array<Array<string | number>>;
}

export interface OutputDataset {
  dataset: Dataset;
  nan: any;
}

const DATASET_MAX_FACTOR = 1;

export interface GenericFilterToggleData {
  type: LocalFilterTypes;
  data: {
    value?: string;
    altKey?: boolean;
    ctrlKey?: boolean;
    markerClassify?: boolean;
    markerLabel?: boolean;
    invert?: boolean;
    reset?: boolean;
  };
}

export interface FilterSelectionValue {
  value: string;
  numericRange?: [number, number];
  color: string;
  label: string;
}

export interface FilterSelectionData {
  type: LocalFilterTypes; // id
  label: string; // caption
  key: keyof GenericObservation; // how to extract data
  chartRichLabel: "highlight" | "label" | "symbol" | "grainShape";
  selected: string[];
  highlighted: string[];
  values: FilterSelectionValue[];
}

@Injectable()
export class ObservationFilterService {
  public dateRange: Date[] = [];
  public regions = {} as Record<string, boolean>;
  public observationSources = {} as Record<ObservationSource, boolean>;

  public filterSelection: Record<LocalFilterTypes, FilterSelectionData> = {
    Elevation: {
      type: LocalFilterTypes.Elevation,
      label: this.translateService.instant("admin.observations.charts.elevation.caption"),
      key: "elevation",
      chartRichLabel: "label",
      values: [
        { value: "4000–∞", numericRange: [4000, 9999], color: "#CC0CE8", label: "40" },
        { value: "3500–4000", numericRange: [3500, 4000], color: "#784BFF", label: "35" },
        { value: "3000–3500", numericRange: [3000, 3500], color: "#035BBE", label: "30" },
        { value: "2500–3000", numericRange: [2500, 3000], color: "#0481FF", label: "25" },
        { value: "2000–2500", numericRange: [2000, 2500], color: "#03CDFF", label: "20" },
        { value: "1500–2000", numericRange: [1500, 2000], color: "#8CFFFF", label: "15" },
        { value: "1000–1500", numericRange: [1000, 1500], color: "#B0FFBC", label: "10" },
        { value: "500–1000", numericRange: [500, 1000], color: "#FFFFB3", label: "5" },
        { value: "0–500", numericRange: [0, 500], color: "#FFFFFE", label: "0" }, //
      ],
      selected: [],
      highlighted: [],
    },
    Aspect: {
      type: LocalFilterTypes.Aspect,
      label: this.translateService.instant("admin.observations.charts.aspect.caption"),
      key: "aspect",
      chartRichLabel: "label",
      values: [
        // FATMAP
        { value: Aspect.N, color: "#2f74f9", label: Aspect.N },
        { value: Aspect.NE, color: "#96c0fc", label: Aspect.NE },
        { value: Aspect.E, color: "#b3b3b3", label: Aspect.E },
        { value: Aspect.SE, color: "#f6ba91", label: Aspect.SE },
        { value: Aspect.S, color: "#ef6d25", label: Aspect.S },
        { value: Aspect.SW, color: "#6c300b", label: Aspect.SW },
        { value: Aspect.W, color: "#000000", label: Aspect.W },
        { value: Aspect.NW, color: "#113570", label: Aspect.NW },
      ],
      selected: [],
      highlighted: [],
    },
    AvalancheProblem: {
      type: LocalFilterTypes.AvalancheProblem,
      label: this.translateService.instant("admin.observations.charts.avalancheProblem.caption"),
      key: "avalancheProblems",
      chartRichLabel: "symbol",
      values: [
        // The international classification for seasonal snow on the ground
        // (except for gliding snow - no definition there)
        { value: AvalancheProblem.new_snow, color: "#00ff00", label: "🌨" },
        { value: AvalancheProblem.wind_slab, color: "#229b22", label: "🚩" },
        { value: AvalancheProblem.persistent_weak_layers, color: "#0000ff", label: "❗" },
        { value: AvalancheProblem.wet_snow, color: "#ff0000", label: "☀️" },
        { value: AvalancheProblem.gliding_snow, color: "#aa0000", label: "🐟" },
      ],
      selected: [],
      highlighted: [],
    },
    Stability: {
      type: LocalFilterTypes.Stability,
      label: this.translateService.instant("admin.observations.charts.stability.caption"),
      key: "stability",
      chartRichLabel: "symbol",
      values: [
        // https://colorbrewer2.org/#type=diverging&scheme=RdYlGn&n=5
        { value: SnowpackStability.very_poor, color: "#d7191c", label: "🔴" },
        { value: SnowpackStability.poor, color: "#fdae61", label: "🟠" },
        { value: SnowpackStability.fair, color: "#ffffbf", label: "🟡" },
        { value: SnowpackStability.good, color: "#a6d96a", label: "🟢" },
      ],
      selected: [],
      highlighted: [],
    },
    ObservationType: {
      type: LocalFilterTypes.ObservationType,
      label: this.translateService.instant("admin.observations.charts.observationType.caption"),
      key: "$type",
      chartRichLabel: "symbol",
      values: [
        // https://colorbrewer2.org/#type=qualitative&scheme=Set1&n=9
        { value: ObservationType.SimpleObservation, color: "#e41a1c", label: "👁" },
        { value: ObservationType.Evaluation, color: "#377eb8", label: "✓" },
        { value: ObservationType.Avalanche, color: "#4daf4a", label: "⛰" },
        { value: ObservationType.Blasting, color: "#984ea3", label: "⁜" },
        { value: ObservationType.Closure, color: "#ff7f00", label: "𐄂" },
        { value: ObservationType.Profile, color: "#ffff33", label: "⌇" },
      ],
      selected: [],
      highlighted: [],
    },
    ImportantObservation: {
      type: LocalFilterTypes.ImportantObservation,
      label: this.translateService.instant("admin.observations.charts.importantObservation.caption"),
      key: "importantObservations",
      chartRichLabel: "grainShape",
      values: [
        // https://colorbrewer2.org/#type=qualitative&scheme=Set1&n=9
        { value: ImportantObservation.SnowLine, color: "#e41a1c", label: "S" },
        { value: ImportantObservation.SurfaceHoar, color: "#377eb8", label: "g" },
        { value: ImportantObservation.Graupel, color: "#4daf4a", label: "o" },
        { value: ImportantObservation.StabilityTest, color: "#984ea3", label: "k" },
        { value: ImportantObservation.IceFormation, color: "#ff7f00", label: "i" },
        { value: ImportantObservation.VeryLightNewSnow, color: "#ffff33", label: "m" },
      ],
      selected: [],
      highlighted: [],
    },
    DangerPattern: {
      type: LocalFilterTypes.DangerPattern,
      label: this.translateService.instant("admin.observations.charts.dangerPattern.caption"),
      key: "dangerPatterns",
      chartRichLabel: "label",
      values: [
        // https://colorbrewer2.org/#type=qualitative&scheme=Set1&n=9
        { value: DangerPattern.dp1, color: "#e41a1c", label: "1" },
        { value: DangerPattern.dp2, color: "#377eb8", label: "2" },
        { value: DangerPattern.dp3, color: "#4daf4a", label: "3" },
        { value: DangerPattern.dp4, color: "#984ea3", label: "4" },
        { value: DangerPattern.dp5, color: "#ff7f00", label: "5" },
        { value: DangerPattern.dp6, color: "#ffff33", label: "6" },
        { value: DangerPattern.dp7, color: "#a65628", label: "7" },
        { value: DangerPattern.dp8, color: "#f781bf", label: "8" },
        { value: DangerPattern.dp9, color: "#999999", label: "9" },
        { value: DangerPattern.dp10, color: "#e41a1c", label: "10" },
      ],
      selected: [],
      highlighted: [],
    },
    Days: {
      type: LocalFilterTypes.Days,
      label: this.translateService.instant("admin.observations.charts.days.caption"),
      key: "eventDate",
      chartRichLabel: "label",
      values: [],
      selected: [],
      highlighted: [],
    },
  };

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private translateService: TranslateService,
    private constantsService: ConstantsService,
  ) {
    this.activatedRoute.queryParams.subscribe((params) => this.parseQueryParams(params));
  }

  toggleFilter(filterData: GenericFilterToggleData) {
    const filterType = this.filterSelection[filterData.type];
    const subset = filterData.data.altKey ? ("highlighted" as const) : ("selected" as const);

    if (filterData.data.reset) {
      filterType.selected = [];
      filterType.highlighted = [];
    } else if (filterData.data.invert) {
      if (filterType[subset].length > 0) {
        const result = filterType.values
          .map(({ value }) => value)
          .filter((value) => !filterType[subset].includes(value));
        filterType[subset] = !filterType[subset].includes("nan") ? result.concat("nan") : result;
      }
    } else {
      const index = filterType[subset].indexOf(filterData.data.value);
      if (index !== -1) filterType[subset].splice(index, 1);
      else filterType[subset].push(filterData.data.value);
      if (filterData.data.ctrlKey) {
        if (filterType[subset].length > 0) {
          const result = filterType.values
            .map(({ value }) => value)
            .filter((value) => !filterType[subset].includes(value));
          filterType[subset] = !filterType[subset].includes("nan") ? result.concat("nan") : result;
        }
      }
    }
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
      const colors = ["#084594", "#2171b5", "#4292c6", "#6baed6", "#9ecae1", "#c6dbef", "#eff3ff"];
      this.filterSelection.Days.values = [];
      for (let i = new Date(this.startDate); i <= this.endDate; i.setDate(i.getDate() + 1)) {
        this.filterSelection.Days.values.push({
          value: this.constantsService.getISODateString(i),
          color: colors.shift(),
          label: formatDate(i, "dd", "en-US"),
        });
      }
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
      Object.values(LocalFilterTypes).every((t) => this.isIncluded(t, observation[this.filterSelection[t].key]))
    );
  }

  public isWeatherStationSelected(observation: GenericObservation) {
    return (
      this.inMapBounds(observation) &&
      this.inRegions(observation.region) &&
      this.isIncluded(LocalFilterTypes.Elevation, observation.elevation)
    );
  }

  public isHighlighted(observation: GenericObservation) {
    if (!this.inMapBounds(observation)) {
      return false;
    }
    return Object.values(LocalFilterTypes).some((t) =>
      this.isIncluded(t, observation[this.filterSelection[t].key], true),
    );
  }

  public toDataset(
    observations: GenericObservation[],
    type: LocalFilterTypes,
    classifyType: LocalFilterTypes,
  ): OutputDataset {
    const filter = this.filterSelection[type];
    let nan = 0;
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
        nan++;
        return;
      }
      castArray(value).forEach((v) => {
        const data = dataRaw.find((f) => this.testFilterSelection(f.value, v))?.data;
        if (!data) {
          return;
        }
        data.all++;
        if (!this.isSelected(observation)) {
          return;
        }
        if (!classifyType || classifyType === type) {
          data[0]++;
          return;
        }
        const filter2 = this.filterSelection[classifyType];
        const value2: number | string | string[] = observation[filter2.key];
        if (value2 === undefined || value2 === null) {
          data[0]++;
          return;
        }
        castArray(value2).forEach((v) => {
          data[filter2.values.findIndex((f) => this.testFilterSelection(f, v)) + 1]++;
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

    const data: OutputDataset["dataset"]["source"] = dataRaw.map((f) => {
      const key = f.value.value;
      const values = f.data;
      const highlighted = filter.highlighted.includes(key) ? values.all : 0;
      const available = !filter.selected.includes(key) ? values.available : 0;
      const selected = filter.selected.includes(key) ? values.available : 0;
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

    return { dataset: { source: [header, ...data] }, nan };
  }

  testFilterSelection(f: FilterSelectionValue, v: number | string | Date): boolean {
    return (
      (Array.isArray(f.numericRange) && typeof v === "number" && f.numericRange[0] <= v && v <= f.numericRange[1]) ||
      (v instanceof Date && f.value === this.constantsService.getISODateString(v)) ||
      f.value === v
    );
  }

  findFilterSelection(filterTypes: LocalFilterTypes, observation: GenericObservation) {
    const filterSelection = this.filterSelection[filterTypes];
    const value = observation[filterSelection.key];
    return filterSelection.values.find((f) => castArray(value).some((v) => this.testFilterSelection(f, v)));
  }

  inDateRange({ $source, eventDate }: GenericObservation): boolean {
    return this.startDate <= eventDate && eventDate <= this.endDate;
  }

  isLastDayInDateRange({ $source, eventDate }: GenericObservation): boolean {
    const selectedData: string[] = this.filterSelection[LocalFilterTypes.Days].selected
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

  isIncluded(
    filter: LocalFilterTypes,
    testData: string | string[] | number,
    testHighlighted: boolean = false,
  ): boolean {
    const filterSelection = this.filterSelection[filter];
    const selectedData: string[] = filterSelection[testHighlighted ? "highlighted" : "selected"];
    const filterSelectionValues = filterSelection.values.filter((v) => selectedData.includes(v.value));
    return (
      (selectedData.includes("nan") && !testData) ||
      (!testHighlighted && selectedData.length === 0) ||
      filterSelectionValues.some((f) => castArray(testData).some((v) => this.testFilterSelection(f, v)))
    );
  }
}
