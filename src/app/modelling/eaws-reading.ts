import { clamp, sum } from "es-toolkit";

import { Frequency, SnowpackStability } from "../enums/enums";
import type { DangerLevelConfig } from "./awsome.config";
import { bandOf } from "./elevation-cut";

export type UnstableClass = Exclude<SnowpackStability, SnowpackStability.good>;
export type MatrixFrequency = Exclude<Frequency, Frequency.none>;
export type NoReading = "classes" | "nothing" | "no size";

export interface FrequencyBounds {
  readonly few: number;
  readonly some: number;
  readonly many: number;
}

export const DEFAULT_FREQUENCY_BOUNDS: FrequencyBounds = { few: 0.05, some: 0.15, many: 0.4 };
export const SIZE_PERCENTILE = 90;

export interface BandPoint {
  readonly value: number;
  readonly size?: number;
}

export interface Reading {
  readonly total: number;
  readonly counts: readonly number[];
  readonly classes: readonly SnowpackStability[];
  readonly decisive?: number;
  readonly stability?: SnowpackStability;
  readonly frequency?: Frequency;
  readonly size?: number;
  readonly sizeClass?: number;
  readonly levels?: readonly number[];
  readonly reason?: NoReading;
}

export const UNSTABLE_CLASSES: readonly UnstableClass[] = [
  SnowpackStability.very_poor,
  SnowpackStability.poor,
  SnowpackStability.fair,
];
export const FREQUENCIES: readonly MatrixFrequency[] = [Frequency.many, Frequency.some, Frequency.few];
export const MATRIX_SIZES: readonly number[] = [5, 4, 3, 2, 1];

export const EAWS_MATRIX: Readonly<
  Record<UnstableClass, Readonly<Record<MatrixFrequency, Readonly<Record<number, readonly number[]>>>>>
> = {
  [SnowpackStability.very_poor]: {
    [Frequency.many]: { 5: [5], 4: [5, 4], 3: [4], 2: [3, 4], 1: [2, 3] },
    [Frequency.some]: { 5: [5, 4], 4: [4], 3: [3, 4], 2: [3], 1: [2] },
    [Frequency.few]: { 5: [4], 4: [3, 4], 3: [3], 2: [2], 1: [1, 2] },
  },
  [SnowpackStability.poor]: {
    [Frequency.many]: { 5: [5, 4], 4: [4], 3: [4, 3], 2: [3], 1: [2] },
    [Frequency.some]: { 5: [4], 4: [4, 3], 3: [3], 2: [2, 3], 1: [2] },
    [Frequency.few]: { 5: [3, 4], 4: [3], 3: [2, 3], 2: [2], 1: [1] },
  },
  [SnowpackStability.fair]: {
    [Frequency.many]: { 5: [4, 3], 4: [3, 4], 3: [3, 2], 2: [2], 1: [1, 2] },
    [Frequency.some]: { 5: [3, 4], 4: [3], 3: [2, 3], 2: [2], 1: [1, 2] },
    [Frequency.few]: { 5: [3], 4: [2, 3], 3: [2, 1], 2: [1, 2], 1: [1] },
  },
};

/** The EAWS stability class of each class of an index, from its most unstable end, the last one good; 2 to 4 classes. */
export function stabilityClasses(classCount: number): SnowpackStability[] | undefined {
  return classCount >= 2 && classCount <= 4
    ? [...UNSTABLE_CLASSES.slice(0, classCount - 1), SnowpackStability.good]
    : undefined;
}

/** The class of a finite value among bounds from the most unstable end: the map's [lo, hi) classes, the outer ones open. */
export function classIndex(bounds: readonly number[], value: number): number {
  const inner = bounds.slice(1, -1);
  return bounds[0] > bounds.at(-1) ? inner.filter((bound) => value < bound).length : bandOf(value, inner);
}

/** The EAWS frequency of a class holding count of total slopes. */
export function frequencyClass(
  count: number,
  total: number,
  { frequencyBounds }: Pick<DangerLevelConfig, "frequencyBounds">,
): Frequency {
  const share = count / total;
  if (!(share > frequencyBounds.few)) return Frequency.none;
  if (share > frequencyBounds.many) return Frequency.many;
  return share >= frequencyBounds.some ? Frequency.some : Frequency.few;
}

/** The size at a percentile of the finite sizes by numpy's method 'lower', floor(p/100 (n-1)); undefined without one. */
export function reckonedSize(sizes: readonly number[], percentile: number): number | undefined {
  const sorted = sizes.filter(Number.isFinite).sort((a, b) => a - b);
  if (!sorted.length) return undefined;
  return sorted[Math.min(sorted.length - 1, Math.floor((percentile / 100) * (sorted.length - 1)))];
}

/** The matrix column of a size: rounded half up into 1 to 5. */
export function sizeClass(size: number): number {
  return clamp(Math.round(size), 1, 5);
}

/** The matrix reading of class counts from the most unstable class; the size is asked of the decisive class only. */
export function readCounts(
  counts: readonly number[],
  sizeOf: (decisive: number) => number | undefined,
  dangerLevel: DangerLevelConfig,
): Reading {
  const classes = stabilityClasses(counts.length);
  const total = sum(counts);
  const base = { total, counts, classes: classes ?? [] };
  if (!classes) return { ...base, reason: "classes" };
  if (!total) return { ...base, reason: "nothing" };
  const decisive = classes.findIndex(
    (stability, i) =>
      stability !== SnowpackStability.good && frequencyClass(counts[i], total, dangerLevel) !== Frequency.none,
  );
  if (decisive < 0) {
    return {
      ...base,
      decisive: classes.length - 1,
      stability: SnowpackStability.good,
      frequency: Frequency.none,
      levels: [1],
    };
  }
  const stability = classes[decisive] as UnstableClass;
  const frequency = frequencyClass(counts[decisive], total, dangerLevel) as MatrixFrequency;
  const size = sizeOf(decisive);
  if (size === undefined || !Number.isFinite(size))
    return { ...base, decisive, stability, frequency, reason: "no size" };
  const column = sizeClass(size);
  return {
    ...base,
    decisive,
    stability,
    frequency,
    size,
    sizeClass: column,
    levels: EAWS_MATRIX[stability][frequency][column],
  };
}

/** The reading of each step of class counts count[k][t] whose sizes size[k][t] were already reckoned per class. */
export function readSteps(
  count: readonly (readonly number[])[],
  size: readonly (readonly (number | null)[])[],
  dangerLevel: DangerLevelConfig,
): Reading[] {
  return Array.from({ length: count[0]?.length ?? 0 }, (_, t) =>
    readCounts(
      count.map((counts) => counts[t] ?? 0),
      (decisive) => size[decisive]?.[t] ?? undefined,
      dangerLevel,
    ),
  );
}

/** The matrix reading of points classed among bounds from the most unstable end; points without a finite value drop. */
export function readBand(
  points: readonly BandPoint[],
  bounds: readonly number[],
  dangerLevel: DangerLevelConfig,
): Reading {
  if (bounds.length < 3) return readCounts([], () => undefined, dangerLevel);
  const counts = Array.from({ length: Math.max(0, bounds.length - 1) }, () => 0);
  const sizes = counts.map((): number[] => []);
  for (const { value, size } of points) {
    if (!Number.isFinite(value)) continue;
    const at = classIndex(bounds, value);
    counts[at]++;
    if (size !== undefined && Number.isFinite(size)) sizes[at].push(size);
  }
  return readCounts(counts, (decisive) => reckonedSize(sizes[decisive], dangerLevel.sizePercentile), dangerLevel);
}
