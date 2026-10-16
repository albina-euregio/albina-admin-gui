export const NOW = "now";
export const RELATIVE_DATE = /^now(?:([+-])(\d+)([hd]))?$/;

const pad = (n: number) => String(n).padStart(2, "0");

/** The latest time on the dashboard's grid before now: steps of stepSeconds counted from local midnight. */
export function latestStep(now: Date, stepSeconds: number): Date {
  const secondsOfDay = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
  const passed = Math.floor(secondsOfDay / stepSeconds) * stepSeconds;
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, passed);
}

/** A local time as the config spells its dates. */
export function formatConfigDate(date: Date): string {
  const day = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  return `${day}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

/** A dashboard date's day and month, dd.mm. */
export function dayMonth(date: string): string {
  return `${date.slice(8, 10)}.${date.slice(5, 7)}.`;
}

/** Whether a date lies within the dashboard's first and last date, either open when absent. */
export function withinDates(date: string, min?: string, max?: string): boolean {
  return !(min && date < min) && !(max && date > max);
}

/** A config date as the dashboard opens it: "now", "now+48h" or "now-14d" count from the latest grid time before now. */
export function resolveConfigDate(value: string, stepSeconds: number, now = new Date()): string {
  const relative = RELATIVE_DATE.exec(value);
  if (!relative) return value;
  const [, sign, amount, unit] = relative;
  const date = latestStep(now, stepSeconds);
  const offset = (sign === "-" ? -1 : 1) * Number(amount ?? 0);
  if (unit === "d") date.setDate(date.getDate() + offset);
  else date.setHours(date.getHours() + offset);
  return formatConfigDate(date);
}
