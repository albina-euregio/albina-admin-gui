import { clamp } from "es-toolkit";

export interface ClassedIndex {
  readonly values: readonly { readonly numericRange?: readonly number[] }[];
  readonly chartAxisRange?: readonly number[];
}

/** The bound two consecutive classes have in common, if any. */
export function sharedBoundary(above: readonly number[], below: readonly number[]): number | undefined {
  return above.find((bound) => below.includes(bound));
}

/** Class bounds from the most unstable end to the most stable one; undefined unless the classes chain monotonically. */
export function classBounds(index: ClassedIndex): number[] | undefined {
  const ranges = index.values.map((v) => v.numericRange).filter((range) => Array.isArray(range));
  if (ranges.length < 2) return undefined;
  const [min, max] = index.chartAxisRange ?? [Math.min(...ranges.flat()), Math.max(...ranges.flat())];
  const descending = ranges[0][0] > ranges.at(-1)[0];
  const inner = ranges.slice(1).map((below, i) => sharedBoundary(ranges[i], below));
  const bounds = descending ? [max, ...inner, min] : [min, ...inner, max];
  const direction = descending ? -1 : 1;
  const monotonic = bounds.slice(1).every((bound, i) => direction * (bound - bounds[i]) > 0);
  return monotonic ? bounds : undefined;
}

/** Where a value lies along the classes: 0 at the most unstable end, 1 at the most stable, linear within a class. */
export function classFraction(bounds: readonly number[], value: number): number {
  const classes = bounds.length - 1;
  const direction = Math.sign(bounds[classes] - bounds[0]);
  const passed = bounds.filter((bound) => direction * (value - bound) >= 0).length;
  const segment = clamp(passed - 1, 0, classes - 1);
  const within = (value - bounds[segment]) / (bounds[segment + 1] - bounds[segment]);
  return clamp((segment + within) / classes, 0, 1);
}

/** The value at a class fraction, interpolated linearly within its class. */
export function valueAtClassFraction(bounds: readonly number[], fraction: number): number {
  const classes = bounds.length - 1;
  const position = clamp(fraction, 0, 1) * classes;
  const segment = Math.min(Math.floor(position), classes - 1);
  return bounds[segment] + (position - segment) * (bounds[segment + 1] - bounds[segment]);
}

/** A value of the index with bounds `from`, carried onto the index with bounds `to` at the same class fraction. */
export function alignToClasses(value: number, from: readonly number[], to: readonly number[]): number {
  return valueAtClassFraction(to, classFraction(from, value));
}

/** Whether an index is most unstable at its minimum, so its axis has to run downwards to keep instability on top. */
export function unstableAtMinimum(index: ClassedIndex): boolean {
  const bounds = classBounds(index);
  return bounds !== undefined && bounds[0] < bounds.at(-1);
}

/** The index filling the placeholder while no index classifies: the default classifier if it is one, else the first. */
export function fallbackStabilityIndex<F extends { type: string; stabilityIndex?: string }>(
  filters: readonly F[],
  defaultClassify: string | undefined,
): F | undefined {
  const preferred = filters.find((f) => f.type === defaultClassify);
  return preferred?.stabilityIndex ? preferred : filters.find((f) => f.stabilityIndex);
}

/** Class slots that fit the values of every filter without a url, never fewer than the ten of upstream. */
export function classSlotsFor(filters: readonly { url?: string; values: readonly unknown[] }[]): number {
  return Math.max(10, ...filters.filter((f) => !f.url).map((f) => f.values.length));
}

/** Whether every value of a filter has a class slot, as a classifier needs. */
export function fitsClassSlots(filter: { values: readonly unknown[] }, classSlots: number): boolean {
  return filter.values.length <= classSlots;
}
