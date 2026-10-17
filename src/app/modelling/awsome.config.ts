import * as z from "zod/v4";

import { FilterSelectionSpecSchema, UrlSchema } from "../observations/filter-selection-config";
import { cutProblems, MAX_CUTS } from "./elevation-cut";

export const AwsomeSourceSchema = z.object({
  name: z
    .string()
    .optional()
    .describe(
      "The recipe the source comes from, for instance tirol25: its folder under the simulation tree, its label in the source menu and its name in the API",
    ),
  group: z
    .string()
    .optional()
    .describe(
      "Where the source sits in the source menu, nested with slashes such as Tirol/Gridded; top level when absent",
    ),
  url: UrlSchema.optional().describe(
    "URL to GeoJSON FeatureCollection. Timestamps in the format 2023-11-12_06-00-00 are evaluated.",
  ),
  detailsTemplates: z
    .object({
      label: z.string().optional(),
      template: z.string().optional(),
    })
    .array()
    .default(() => [])
    .describe(
      "Template for details HTML. The details are shown in the sidebar after clicking an marker on the map. Placeholders such as `{path.to.variable.in.json}` are evaluated relative to the `properties` of a GeoJSON Feature.",
    ),
  tooltipTemplate: z
    .string()
    .optional()
    .describe(
      "Template for tooltip HTML. Tooltip is shown when hovering the marker on the map. Placeholders such as `{path.to.variable.in.json}` are evaluated relative to the `properties` of a GeoJSON Feature.",
    ),
  borderColor: z
    .string()
    .optional()
    .describe("Border stroke color of this source's markers, overrides the filter value's"),
  borderWidth: z
    .number()
    .optional()
    .describe("Border stroke width of this source's markers, overrides the filter value's"),
  borderDashArray: z
    .string()
    .optional()
    .describe(
      "Border stroke dash-array of this source's markers, overrides the filter value's, see https://developer.mozilla.org/en-US/docs/Web/CSS/stroke-dasharray",
    ),
  imageOverlays: z
    .object({
      name: z.string().describe("Identifier shown in map layer control"),
      imageUrl: UrlSchema,
      imageBounds: z
        .number()
        .array()
        .min(2)
        .max(2)
        .array()
        .min(2)
        .max(2)
        .describe(
          "Image bounds such as " +
            JSON.stringify([
              [40.712, -74.227],
              [40.774, -74.125],
            ]),
        ),
      opacity: z.number().optional().describe("The opacity of the image overlay."),
      zIndex: z.number().optional().describe("The explicit zIndex of the overlay layer."),
      className: z.string().default("").describe("A custom class name to assign to the image. Empty by default."),
    })
    .array()
    .optional()
    .describe("Image overlays to be shown on the map."),
});
export type AwsomeSource = z.infer<typeof AwsomeSourceSchema>;

export const AwsomeFilterSchema = FilterSelectionSpecSchema.extend({
  dormantMenu: z
    .boolean()
    .optional()
    .describe(
      "On the datetag filter (type `datetag`): a menu in its chart header sets dates dormant. The filter and its chart stop offering a dormant date and count the features it drives as without specification; these stay on the map without a datetag marker label, and tooltips, the hazard chart and the timeseries keep the date. Every dashboard reads the list from `dormant_datetags.json` next to its config (when it cannot be read, nothing is dormant); only a dashboard with this flag shows the menu, which saves the list through `api/dormant-datetags`.",
    ),
  cuts: z
    .number()
    .int()
    .array()
    .min(1)
    .max(MAX_CUTS)
    .optional()
    .describe(
      "On the elevation filter (type `elevation`): one or two elevations in whole metres, ascending, that split its rows into bands; each must be a bound that two consecutive values share. While the filter is shown as a bar chart whose rows run from the highest down and fit the chart, a slider beside it moves the cuts from row bound to row bound (an end of the slider means no split), and a click between the cuts selects the rows of that band. A link carries cuts that differ from these as `cut`.",
    ),
}).superRefine(({ cuts, values }, ctx) => {
  for (const message of cutProblems(cuts ?? [], values)) ctx.addIssue({ code: "custom", path: ["cuts"], message });
});

export const DangerLevelSchema = z
  .object({
    frequencyBounds: z
      .object({
        few: z.number().min(0).max(1),
        some: z.number().min(0).max(1),
        many: z.number().min(0).max(1),
      })
      .refine(({ few, some, many }) => few < some && some < many, {
        message: "frequency bounds must rise: few < some < many",
      })
      .describe("Shares of a band's read slopes from which a stability class counts as a few (above few), some (from some) and many (above many), as numbers: the publisher writes them out from its named presets"),
    sizePercentile: z
      .number()
      .gt(0)
      .max(100)
      .default(90)
      .describe(
        "Percentile of the decisive class's size estimates taken as the largest avalanche size to be reckoned with (numpy's method lower)",
      ),
    minCount: z
      .number()
      .int()
      .min(1)
      .default(1)
      .describe("Fewest slopes a stability class needs to count as more than none or nearly none"),
    minFeatures: z.number().int().min(1).default(20).describe("Fewest read slopes a band needs for a danger level"),
    sources: z
      .string()
      .array()
      .optional()
      .describe("Names of the sources whose features are read; every active source when absent"),
    snowDepthKey: z
      .string()
      .default("snowpack.hs")
      .describe("Key of the snow depth; a feature whose snow depth is 0 (no snow or no model output) is not read"),
  })
  .describe(
    "Offers the danger level view: a button beside the share button reads the selected features that have an aspect against the EAWS matrix, once per elevation band of the elevation filter's cuts, from the classifying stability index (else the default one) and the hazard chart's size, shows the matrix in place of the hazard chart and paints the map by band. The settings are uncalibrated defaults.",
  );

const ConfigDateSchema = z.union([z.string().regex(/^now(?:[+-]\d+[hd])?$/), z.iso.datetime({ local: true })]);

export const AwsomeConfigSchema = z.object({
  $schema: UrlSchema.optional().describe("URL of JSON Schema awsome.schema.json"),
  date: ConfigDateSchema.describe(
    "Initial date/time when opening the dashboard; `now` opens it at the latest time on the dateStepSeconds grid before the current time",
  ),
  dateMax: ConfigDateSchema.optional().describe(
    "Last date/time the dashboard offers; `now` or `now+48h` for a time relative to now",
  ),
  dateMin: ConfigDateSchema.optional().describe("First date/time the dashboard offers; `now-14d` for a rolling window"),
  dateStepSeconds: z.number().describe("Seconds between two models runs"),
  filters: AwsomeFilterSchema.array(),
  sources: AwsomeSourceSchema.array(),
  mapCenter: z
    .number()
    .array()
    .min(3)
    .max(3)
    .describe("Map center given as [latitude, longitude, zoom]")
    .default(() => [47.3, 11.3, 8]),
  regions: z
    .object({
      url: UrlSchema.describe(
        "URL to GeoJSON FeatureCollection for micro-region polygons. " +
          "For instance, https://regions.avalanches.org/micro-regions/latest/AT-07_micro-regions.geojson.json",
      ),
    })
    .partial()
    .optional(),
  hazardChart: z
    .object({
      xType: z.string().default("size_estimate"),
      xAxisLabels: z.number().array().optional().describe("Array of axis labels (indexed by the value)"),
    })
    .default({ xType: "size_estimate" }),
  timeseriesChart: z
    .object({
      url: UrlSchema.optional(),
    })
    .optional(),
  dangerLevel: DangerLevelSchema.optional(),
});
export type AwsomeConfig = z.infer<typeof AwsomeConfigSchema>;
export type DangerLevelConfig = z.infer<typeof DangerLevelSchema>;
