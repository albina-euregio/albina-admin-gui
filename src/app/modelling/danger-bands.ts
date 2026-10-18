import { castArray } from "es-toolkit/compat";

import type { DangerLevelConfig } from "./awsome.config";
import { type BandPoint, type Reading, readBand } from "./eaws-reading";
import { bandEdges, type BandKeys, type BandName, bandName, bandOf } from "./elevation-cut";

export type NotRead = "flat" | "aspect" | "elevation" | "snow" | "value";

export const SNOW_DEPTH_KEY = "snowpack.hs";

const BAND_NAMES: BandKeys = {
  all: "all elevations",
  below: "< {{elevation}} m",
  above: "≥ {{elevation}} m",
  between: "{{lower}}–{{upper}} m",
};

const COMPASS: ReadonlySet<string> = new Set("N NNE NE ENE E ESE SE SSE S SSW SW WSW W WNW NW NNW".split(" "));

export interface DangerProbe {
  readonly key: string;
  readonly polygon: boolean;
  readonly aspect: unknown;
  readonly elevation: unknown;
  readonly snowDepth: unknown;
  readonly value: unknown;
  readonly size: unknown;
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

export interface DangerBand {
  readonly name: string;
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
  if (aspect === "F") return { ...sample, notRead: "flat" };
  if (!aspect || !COMPASS.has(aspect)) return { ...sample, notRead: "aspect" };
  if (band === undefined) return { ...sample, notRead: "elevation" };
  if (typeof probe.snowDepth === "number" && !(probe.snowDepth > 0)) return { ...sample, notRead: "snow" };
  if (!isFiniteNumber(probe.value)) return { ...sample, notRead: "value" };
  return { ...sample, value: probe.value, size: isFiniteNumber(probe.size) ? probe.size : undefined };
}

/** The name of each band of the cuts, lowest first, as a translation key and its parameters. */
export function bandNames(cuts: readonly number[]): BandName[] {
  return bandEdges(cuts).map((edges) => bandName(edges, BAND_NAMES));
}

/**
 * The bands of the cuts, lowest first: the name nameOf gives, edges, the reading of the samples read in it and how
 * many it holds.
 */
export function dangerBands(
  samples: Iterable<DangerSample>,
  cuts: readonly number[],
  bounds: readonly number[],
  dangerLevel: DangerLevelConfig,
  nameOf: (name: BandName) => string,
): DangerBand[] {
  const names = bandNames(cuts);
  const edges = bandEdges(cuts);
  const points = names.map((): BandPoint[] => []);
  const selected = names.map(() => 0);
  for (const sample of samples) {
    if (sample.band === undefined) continue;
    selected[sample.band]++;
    if (!sample.notRead) points[sample.band].push({ value: sample.value, size: sample.size });
  }
  return names.map((name, band) => ({
    name: nameOf(name),
    band,
    edges: edges[band],
    reading: readBand(points[band], bounds, dangerLevel),
    selected: selected[band],
  }));
}
