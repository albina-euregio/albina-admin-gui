import { expect, test } from "@playwright/test";

import { DangerLevelSchema } from "../src/app/modelling/awsome.config";
import {
  classIndex,
  EAWS_MATRIX,
  FREQUENCIES,
  frequencyClass,
  MATRIX_SIZES,
  readBand,
  readCounts,
  readSteps,
  reckonedSize,
  sizeClass,
  stabilityClasses,
  UNSTABLE_CLASSES,
} from "../src/app/modelling/eaws-reading";
import golden from "./data/eaws-read-matrix.json";

const calibration = DangerLevelSchema.parse({ frequencyBounds: { few: 0, some: 0.04, many: 0.2 } });
const nivix = { ...calibration, minFeatures: 1 };
const punstable = [1, 0.85, 0.78, 0.7, 0];
const sk38 = [0, 0.5, 0.95, 1.05, 1.5];
const lwc = [100, 3, 1, 0];

test("the matrix holds nivix's EAWS 2025 table in all 45 cells, primary level first", () => {
  let cells = 0;
  for (const stability of UNSTABLE_CLASSES) {
    for (const frequency of FREQUENCIES) {
      for (const size of MATRIX_SIZES) {
        expect(EAWS_MATRIX[stability][frequency][size], `${stability} ${frequency} ${size}`).toEqual(
          golden.matrix[stability][frequency][size],
        );
        cells++;
      }
    }
  }
  expect(cells).toBe(45);
  expect(EAWS_MATRIX.poor.many[3][0]).toBe(4);
});

test("readCounts reproduces nivix read_matrix on its 2016 golden vectors, a good reading without its size", () => {
  expect(golden.vectors).toHaveLength(2016);
  expect(golden.bounds).toEqual(calibration.frequencyBounds);
  for (const { counts, size, out } of golden.vectors) {
    const reading = readCounts([counts.vp, counts.poor, counts.fair, counts.good], () => size, nivix);
    const vector = JSON.stringify({ counts, size });
    expect(reading.stability, vector).toBe(out.stability);
    expect(reading.frequency, vector).toBe(out.frequency);
    expect(reading.levels, vector).toEqual(out.levels);
    expect(reading.levels[0], vector).toBe(out.level);
    expect(reading.sizeClass, vector).toBe(out.stability === "good" ? undefined : out.size);
  }
});

test("classIndex puts a value in the map's [lo, hi) class, the outer classes open", () => {
  const punstableClasses = [0.85, 0.8499, 0.78, 0.7, 1.0, 0.69, 0].map((value) => classIndex(punstable, value));
  expect(punstableClasses).toEqual([0, 1, 1, 2, 0, 3, 3]);
  const sk38Classes = [0.5, 0.95, 1.05, 0.49, 0, 5].map((value) => classIndex(sk38, value));
  expect(sk38Classes).toEqual([1, 2, 3, 0, 0, 3]);
  expect([3, 2.99, 1, 0.5, 100].map((value) => classIndex(lwc, value))).toEqual([0, 1, 1, 2, 0]);
});

test("the frequency follows Techel's bounds: none at 0, a few above it, some from 4 %, many above 20 %", () => {
  expect(frequencyClass(0, 1000, calibration)).toBe("none");
  expect(frequencyClass(1, 1e9, calibration)).toBe("a few");
  expect(frequencyClass(39, 1000, calibration)).toBe("a few");
  expect(frequencyClass(40, 1000, calibration)).toBe("some");
  expect(frequencyClass(200, 1000, calibration)).toBe("some");
  expect(frequencyClass(2001, 10000, calibration)).toBe("many");
  expect(frequencyClass(0, 0, calibration)).toBe("none");
});

test("a class is none up to few, a few above it, some from some, many above many", () => {
  const preset = DangerLevelSchema.parse({ frequencyBounds: { few: 0.05, some: 0.15, many: 0.4 } });
  expect(frequencyClass(50, 1000, preset)).toBe("none");
  expect(frequencyClass(51, 1000, preset)).toBe("a few");
  expect(frequencyClass(149, 1000, preset)).toBe("a few");
  expect(frequencyClass(150, 1000, preset)).toBe("some");
  expect(frequencyClass(400, 1000, preset)).toBe("some");
  expect(frequencyClass(401, 1000, preset)).toBe("many");
  expect(frequencyClass(0, 0, preset)).toBe("none");
});

test("minCount makes a rare class none, minFeatures refuses a band with too few slopes", () => {
  expect(frequencyClass(2, 100, { ...calibration, minCount: 3 })).toBe("none");
  expect(frequencyClass(3, 100, { ...calibration, minCount: 3 })).toBe("a few");
  expect(readCounts([1, 0, 0, 99], () => 3, { ...calibration, minCount: 2 }).stability).toBe("good");
  expect(readCounts([5, 0, 0, 14], () => 3, calibration)).toMatchObject({ total: 19, reason: "too few" });
  expect(readCounts([5, 0, 0, 14], () => 3, calibration).levels).toBeUndefined();
  expect(readCounts([5, 0, 0, 14], () => 3, nivix).levels).toEqual([4]);
  expect(readCounts([0, 0, 0, 0], () => 3, nivix)).toMatchObject({ total: 0, reason: "nothing" });
});

test("the walk passes very poor and poor to fair, and good throughout reads 1 Low without asking for a size", () => {
  const fair = readCounts([0, 0, 50, 950], () => 2.4, calibration);
  expect(fair).toMatchObject({ decisive: 2, stability: "fair", frequency: "some", sizeClass: 2, levels: [2] });
  const asked: number[] = [];
  const good = readCounts(
    [0, 0, 0, 1000],
    (decisive) => {
      asked.push(decisive);
      return 4;
    },
    calibration,
  );
  expect(good).toMatchObject({ decisive: 3, stability: "good", frequency: "none", levels: [1] });
  expect(good.size).toBeUndefined();
  expect(asked).toEqual([]);
});

test("the size is asked of the decisive class only; a decisive class without sizes reads no level", () => {
  const points = [
    ...Array.from({ length: 10 }, () => ({ value: 0.8 })),
    ...Array.from({ length: 90 }, () => ({ value: 0.2, size: 5 })),
  ];
  expect(readBand(points, punstable, calibration)).toMatchObject({
    decisive: 1,
    stability: "poor",
    frequency: "some",
    reason: "no size",
  });
  expect(readBand(points, punstable, calibration).levels).toBeUndefined();
  const asked: number[] = [];
  readCounts(
    [0, 5, 0, 95],
    (decisive) => {
      asked.push(decisive);
      return undefined;
    },
    calibration,
  );
  expect(asked).toEqual([1]);
  const sized = [...points.slice(0, 9), { value: 0.79, size: 3.6 }, ...points.slice(10)];
  expect(readBand(sized, punstable, calibration)).toMatchObject({ size: 3.6, sizeClass: 4, levels: [4, 3] });
});

test("reckonedSize takes the size at floor(p/100 (n-1)) of the finite sizes, numpy's method lower", () => {
  expect(reckonedSize([10, 9, 8, 7, 6, 5, 4, 3, 2, 1], 90)).toBe(9);
  expect(reckonedSize([2, 1], 90)).toBe(1);
  expect(reckonedSize([1, 2, 3], 100)).toBe(3);
  expect(reckonedSize([4.35], 90)).toBe(4.35);
  expect(reckonedSize([NaN, Infinity, 2, 1], 90)).toBe(1);
  expect(reckonedSize([], 90)).toBeUndefined();
});

test("a size rounds half up into the matrix columns 1 to 5", () => {
  expect([2.5, 2.49, 0.2, -1, 4.5, 7].map(sizeClass)).toEqual([3, 2, 1, 1, 5, 5]);
});

test("readBand classes the points with the map's classes and drops values that are not finite", () => {
  const points = [
    ...Array.from({ length: 30 }, () => ({ value: 0.5, size: 2 })),
    { value: 0.95, size: 4 },
    { value: NaN, size: 5 },
  ];
  const reading = readBand(points, sk38, calibration);
  expect(reading.counts).toEqual([0, 30, 1, 0]);
  expect(reading).toMatchObject({ total: 31, stability: "poor", frequency: "many", size: 2, levels: [3] });
  expect(readBand([{ value: 1 }, { value: 0.85 }], punstable, nivix).counts).toEqual([2, 0, 0, 0]);
  expect(readBand([{ value: 0.9, size: 3 }], [], nivix)).toMatchObject({ reason: "classes", total: 0 });
  expect(readBand([{ value: 0.9, size: 3 }], [1, 0], nivix).reason).toBe("classes");
});

test("readSteps reads each step's class counts with the size the API reckoned for the decisive class", () => {
  const count = [
    [30, 0, 1, 1, 2],
    [0, 0, 0, 3, 0],
    [0, 0, 0, 0, 0],
    [70, 0, 99, 16, 1],
  ];
  const size = [
    [3.6, null, 2.4, null, 5],
    [null, null, null, 2.5, null],
    [null, null, null, null, null],
    [1, null, 1, 5, 5],
  ];
  const readings = readSteps(count, size, calibration);
  expect(readings).toHaveLength(5);
  expect(readings[0]).toMatchObject({
    stability: "very poor",
    frequency: "many",
    size: 3.6,
    sizeClass: 4,
    levels: [5, 4],
  });
  expect(readings[1]).toMatchObject({ total: 0, reason: "nothing" });
  expect(readings[2]).toMatchObject({ stability: "very poor", frequency: "a few", size: 2.4, levels: [2] });
  expect(readings[3]).toMatchObject({ decisive: 0, stability: "very poor", frequency: "some", reason: "no size" });
  expect(readings[3].levels).toBeUndefined();
  expect(readings[4]).toMatchObject({ total: 3, reason: "too few" });
  readings.forEach((reading, t) =>
    expect(reading).toEqual(
      readCounts(
        count.map((counts) => counts[t]),
        (decisive) => size[decisive][t] ?? undefined,
        calibration,
      ),
    ),
  );
  expect(readSteps([], [], calibration)).toEqual([]);
});

test("an index's classes map onto the EAWS stability classes by position from its most unstable end", () => {
  expect(stabilityClasses(4)).toEqual(["very poor", "poor", "fair", "good"]);
  expect(stabilityClasses(3)).toEqual(["very poor", "poor", "good"]);
  expect(stabilityClasses(5)).toBeUndefined();
  expect(stabilityClasses(1)).toBeUndefined();
  expect(readCounts([0, 50, 950], () => 2, calibration)).toMatchObject({ stability: "poor", levels: [2, 3] });
  expect(readCounts([0, 0, 1000], () => 2, calibration)).toMatchObject({ stability: "good", levels: [1] });
  expect(readCounts([1, 1, 1, 1, 96], () => 2, calibration)).toMatchObject({ reason: "classes" });
});
