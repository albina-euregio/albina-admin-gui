import { expect, test } from "@playwright/test";

import { formatConfigDate, latestStep, resolveConfigDate, withinDates } from "../src/app/modelling/dashboard-date";

const at = (hour: number, minute: number, second = 0) => new Date(2026, 9, 14, hour, minute, second);

test("now floors to the last three-hourly step", () => {
  expect(formatConfigDate(latestStep(at(14, 30, 12), 10800))).toBe("2026-10-14T12:00:00");
});

test("a time on the step stays", () => {
  expect(formatConfigDate(latestStep(at(12, 0), 10800))).toBe("2026-10-14T12:00:00");
});

test("an hourly grid keeps the hour and a daily grid the midnight", () => {
  expect(formatConfigDate(latestStep(at(0, 10), 3600))).toBe("2026-10-14T00:00:00");
  expect(formatConfigDate(latestStep(at(23, 59, 59), 86400))).toBe("2026-10-14T00:00:00");
});

test("offsets count from the grid time in hours or days", () => {
  expect(resolveConfigDate("now+48h", 10800, at(14, 30))).toBe("2026-10-16T12:00:00");
  expect(resolveConfigDate("now+2d", 10800, at(14, 30))).toBe("2026-10-16T12:00:00");
  expect(resolveConfigDate("now-14d", 10800, at(14, 30))).toBe("2026-09-30T12:00:00");
  expect(resolveConfigDate("now+6h", 10800, at(23, 30))).toBe("2026-10-15T03:00:00");
});

test("only now and its offsets are resolved", () => {
  expect(resolveConfigDate("now", 10800, at(14, 30))).toBe("2026-10-14T12:00:00");
  expect(resolveConfigDate("2026-04-05T00:00:00", 10800, at(14, 30))).toBe("2026-04-05T00:00:00");
  expect(resolveConfigDate("now+1w", 10800, at(14, 30))).toBe("now+1w");
});

test("a date lies within the dashboard's dates on and between its bounds, a bound left out is open", () => {
  const [first, last] = ["2026-04-01T00:00:00", "2026-04-05T00:00:00"];
  expect(withinDates("2026-04-03T12:00:00", first, last)).toBe(true);
  expect(withinDates(first, first, last)).toBe(true);
  expect(withinDates(last, first, last)).toBe(true);
  expect(withinDates("2026-03-31T21:00:00", first, last)).toBe(false);
  expect(withinDates("2026-04-05T03:00:00", first, last)).toBe(false);
  expect(withinDates("2020-01-01T00:00:00", undefined, last)).toBe(true);
  expect(withinDates("2030-01-01T00:00:00", first)).toBe(true);
  expect(withinDates("2030-01-01T00:00:00")).toBe(true);
});
