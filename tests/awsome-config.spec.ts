import { expect, test } from "@playwright/test";
import * as z from "zod/v4";

import { AwsomeConfigSchema } from "../src/app/modelling/awsome.config";
import example from "../src/app/modelling/awsome.json";
import checkedIn from "../src/app/modelling/awsome.schema.json";

/** The datetag filter of the live config, with the given dormantMenu value unless it is undefined. */
const datetag = (dormantMenu?: unknown) => ({
  type: "datetag",
  label: "Datetag",
  key: "snowpack.$stabilityIndex.instabilityDrivenBy",
  url: "api/locations",
  chartType: "bar",
  chartRichLabel: "label",
  values: [{ value: "new_snow", label: "Unburied new snow", color: "#ffde00" }],
  ...(dormantMenu === undefined ? {} : { dormantMenu }),
});
const bounds = [4000, 3200, 3000, 2800, 2600, 2400, 2200, 2000, 1800, 1600, 1400];
/** The elevation filter of the live config, with the given cuts unless they are undefined. */
const elevation = (cuts?: unknown) => ({
  type: "elevation",
  label: "Elevation",
  key: "elevation",
  chartType: "bar",
  chartRichLabel: "label",
  values: bounds.slice(1).map((low, i) => ({
    value: `${low}-${bounds[i]}`,
    numericRange: [low, bounds[i]],
    label: String(low / 100),
    color: "#0481FF",
  })),
  ...(cuts === undefined ? {} : { cuts }),
});
/** A minimal config around one filter. */
const config = (filter: object) => ({
  date: "2026-04-05T00:00:00",
  dateStepSeconds: 86400,
  filters: [filter],
  sources: [],
});

test("the dormantMenu flag survives parsing", () => {
  expect(AwsomeConfigSchema.parse(config(datetag(true))).filters[0].dormantMenu).toBe(true);
  expect(AwsomeConfigSchema.parse(config(datetag(false))).filters[0].dormantMenu).toBe(false);
  expect(AwsomeConfigSchema.parse(config(datetag())).filters[0]).not.toHaveProperty("dormantMenu");
});

test("a dormantMenu flag that is not a boolean is refused", () => {
  for (const flag of ["true", 1, null, {}]) {
    expect(AwsomeConfigSchema.safeParse(config(datetag(flag))).success).toBe(false);
  }
});

test("the JSON schema declares the filters as zod generates them, dormantMenu included", () => {
  const generated = z.toJSONSchema(AwsomeConfigSchema) as { properties: Record<string, unknown> };
  expect(checkedIn.properties.filters).toEqual(generated.properties.filters);
  expect(checkedIn.properties.filters.items.properties.dormantMenu.type).toBe("boolean");
});

test("the cuts of the elevation filter survive parsing", () => {
  expect(AwsomeConfigSchema.parse(config(elevation([2200]))).filters[0].cuts).toEqual([2200]);
  expect(AwsomeConfigSchema.parse(config(elevation([1800, 2400]))).filters[0].cuts).toEqual([1800, 2400]);
  expect(AwsomeConfigSchema.parse(config(elevation())).filters[0]).not.toHaveProperty("cuts");
  expect(AwsomeConfigSchema.parse(example).filters.find((f) => f.type === "elevation").cuts).toEqual([2200]);
});

test("cuts that no two consecutive rows share, that do not ascend, are no whole metres or too many are refused", () => {
  const issues = (cuts: unknown) => AwsomeConfigSchema.safeParse(config(elevation(cuts))).error?.issues ?? [];
  expect(issues([2150])).toEqual([
    expect.objectContaining({
      path: ["filters", 0, "cuts"],
      message:
        "cut 2150 is no bound that two consecutive values share (possible: 1600, 1800, 2000, 2200, 2400, 2600, 2800, 3000, 3200)",
    }),
  ]);
  expect(issues([2400, 1800]).map((issue) => issue.message)).toEqual(["cuts must ascend: 2400, 1800"]);
  for (const cuts of [[4000], [1400], [2200.5], [], [1800, 2200, 2600], ["2200"], 2200, null]) {
    expect(issues(cuts).length, JSON.stringify(cuts)).toBeGreaterThan(0);
  }
});

test("the JSON schema declares the cuts as whole numbers, one or two of them", () => {
  const cuts = checkedIn.properties.filters.items.properties.cuts;
  expect(cuts).toMatchObject({ type: "array", minItems: 1, maxItems: 2, items: { type: "integer" } });
});

test("dangerLevel: {} receives every default, and an absent dangerLevel stays absent", () => {
  const parsed = AwsomeConfigSchema.parse({ ...config(elevation([2200])), dangerLevel: {} });
  expect(parsed.dangerLevel).toEqual({
    frequencyBounds: { few: 0, some: 0.04, many: 0.2 },
    sizePercentile: 90,
    minCount: 1,
    minFeatures: 20,
    snowDepthKey: "snowpack.hs",
  });
  expect(AwsomeConfigSchema.parse(config(elevation([2200])))).not.toHaveProperty("dangerLevel");
  expect(AwsomeConfigSchema.parse(example).dangerLevel).toMatchObject({ sizePercentile: 90, minFeatures: 20 });
  const tuned = { frequencyBounds: { few: 0.01, some: 0.1, many: 0.3 }, sources: ["tirol25"] };
  expect(AwsomeConfigSchema.parse({ ...config(elevation()), dangerLevel: tuned }).dangerLevel).toMatchObject(tuned);
});

test("frequency bounds that do not rise or leave [0, 1], and percentiles or minima out of range, are refused", () => {
  const refused = (dangerLevel: unknown) =>
    !AwsomeConfigSchema.safeParse({ ...config(elevation()), dangerLevel }).success;
  for (const frequencyBounds of [
    { few: 0, some: 0.04 },
    { few: 0.04, some: 0.04, many: 0.2 },
    { few: 0, some: 0.2, many: 0.2 },
    { few: 0, some: 0.3, many: 0.2 },
    { few: -0.1, some: 0.04, many: 0.2 },
    { few: 0, some: 0.04, many: 1.2 },
  ]) {
    expect(refused({ frequencyBounds }), JSON.stringify(frequencyBounds)).toBe(true);
  }
  for (const dangerLevel of [
    { sizePercentile: 0 },
    { sizePercentile: 101 },
    { minCount: 0 },
    { minFeatures: 0 },
    { minFeatures: 2.5 },
    { sources: "tirol25" },
    { snowDepthKey: 3 },
    true,
    [],
  ]) {
    expect(refused(dangerLevel), JSON.stringify(dangerLevel)).toBe(true);
  }
  expect(refused({ sizePercentile: 100, minCount: 2, minFeatures: 1 })).toBe(false);
});

test("the JSON schema declares dangerLevel as zod generates it", () => {
  const generated = z.toJSONSchema(AwsomeConfigSchema) as { properties: Record<string, unknown> };
  expect(checkedIn.properties.dangerLevel).toEqual(generated.properties.dangerLevel);
  expect(checkedIn.properties.dangerLevel.properties.minFeatures).toMatchObject({ type: "integer", default: 20 });
});
