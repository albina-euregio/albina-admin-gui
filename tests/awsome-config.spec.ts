import { expect, test } from "@playwright/test";
import * as z from "zod/v4";

import { AwsomeConfigSchema } from "../src/app/modelling/awsome.config";
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
