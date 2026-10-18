import { DangerRating } from "../enums/enums";

export interface DangerLevel {
  readonly rating: DangerRating;
  readonly color: string;
}

export const DANGER_LEVELS: readonly DangerLevel[] = [
  { rating: DangerRating.missing, color: "#969696" },
  { rating: DangerRating.low, color: "#a6d96a" },
  { rating: DangerRating.moderate, color: "#ffffbf" },
  { rating: DangerRating.considerable, color: "#fdae61" },
  { rating: DangerRating.high, color: "#d7191c" },
  { rating: DangerRating.very_high, color: "#000000" },
];

/** The table entry of a level, the missing one without a level. */
function levelEntry(level: number | undefined): DangerLevel {
  return DANGER_LEVELS[level ?? 0] ?? DANGER_LEVELS[0];
}

/** The danger rating of a level, missing without one. */
export function dangerRating(level: number | undefined): DangerRating {
  return levelEntry(level).rating;
}

/** The level of a danger rating, 0 for a rating without a level. */
export function levelOfRating(rating: DangerRating): number {
  return Math.max(
    0,
    DANGER_LEVELS.findIndex((entry) => entry.rating === rating),
  );
}

/** The colour of a danger level, the 'missing' grey without one. */
export function levelColor(level: number | undefined): string {
  return levelEntry(level).color;
}

/** Whether a level's colour takes white text: levels 4 and 5. */
export function whiteOnLevel(level: number | undefined): boolean {
  return (level ?? 0) >= 4;
}

/** The colour of a level and whether it takes white text. */
export function levelStyle(level: number | undefined): { color: string; white: boolean } {
  return { color: levelColor(level), white: whiteOnLevel(level) };
}
