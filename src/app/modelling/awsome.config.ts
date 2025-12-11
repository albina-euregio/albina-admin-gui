import { FilterSelectionSpecSchema } from "../observations/filter-selection-config";
import * as z from "zod/v4";

const url = z.union([z.url().describe("Absolute URL"), z.string().describe("Relative URL")]);

export const AwsomeSourceSchema = z.object({
  name: z.string().optional().describe("Identifier shown in source multiselect"),
  domain: z.string().optional().describe("Domain identifier used in AWSOME, for instance tirol24"),
  toolchain: z.string().optional().describe("Toolchain identifier used in AWSOME, for instance gridded-chain"),
  url: url
    .optional()
    .describe("URL to GeoJSON FeatureCollection. Timestamps in the format 2023-11-12_06-00-00 are evaluated."),
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
  imageOverlays: z
    .object({
      name: z.string().describe("Identifier shown in map layer control"),
      imageUrl: url,
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

export const AwsomeConfigSchema = z.object({
  $schema: url.optional().describe("URL of JSON Schema awsome.schema.json"),
  date: z.string().describe("Initial date/time when opening the dashboard"),
  dateMax: z.string().optional(),
  dateMin: z.string().optional(),
  dateStepSeconds: z.number().describe("Seconds between two models runs"),
  filters: FilterSelectionSpecSchema.array(),
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
      url: url.describe(
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
      url: url.optional(),
    })
    .optional(),
});
export type AwsomeConfig = z.infer<typeof AwsomeConfigSchema>;
