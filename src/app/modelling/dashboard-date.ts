export const RELATIVE_DATE = /^now(?:([+-])(\d+)([hd]))?$/;
const NAIVE_TIME = /T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?$/;

/** The latest time on the dashboard's grid before now: steps of stepSeconds counted from UTC midnight. */
export function latestStep(now: Date, stepSeconds: number): Date {
  const secondsOfDay = now.getUTCHours() * 3600 + now.getUTCMinutes() * 60 + now.getUTCSeconds();
  const passed = Math.floor(secondsOfDay / stepSeconds) * stepSeconds;
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, passed));
}

/** A UTC time as the config spells its dates, whose model times are UTC. */
export function formatUtcConfigDate(date: Date): string {
  return date.toISOString().slice(0, 19);
}

/** The instant of a model time, which a time without a zone names in UTC. */
export function parseModelTime(value: string): Date {
  return new Date(NAIVE_TIME.test(value) ? `${value}Z` : value);
}

/** A dashboard date's day and month, dd.mm. */
export function dayMonth(date: string): string {
  return `${date.slice(8, 10)}.${date.slice(5, 7)}.`;
}

/** Whether a date lies within the dashboard's first and last date, either open when absent. */
export function withinDates(date: string, min?: string, max?: string): boolean {
  return !(min && date < min) && !(max && date > max);
}

/** Resolves the date, dateMin and dateMax of a config in place, the two limits only when it has them. */
export function resolveConfigDates(
  config: { date?: string; dateMin?: string; dateMax?: string },
  stepSeconds: number,
): void {
  config.date = resolveConfigDate(config.date, stepSeconds);
  if (config.dateMax) config.dateMax = resolveConfigDate(config.dateMax, stepSeconds);
  if (config.dateMin) config.dateMin = resolveConfigDate(config.dateMin, stepSeconds);
}

/** A config date as the dashboard opens it: "now", "now+48h" or "now-14d" count in UTC from the latest grid time. */
export function resolveConfigDate(value: string, stepSeconds: number, now = new Date()): string {
  const relative = RELATIVE_DATE.exec(value);
  if (!relative) return value;
  const [, sign, amount, unit] = relative;
  const date = latestStep(now, stepSeconds);
  const offset = (sign === "-" ? -1 : 1) * Number(amount ?? 0);
  if (unit === "d") date.setUTCDate(date.getUTCDate() + offset);
  else date.setUTCHours(date.getUTCHours() + offset);
  return formatUtcConfigDate(date);
}
