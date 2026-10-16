import { expect, test } from "@playwright/test";

import {
  alignToClasses,
  classBounds,
  classFraction,
  classSlotsFor,
  fallbackStabilityIndex,
  fitsClassSlots,
  unstableAtMinimum,
  valueAtClassFraction,
} from "../src/app/modelling/index-classes";

const unstableHigh = {
  chartAxisRange: [0, 1],
  values: [
    { numericRange: [0.8, 1] },
    { numericRange: [0.77, 0.8] },
    { numericRange: [0.7, 0.77] },
    { numericRange: [0, 0.7] },
  ],
};
const unstableLow = {
  chartAxisRange: [0, 1.5],
  values: [
    { numericRange: [0, 0.5] },
    { numericRange: [0.5, 0.95] },
    { numericRange: [0.95, 1.05] },
    { numericRange: [1.05, 100] },
  ],
};
const withoutAxisRange = { values: [{ numericRange: [3, 100] }, { numericRange: [1, 3] }, { numericRange: [0, 1] }] };

test("bounds run from the most unstable end to the most stable one", () => {
  expect(classBounds(unstableHigh)).toEqual([1, 0.8, 0.77, 0.7, 0]);
  expect(classBounds(unstableLow)).toEqual([0, 0.5, 0.95, 1.05, 1.5]);
  expect(classBounds(withoutAxisRange)).toEqual([100, 3, 1, 0]);
});

test("classes that do not chain have no bounds", () => {
  expect(classBounds({ values: [{ numericRange: [0.8, 1] }, { numericRange: [0, 0.7] }] })).toBeUndefined();
  expect(classBounds({ chartAxisRange: [0, 0.75], values: unstableHigh.values })).toBeUndefined();
  expect(classBounds({ values: [{ numericRange: [0, 1] }] })).toBeUndefined();
});

test("each boundary maps onto the matching boundary, across a direction flip", () => {
  const low = classBounds(unstableLow);
  const high = classBounds(unstableHigh);
  low.forEach((bound, i) => {
    expect(alignToClasses(bound, low, high)).toBeCloseTo(high[i], 12);
    expect(alignToClasses(high[i], high, low)).toBeCloseTo(bound, 12);
  });
});

test("a value keeps its position inside its class", () => {
  const low = classBounds(unstableLow);
  const high = classBounds(unstableHigh);
  expect(classFraction(high, 0.785)).toBeCloseTo(0.375, 12);
  expect(alignToClasses(0.785, high, low)).toBeCloseTo(0.725, 12);
  expect(alignToClasses(1.275, low, high)).toBeCloseTo(0.35, 12);
});

test("values beyond either end clamp to that end", () => {
  const low = classBounds(unstableLow);
  const high = classBounds(unstableHigh);
  expect(classFraction(low, -1)).toBe(0);
  expect(classFraction(low, 3.7)).toBe(1);
  expect(classFraction(high, 1.2)).toBe(0);
  expect(alignToClasses(3.7, low, high)).toBe(0);
  expect(alignToClasses(-0.5, high, low)).toBe(1.5);
  expect(valueAtClassFraction(high, 2)).toBe(0);
  expect(valueAtClassFraction(high, -1)).toBe(1);
});

test("an index most unstable at its minimum runs downwards", () => {
  expect(unstableAtMinimum(unstableLow)).toBe(true);
  expect(unstableAtMinimum(unstableHigh)).toBe(false);
  expect(unstableAtMinimum(withoutAxisRange)).toBe(false);
});

const elevation = { type: "elevation" };
const sk38 = { type: "sk38_ccl", stabilityIndex: "dry" };
const punstable = { type: "Punstable", stabilityIndex: "dry" };
const lwc = { type: "lwc", stabilityIndex: "wet" };
const filters = [elevation, sk38, punstable, lwc];

test("the default classifier fills the placeholder when it is a stability index", () => {
  expect(fallbackStabilityIndex(filters, "Punstable")).toBe(punstable);
  expect(fallbackStabilityIndex(filters, "lwc")).toBe(lwc);
});

test("otherwise the first stability index in config order fills it", () => {
  expect(fallbackStabilityIndex(filters, "elevation")).toBe(sk38);
  expect(fallbackStabilityIndex(filters, undefined)).toBe(sk38);
  expect(fallbackStabilityIndex(filters, "unknown")).toBe(sk38);
});

test("without any stability index the placeholder stays empty", () => {
  expect(fallbackStabilityIndex([elevation, { type: "hs" }], "elevation")).toBeUndefined();
  expect(fallbackStabilityIndex([], undefined)).toBeUndefined();
});

test("the class slots fit the longest filter without a url, never fewer than ten", () => {
  const values = (n: number) => Array.from({ length: n }, (_, i) => i);
  const datetags = { url: "api/locations", values: values(72) };
  expect(classSlotsFor([{ values: values(5) }, { values: values(11) }, datetags])).toBe(11);
  expect(classSlotsFor([{ values: values(5) }, { url: "api/locations", values: values(8) }])).toBe(10);
  expect(classSlotsFor([datetags])).toBe(10);
  expect(classSlotsFor([])).toBe(10);
});

test("a filter fits the class slots while it has no more values than slots, with a url or without", () => {
  const values = (n: number) => Array.from({ length: n }, (_, i) => i);
  expect(fitsClassSlots({ values: values(11) }, 11)).toBe(true);
  expect(fitsClassSlots({ values: values(12) }, 11)).toBe(false);
  expect(fitsClassSlots({ url: "api/locations", values: values(10) }, 10)).toBe(true);
  expect(fitsClassSlots({ url: "api/locations", values: values(72) }, 11)).toBe(false);
});
