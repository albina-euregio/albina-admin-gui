import { orderBy } from "es-toolkit";
import * as z from "zod/v4";

export const DormantDatetagsSchema = z.object({ dormant_datetags: z.string().array() });

/** Whether a datetag is an ISO date, the only kind of datetag that can go dormant. */
export function isDateDatetag(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

/** Datetag values in canonical order: the other values first as given, then the dates newest first. */
export function sortDatetags<V extends { value: string }>(values: readonly V[]): V[] {
  const dates = values.filter((v) => isDateDatetag(v.value));
  return [...values.filter((v) => !isDateDatetag(v.value)), ...orderBy(dates, [(v) => v.value], ["desc"])];
}

/** The dates among the values that a dormant-datetags document lists; throws when the document has another shape. */
export function dormantDatetags(content: unknown, values: readonly { value: string }[]): Set<string> {
  const listed = new Set(DormantDatetagsSchema.parse(content).dormant_datetags);
  return new Set(values.map((v) => v.value).filter((value) => isDateDatetag(value) && listed.has(value)));
}
