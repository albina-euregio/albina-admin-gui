import { expect, test } from "@playwright/test";

import { classSlotsFor, fitsClassSlots } from "../src/app/modelling/index-classes";
import {
  clickFilterValues,
  type ClickModifiers,
  FilterSelectionData,
} from "../src/app/observations/filter-selection-data";

const grainTypes = ["PP", "DF", "PPgp", "SH", "DH", "FC", "FCxr", "RG", "MF", "MFcr", "IF"];
/** A filter over the eleven grain types of the live config, keyed through the placeholder. */
const grainType = () =>
  new FilterSelectionData<Record<string, unknown>>({
    type: "grainType",
    label: "Grain type",
    key: "snowpack.$stabilityIndex.grainType",
    chartType: "bar",
    chartRichLabel: "grainShape",
    values: grainTypes.map((value) => ({ value, label: value, color: "#000" })),
  });
/** A two-valued filter to chart against the classifier. */
const band = () =>
  new FilterSelectionData<Record<string, unknown>>({
    type: "band",
    label: "Band",
    key: "band",
    chartType: "bar",
    chartRichLabel: "label",
    values: ["low", "high"].map((value) => ({ value, label: value, color: "#000" })),
  });
/** An observation in a band whose Punstable layer has the given grain type. */
const observation = (grain: string | undefined, bandValue: string) => ({
  $stabilityIndex: "Punstable",
  band: bandValue,
  snowpack: { Punstable: { grainType: grain }, sk38_ccl: { grainType: "PP" } },
});

test("ten class slots by default, slot 0 for the unclassified", () => {
  const chart = band();
  const classifier = grainType();
  chart.buildChartsData(classifier, [observation("PP", "low"), observation(undefined, "low")], () => true);
  expect(chart.dataset[0]).toEqual([
    "category",
    "max",
    "all",
    "highlighted",
    "available",
    "selected",
    ...["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
  ]);
  expect(chart.dataset[1].slice(6)).toEqual([1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
});

test("an eleventh class gets its own slot once the slots fit it", () => {
  const chart = band();
  const classifier = grainType();
  const observations = [observation("IF", "high"), observation("MFcr", "high"), observation("PP", "high")];
  chart.buildChartsData(classifier, observations, () => true, undefined, 11);
  expect(chart.dataset[0].slice(6)).toEqual(["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11"]);
  expect(chart.dataset[2].slice(6)).toEqual([0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1]);
  chart.buildChartsData(classifier, observations, () => true);
  expect(chart.dataset[2].slice(6)).toEqual([0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1]);
});

/** The url-backed datetag filter over the given values, keyed through the placeholder like the live config. */
const datetag = (values: string[]) =>
  new FilterSelectionData<Record<string, unknown>>({
    type: "datetag",
    label: "Datetag",
    key: "snowpack.$stabilityIndex.instabilityDrivenBy",
    url: "api/locations",
    chartType: "bar",
    chartRichLabel: "label",
    values: values.map((value) => ({ value, label: value, color: "#000" })),
  });
/** The same filter, reading a value it does not offer as nan. */
const datetagAsNan = (values: string[]) => Object.assign(datetag(values), { unmatchedAsNan: true });
/** An observation whose Punstable layer is driven by the given datetag or datetags. */
const drivenBy = (tag: string | string[] | undefined) => ({
  $stabilityIndex: "Punstable",
  snowpack: { Punstable: { instabilityDrivenBy: tag, value: 0.9 } },
});

test("a url-backed classifier fits the class slots only while each of its classes lands in a slot", () => {
  const dates = Array.from({ length: 12 }, (_, i) => `2026-03-${i + 10}`);
  const twelve = datetag(dates);
  const eleven = datetag(dates.slice(0, 11));
  const classSlots = classSlotsFor([band(), grainType(), twelve]);
  expect(classSlots).toBe(11);
  expect(fitsClassSlots(eleven, classSlots)).toBe(true);
  expect(fitsClassSlots(twelve, classSlots)).toBe(false);
  const observations = dates.map((date) => ({ ...drivenBy(date), band: "low" }));
  const slotSum = (classifier: FilterSelectionData<Record<string, unknown>>) => {
    const chart = band();
    chart.buildChartsData(classifier, observations, () => true, undefined, classSlots);
    return (chart.dataset[1].slice(6) as number[]).reduce((sum, count) => sum + count, 0);
  };
  expect(slotSum(eleven)).toBe(12);
  expect(slotSum(twelve)).toBe(11);
});

test("by default a value the filter does not offer is read as it is and counted nowhere", () => {
  const filter = datetag(["new_snow", "2026-03-24"]);
  expect(filter.unmatchedAsNan).toBe(false);
  expect(filter.getValue(drivenBy("2026-01-28"))).toBe("2026-01-28");
  filter.buildChartsData(undefined, [drivenBy("2026-01-28"), drivenBy("2026-03-24"), drivenBy(undefined)], () => true);
  expect(filter.nan).toBe(1);
});

test("with unmatchedAsNan a value the filter does not offer counts without specification", () => {
  const filter = datetagAsNan(["new_snow", "2026-03-24"]);
  expect(filter.getValue(drivenBy("2026-01-28"))).toBeUndefined();
  expect(filter.getValue(drivenBy("2026-03-24"))).toBe("2026-03-24");
  filter.buildChartsData(undefined, [drivenBy("2026-01-28"), drivenBy("2026-03-24"), drivenBy(undefined)], () => true);
  expect(filter.nan).toBe(2);
  expect(filter.dataset.slice(1).map((row) => [row[0], row[6]])).toEqual([
    ["new_snow", 0],
    ["2026-03-24", 1],
  ]);
});

test("with unmatchedAsNan an array keeps the datetags the filter offers and counts without specification when none", () => {
  const filter = datetagAsNan(["new_snow", "2026-03-24"]);
  const dormant = drivenBy(["2026-01-28", "2025-12-01"]);
  const partly = drivenBy(["2026-01-28", "2026-03-24", "new_snow"]);
  expect(filter.getValue(dormant)).toBeUndefined();
  expect(filter.getValue(partly)).toEqual(["2026-03-24", "new_snow"]);
  expect(filter.getValue(drivenBy([]))).toBeUndefined();
  expect(datetag(["new_snow"]).getValue(dormant)).toEqual(["2026-01-28", "2025-12-01"]);
  filter.buildChartsData(undefined, [dormant, partly, drivenBy(["2026-03-24"])], () => true);
  expect(filter.nan).toBe(1);
  expect(filter.dataset.slice(1).map((row) => [row[0], row[6]])).toEqual([
    ["new_snow", 1],
    ["2026-03-24", 2],
  ]);
  filter.selected = new Set(["nan"]);
  expect(filter.isIncluded("selected", filter.getValue(dormant))).toBe(true);
  expect(filter.isIncluded("selected", filter.getValue(partly))).toBe(false);
  filter.selected = new Set(["2026-03-24"]);
  expect(filter.isIncluded("selected", filter.getValue(dormant))).toBe(false);
  expect(filter.isIncluded("selected", filter.getValue(partly))).toBe(true);
});

test("a fully dormant datetag array classifies as unclassified, a partly dormant one by its offered datetags", () => {
  const classifier = datetagAsNan(["new_snow", "2026-03-24"]);
  const chart = band();
  const observations = [
    { ...drivenBy(["2026-01-28", "2025-12-01"]), band: "low" },
    { ...drivenBy(["2026-01-28", "2026-03-24"]), band: "low" },
  ];
  chart.buildChartsData(classifier, observations, () => true);
  expect(chart.dataset[1].slice(6, 9)).toEqual([1, 0, 1]);
});

test("with unmatchedAsNan the offered values follow every replacement of the values", () => {
  const filter = datetagAsNan(["new_snow"]);
  expect(filter.getValue(drivenBy("2026-03-24"))).toBeUndefined();
  filter.replaceValues([{ value: "2026-03-24", label: "2026-03-24", color: "#000" }]);
  expect(filter.getValue(drivenBy("2026-03-24"))).toBe("2026-03-24");
  expect(filter.getValue(drivenBy("new_snow"))).toBeUndefined();
  const day = new FilterSelectionData<Record<string, unknown>>({
    type: "day",
    label: "Day",
    key: "day",
    chartType: "bar",
    chartRichLabel: "label",
    values: [],
  });
  day.unmatchedAsNan = true;
  expect(day.getValue({ day: "2026-03-02" })).toBeUndefined();
  day.setDateRange(new Date(2026, 2, 1), new Date(2026, 2, 3));
  expect(day.values.map((v) => v.value)).toEqual(["2026-03-01", "2026-03-02", "2026-03-03"]);
  expect(day.getValue({ day: "2026-03-02" })).toBe("2026-03-02");
});

test("unmatchedAsNan leaves values that are not strings alone", () => {
  const punstable = new FilterSelectionData<Record<string, unknown>>({
    type: "Punstable",
    label: "Punstable",
    key: "snowpack.Punstable.value",
    chartType: "bar",
    chartRichLabel: "label",
    values: [{ value: "rather stable", label: "rather stable", color: "#000", numericRange: [0, 0.7] }],
  });
  punstable.unmatchedAsNan = true;
  expect(punstable.getValue(drivenBy("2026-03-24"))).toBe(0.9);
});

test("a driver the filter does not offer stays in a nan selection and in an inverted one", () => {
  const filter = datetagAsNan(["new_snow", "2026-03-24"]);
  const dormant = drivenBy("2026-01-28");
  filter.selected = new Set(["nan"]);
  expect(filter.isIncluded("selected", filter.getValue(dormant))).toBe(true);
  filter.selected = new Set(["2026-03-24"]);
  expect(filter.isIncluded("selected", filter.getValue(dormant))).toBe(false);
  filter.invertFilter("selected");
  expect(filter.isIncluded("selected", filter.getValue(dormant))).toBe(true);
  expect(filter.isIncluded("selected", filter.getValue(drivenBy("2026-03-24")))).toBe(false);
});

test("retainKnown keeps only the offered values and nan of the selection and the highlight", () => {
  const filter = datetag(["new_snow", "2026-03-24"]);
  filter.selected = new Set(["2026-01-28", "nan", "2026-03-24"]);
  filter.highlighted = new Set(["2025-10-03", "new_snow"]);
  filter.retainKnown();
  expect([...filter.selected]).toEqual(["nan", "2026-03-24"]);
  expect([...filter.highlighted]).toEqual(["new_snow"]);
});

test("a selection of values the filter does not offer is emptied and selects everything again", () => {
  const filter = datetagAsNan(["new_snow", "2026-03-24"]);
  filter.selected = new Set(["2026-01-28"]);
  expect(filter.isIncluded("selected", filter.getValue(drivenBy("2026-03-24")))).toBe(false);
  filter.retainKnown();
  expect(filter.selected.size).toBe(0);
  expect(filter.isIncluded("selected", filter.getValue(drivenBy("2026-03-24")))).toBe(true);
  expect(filter.isIncluded("selected", filter.getValue(drivenBy("2026-01-28")))).toBe(true);
});

const letters = ["a", "b", "c", "d"];
/** A filter over four plain values. */
const lettered = () =>
  new FilterSelectionData<Record<string, unknown>>({
    type: "letter",
    label: "Letter",
    key: "letter",
    chartType: "bar",
    chartRichLabel: "label",
    values: letters.map((value) => ({ value, label: value, color: "#000" })),
  });

test("setFilterValues puts exactly the values in the subset and empties it on a repeat", () => {
  const filter = lettered();
  filter.selected = new Set(["a", "c"]);
  filter.setFilterValues("selected", ["a", "b"]);
  expect(filter.selected).toEqual(new Set(["a", "b"]));
  filter.setFilterValues("selected", ["b", "a"]);
  expect(filter.selected.size).toBe(0);
  filter.selected = new Set(["a"]);
  filter.setFilterValues("selected", ["a", "b"]);
  expect(filter.selected).toEqual(new Set(["a", "b"]));
  filter.setFilterValues("highlighted", ["c"]);
  expect(filter.highlighted).toEqual(new Set(["c"]));
  expect(filter.selected).toEqual(new Set(["a", "b"]));
});

test("toggleFilterValues adds the values unless the subset holds them all, then removes them all", () => {
  const filter = lettered();
  filter.toggleFilterValues("highlighted", ["a", "b"]);
  expect(filter.highlighted).toEqual(new Set(["a", "b"]));
  filter.toggleFilterValues("highlighted", ["a", "b"]);
  expect(filter.highlighted.size).toBe(0);
  filter.highlighted = new Set(["a", "c"]);
  filter.toggleFilterValues("highlighted", ["a", "b"]);
  expect(filter.highlighted).toEqual(new Set(["a", "b", "c"]));
  filter.toggleFilterValues("highlighted", ["a", "b"]);
  expect(filter.highlighted).toEqual(new Set(["c"]));
});

/** The click rules of a chart row as they stood before clickFilterValues took them over. */
function rowClick(
  filter: FilterSelectionData<Record<string, unknown>>,
  event: ClickModifiers,
  value: string,
  platform: string,
) {
  const subset = event.altKey ? "highlighted" : "selected";
  const selectedData = filter[subset];
  if (event.shiftKey) {
    if (selectedData.has(value)) selectedData.delete(value);
    else selectedData.add(value);
  } else if (selectedData.has(value) && selectedData.size === 1) {
    selectedData.clear();
  } else {
    selectedData.clear();
    selectedData.add(value);
  }
  if (/Mac|iPod|iPhone|iPad/.test(platform) ? event.metaKey : event.ctrlKey) {
    filter.invertFilter(subset);
  }
}

test("a click on one value keeps the row rules for every modifier, start state and platform", () => {
  const values = [...letters, "nan"];
  const subsets = values.reduce<string[][]>((all, value) => all.flatMap((s) => [s, [...s, value]]), [[]]);
  const sorted = (set: Set<string>) => [...set].sort();
  const mismatches: string[] = [];
  let cases = 0;
  for (const platform of ["Linux x86_64", "MacIntel", "iPhone"]) {
    for (let modifiers = 0; modifiers < 16; modifiers++) {
      const event = {
        altKey: !!(modifiers & 1),
        shiftKey: !!(modifiers & 2),
        ctrlKey: !!(modifiers & 4),
        metaKey: !!(modifiers & 8),
      };
      for (const selected of subsets) {
        for (const highlighted of [[], ["b"], ["a", "nan"]]) {
          for (const value of values) {
            const before = lettered();
            const after = lettered();
            for (const filter of [before, after]) {
              filter.selected = new Set(selected);
              filter.highlighted = new Set(highlighted);
            }
            rowClick(before, event, value, platform);
            clickFilterValues(after, event, [value], platform);
            const expected = [sorted(before.selected), sorted(before.highlighted)];
            const actual = [sorted(after.selected), sorted(after.highlighted)];
            if (JSON.stringify(actual) !== JSON.stringify(expected)) {
              mismatches.push(JSON.stringify({ platform, event, selected, highlighted, value }));
            }
            cases++;
          }
        }
      }
    }
  }
  expect(mismatches).toEqual([]);
  expect(cases).toBe(3 * 16 * 32 * 3 * 5);
});

test("a click on several values selects them, adds them with Shift, highlights them with Alt and inverts with Ctrl", () => {
  const filter = lettered();
  const plain = { altKey: false, shiftKey: false, ctrlKey: false, metaKey: false };
  clickFilterValues(filter, plain, ["a", "b"], "Linux x86_64");
  expect(filter.selected).toEqual(new Set(["a", "b"]));
  clickFilterValues(filter, { ...plain, shiftKey: true }, ["c", "d"], "Linux x86_64");
  expect(filter.selected).toEqual(new Set(["a", "b", "c", "d"]));
  clickFilterValues(filter, plain, ["a", "b"], "Linux x86_64");
  expect(filter.selected).toEqual(new Set(["a", "b"]));
  clickFilterValues(filter, plain, ["a", "b"], "Linux x86_64");
  expect(filter.selected.size).toBe(0);
  clickFilterValues(filter, { ...plain, altKey: true }, ["c", "d"], "Linux x86_64");
  expect(filter.highlighted).toEqual(new Set(["c", "d"]));
  expect(filter.selected.size).toBe(0);
  clickFilterValues(filter, { ...plain, ctrlKey: true }, ["a", "b"], "Linux x86_64");
  expect(filter.selected).toEqual(new Set(["c", "d", "nan"]));
  clickFilterValues(filter, { ...plain, ctrlKey: true }, ["a", "b"], "MacIntel");
  expect(filter.selected).toEqual(new Set(["a", "b"]));
  clickFilterValues(filter, { ...plain, metaKey: true }, ["c"], "MacIntel");
  expect(filter.selected).toEqual(new Set(["a", "b", "d", "nan"]));
});
