import type { FilterSelectionValue } from "../observations/filter-selection-config";
import type { DangerSample, NotRead } from "./danger-bands";
import { levelColor, whiteOnLevel } from "./danger-levels";

const NOT_READ: Readonly<Record<NotRead, string>> = {
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

export const HIGHLIGHT_ONLY_COLOR = "#5c6770";

const NO_FILL = "rgba(0, 0, 0, 0)";

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
