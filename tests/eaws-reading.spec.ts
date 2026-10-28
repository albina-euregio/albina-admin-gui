import { expect, test } from "@playwright/test";

import { Frequency, SnowpackStability } from "../src/app/enums/enums";
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
  SIZE_PERCENTILE,
  sizeClass,
  stabilityClasses,
  UNSTABLE_CLASSES,
} from "../src/app/modelling/eaws-reading";
import golden from "./data/eaws-read-matrix.json";

const dangerLevel = DangerLevelSchema.parse({ frequencyBounds: { few: 0, some: 0.04, many: 0.2 } });
const NIVIX_WORDS: Readonly<Record<string, string>> = {
  [SnowpackStability.very_poor]: "very poor",
  [Frequency.few]: "a few",
};
/** A stability class or frequency in the words of nivix's golden vectors. */
const nivixWord = (word: string) => NIVIX_WORDS[word] ?? word;
const punstable = [1, 0.85, 0.78, 0.7, 0];
const sk38 = [0, 0.5, 0.95, 1.05, 1.5];
const lwc = [100, 3, 1, 0];

test("the matrix holds nivix's EAWS 2025 table in all 45 cells, primary level first", () => {
  let cells = 0;
  for (const stability of UNSTABLE_CLASSES) {
    for (const frequency of FREQUENCIES) {
      for (const size of MATRIX_SIZES) {
        expect(EAWS_MATRIX[stability][frequency][size], `${stability} ${frequency} ${size}`).toEqual(
          golden.matrix[nivixWord(stability)][nivixWord(frequency)][size],
        );
        cells++;
      }
    }
  }
  expect(cells).toBe(45);
  expect(EAWS_MATRIX[SnowpackStability.poor][Frequency.many][3][0]).toBe(4);
});

test("readCounts reproduces nivix read_matrix on its 2016 golden vectors, a good reading without its size", () => {
  expect(golden.vectors).toHaveLength(2016);
  expect(golden.bounds).toEqual(dangerLevel.frequencyBounds);
  for (const { counts, size, out } of golden.vectors) {
    const reading = readCounts([counts.vp, counts.poor, counts.fair, counts.good], () => size, dangerLevel);
    const vector = JSON.stringify({ counts, size });
    expect(nivixWord(reading.stability), vector).toBe(out.stability);
    expect(nivixWord(reading.frequency), vector).toBe(out.frequency);
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

test("the frequency follows Techel's bounds: none at 0, few above it, some from 4 %, many above 20 %", () => {
  expect(frequencyClass(0, 1000, dangerLevel)).toBe(Frequency.none);
  expect(frequencyClass(1, 1e9, dangerLevel)).toBe(Frequency.few);
  expect(frequencyClass(39, 1000, dangerLevel)).toBe(Frequency.few);
  expect(frequencyClass(40, 1000, dangerLevel)).toBe(Frequency.some);
  expect(frequencyClass(200, 1000, dangerLevel)).toBe(Frequency.some);
  expect(frequencyClass(2001, 10000, dangerLevel)).toBe(Frequency.many);
  expect(frequencyClass(0, 0, dangerLevel)).toBe(Frequency.none);
});

test("a class is none up to few, few above it, some from some, many above many", () => {
  const preset = DangerLevelSchema.parse({ frequencyBounds: { few: 0.05, some: 0.15, many: 0.4 } });
  expect(frequencyClass(50, 1000, preset)).toBe(Frequency.none);
  expect(frequencyClass(51, 1000, preset)).toBe(Frequency.few);
  expect(frequencyClass(149, 1000, preset)).toBe(Frequency.few);
  expect(frequencyClass(150, 1000, preset)).toBe(Frequency.some);
  expect(frequencyClass(400, 1000, preset)).toBe(Frequency.some);
  expect(frequencyClass(401, 1000, preset)).toBe(Frequency.many);
  expect(frequencyClass(0, 0, preset)).toBe(Frequency.none);
});

test("a single slope counts once its share exceeds few, and a band with one read slope reads a level", () => {
  expect(frequencyClass(1, 100, dangerLevel)).toBe(Frequency.few);
  expect(readCounts([1, 0, 0, 99], () => 3, dangerLevel)).toMatchObject({
    stability: SnowpackStability.very_poor,
    levels: [3],
  });
  expect(readCounts([5, 0, 0, 14], () => 3, dangerLevel)).toMatchObject({
    total: 19,
    frequency: Frequency.many,
    levels: [4],
  });
  expect(readCounts([1, 0, 0, 0], () => 3, dangerLevel)).toMatchObject({
    total: 1,
    frequency: Frequency.many,
    levels: [4],
  });
  expect(readCounts([0, 0, 0, 1], () => 3, dangerLevel)).toMatchObject({
    total: 1,
    stability: SnowpackStability.good,
    levels: [1],
  });
  expect(readCounts([0, 0, 0, 0], () => 3, dangerLevel)).toMatchObject({ total: 0, reason: "nothing" });
  expect(readCounts([0, 0, 0, 0], () => 3, dangerLevel).levels).toBeUndefined();
});

test("the walk passes very poor and poor to fair, and good throughout reads 1 Low without asking for a size", () => {
  const fair = readCounts([0, 0, 50, 950], () => 2.4, dangerLevel);
  expect(fair).toMatchObject({
    decisive: 2,
    stability: SnowpackStability.fair,
    frequency: Frequency.some,
    sizeClass: 2,
    levels: [2],
  });
  const asked: number[] = [];
  const good = readCounts(
    [0, 0, 0, 1000],
    (decisive) => {
      asked.push(decisive);
      return 4;
    },
    dangerLevel,
  );
  expect(good).toMatchObject({
    decisive: 3,
    stability: SnowpackStability.good,
    frequency: Frequency.none,
    levels: [1],
  });
  expect(good.size).toBeUndefined();
  expect(asked).toEqual([]);
});

test("the size is asked of the decisive class only; a decisive class without sizes reads no level", () => {
  const points = [
    ...Array.from({ length: 10 }, () => ({ value: 0.8 })),
    ...Array.from({ length: 90 }, () => ({ value: 0.2, size: 5 })),
  ];
  expect(readBand(points, punstable, dangerLevel)).toMatchObject({
    decisive: 1,
    stability: SnowpackStability.poor,
    frequency: Frequency.some,
    reason: "no size",
  });
  expect(readBand(points, punstable, dangerLevel).levels).toBeUndefined();
  const asked: number[] = [];
  readCounts(
    [0, 5, 0, 95],
    (decisive) => {
      asked.push(decisive);
      return undefined;
    },
    dangerLevel,
  );
  expect(asked).toEqual([1]);
  const sized = [...points.slice(0, 9), { value: 0.79, size: 3.6 }, ...points.slice(10)];
  expect(readBand(sized, punstable, dangerLevel)).toMatchObject({ size: 3.6, sizeClass: 4, levels: [4, 3] });
});

test("reckonedSize takes the size at floor(p/100 (n-1)) of the finite sizes, numpy's method lower", () => {
  expect(reckonedSize([10, 9, 8, 7, 6, 5, 4, 3, 2, 1], 90)).toBe(9);
  expect(reckonedSize([10, 9, 8, 7, 6, 5, 4, 3, 2, 1], 50)).toBe(5);
  expect(reckonedSize([2, 1], 90)).toBe(1);
  expect(reckonedSize([1, 2, 3], 100)).toBe(3);
  expect(reckonedSize([4.35], 90)).toBe(4.35);
  expect(reckonedSize([NaN, Infinity, 2, 1], 90)).toBe(1);
  expect(reckonedSize([], 90)).toBeUndefined();
});

test("a configured sizePercentile of 50 reckons the decisive class's median size instead of its p90", () => {
  const points = [
    ...[1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5].map((size) => ({ value: 0.9, size })),
    ...Array.from({ length: 90 }, () => ({ value: 0.5, size: 1 })),
  ];
  expect(dangerLevel.sizePercentile).toBe(SIZE_PERCENTILE);
  const p90 = readBand(points, punstable, dangerLevel);
  expect(p90).toMatchObject({
    stability: SnowpackStability.very_poor,
    frequency: Frequency.some,
    size: 5,
    sizeClass: 5,
    levels: [5, 4],
  });
  const median = readBand(points, punstable, DangerLevelSchema.parse({ ...dangerLevel, sizePercentile: 50 }));
  expect(median).toMatchObject({
    stability: SnowpackStability.very_poor,
    frequency: Frequency.some,
    size: 3,
    sizeClass: 3,
    levels: [3, 4],
  });
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
  const reading = readBand(points, sk38, dangerLevel);
  expect(reading.counts).toEqual([0, 30, 1, 0]);
  expect(reading).toMatchObject({
    total: 31,
    stability: SnowpackStability.poor,
    frequency: Frequency.many,
    size: 2,
    levels: [3],
  });
  expect(readBand([{ value: 1 }, { value: 0.85 }], punstable, dangerLevel).counts).toEqual([2, 0, 0, 0]);
  expect(readBand([{ value: 0.9, size: 3 }], [], dangerLevel)).toMatchObject({ reason: "classes", total: 0 });
  expect(readBand([{ value: 0.9, size: 3 }], [1, 0], dangerLevel).reason).toBe("classes");
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
  const readings = readSteps(count, size, dangerLevel);
  expect(readings).toHaveLength(5);
  expect(readings[0]).toMatchObject({
    stability: SnowpackStability.very_poor,
    frequency: Frequency.many,
    size: 3.6,
    sizeClass: 4,
    levels: [5, 4],
  });
  expect(readings[1]).toMatchObject({ total: 0, reason: "nothing" });
  expect(readings[2]).toMatchObject({
    stability: SnowpackStability.very_poor,
    frequency: Frequency.few,
    size: 2.4,
    levels: [2],
  });
  expect(readings[3]).toMatchObject({
    decisive: 0,
    stability: SnowpackStability.very_poor,
    frequency: Frequency.some,
    reason: "no size",
  });
  expect(readings[3].levels).toBeUndefined();
  expect(readings[4]).toMatchObject({
    total: 3,
    stability: SnowpackStability.very_poor,
    frequency: Frequency.many,
    size: 5,
    levels: [5],
  });
  readings.forEach((reading, t) =>
    expect(reading).toEqual(
      readCounts(
        count.map((counts) => counts[t]),
        (decisive) => size[decisive][t] ?? undefined,
        dangerLevel,
      ),
    ),
  );
  expect(readSteps([], [], dangerLevel)).toEqual([]);
});

test("an index's classes map onto the EAWS stability classes by position from its most unstable end", () => {
  expect(stabilityClasses(4)).toEqual(["very_poor", "poor", "fair", "good"]);
  expect(stabilityClasses(3)).toEqual(["very_poor", "poor", "good"]);
  expect(stabilityClasses(5)).toBeUndefined();
  expect(stabilityClasses(1)).toBeUndefined();
  expect(readCounts([0, 50, 950], () => 2, dangerLevel)).toMatchObject({
    stability: SnowpackStability.poor,
    levels: [2, 3],
  });
  expect(readCounts([0, 0, 1000], () => 2, dangerLevel)).toMatchObject({
    stability: SnowpackStability.good,
    levels: [1],
  });
  expect(readCounts([1, 1, 1, 1, 96], () => 2, dangerLevel)).toMatchObject({ reason: "classes" });
});
