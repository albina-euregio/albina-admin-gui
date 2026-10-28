import { expect, test } from "@playwright/test";

import { dangerSeriesOf } from "../src/app/modelling/danger-series";
import {
  DAY_LABEL_GAP,
  DAY_LABEL_WIDTH,
  dayLabels,
  dayStarts,
  labelCentre,
  separatedCells,
  shownLabels,
} from "../src/app/modelling/danger-series.component";
import { dayMonth } from "../src/app/modelling/dashboard-date";

/** The dashboard dates of steps hours apart from a start, as the config spells them. */
function steps(start: string, count: number, hours: number): string[] {
  const first = Date.parse(`${start}Z`);
  return Array.from({ length: count }, (_, t) => new Date(first + t * hours * 3600e3).toISOString().slice(0, 19));
}

/** The day labels a strip of these dates shows at a width. */
const shownAt = (dates: readonly string[], width: number) =>
  shownLabels(dayLabels(dates), dates.length, width).map((label) => label.text);
const labelSpace = DAY_LABEL_WIDTH + DAY_LABEL_GAP;

test("dayLabels labels the first step of each day dd.mm., the first step of the series too", () => {
  expect(dayMonth("2026-04-05T21:00:00")).toBe("05.04.");
  expect(steps("2026-03-31T21:00:00", 4, 3)).toEqual([
    "2026-03-31T21:00:00",
    "2026-04-01T00:00:00",
    "2026-04-01T03:00:00",
    "2026-04-01T06:00:00",
  ]);
  expect(dayLabels(steps("2026-03-31T21:00:00", 10, 3))).toEqual([
    { index: 0, text: "31.03." },
    { index: 1, text: "01.04." },
    { index: 9, text: "02.04." },
  ]);
  expect(dayLabels(steps("2026-04-01T00:00:00", 3, 24))).toEqual([
    { index: 0, text: "01.04." },
    { index: 1, text: "02.04." },
    { index: 2, text: "03.04." },
  ]);
  expect(dayLabels(["2026-04-01T00:00:00"])).toEqual([{ index: 0, text: "01.04." }]);
  expect(dayLabels([])).toEqual([]);
});

test("a tick marks where a day starts on the strip: every later day, the first step only at midnight", () => {
  const lateStart = steps("2026-03-31T21:00:00", 10, 3);
  expect(dayStarts(dayLabels(lateStart), lateStart).map((day) => day.index)).toEqual([1, 9]);
  const midnightStart = steps("2026-04-01T00:00:00", 3, 24);
  expect(dayStarts(dayLabels(midnightStart), midnightStart).map((day) => day.index)).toEqual([0, 1, 2]);
  expect(dayStarts([], [])).toEqual([]);
});

test("a day label is centred on its step, moved inwards at the ends of the strip to stay on it", () => {
  const label = (index: number) => ({ index, text: "01.04." });
  expect(labelCentre(label(2), 6, 600)).toBe(250);
  expect(labelCentre(label(0), 6, 600)).toBe(50);
  expect(labelCentre(label(0), 136, 440)).toBe(DAY_LABEL_WIDTH / 2);
  expect(labelCentre(label(135), 136, 440)).toBe(440 - DAY_LABEL_WIDTH / 2);
  expect(labelCentre(label(68), 136, 440)).toBeCloseTo(221.6, 1);
  expect(labelCentre(label(0), 136, 440, 70)).toBe(35);
});

test("a strip shows every day while the labels are far enough apart, then every second, third … day", () => {
  const daily = steps("2026-04-01T00:00:00", 6, 24);
  expect(shownAt(daily, 440)).toEqual(["01.04.", "02.04.", "03.04.", "04.04.", "05.04.", "06.04."]);
  expect(shownAt(daily, 6 * labelSpace)).toHaveLength(6);
  expect(shownAt(daily, 6 * labelSpace - 1)).toEqual(["01.04.", "03.04.", "05.04."]);
  const threeHourly = steps("2026-03-19T12:00:00", 136, 3);
  expect(dayLabels(threeHourly)).toHaveLength(18);
  expect(
    dayLabels(threeHourly)
      .slice(0, 3)
      .map((day) => day.index),
  ).toEqual([0, 4, 12]);
  expect(shownAt(threeHourly, 9 * 136)).toHaveLength(17);
  expect(shownAt(threeHourly, 989)).toHaveLength(17);
  expect(shownAt(threeHourly, 603)).toEqual([
    "21.03.",
    "23.03.",
    "25.03.",
    "27.03.",
    "29.03.",
    "31.03.",
    "02.04.",
    "04.04.",
  ]);
  expect(shownAt(threeHourly, 359)).toEqual(["22.03.", "25.03.", "28.03.", "31.03.", "03.04."]);
  expect(shownAt(threeHourly, 198)).toEqual(["24.03.", "29.03.", "03.04."]);
  expect(shownAt(threeHourly, 0)).toEqual([]);
  expect(shownLabels([], 0, 440)).toEqual([]);
});

test("a wider measured label spaces the labels by its width and the gap", () => {
  const daily = dayLabels(steps("2026-04-01T00:00:00", 6, 24));
  expect(shownLabels(daily, 6, 440).map((label) => label.text)).toHaveLength(6);
  const wide = shownLabels(daily, 6, 440, 70);
  expect(wide.map((label) => label.text)).toEqual(["01.04.", "03.04.", "05.04."]);
  expect(Math.min(...wide.slice(1).map((label, k) => label.centre - wide[k].centre))).toBeGreaterThanOrEqual(
    70 + DAY_LABEL_GAP,
  );
});

test("the first and the last label give way to a neighbour too close instead of thinning out every label", () => {
  const halfDayFirst = shownAt(steps("2026-03-19T12:00:00", 136, 3), 989);
  expect([halfDayFirst[0], halfDayFirst.at(-1)]).toEqual(["20.03.", "05.04."]);
  const fromMidnight = steps("2026-03-22T00:00:00", 120, 3);
  expect(shownAt(fromMidnight, 883)).toHaveLength(14);
  expect(shownAt(fromMidnight, 883)[0]).toBe("23.03.");
  expect(shownAt(fromMidnight, 1150)).toHaveLength(15);
  const shortLast = [0, 8, 16, 24, 30].map((index, k) => ({ index, text: `0${k + 1}.04.` }));
  expect(shownLabels(shortLast, 31, 300).map((label) => label.text)).toEqual(["01.04.", "02.04.", "03.04.", "04.04."]);
  expect(shownAt(steps("2026-04-01T00:00:00", 4, 24), 104)).toEqual(["01.04.", "04.04."]);
});

test("shown labels keep a label width and the gap between their centres, stay on the strip and step through the days evenly", () => {
  for (const [start, count] of [
    ["2026-03-19T12:00:00", 136],
    ["2026-03-22T00:00:00", 120],
    ["2026-04-01T00:00:00", 41],
  ] as const) {
    const labels = dayLabels(steps(start, count, 3));
    for (const width of [133, 191, 298, 391, 421, 511, 624, 654, 741, 1042]) {
      const shown = shownLabels(labels, count, width);
      const at = `${start} ${width}`;
      expect(shown.length, at).toBeGreaterThanOrEqual(2);
      const gaps = shown.slice(1).map((label, k) => label.centre - shown[k].centre);
      expect(Math.min(...gaps), at).toBeGreaterThanOrEqual(labelSpace);
      for (const label of shown) {
        expect(label.centre - DAY_LABEL_WIDTH / 2, at).toBeGreaterThanOrEqual(0);
        expect(label.centre + DAY_LABEL_WIDTH / 2, at).toBeLessThanOrEqual(width);
      }
      const positions = shown.map((label) => labels.findIndex((day) => day.index === label.index));
      const stride = positions[1] - positions[0];
      expect(positions, at).toEqual(positions.map((_, j) => positions[0] + j * stride));
      expect(positions[0] % stride, at).toBe(0);
    }
  }
});

test("the cells of a strip are told apart by a white line only when they are wider than 2.5 px", () => {
  expect(separatedCells(6, 440)).toBe(true);
  expect(separatedCells(136, 440)).toBe(true);
  expect(separatedCells(136, 341)).toBe(true);
  expect(separatedCells(136, 340)).toBe(false);
  expect(separatedCells(136, 128)).toBe(false);
  expect(separatedCells(0, 440)).toBe(false);
});

test("the danger level series of an answer are the reading index's classes on the answer's steps", () => {
  const index = { depth: [10, 20], size_estimate: [2, 3], lower: [0.5, 0.6], mean: [0.7, 0.8], upper: [0.9, 1] };
  const classes = {
    bounds: [0.85, 0.78, 0.7],
    cuts: [2200],
    bands: [
      { count: [[1, 2]], size: [[2.5, null]] },
      { count: [[3, 4]], size: [[3.5, 4]] },
    ],
  };
  const answer = {
    timestamps: ["2026-04-04T00:00:00", "2026-04-04T03:00:00"],
    indexes: { Punstable: { ...index, classes }, sk38_ccl: index },
    applied: ["aspect"],
  };
  expect(dangerSeriesOf(answer, "Punstable")).toEqual({
    timestamps: answer.timestamps.map((timestamp) => new Date(`${timestamp}Z`)),
    ...classes,
    applied: ["aspect"],
  });
  expect(dangerSeriesOf(answer, "sk38_ccl")).toBe("none");
  expect(dangerSeriesOf(answer, "lwc")).toBe("none");
  expect(dangerSeriesOf({ timestamps: "not a list" }, "Punstable")).toBe("none");
});
