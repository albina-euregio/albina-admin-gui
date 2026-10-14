import { expect, test } from "@playwright/test";

import {
  bandEdges,
  bandValues,
  cutParam,
  cutProblems,
  cutsFromParam,
  cutStops,
  followBands,
  holdsAll,
  isSplit,
  nearestStop,
  sharedBounds,
  sliderStops,
  staysSplit,
  stepStop,
  stopAtPointer,
  stopCode,
  thumbRange,
} from "../src/app/modelling/elevation-cut";

const bounds = [4000, 3200, 3000, 2800, 2600, 2400, 2200, 2000, 1800, 1600, 1400];
const live = bounds.slice(1).map((low, i) => ({ value: `${low}-${bounds[i]}`, numericRange: [low, bounds[i]] }));
const values = live.map((row) => row.value);
const stops = cutStops(live);
const splits = stops.filter((stop) => isSplit(stops, stop));
const chart = { rows: 11, gridTop: 5, labelOffset: 14 };
/** The rows as a set. */
const rowsOf = (...rows: string[]) => new Set(rows);

test("the stops of the live elevation rows are their bounds from 4000 m down to 1400 m", () => {
  expect(stops).toEqual(bounds);
  expect(sharedBounds(live)).toEqual(bounds.slice(1, -1));
  expect(splits).toEqual(bounds.slice(1, -1));
});

test("a slider needs a shown bar chart whose rows have ranges, chain downwards and fit the chart", () => {
  const bar = { chartType: "bar", values: live };
  expect(sliderStops(bar, 11)).toEqual(bounds);
  expect(sliderStops(bar, 10)).toEqual(bounds);
  expect(sliderStops(bar, 9)).toBeUndefined();
  expect(sliderStops({ ...bar, chartType: "rose" }, 11)).toBeUndefined();
  expect(sliderStops({ ...bar, hidden: true }, 11)).toBeUndefined();
  expect(sliderStops({ ...bar, values: [...live, { value: "nan" }] }, 11)).toBeUndefined();
  expect(sliderStops({ ...bar, values: [...live].reverse() }, 11)).toBeUndefined();
  const gap = live.filter((row) => row.value !== "2200-2400");
  expect(sliderStops({ ...bar, values: gap }, 11)).toBeUndefined();
});

test("a value snaps to the nearest stop, upwards on a tie", () => {
  expect(nearestStop(splits, 2150)).toBe(2200);
  expect(nearestStop(splits, 2100)).toBe(2200);
  expect(nearestStop(splits, 2099)).toBe(2000);
  expect(nearestStop(splits, 5000)).toBe(3200);
  expect(nearestStop(splits, 0)).toBe(1600);
});

test("every split puts each row wholly into the band below it or the band above it", () => {
  for (const split of splits) {
    const [below, above] = bandValues(live, stops, [split]);
    expect(below.length).toBeGreaterThan(0);
    expect(above.length).toBeGreaterThan(0);
    expect([...above, ...below]).toEqual(values);
    for (const row of live) {
      expect(below.includes(row.value)).toBe(row.numericRange[1] <= split);
      expect(above.includes(row.value)).toBe(row.numericRange[0] >= split);
    }
  }
});

test("a cut at an end of the slider splits nothing and the link says none", () => {
  expect(bandValues(live, stops, [1400])).toEqual([[], values]);
  expect(bandValues(live, stops, [4000])).toEqual([values, []]);
  expect(bandEdges(stops, [1400, 4000])).toEqual([
    [1400, 1400],
    [1400, 4000],
    [4000, 4000],
  ]);
  expect(cutParam(stops, [1400])).toBe("none");
  expect(cutParam(stops, [4000])).toBe("none");
  expect(cutParam(stops, [1400, 4000])).toBe("none");
  expect(cutParam(stops, [1400, 2400])).toBe("2400");
  expect(cutParam(stops, [1800, 2400])).toBe("1800,2400");
});

test("two cuts make three bands", () => {
  expect(bandEdges(stops, [1800, 2400])).toEqual([
    [1400, 1800],
    [1800, 2400],
    [2400, 4000],
  ]);
  expect(bandValues(live, stops, [1800, 2400])).toEqual([
    ["1600-1800", "1400-1600"],
    ["2200-2400", "2000-2200", "1800-2000"],
    ["3200-4000", "3000-3200", "2800-3000", "2600-2800", "2400-2600"],
  ]);
});

test("a link snaps its cuts, parks the thumbs for none and is ignored when malformed", () => {
  expect(cutsFromParam("2150", stops, [2200])).toEqual([2200]);
  expect(cutsFromParam("2400", stops, [2200])).toEqual([2400]);
  expect(cutsFromParam("1800,2400", stops, [2200])).toEqual([1800, 2400]);
  expect(cutsFromParam("2150,2190", stops, [2200])).toEqual([2200]);
  expect(cutsFromParam("2200", stops, [1800, 2400])).toEqual([2200]);
  expect(cutsFromParam("4000", stops, [2200])).toEqual([3200]);
  expect(cutsFromParam("1400", stops, [2200])).toEqual([1600]);
  expect(cutsFromParam("none", stops, [2200])).toEqual([1400]);
  expect(cutsFromParam("none", stops, [1800, 2400])).toEqual([1400, 4000]);
  for (const raw of [
    "",
    " 2200",
    "2200,",
    ",2200",
    "-100",
    "22.5",
    "2e3",
    "2400,1800",
    "2200,2200",
    "1800,2200,2600",
  ]) {
    expect(cutsFromParam(raw, stops, [2200]), raw).toBeUndefined();
  }
  for (const raw of ["NONE", "none,2200", "abc"]) expect(cutsFromParam(raw, stops, [2200]), raw).toBeUndefined();
});

test("a thumb keeps at least one row between itself and its neighbours", () => {
  expect(thumbRange(stops, [2200], 0)).toEqual([0, 10]);
  expect(thumbRange(stops, [1800, 2400], 0)).toEqual([6, 10]);
  expect(thumbRange(stops, [1800, 2400], 1)).toEqual([0, 7]);
  expect(thumbRange(stops, [1400, 1600], 1)).toEqual([0, 9]);
});

test("keys move a thumb one stop, two stops or to an end of its range, other keys not at all", () => {
  const range: [number, number] = [0, 10];
  expect(stepStop("ArrowUp", 6, range)).toBe(5);
  expect(stepStop("ArrowRight", 6, range)).toBe(5);
  expect(stepStop("ArrowDown", 6, range)).toBe(7);
  expect(stepStop("ArrowLeft", 6, range)).toBe(7);
  expect(stepStop("PageUp", 6, range)).toBe(4);
  expect(stepStop("PageDown", 6, range)).toBe(8);
  expect(stepStop("Home", 6, range)).toBe(10);
  expect(stepStop("End", 6, range)).toBe(0);
  expect(stepStop("ArrowUp", 0, range)).toBe(0);
  expect(stepStop("PageDown", 9, range)).toBe(10);
  expect(stepStop("PageUp", 7, [6, 10])).toBe(6);
  expect(stepStop("Home", 7, [6, 9])).toBe(9);
  for (const key of ["Tab", "Enter", " ", "a", "Escape"]) expect(stepStop(key, 6, range), key).toBeUndefined();
});

test("a pointer snaps to the stop nearest it, in a host of any height", () => {
  for (const height of [300, 400]) {
    const row = (height - chart.gridTop) / chart.rows;
    const at = (stop: number) => chart.gridTop + stop * row - chart.labelOffset / 2;
    for (let stop = 0; stop <= 10; stop++) {
      expect(stopAtPointer(at(stop), height, chart)).toBe(stop);
      expect(stopAtPointer(at(stop) + 13, height, chart)).toBe(stop);
      expect(stopAtPointer(at(stop) - 13, height, chart)).toBe(stop);
    }
    expect(stopAtPointer(at(6) + 0.4 * row, height, chart)).toBe(6);
    expect(stopAtPointer(at(6) + 0.6 * row, height, chart)).toBe(7);
  }
  expect(stopAtPointer(-2, 300, chart)).toBe(0);
  expect(stopAtPointer(-40, 300, chart)).toBe(0);
  expect(stopAtPointer(158.909, 300, chart)).toBe(6);
});

test("a band whose rows were all selected keeps all its rows when its cut moves", () => {
  const before = bandValues(live, stops, [2200]);
  const after = bandValues(live, stops, [2400]);
  expect(followBands(new Set(before[0]), before, after)).toEqual(new Set(after[0]));
  expect(followBands(new Set([...before[0], "nan"]), before, after)).toEqual(new Set([...after[0], "nan"]));
  expect(followBands(new Set([...before[1], "1400-1600"]), before, after)).toEqual(new Set([...after[1], "1400-1600"]));
  expect(followBands(rowsOf("2000-2200"), before, after)).toBeUndefined();
  expect(followBands(new Set(values), before, after)).toBeUndefined();
  expect(followBands(new Set(), before, after)).toBeUndefined();
});

test("bands follow a cut only while every thumb that moved goes from a split to a split", () => {
  expect(staysSplit(stops, [2200], [2400])).toBe(true);
  expect(staysSplit(stops, [2200], [2200])).toBe(true);
  expect(staysSplit(stops, [2200], [1400])).toBe(false);
  expect(staysSplit(stops, [2200], [4000])).toBe(false);
  expect(staysSplit(stops, [1400], [1600])).toBe(false);
  expect(staysSplit(stops, [4000], [3200])).toBe(false);
  expect(staysSplit(stops, [1400, 2400], [1400, 2600])).toBe(true);
  expect(staysSplit(stops, [1800, 2400], [1800, 4000])).toBe(false);
  expect(staysSplit(stops, [1400, 4000], [1600, 4000])).toBe(false);
});

test("a band counts as held only when it has rows and the set holds every one of them", () => {
  expect(holdsAll(rowsOf("a", "b", "nan"), ["a", "b"])).toBe(true);
  expect(holdsAll(rowsOf("a"), ["a", "b"])).toBe(false);
  expect(holdsAll(rowsOf("a"), [])).toBe(false);
});

test("cuts must be bounds that two consecutive values share, in ascending order", () => {
  expect(cutProblems([2200], live)).toEqual([]);
  expect(cutProblems([1800, 2400], live)).toEqual([]);
  for (const cut of [2150, 4000, 1400, 0]) {
    const problems = cutProblems([cut], live);
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain(`cut ${cut} `);
    expect(problems[0]).toContain("1600, 1800, 2000, 2200, 2400, 2600, 2800, 3000, 3200");
  }
  expect(cutProblems([2400, 1800], live)).toEqual(["cuts must ascend: 2400, 1800"]);
  expect(cutProblems([2200, 2200], live)).toEqual(["cuts must ascend: 2200, 2200"]);
  expect(cutProblems([2200], [{ value: "a" }, { value: "b" }])[0]).toContain("possible: none");
});

test("a thumb shows its stop in hundreds of metres", () => {
  expect(stopCode(2200)).toBe("22");
  expect(stopCode(1400)).toBe("14");
  expect(stopCode(2150)).toBe("21.5");
});
