import { Injectable } from "@angular/core";
import { ConstantsService } from "app/providers/constants-service/constants.service";
import {
  GenericObservation,
  LocalFilterTypes,
  AvalancheProblem,
  Aspect,
  ObservationType,
  DangerPattern,
  Stability,
  ImportantObservation,
} from "./models/generic-observation.model";
import { ObservationFilterType } from "./models/generic-observation.model";

interface Dataset {
  source: Array<Array<string | number>>;
}

interface OutputDataset {
  dataset: Dataset;
  nan: any;
}

const DATASET_MAX_FACTOR = 1;

export interface GenericFilterToggleData {
  type: LocalFilterTypes;
  data: {
    value?: string;
    altKey?: boolean;
    markerClassify?: boolean;
    markerLabel?: boolean;
    invert?: boolean;
    reset?: boolean;
  };
}

export interface FilterSelectionData {
  type: LocalFilterTypes;
  all: string[];
  selected: string[];
  highlighted: string[];
}

@Injectable()
export class ObservationFilterService {
  public dateRange: Date[] = [];
  public readonly elevationRange = [0, 4000];
  public readonly elevationSectionSize = 500;
  public selectedElevations: number[] = [];
  public regions: string[] = [];
  public observationSources: string[] = [];

  public filterSelection: Record<LocalFilterTypes, FilterSelectionData> = {
    Elevation: {
      type: LocalFilterTypes.Elevation,
      all: ["0", "500", "1000", "1500", "2000", "2500", "3000", "3500", "4000"],
      selected: [],
      highlighted: [],
    },
    Aspect: {
      type: LocalFilterTypes.Aspect,
      all: Object.keys(Aspect),
      selected: [],
      highlighted: [],
    },
    AvalancheProblem: {
      type: LocalFilterTypes.AvalancheProblem,
      all: Object.keys(AvalancheProblem),
      selected: [],
      highlighted: [],
    },
    Stability: {
      type: LocalFilterTypes.Stability,
      all: Object.keys(Stability),
      selected: [],
      highlighted: [],
    },
    ObservationType: {
      type: LocalFilterTypes.ObservationType,
      all: Object.keys(ObservationType),
      selected: [],
      highlighted: [],
    },
    ImportantObservation: {
      type: LocalFilterTypes.ImportantObservation,
      all: Object.keys(ImportantObservation),
      selected: [],
      highlighted: [],
    },
    DangerPattern: {
      type: LocalFilterTypes.DangerPattern,
      all: Object.keys(DangerPattern),
      selected: [],
      highlighted: [],
    },
    Days: {
      type: LocalFilterTypes.Days,
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
        filterType[subset] = filterType.all.filter((value) => !filterType[subset].includes(value));
      }
    } else {
      const index = filterType[subset].indexOf(filterData.data.value);
      if (index !== -1) filterType[subset].splice(index, 1);
      else filterType[subset].push(filterData.data.value);
    }

    this.filterSelection[filterData["type"]] = filterType;
  }

  set days(days: number) {
    if (!this.endDate) {
      this.endDate = new Date();
    }
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
      const newDates = [];
      for (let i = new Date(this.startDate); i <= this.endDate; i.setDate(i.getDate() + 1)) {
        newDates.push(i.toISOString());
      }
      this.filterSelection.Days.all = newDates;
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
      this.inMapBounds(observation) &&
      this.inRegions(observation.region) &&
      this.isIncluded(LocalFilterTypes.Elevation, this.getElevationIndex(observation.elevation)) &&
      this.isIncluded(LocalFilterTypes.Aspect, observation.aspect) &&
      this.isIncluded(LocalFilterTypes.AvalancheProblem, observation.avalancheProblems) &&
      this.isIncluded(LocalFilterTypes.Stability, observation.stability) &&
      this.isIncluded(LocalFilterTypes.ObservationType, observation.$type) &&
      this.isIncluded(LocalFilterTypes.ImportantObservation, observation.importantObservations) &&
      this.isIncluded(LocalFilterTypes.DangerPattern, observation.dangerPatterns) &&
      this.isIncluded(LocalFilterTypes.Days, this._normedDateString(observation.eventDate))
    );
  }

  public isHighlighted(observation: GenericObservation) {
    if (!this.inMapBounds(observation)) {
      return false;
    }
    return (
      this.isIncluded(LocalFilterTypes.Elevation, this.getElevationIndex(observation.elevation), true) ||
      this.isIncluded(LocalFilterTypes.Aspect, observation.aspect, true) ||
      this.isIncluded(LocalFilterTypes.AvalancheProblem, observation.avalancheProblems, true) ||
      this.isIncluded(LocalFilterTypes.Stability, observation.stability, true) ||
      this.isIncluded(LocalFilterTypes.ObservationType, observation.$type, true) ||
      this.isIncluded(LocalFilterTypes.ImportantObservation, observation.importantObservations, true) ||
      this.isIncluded(LocalFilterTypes.DangerPattern, observation.dangerPatterns, true) ||
      this.isIncluded(LocalFilterTypes.Days, this._normedDateString(observation.eventDate), true)
    );
  }

  public getAspectDataset(observations: GenericObservation[]) {
    const dataRaw = {};
    let nan = 0;

    this.filterSelection[LocalFilterTypes.Aspect]["all"].forEach(
      (key) =>
        (dataRaw[key] = {
          all: 0,
          available: 0,
          selected: this.filterSelection[LocalFilterTypes.Aspect].selected.includes(key) ? 1 : 0,
          highlighted: this.filterSelection[LocalFilterTypes.Aspect].highlighted.includes(key) ? 1 : 0,
        }),
    );

    observations.forEach((observation) => {
      if (observation.aspect) {
        dataRaw[observation.aspect].all++;

        if (observation.filterType === ObservationFilterType.Local) dataRaw[observation.aspect].available++;
      } else nan++;
    });
    const dataset = [["category", "all", "highlighted", "available", "selected"]];

    for (const [key, values] of Object.entries(dataRaw))
      dataset.push([
        key,
        values["all"],
        values["highlighted"] === 1 ? values["all"] * DATASET_MAX_FACTOR * DATASET_MAX_FACTOR : 0,
        values["selected"] === 0 ? values["available"] : 0,
        values["selected"] === 1 ? values["available"] : 0,
      ]);
    return { dataset: { source: dataset }, nan };
  }

  public getStabilityDataset(observations: GenericObservation[]) {
    const dataRaw = {};
    let nan = 0;

    this.filterSelection[LocalFilterTypes.Stability]["all"].forEach(
      (key) =>
        (dataRaw[key] = {
          max: 0,
          all: 0,
          available: 0,
          selected: this.filterSelection[LocalFilterTypes.Stability].selected.includes(key) ? 1 : 0,
          highlighted: this.filterSelection[LocalFilterTypes.Stability].highlighted.includes(key) ? 1 : 0,
        }),
    );

    observations.forEach((observation) => {
      if (observation.stability) {
        dataRaw[observation.stability].all++;

        if (observation.filterType === ObservationFilterType.Local) dataRaw[observation.stability].available++;
      } else nan++;
    });
    return this.toDataset(dataRaw, nan);
  }

  private toDataset(dataRaw: {}, nan: number) {
    const dataset = [["category", "max", "all", "highlighted", "available", "selected"]];

    for (const [key, values] of Object.entries(dataRaw))
      dataset.push([
        key,
        values["all"] * DATASET_MAX_FACTOR,
        values["all"],
        values["highlighted"] === 1 ? values["all"] : 0,
        values["selected"] === 0 ? values["available"] : 0,
        values["selected"] === 1 ? values["available"] : 0,
      ]);
    return { dataset: { source: dataset }, nan };
  }

  public getObservationTypeDataset(observations: GenericObservation[]) {
    const dataRaw = {};
    let nan = 0;

    this.filterSelection[LocalFilterTypes.ObservationType]["all"].forEach(
      (key) =>
        (dataRaw[key] = {
          max: 0,
          all: 0,
          available: 0,
          selected: this.filterSelection[LocalFilterTypes.ObservationType].selected.includes(key) ? 1 : 0,
          highlighted: this.filterSelection[LocalFilterTypes.ObservationType].highlighted.includes(key) ? 1 : 0,
        }),
    );

    observations.forEach((observation) => {
      if (observation.$type) {
        dataRaw[observation.$type].all++;

        if (observation.filterType === ObservationFilterType.Local) dataRaw[observation.$type].available++;
      } else nan++;
    });
    return this.toDataset(dataRaw, nan);
  }

  public getImportantObservationDataset(observations: GenericObservation[]) {
    const dataRaw = {};
    const nan = 0;

    this.filterSelection[LocalFilterTypes.ImportantObservation]["all"].forEach(
      (key) =>
        (dataRaw[key] = {
          max: 0,
          all: 0,
          available: 0,
          selected: this.filterSelection[LocalFilterTypes.ImportantObservation].selected.includes(key) ? 1 : 0,
          highlighted: this.filterSelection[LocalFilterTypes.ImportantObservation].highlighted.includes(key) ? 1 : 0,
        }),
    );

    observations.forEach((observation) => {
      if (Array.isArray(observation.importantObservations)) {
        observation.importantObservations.forEach((importantObservation) => {
          if (!importantObservation) return;
          if (!dataRaw[importantObservation]) {
            console.warn("Unsupported important observation:", importantObservation);
            return;
          }
          dataRaw[importantObservation].all++;

          if (observation.filterType === ObservationFilterType.Local) dataRaw[importantObservation].available++;
        });
      }
    });
    return this.toDataset(dataRaw, nan);
  }

  public getElevationDataset(observations: GenericObservation[]) {
    const dataRaw = {};
    let nan = 0;

    this.filterSelection[LocalFilterTypes.Elevation]["all"].forEach(
      (key) =>
        (dataRaw[key] = {
          max: 0,
          all: 0,
          available: 0,
          selected: this.filterSelection[LocalFilterTypes.Elevation].selected.includes(key) ? 1 : 0,
          highlighted: this.filterSelection[LocalFilterTypes.Elevation].highlighted.includes(key) ? 1 : 0,
        }),
    );

    observations.forEach((observation) => {
      if (observation.elevation) {
        const elevationIndex = this.getElevationIndex(observation.elevation);
        dataRaw[elevationIndex].all++;
        if (observation.filterType === ObservationFilterType.Local) dataRaw[elevationIndex].available++;
      } else nan++;
    });
    return this.toDataset(dataRaw, nan);
  }

  public getAvalancheProblemDataset(observations: GenericObservation[]) {
    const dataRaw = {};
    let nan = 0;

    this.filterSelection[LocalFilterTypes.AvalancheProblem]["all"].forEach(
      (key) =>
        (dataRaw[key] = {
          max: 0,
          available: 0,
          all: 0,
          selected: this.filterSelection[LocalFilterTypes.AvalancheProblem].selected.includes(key) ? 1 : 0,
          highlighted: this.filterSelection[LocalFilterTypes.AvalancheProblem].highlighted.includes(key) ? 1 : 0,
        }),
    );

    observations.forEach((observation) => {
      if (Array.isArray(observation.avalancheProblems)) {
        observation.avalancheProblems.forEach((avalancheProblem) => {
          if (!dataRaw[avalancheProblem]) {
            console.warn("Unsupported avalanche problem:", avalancheProblem);
            return;
          }
          dataRaw[avalancheProblem].all++;

          if (observation.filterType === ObservationFilterType.Local) dataRaw[avalancheProblem].available++;
        });
      } else nan++;
    });
    return this.toDataset(dataRaw, nan);
  }

  public getDangerPatternDataset(observations: GenericObservation[]) {
    const dataRaw = {};
    let nan = 0;

    this.filterSelection[LocalFilterTypes.DangerPattern]["all"].forEach(
      (key) =>
        (dataRaw[key] = {
          max: 0,
          available: 0,
          all: 0,
          selected: this.filterSelection[LocalFilterTypes.DangerPattern].selected.includes(key) ? 1 : 0,
          highlighted: this.filterSelection[LocalFilterTypes.DangerPattern].highlighted.includes(key) ? 1 : 0,
        }),
    );

    observations.forEach((observation) => {
      if (Array.isArray(observation.dangerPatterns)) {
        observation.dangerPatterns.forEach((dangerPattern) => {
          if (!dangerPattern) return;
          dataRaw[dangerPattern].all++;

          if (observation.filterType === ObservationFilterType.Local) dataRaw[dangerPattern].available++;
        });
      } else nan++;
    });
    return this.toDataset(dataRaw, nan);
  }

  public normalizeData(dataset: OutputDataset): OutputDataset {
    const nan = 0;
    const data = dataset?.dataset.source.slice(1);
    const header = dataset?.dataset.source[0];
    //if(!this.isFilterActive()) console.log("normalizeData #0 ", {filterActive: this.isFilterActive(), filter: this.filterSelection, data});
    if (!this.isFilterActive() || !dataset || !data || !header) return dataset;

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

  _normedDateString(date: Date): string {
    date = new Date(date);
    date.setHours(0, 0, 0, 0);
    return date.toISOString();
  }

  getDaysDataset(observations: GenericObservation[]) {
    const dataRaw = {};
    let nan = 0;

    this.filterSelection[LocalFilterTypes.Days]["all"].forEach(
      (key) =>
        (dataRaw[key] = {
          max: 0,
          all: 0,
          available: 0,
          selected: this.filterSelection[LocalFilterTypes.Days].selected.includes(key) ? 1 : 0,
          highlighted: this.filterSelection[LocalFilterTypes.Days].highlighted.includes(key) ? 1 : 0,
        }),
    );
    observations.forEach((observation) => {
      if (observation.eventDate) {
        const dateId = this._normedDateString(observation.eventDate);
        if (dataRaw[dateId]) {
          dataRaw[dateId].all++;
          if (observation.filterType === ObservationFilterType.Local) dataRaw[dateId].available++;
        } else console.error("observations-filter.service->getDayDataset Date not found ##4", dateId, observation);
      } else nan++;
    });
    return this.toDataset(dataRaw, nan);
  }

  inDateRange({ $source, eventDate }: GenericObservation): boolean {
    return this.startDate <= eventDate && eventDate <= this.endDate;
  }

  inMapBounds({ latitude, longitude }: GenericObservation): boolean {
    if (!latitude || !longitude) {
      return true;
    }
    const { mapBoundaryS, mapBoundaryN, mapBoundaryW, mapBoundaryE } = this.constantsService;
    return mapBoundaryS < latitude && latitude < mapBoundaryN && mapBoundaryW < longitude && longitude < mapBoundaryE;
  }

  inRegions(region: string) {
    return !this.regions.length || (typeof region === "string" && this.regions.includes(region));
  }

  inObservationSources({ $source }: GenericObservation) {
    return (
      !this.observationSources.length || (typeof $source === "string" && this.observationSources.includes($source))
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

  private getElevationIndex(elevation: number): string {
    if (!elevation) return "";
    const range = this.elevationRange[1] - this.elevationRange[0];
    return (
      Math.floor((elevation - this.elevationRange[0]) / this.elevationSectionSize) * this.elevationSectionSize +
      this.elevationRange[0] +
      ""
    );
  }
}
