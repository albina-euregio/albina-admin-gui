import { castArray, get } from "lodash";

export type ChartType = "bar" | "rose";

export type Dataset = Array<Array<string | number>>;

export type ValueType = number | string | Date | string[];

export interface FilterSelectionValue {
  value: string;
  numericRange?: [number, number];
  color: string; // icon color
  label: string; // icon label
  legend: string; // long text for chart legend
  // optional
  borderColor?: string;
  labelColor?: string;
  labelFontSize?: number;
  opacity?: number;
  radius?: number;
  weight?: number;
  zIndexOffset?: number;
}

export interface FilterSelectionSpec<T> {
  type: string; // id
  label: string; // caption
  key: keyof T; // how to extract data
  chartType: ChartType;
  chartRichLabel: "highlight" | "label" | "symbol" | "grainShape";
  values: FilterSelectionValue[];
  selectedValues?: string[];
}

export class FilterSelectionData<T> implements FilterSelectionSpec<T> {
  readonly type: string;
  readonly label: string;
  readonly key: keyof T;
  readonly chartType: ChartType;
  readonly chartRichLabel: "highlight" | "label" | "symbol" | "grainShape";
  readonly values: FilterSelectionValue[];

  selected = new Set<string>();
  highlighted = new Set<string>();
  dataset: Dataset;
  nan = 0;

  constructor(spec: FilterSelectionSpec<T>) {
    Object.assign(this, spec);
    if (Array.isArray(spec.selectedValues)) {
      this.selected = new Set(spec.selectedValues);
    }
  }

  setFilterValue(subset: "highlighted" | "selected", value: string) {
    const selectedData = this[subset];
    selectedData.clear();
    selectedData.add(value);
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

  isIncluded(subset: "highlighted" | "selected", testData: ValueType): boolean {
    const selectedData = this[subset];
    const filterSelectionValues = this.values.filter((v) => selectedData.has(v.value));
    return (
      (selectedData.has("nan") && !testData) ||
      (subset === "selected" && selectedData.size === 0) ||
      filterSelectionValues.some((f) => castArray(testData).some((v) => FilterSelectionData.testFilterSelection(f, v)))
    );
  }

  setDateRange(startDate: Date, endDate: Date) {
    const colors = ["#084594", "#2171b5", "#4292c6", "#6baed6", "#9ecae1", "#c6dbef", "#eff3ff"];
    this.values.length = 0;
    for (let i = new Date(startDate); i <= endDate; i.setDate(i.getDate() + 1)) {
      this.values.push({
        value: FilterSelectionData.getISODateString(i),
        color: colors.shift(),
        label: FilterSelectionData.getISODateString(i).slice(-2),
        legend: FilterSelectionData.getISODateString(i),
      });
    }
  }

  getValue(observation: T): ValueType {
    return get(observation, this.key) as ValueType;
  }

  getValues(observation: T) {
    return castArray(this.getValue(observation));
  }

  findForObservation(observation: T) {
    return this.values.find((f) =>
      this.getValues(observation).some((v) => FilterSelectionData.testFilterSelection(f, v)),
    );
  }

  static testFilterSelection(f: FilterSelectionValue, v: Exclude<ValueType, string[]>): boolean {
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

  buildChartsData(markerClassify: FilterSelectionData<T>, observations: T[], isSelected: (o: T) => boolean): void {
    this.nan = 0;
    const dataRaw = this.values.map((value) => ({
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
      const value = this.getValue(observation);
      if (value === undefined || value === null) {
        this.nan++;
        return;
      }
      castArray(value).forEach((v) => {
        const data = dataRaw.find((f) => FilterSelectionData.testFilterSelection(f.value, v))?.data;
        if (!data) {
          return;
        }
        data.all++;
        if (!isSelected(observation)) {
          return;
        }
        if (!markerClassify || markerClassify.type === this.type) {
          data[0]++;
          return;
        }
        const value2 = markerClassify.getValue(observation);
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
      const highlighted = this.highlighted.has(key) ? values.all : 0;
      const available = !this.selected.has(key) ? values.available : 0;
      const selected = this.selected.has(key) ? values.available : 0;
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

    this.dataset = [header, ...data];
  }
}
