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
