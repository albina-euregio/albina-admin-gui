import { clamp } from "es-toolkit";

import { sharedBoundary } from "./index-classes";

export const MAX_CUTS = 2;

type Ranged = readonly { readonly numericRange?: readonly number[] }[];
type Rows = readonly { readonly value: string; readonly numericRange?: readonly number[] }[];

export interface ChartRows {
  readonly rows: number;
  readonly gridTop: number;
  readonly labelOffset: number;
}

const KEY_STEPS: ReadonlyMap<string, number> = new Map([
  ["ArrowUp", -1],
  ["ArrowRight", -1],
  ["ArrowDown", 1],
  ["ArrowLeft", 1],
  ["PageUp", -2],
  ["PageDown", 2],
]);

/** The bounds that consecutive values share, in row order. */
export function sharedBounds(values: Ranged): number[] {
  return values.slice(1).flatMap(({ numericRange: below }, i) => {
    const above = values[i].numericRange;
    const bound = above && below ? sharedBoundary(above, below) : undefined;
    return bound === undefined ? [] : [bound];
  });
}

/** The row bounds from the top of the first row to the bottom of the last; undefined unless the rows chain downwards. */
export function cutStops(values: Ranged): number[] | undefined {
  const ranges = values.map((v) => v.numericRange);
  if (ranges.length < 2 || ranges.some((range) => range?.length !== 2)) return undefined;
  const stops = [ranges[0][1], ...ranges.map((range) => range[0])];
  return ranges.every(([low, high], i) => high === stops[i] && low < high) ? stops : undefined;
}

/** The stops of a slider beside a filter's chart; undefined unless it is a shown bar chart whose rows fit and chain. */
export function sliderStops(
  filter: { readonly chartType: string; readonly hidden?: boolean; readonly values: Ranged },
  rows: number,
): number[] | undefined {
  return filter.chartType === "bar" && !filter.hidden && filter.values.length <= rows
    ? cutStops(filter.values)
    : undefined;
}

/** What is wrong with cuts for a filter's values: each must be a bound two consecutive values share, ascending. */
export function cutProblems(cuts: readonly number[], values: Ranged): string[] {
  const bounds = sharedBounds(values);
  const offered = [...bounds].sort((a, b) => a - b).join(", ") || "none";
  const strangers = cuts.filter((cut) => !bounds.includes(cut));
  const descending = cuts.some((cut, i) => i > 0 && cut <= cuts[i - 1]);
  return [
    ...strangers.map((cut) => `cut ${cut} is no bound that two consecutive values share (possible: ${offered})`),
    ...(descending ? [`cuts must ascend: ${cuts.join(", ")}`] : []),
  ];
}

/** Whether a stop splits the rows, i.e. is neither end of the slider. */
export function isSplit(stops: readonly number[], cut: number): boolean {
  return cut !== stops[0] && cut !== stops.at(-1);
}

/** Whether every thumb that moved went from a split to a split, so that pressed bands may follow it. */
export function staysSplit(stops: readonly number[], before: readonly number[], after: readonly number[]): boolean {
  return after.every((cut, i) => cut === before[i] || (isSplit(stops, cut) && isSplit(stops, before[i])));
}

/** The stop nearest a value, the higher one on a tie. */
export function nearestStop(stops: readonly number[], value: number): number {
  return stops.reduce((best, stop) => {
    const distance = Math.abs(stop - value) - Math.abs(best - value);
    return distance < 0 || (distance === 0 && stop > best) ? stop : best;
  });
}

/** The cuts a link asks for, snapped to splits; `none` parks the thumbs at the ends; undefined when malformed. */
export function cutsFromParam(
  raw: string,
  stops: readonly number[],
  defaults: readonly number[],
): number[] | undefined {
  if (raw === "none") return defaults.map((_, thumb) => (thumb === 0 ? stops.at(-1) : stops[0]));
  if (!/^\d+(,\d+)*$/.test(raw)) return undefined;
  const asked = raw.split(",").map(Number);
  const splits = stops.filter((stop) => isSplit(stops, stop));
  if (!splits.length || asked.length > MAX_CUTS || asked.some((cut, i) => i > 0 && cut <= asked[i - 1])) {
    return undefined;
  }
  return [...new Set(asked.map((cut) => nearestStop(splits, cut)))];
}

/** The link value of the cuts: those that split, or `none`. */
export function cutParam(stops: readonly number[], cuts: readonly number[]): string {
  return cuts.filter((cut) => isSplit(stops, cut)).join(",") || "none";
}

/** The edges of the bands the cuts make, lowest band first, as [lower, upper] in metres. */
export function bandEdges(stops: readonly number[], cuts: readonly number[]): [number, number][] {
  const edges = [stops.at(-1), ...cuts, stops[0]];
  return edges.slice(1).map((upper, i) => [edges[i], upper]);
}

/** The band of an elevation among ascending cuts, the lowest band 0; an elevation on a cut belongs to the band above. */
export function bandOf(elevation: number, cuts: readonly number[]): number {
  return cuts.filter((cut) => elevation >= cut).length;
}

/** The values of the rows wholly inside each band, lowest band first. */
export function bandValues(values: Rows, stops: readonly number[], cuts: readonly number[]): string[][] {
  return bandEdges(stops, cuts).map(([lower, upper]) =>
    values
      .filter(({ numericRange }) => numericRange && numericRange[0] >= lower && numericRange[1] <= upper)
      .map((v) => v.value),
  );
}

/** Whether the set holds every row of a band that has rows. */
export function holdsAll(values: ReadonlySet<string>, rows: readonly string[]): boolean {
  return rows.length > 0 && rows.every((row) => values.has(row));
}

/** The values once each band that held all its rows holds all of them at its new extent; undefined if none moves. */
export function followBands(
  values: ReadonlySet<string>,
  before: readonly (readonly string[])[],
  after: readonly (readonly string[])[],
): Set<string> | undefined {
  const held = before.map((rows) => holdsAll(values, rows));
  const left = new Set(before.flatMap((rows, band) => (held[band] ? rows : [])));
  const moved = new Set([
    ...[...values].filter((value) => !left.has(value)),
    ...after.flatMap((rows, band) => (held[band] ? rows : [])),
  ]);
  return moved.size === values.size && [...moved].every((value) => values.has(value)) ? undefined : moved;
}

/** The stop indices a thumb may take, top first: one row below its higher neighbour, one row above its lower one. */
export function thumbRange(stops: readonly number[], cuts: readonly number[], thumb: number): [number, number] {
  const above = cuts[thumb + 1];
  const below = cuts[thumb - 1];
  return [
    above === undefined ? 0 : stops.indexOf(above) + 1,
    below === undefined ? stops.length - 1 : stops.indexOf(below) - 1,
  ];
}

/** The stop index a key moves a thumb to within its range; undefined for a key the slider leaves alone. */
export function stepStop(key: string, index: number, [top, bottom]: readonly [number, number]): number | undefined {
  if (key === "Home") return bottom;
  if (key === "End") return top;
  const step = KEY_STEPS.get(key);
  return step === undefined ? undefined : clamp(index + step, top, bottom);
}

/** The stop index nearest a pointer y px below the top of a slider host of the given height, 0 above the first stop. */
export function stopAtPointer(y: number, height: number, { rows, gridTop, labelOffset }: ChartRows): number {
  return Math.max(0, Math.round(((y - gridTop + labelOffset / 2) * rows) / (height - gridTop)));
}

/** The short code a thumb shows: the stop in hundreds of metres. */
export function stopCode(stop: number): string {
  return String(stop / 100);
}
