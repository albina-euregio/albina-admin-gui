import { expect, test } from "@playwright/test";

import {
  formatConfigDate,
  formatUtcConfigDate,
  latestStep,
  resolveConfigDate,
  withinDates,
} from "../src/app/modelling/dashboard-date";

/** The instant of the given UTC time on 2026-10-14. */
const at = (hour: number, minute: number, second = 0) => new Date(Date.UTC(2026, 9, 14, hour, minute, second));

/** Runs a check with the process in the given time zone and restores the zone after. */
function inTimeZone(zone: string, check: () => void) {
  const before = process.env.TZ;
  process.env.TZ = zone;
  try {
    check();
  } finally {
    if (before === undefined) delete process.env.TZ;
    else process.env.TZ = before;
  }
}

test("now floors to the last three-hourly step", () => {
  expect(formatUtcConfigDate(latestStep(at(14, 30, 12), 10800))).toBe("2026-10-14T12:00:00");
  expect(latestStep(at(14, 30, 12), 10800).toISOString()).toBe("2026-10-14T12:00:00.000Z");
});

test("a time on the step stays", () => {
  expect(formatUtcConfigDate(latestStep(at(12, 0), 10800))).toBe("2026-10-14T12:00:00");
});

test("an hourly grid keeps the hour and a daily grid the midnight", () => {
  expect(formatUtcConfigDate(latestStep(at(0, 10), 3600))).toBe("2026-10-14T00:00:00");
  expect(formatUtcConfigDate(latestStep(at(23, 59, 59), 86400))).toBe("2026-10-14T00:00:00");
});

test("now counts in UTC in any time zone, also on the days the clocks change", () => {
  inTimeZone("Europe/Vienna", () => {
    expect(at(11, 30).getHours()).toBe(13);
    expect(resolveConfigDate("now", 10800, at(11, 30))).toBe("2026-10-14T09:00:00");
    expect(resolveConfigDate("now", 3600, at(11, 30))).toBe("2026-10-14T11:00:00");
    expect(resolveConfigDate("now", 86400, at(23, 30))).toBe("2026-10-14T00:00:00");
    const autumn = new Date(Date.UTC(2026, 9, 25, 5, 30));
    expect(resolveConfigDate("now", 10800, autumn)).toBe("2026-10-25T03:00:00");
    expect(resolveConfigDate("now+6h", 10800, autumn)).toBe("2026-10-25T09:00:00");
    expect(resolveConfigDate("now-1d", 10800, autumn)).toBe("2026-10-24T03:00:00");
    const spring = new Date(Date.UTC(2026, 2, 29, 1, 30));
    expect(resolveConfigDate("now", 3600, spring)).toBe("2026-03-29T01:00:00");
    expect(resolveConfigDate("now+1h", 3600, spring)).toBe("2026-03-29T02:00:00");
  });
});

test("a config date read as local time is spelled back unchanged in any time zone", () => {
  for (const zone of ["UTC", "Europe/Vienna", "America/New_York"]) {
    inTimeZone(zone, () => expect(formatConfigDate(new Date("2026-04-05T00:00:00")), zone).toBe("2026-04-05T00:00:00"));
  }
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
