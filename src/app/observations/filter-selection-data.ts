import type { GenericObservation, LocalFilterTypes } from "./models/generic-observation.model";
import { castArray } from "lodash";

export type ChartType = "bar" | "rose";

export type Dataset = Array<Array<string | number>>;

export interface FilterSelectionValue {
  value: string;
  numericRange?: [number, number];
  color: string; // icon color
  label: string; // icon label
  legend: string; // long text for chart legend
}

export interface FilterSelectionSpec {
  type: LocalFilterTypes; // id
  label: string; // caption
  key: keyof GenericObservation; // how to extract data
  chartType: ChartType;
  chartRichLabel: "highlight" | "label" | "symbol" | "grainShape";
  values: FilterSelectionValue[];
}

export class FilterSelectionData implements FilterSelectionSpec {
  readonly type: LocalFilterTypes;
  readonly label: string;
  readonly key: keyof GenericObservation;
  readonly chartType: ChartType;
  readonly chartRichLabel: "highlight" | "label" | "symbol" | "grainShape";
  readonly values: FilterSelectionValue[];

  selected = new Set<string>();
  highlighted = new Set<string>();
  dataset: Dataset;
  nan = 0;

  constructor(spec: FilterSelectionSpec) {
    Object.assign(this, spec);
  }

  toggleFilterValue(subset: "highlighted" | "selected", value: string) {
    const selectedData = this[subset];
    if (selectedData.has(value)) {
      selectedData.delete(value);
    } else {
      selectedData.add(value);
    }
  }

  resetFilter() {
    this.selected = new Set();
    this.highlighted = new Set();
  }

  invertFilter(subset: "highlighted" | "selected") {
    const selectedData = this[subset];
    if (selectedData.size <= 0) {
      return;
    }
    this[subset] = new Set(this.values.map(({ value }) => value));
    selectedData.forEach((value) => this[subset].delete(value));
    this[subset].add("nan");
  }

  isIncluded(subset: "highlighted" | "selected", testData: string | string[] | number): boolean {
    const selectedData = this[subset];
    const filterSelectionValues = this.values.filter((v) => selectedData.has(v.value));
    return (
      (selectedData.has("nan") && !testData) ||
      (subset === "selected" && selectedData.size === 0) ||
      filterSelectionValues.some((f) => castArray(testData).some((v) => FilterSelectionData.testFilterSelection(f, v)))
    );
  }

  static testFilterSelection(f: FilterSelectionValue, v: number | string | Date): boolean {
    return (
      (Array.isArray(f.numericRange) && typeof v === "number" && f.numericRange[0] <= v && v <= f.numericRange[1]) ||
      (v instanceof Date && f.value === FilterSelectionData.getISODateString(v)) ||
      f.value === v
    );
  }

  static getISODateString(date: Date) {
    // like Date.toISOString(), but not using UTC
    // Angular is too slow - formatDate(date, "yyyy-MM-dd", "en-US");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` as const;

    function pad(number: number) {
      return number < 10 ? (`${0}${number}` as const) : (`${number}` as const);
    }
  }
}
