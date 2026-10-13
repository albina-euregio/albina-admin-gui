import { expect, test } from "@playwright/test";

import { FilterSelectionData } from "../src/app/observations/filter-selection-data";

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
/** An observation whose Punstable layer is driven by the given datetag. */
const drivenBy = (tag: string | undefined) => ({
  $stabilityIndex: "Punstable",
  snowpack: { Punstable: { instabilityDrivenBy: tag, value: 0.9 } },
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
