import { expect, test } from "@playwright/test";

import { DangerLevelSchema } from "../src/app/modelling/awsome.config";
import {
  bandNames,
  dangerBands,
  dangerNote,
  dangerPaint,
  type DangerProbe,
  type DangerSample,
  HIGHLIGHT_ONLY_COLOR,
  levelColor,
  levelStyle,
  MISSING_COLOR,
  NOTE_WORDS,
  planDanger,
  sampleOf,
  SNOW_DEPTH_KEY,
} from "../src/app/modelling/danger-paint";
import en from "../src/assets/i18n/en.json";

const cuts = [2200];
/** A probe of a snow-covered north slope at 2500 m whose Punstable reads 0.9 with size 3.4. */
const probe = (fields: Partial<DangerProbe> = {}): DangerProbe => ({
  key: "tirol25\nGRID_1",
  polygon: true,
  aspect: ["N"],
  elevation: 2500,
  snowDepth: 120,
  value: 0.9,
  size: 3.4,
  ...fields,
});
/** The features of one location: one copy per aspect, each a sample of its probe. */
const copies = (key: string, probes: Partial<DangerProbe>[]) =>
  new Map(probes.map((fields, i): [object, DangerSample] => [{ copy: i }, sampleOf(probe({ key, ...fields }), cuts)]));
/** The names of the bands of the cuts as the dashboard's English spells them. */
const englishNames = (bandCuts: readonly number[]) =>
  bandNames(bandCuts).map(({ key, params }) =>
    (en.awsome[key] as string).replace(/{{(\w+)}}/g, (_, name: string) => String(params[name])),
  );

test("a snow-covered slope with an aspect, an elevation and an index value is read in its band", () => {
  expect(sampleOf(probe(), cuts)).toEqual({
    key: "tirol25\nGRID_1",
    polygon: true,
    aspect: "N",
    band: 1,
    value: 0.9,
    size: 3.4,
  });
  expect(sampleOf(probe({ aspect: "N" }), cuts)).toEqual(sampleOf(probe(), cuts));
  expect(sampleOf(probe({ elevation: 2199 }), cuts).band).toBe(0);
  expect(sampleOf(probe({ aspect: ["NW", "N"] }), cuts).notRead).toBeUndefined();
  expect(sampleOf(probe({ aspect: ["NNE"] }), cuts).notRead).toBeUndefined();
  const sizeless = sampleOf(probe({ size: undefined }), cuts);
  expect(sizeless).toMatchObject({ value: 0.9, size: undefined });
  expect(sizeless.notRead).toBeUndefined();
  expect(sampleOf(probe({ snowDepth: undefined }), cuts).notRead).toBeUndefined();
});

test("a slope that cannot be read says why: flat, aspect, elevation, snow, index value", () => {
  expect(SNOW_DEPTH_KEY).toBe("snowpack.hs");
  expect(sampleOf(probe({ aspect: ["F"] }), cuts).notRead).toBe("flat");
  expect(sampleOf(probe({ aspect: undefined }), cuts).notRead).toBe("aspect");
  for (const aspect of ["SN", "EW", "NNN", "nan"])
    expect(sampleOf(probe({ aspect: [aspect] }), cuts).notRead).toBe("aspect");
  expect(sampleOf(probe({ elevation: undefined }), cuts)).toMatchObject({ notRead: "elevation", band: undefined });
  expect(sampleOf(probe({ snowDepth: 0 }), cuts)).toMatchObject({ notRead: "snow", band: 1 });
  expect(sampleOf(probe({ value: undefined }), cuts).notRead).toBe("value");
  expect(sampleOf(probe({ value: NaN }), cuts).notRead).toBe("value");
});

test("a read location is filled once in its band's level colour, its stacked copies stay clear in the same colour", () => {
  const samples = copies("tirol25\nGRID_1", [
    { aspect: ["N"] },
    { aspect: ["E"] },
    { aspect: ["S"], snowDepth: 0 },
    { aspect: ["W"] },
    { aspect: ["F"] },
  ]);
  const plan = planDanger(samples, [2, 4]);
  const paints = [...samples.keys()].map((feature) => dangerPaint(plan, feature, true));
  expect(paints[0]).toMatchObject({ color: levelColor(4), fillOpacity: 0.6, borderColor: levelColor(4), weight: 0.5 });
  for (const stacked of paints.slice(1)) {
    expect(stacked).toMatchObject({ color: levelColor(4), fillOpacity: 0, weight: 0 });
  }
  expect(paints.filter((paint) => paint.fillOpacity > 0)).toHaveLength(1);
});

test("the owner of a location is its first selected polygon, whatever its own reading", () => {
  const samples = copies("tirol25\nGRID_2", [{ aspect: ["F"] }, { aspect: ["N"] }]);
  const plan = planDanger(samples, [2, 4]);
  const [flat, north] = [...samples.keys()];
  expect(dangerPaint(plan, flat, true)).toMatchObject({ color: levelColor(4), fillOpacity: 0.6 });
  expect(dangerPaint(plan, north, true)).toMatchObject({ fillOpacity: 0, weight: 0 });
});

test("a selected location that is not read is outlined in its band's colour without a fill, points white", () => {
  const samples = copies("tirol25\nGRID_3", [{ aspect: ["F"], elevation: 1900 }]);
  const plan = planDanger(samples, [3, 5]);
  const [feature] = samples.keys();
  expect(dangerPaint(plan, feature, true)).toMatchObject({ fillOpacity: 0, borderColor: levelColor(3), weight: 1.5 });
  expect(dangerPaint(plan, feature, false)).toMatchObject({
    color: "#fff",
    borderColor: levelColor(3),
    borderWidth: 1.5,
  });
});

test("a feature that is only highlighted gets a grey outline without a fill", () => {
  const plan = planDanger(copies("tirol25\nGRID_1", [{}]), [1, 4]);
  expect(dangerPaint(plan, { highlighted: true }, true)).toMatchObject({
    fillOpacity: 0,
    borderColor: HIGHLIGHT_ONLY_COLOR,
    weight: 2,
  });
  expect(dangerPaint(plan, { highlighted: true }, false)).toMatchObject({
    color: "#fff",
    borderColor: HIGHLIGHT_ONLY_COLOR,
    borderWidth: 2,
  });
});

test("a band without a level paints its read locations missing grey at 0.3", () => {
  const plan = planDanger(copies("tirol25\nGRID_1", [{}]), [1, undefined]);
  const [feature] = plan.samples.keys();
  expect(dangerPaint(plan, feature, true)).toMatchObject({ color: MISSING_COLOR, fillOpacity: 0.3, weight: 0.5 });
});

test("every copy of a point location takes the location's paint, labels white on levels 4 and 5", () => {
  const samples = copies("tirol25_stations\nBrenner", [
    { polygon: false, aspect: ["N"] },
    { polygon: false, aspect: ["W"], snowDepth: 0 },
    { polygon: false, aspect: ["F"] },
  ]);
  for (const [level, labelColor] of [
    [4, "#fff"],
    [5, "#fff"],
    [3, "#000"],
  ] as const) {
    const plan = planDanger(samples, [1, level]);
    for (const feature of samples.keys()) {
      expect(dangerPaint(plan, feature, false)).toMatchObject({ color: levelColor(level), labelColor });
    }
  }
});

test("the levels take the dashboard's index class colours, level 5 black", () => {
  expect([1, 2, 3, 4, 5].map(levelColor)).toEqual(["#a6d96a", "#ffffbf", "#fdae61", "#d7191c", "#000000"]);
  expect(levelColor(undefined)).toBe(MISSING_COLOR);
});

test("a level takes white text on levels 4 and 5 only, the missing grey without a level", () => {
  expect([1, 2, 3, 4, 5].map((level) => levelStyle(level).white)).toEqual([false, false, false, true, true]);
  expect(levelStyle(4)).toEqual({ color: levelColor(4), white: true });
  expect(levelStyle(undefined)).toEqual({ color: MISSING_COLOR, white: false });
});

test("the tooltip note names the band and, with several copies, which aspects were read and why not", () => {
  const single = planDanger(copies("tirol25\nGRID_1", [{}]), [1, 4]);
  expect(dangerNote(single, [...single.samples.keys()][0], englishNames(cuts))).toBe("≥ 2200 m: read");
  const flat = planDanger(copies("tirol25\nGRID_9", [{ aspect: ["F"], elevation: 1500 }]), [1, 4]);
  expect(dangerNote(flat, [...flat.samples.keys()][0], englishNames(cuts))).toBe("< 2200 m: not read: flat");
  const several = planDanger(
    copies("tirol25\nGRID_1", [{ aspect: ["N"] }, { aspect: ["W"], snowDepth: 0 }, { aspect: ["F"] }]),
    [1, 4],
  );
  const notes = [...several.samples.keys()].map((feature) => dangerNote(several, feature, englishNames(cuts)));
  expect(new Set(notes)).toEqual(new Set(["≥ 2200 m: read N · not read: W no snow or no model output, F flat"]));
  expect(dangerNote(several, { highlighted: true }, englishNames(cuts))).toBeUndefined();
});

test("the tooltip note takes its words and band names in the dashboard's language", () => {
  const words = { ...NOTE_WORDS, read: "gelesen", "not read": "nicht gelesen", snow: "kein Schnee", flat: "flach" };
  const names = ["unter 2200 m", "ab 2200 m"];
  const several = planDanger(
    copies("tirol25\nGRID_1", [{ aspect: ["N"] }, { aspect: ["W"], snowDepth: 0 }, { aspect: ["F"] }]),
    [1, 4],
  );
  expect(dangerNote(several, [...several.samples.keys()][0], names, words)).toBe(
    "ab 2200 m: gelesen N · nicht gelesen: W kein Schnee, F flach",
  );
  const single = planDanger(copies("tirol25\nGRID_1", [{}]), [1, 4]);
  expect(dangerNote(single, [...single.samples.keys()][0], names, words)).toBe("ab 2200 m: gelesen");
});

test("the bands are named from the lowest up, as translation keys whose English is unchanged", () => {
  expect(bandNames([])).toEqual([{ key: "all elevations" }]);
  expect(bandNames([2200])).toEqual([
    { key: "< {{elevation}} m", params: { elevation: 2200 } },
    { key: "≥ {{elevation}} m", params: { elevation: 2200 } },
  ]);
  expect(englishNames([])).toEqual(["all elevations"]);
  expect(englishNames([2200])).toEqual(["< 2200 m", "≥ 2200 m"]);
  expect(englishNames([1800, 2400])).toEqual(["< 1800 m", "1800–2400 m", "≥ 2400 m"]);
});

test("dangerBands reads the samples read in each band and counts every sample with a band as selected", () => {
  const calibration = DangerLevelSchema.parse({ frequencyBounds: { few: 0, some: 0.04, many: 0.2 } });
  const punstable = [1, 0.85, 0.78, 0.7, 0];
  const samples = [
    sampleOf(probe(), cuts),
    sampleOf(probe({ value: 0.5, size: 1 }), cuts),
    sampleOf(probe({ aspect: ["F"] }), cuts),
    sampleOf(probe({ elevation: 1500, value: 0.5 }), cuts),
    sampleOf(probe({ elevation: undefined }), cuts),
  ];
  const [below, above] = dangerBands(samples, cuts, punstable, calibration);
  expect(below).toMatchObject({ name: bandNames(cuts)[0], band: 0, edges: [undefined, 2200], selected: 1 });
  expect(below.reading).toMatchObject({ total: 1, counts: [0, 0, 0, 1], stability: "good", levels: [1] });
  expect(above).toMatchObject({ name: bandNames(cuts)[1], band: 1, edges: [2200, undefined], selected: 3 });
  expect(above.reading).toMatchObject({
    total: 2,
    counts: [1, 0, 0, 1],
    stability: "very poor",
    frequency: "many",
    sizeClass: 3,
    levels: [4],
  });
  const [all] = dangerBands([], [], punstable, calibration);
  expect(all).toMatchObject({ name: { key: "all elevations" }, edges: [undefined, undefined], selected: 0 });
  expect(all.reading).toMatchObject({ total: 0, reason: "nothing" });
});
