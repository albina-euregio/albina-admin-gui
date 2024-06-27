import { Injectable } from "@angular/core";
import { ConstantsService } from "app/providers/constants-service/constants.service";
import {
  Aspect,
  AvalancheProblem,
  DangerPattern,
  GenericObservation,
  ImportantObservation,
  LocalFilterTypes,
  ObservationSource,
  ObservationType,
  Stability,
} from "./models/generic-observation.model";

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

export interface FilterSelectionData {
  type: LocalFilterTypes;
  toValue: (o: GenericObservation) => undefined | string | string[];
  all: string[];
  selected: string[];
  highlighted: string[];
}

@Injectable()
export class ObservationFilterService {
  public dateRange: Date[] = [];
  public regions = {} as Record<string, boolean>;
  public observationSources = {} as Record<ObservationSource, boolean>;

  public filterSelection: Record<LocalFilterTypes, FilterSelectionData> = {
    Elevation: {
      type: LocalFilterTypes.Elevation,
      toValue: (o) => (isFinite(o.elevation) ? String(Math.floor(o.elevation / 500) * 500) : undefined),
      all: ["0", "500", "1000", "1500", "2000", "2500", "3000", "3500", "4000"].reverse(),
      selected: [],
      highlighted: [],
    },
    Aspect: {
      type: LocalFilterTypes.Aspect,
      toValue: (o) => o.aspect,
      all: Object.keys(Aspect),
      selected: [],
      highlighted: [],
    },
    AvalancheProblem: {
      type: LocalFilterTypes.AvalancheProblem,
      toValue: (o) => o.avalancheProblems,
      all: Object.keys(AvalancheProblem).filter(
        (type) =>
          type !== AvalancheProblem.no_distinct_problem &&
          type !== AvalancheProblem.cornices &&
          type !== AvalancheProblem.favourable_situation,
      ),
      selected: [],
      highlighted: [],
    },
    Stability: {
      type: LocalFilterTypes.Stability,
      toValue: (o) => o.stability,
      all: Object.keys(Stability).reverse(),
      selected: [],
      highlighted: [],
    },
    ObservationType: {
      type: LocalFilterTypes.ObservationType,
      toValue: (o) => o.$type,
      all: Object.keys(ObservationType).filter(
        (type) => type !== ObservationType.TimeSeries && type !== ObservationType.Webcam,
      ),
      selected: [],
      highlighted: [],
    },
    ImportantObservation: {
      type: LocalFilterTypes.ImportantObservation,
      toValue: (o) => o.importantObservations,
      all: Object.keys(ImportantObservation),
      selected: [],
      highlighted: [],
    },
    DangerPattern: {
      type: LocalFilterTypes.DangerPattern,
      toValue: (o) => o.dangerPatterns,
      all: Object.keys(DangerPattern),
      selected: [],
      highlighted: [],
    },
    Days: {
      type: LocalFilterTypes.Days,
      toValue: (o) => this.constantsService.getISODateString(new Date(o.eventDate)),
      all: [],
      selected: [],
      highlighted: [],
    },
  };

  public isFilterActive(): boolean {
    return Object.values(this.filterSelection).some(
      (filter) => filter.selected.length > 0 || filter.highlighted.length > 0,
    );
  }

  constructor(private constantsService: ConstantsService) {}

  toggleFilter(filterData: GenericFilterToggleData) {
    const filterType = this.filterSelection[filterData["type"]];
    const subset = filterData.data.altKey ? "highlighted" : ("selected" as const);

    if (filterData.data.reset) {
      filterType["selected"] = [];
      filterType["highlighted"] = [];
    } else if (filterData.data.invert) {
      if (filterType[subset].length > 0) {
        const result = filterType.all.filter((value) => !filterType[subset].includes(value));
        filterType[subset] = !filterType[subset].includes("nan") ? result.concat("nan") : result;
      }
    } else {
      const index = filterType[subset].indexOf(filterData.data.value);
      if (index !== -1) filterType[subset].splice(index, 1);
      else filterType[subset].push(filterData.data.value);
      if (filterData.data.ctrlKey) {
        if (filterType[subset].length > 0) {
          const result = filterType.all.filter((value) => !filterType[subset].includes(value));
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
      this.filterSelection.Days.all = [];
      for (let i = new Date(this.startDate); i <= this.endDate; i.setDate(i.getDate() + 1)) {
        this.filterSelection.Days.all.push(this.constantsService.getISODateString(i));
      }
    }
    this.dateRange = [this.startDate, this.endDate];
  }

  get startDate(): Date {
    return this.dateRange[0];
  }

  get startDateString(): string {
    return this.constantsService.getISOStringWithTimezoneOffsetUrlEncoded(this.startDate);
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

  get endDateString(): string {
    return this.constantsService.getISOStringWithTimezoneOffsetUrlEncoded(this.endDate);
  }

  public isSelected(observation: GenericObservation) {
    return (
      this.inObservationSources(observation) &&
      this.inMapBounds(observation) &&
      this.inRegions(observation.region) &&
      (observation.$source === ObservationSource.SnowLine ? this.isLastDayInDateRange(observation) : true) &&
      Object.values(LocalFilterTypes).every((t) => this.isIncluded(t, this.filterSelection[t].toValue(observation)))
    );
  }

  public isHighlighted(observation: GenericObservation) {
    if (!this.inMapBounds(observation)) {
      return false;
    }
    return Object.values(LocalFilterTypes).some((t) =>
      this.isIncluded(t, this.filterSelection[t].toValue(observation), true),
    );
  }

  public toDataset(
    observations: GenericObservation[],
    type: LocalFilterTypes,
    classifyType: LocalFilterTypes,
  ): OutputDataset {
    const filter = this.filterSelection[type];
    let nan = 0;
    const dataRaw = Object.fromEntries(
      filter["all"].map((key) => [
        key,
        {
          all: 0,
          available: 0,
          selected: filter.selected.includes(key) ? 1 : 0,
          highlighted: filter.highlighted.includes(key) ? 1 : 0,
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
      ]),
    );
    observations.forEach((observation) => {
      const value = filter.toValue(observation);
      if (!value) {
        nan++;
        return;
      }
      (typeof value === "string" ? [value] : value).forEach((v) => {
        const data = dataRaw[v];
        if (!data) return;
        data.all++;
        if (this.isSelected(observation)) {
          if (classifyType && classifyType !== type) {
            const categories = this.filterSelection[classifyType].all;
            const entry: string | string[] = this.filterSelection[classifyType].toValue(observation);
            if (entry) {
              (typeof entry === "string" ? [entry] : entry).forEach((v) => {
                data[categories.indexOf(v) + 1]++;
              });
            } else {
              data[0]++;
            }
          } else {
            data.available++;
          }
        }
      });
    });
    const dataset: OutputDataset["dataset"]["source"] = [
      [
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
      ],
    ];

    for (const key of filter["all"]) {
      const values = dataRaw[key];
      dataset.push([
        key,
        values["all"],
        values["all"],
        values["highlighted"] === 1 ? values["all"] : 0,
        values["selected"] === 0 ? values["available"] : 0,
        values["selected"] === 1 ? values["available"] : 0,
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
      ]);
    }

    return this.normalizeData({ dataset: { source: dataset }, nan });
  }

  public normalizeData(originalDataset: OutputDataset): OutputDataset {
    const nan = originalDataset.nan;
    const data = originalDataset?.dataset.source.slice(1);
    const header = originalDataset?.dataset.source[0];
    //if(!this.isFilterActive()) console.log("normalizeData #0 ", {filterActive: this.isFilterActive(), filter: this.filterSelection, data});
    //if (!this.isFilterActive() || !originalDataset || !data || !header) return originalDataset;

    // get max values in order to normalize data
    // let availableMax = Number.MIN_VALUE;
    // let allMax = Number.MIN_VALUE;
    // let maxMax = Number.MIN_VALUE;

    // data.forEach((row) => {
    //   const availableValue = row[header.indexOf("available")];
    //   const allValue = row[header.indexOf("all")];
    //   const maxValue = row[header.indexOf("max")];
    //   //console.log("normalizeData #1", row[header.indexOf("category")], {available: row[header.indexOf("available")], all: row[header.indexOf("all")]});
    //   if (+availableValue > +availableMax) {
    //     availableMax = +availableValue;
    //   }

    //   if (+allValue > +allMax) {
    //     allMax = +allValue;
    //   }

    //   if (+maxValue > +maxMax) {
    //     maxMax = +maxValue;
    //   }

    // });

    const newData = data.map((row) => {
      const tempRow = row.slice();
      const availableValue = row[header.indexOf("available")];
      const selectedValue = row[header.indexOf("selected")];
      const overwriteValue = +availableValue > 0 ? +availableValue : +selectedValue;
      tempRow[header.indexOf("all")] = overwriteValue;
      if (tempRow[header.indexOf("highlighted")]) tempRow[header.indexOf("highlighted")] = overwriteValue;
      if (tempRow[header.indexOf("max")]) tempRow[header.indexOf("max")] = overwriteValue;
      return tempRow;
    });

    newData.unshift(header);
    //console.log("normalizeData #2", data[0][header.indexOf("category")], {newData, data});
    return { dataset: { source: newData }, nan };
  }

  inDateRange({ $source, eventDate }: GenericObservation): boolean {
    return this.startDate <= eventDate && eventDate <= this.endDate;
  }

  isLastDayInDateRange({ $source, eventDate }: GenericObservation): boolean {
    const selectedData: string[] = this.filterSelection[LocalFilterTypes.Days]["selected"]
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

  isIncluded(filter: LocalFilterTypes, testData: string | string[], testHighlighted: boolean = false): boolean {
    const testField: keyof FilterSelectionData = testHighlighted ? "highlighted" : "selected";
    const selectedData: string[] = this.filterSelection[filter][testField];
    return (
      (selectedData.includes("nan") && !testData) ||
      (!testHighlighted && selectedData.length === 0) ||
      (Array.isArray(testData) && testData.some((d) => d && selectedData.includes(d))) ||
      (typeof testData === "string" && selectedData.includes(testData))
    );
  }
}
