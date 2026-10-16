import { castArray } from "es-toolkit/compat";

import type { FilterSelectionValue } from "../observations/filter-selection-config";
import { type BandPoint, type Calibration, type Reading, readBand } from "./eaws-reading";
import { bandOf } from "./elevation-cut";

export type NotRead = "source" | "flat" | "aspect" | "elevation" | "snow" | "value";

const NOT_READ: Readonly<Record<NotRead, string>> = {
  source: "source not read",
  flat: "flat",
  aspect: "no aspect",
  elevation: "no elevation",
  snow: "no snow or no model output",
  value: "no index value",
};

export const NOTE_WORDS: Readonly<Record<NotRead | "read" | "not read", string>> = {
  ...NOT_READ,
  read: "read",
  "not read": "not read",
};

const DANGER_LEVEL_COLORS: readonly string[] = ["#a6d96a", "#ffffbf", "#fdae61", "#d7191c", "#000000"];
export const MISSING_COLOR = "#969696";
export const HIGHLIGHT_ONLY_COLOR = "#5c6770";

const NO_FILL = "rgba(0, 0, 0, 0)";
const COMPASS: ReadonlySet<string> = new Set("N NNE NE ENE E ESE SE SSE S SSW SW WSW W WNW NW NNW".split(" "));

export interface DangerProbe {
  readonly key: string;
  readonly polygon: boolean;
  readonly aspect: unknown;
  readonly elevation: unknown;
  readonly snowDepth: unknown;
  readonly value: unknown;
  readonly size: unknown;
  readonly sourceRead: boolean;
}

export interface DangerSample {
  readonly key: string;
  readonly polygon: boolean;
  readonly aspect?: string;
  readonly band?: number;
  readonly notRead?: NotRead;
  readonly value?: number;
  readonly size?: number;
}

export interface DangerLocation {
  readonly band?: number;
  readonly read: boolean;
  readonly copies: readonly DangerSample[];
}

export interface DangerPlan<T> {
  readonly levels: readonly (number | undefined)[];
  readonly samples: ReadonlyMap<T, DangerSample>;
  readonly owners: ReadonlySet<T>;
  readonly locations: ReadonlyMap<string, DangerLocation>;
}

export interface BandName {
  readonly key: string;
  readonly params?: Readonly<Record<string, number>>;
}

export interface DangerBand {
  readonly name: BandName;
  readonly band: number;
  readonly edges: readonly [number | undefined, number | undefined];
  readonly reading: Reading;
  readonly selected: number;
}

/** Whether a value is a finite number. */
function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

/** What the danger level makes of a selected feature: its band and point, or why it is not read. */
export function sampleOf(probe: DangerProbe, cuts: readonly number[]): DangerSample {
  const first: unknown = castArray(probe.aspect)[0];
  const aspect = typeof first === "string" ? first : undefined;
  const band = isFiniteNumber(probe.elevation) ? bandOf(probe.elevation, cuts) : undefined;
  const sample = { key: probe.key, polygon: probe.polygon, aspect, band };
  if (!probe.sourceRead) return { ...sample, notRead: "source" };
  if (aspect === "F") return { ...sample, notRead: "flat" };
  if (!aspect || !COMPASS.has(aspect)) return { ...sample, notRead: "aspect" };
  if (band === undefined) return { ...sample, notRead: "elevation" };
  if (typeof probe.snowDepth === "number" && !(probe.snowDepth > 0)) return { ...sample, notRead: "snow" };
  if (!isFiniteNumber(probe.value)) return { ...sample, notRead: "value" };
  return { ...sample, value: probe.value, size: isFiniteNumber(probe.size) ? probe.size : undefined };
}

/** The locations of the sampled features, each owned by its first polygon, read when any copy of it is read. */
export function planDanger<T>(
  samples: ReadonlyMap<T, DangerSample>,
  levels: readonly (number | undefined)[],
): DangerPlan<T> {
  const owners = new Set<T>();
  const copies = new Map<string, DangerSample[]>();
  for (const [feature, sample] of samples) {
    const known = copies.get(sample.key);
    if (sample.polygon && !known?.some((copy) => copy.polygon)) owners.add(feature);
    if (known) known.push(sample);
    else copies.set(sample.key, [sample]);
  }
  const locations = new Map(
    [...copies].map(([key, list]): [string, DangerLocation] => [
      key,
      {
        band: list.find((copy) => copy.band !== undefined)?.band,
        read: list.some((copy) => !copy.notRead),
        copies: list,
      },
    ]),
  );
  return { levels, samples, owners, locations };
}

/** The colour of a danger level, the 'missing' grey without one. */
export function levelColor(level: number | undefined): string {
  return (level && DANGER_LEVEL_COLORS[level - 1]) || MISSING_COLOR;
}

/** Whether a level's colour takes white text: levels 4 and 5. */
function whiteOnLevel(level: number | undefined): boolean {
  return (level ?? 0) >= 4;
}

/** The colour of a level and whether it takes white text. */
export function levelStyle(level: number | undefined): { color: string; white: boolean } {
  return { color: levelColor(level), white: whiteOnLevel(level) };
}

/** A paint in the shape of a filter value. */
function paint(fields: Omit<FilterSelectionValue, "value" | "label">): FilterSelectionValue {
  return { value: "danger-level", label: "", ...fields };
}

/**
 * The paint of a feature in the danger level view: a read location in its band's level colour, filled once by its
 * owner; an unread one outlined in its band's colour; a feature only highlighted outlined in grey.
 */
export function dangerPaint<T>(plan: DangerPlan<T>, feature: T, polygon: boolean): FilterSelectionValue {
  const sample = plan.samples.get(feature);
  const location = sample && plan.locations.get(sample.key);
  if (!location) {
    return polygon
      ? paint({ color: NO_FILL, fillOpacity: 0, borderColor: HIGHLIGHT_ONLY_COLOR, weight: 2 })
      : paint({ color: "#fff", borderColor: HIGHLIGHT_ONLY_COLOR, borderWidth: 2 });
  }
  const level = location.band === undefined ? undefined : plan.levels[location.band];
  const color = levelColor(level);
  const owner = plan.owners.has(feature);
  if (location.read) {
    if (!polygon)
      return paint({ color, labelColor: whiteOnLevel(level) ? "#fff" : "#000", borderColor: "#000", borderWidth: 1 });
    return owner
      ? paint({ color, fillOpacity: level ? 0.6 : 0.3, borderColor: color, weight: 0.5 })
      : paint({ color, fillOpacity: 0, borderColor: color, weight: 0 });
  }
  if (!polygon) return paint({ color: "#fff", labelColor: "#000", borderColor: color, borderWidth: 1.5 });
  return paint({ color: NO_FILL, fillOpacity: 0, borderColor: color, weight: owner ? 1.5 : 0 });
}

/** The tooltip line of a feature's location: its band and which of its copies were read, or why not. */
export function dangerNote<T>(
  plan: DangerPlan<T>,
  feature: T,
  bandNames: readonly string[],
  words: Readonly<Record<keyof typeof NOTE_WORDS, string>> = NOTE_WORDS,
): string | undefined {
  const sample = plan.samples.get(feature);
  const location = sample && plan.locations.get(sample.key);
  if (!location) return undefined;
  const several = location.copies.length > 1;
  const named = (copy: DangerSample, text: string) => (several && copy.aspect ? `${copy.aspect} ${text}` : text);
  const read = location.copies.filter((copy) => !copy.notRead);
  const unread = location.copies.filter((copy) => copy.notRead);
  const parts = [
    ...(read.length ? [several ? `${words.read} ${read.map((copy) => copy.aspect).join(", ")}` : words.read] : []),
    ...(unread.length
      ? [`${words["not read"]}: ${unread.map((copy) => named(copy, words[copy.notRead])).join(", ")}`]
      : []),
  ];
  const where = location.band === undefined ? undefined : bandNames[location.band];
  return [where, parts.join(" · ")].filter(Boolean).join(": ");
}

/** The name of each band of the cuts, lowest first, as a translation key and its parameters. */
export function bandNames(cuts: readonly number[]): BandName[] {
  if (!cuts.length) return [{ key: "all elevations" }];
  return [
    { key: "< {{elevation}} m", params: { elevation: cuts[0] } },
    ...cuts.slice(1).map((upper, i) => ({ key: "{{lower}}–{{upper}} m", params: { lower: cuts[i], upper } })),
    { key: "≥ {{elevation}} m", params: { elevation: cuts.at(-1) } },
  ];
}

/** The bands of the cuts, lowest first: name, edges, the reading of the samples read in it and how many it holds. */
export function dangerBands(
  samples: Iterable<DangerSample>,
  cuts: readonly number[],
  bounds: readonly number[],
  calibration: Calibration,
): DangerBand[] {
  const names = bandNames(cuts);
  const edges = [undefined, ...cuts, undefined];
  const points = names.map((): BandPoint[] => []);
  const selected = names.map(() => 0);
  for (const sample of samples) {
    if (sample.band === undefined) continue;
    selected[sample.band]++;
    if (!sample.notRead) points[sample.band].push({ value: sample.value, size: sample.size });
  }
  return names.map((name, band) => ({
    name,
    band,
    edges: [edges[band], edges[band + 1]],
    reading: readBand(points[band], bounds, calibration),
    selected: selected[band],
  }));
}
