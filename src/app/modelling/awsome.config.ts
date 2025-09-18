import { FilterSelectionSpecSchema } from "../observations/filter-selection-config";
import * as z from "zod/v4";

export const AwsomeSourceSchema = z.object({
  name: z.string().optional().describe("Identifier shown in source multiselect"),
  url: z
    .url()
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
      imageUrl: z.url(),
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
  date: z.string().describe("Initial date/time when opening the dashboard"),
  dateMax: z.string().optional(),
  dateMin: z.string().optional(),
  dateStepSeconds: z.number().describe("Seconds between two models runs"),
  filters: z.array(FilterSelectionSpecSchema),
  sources: z.array(AwsomeSourceSchema),
  regions: z
    .object({
      url: z
        .url()
        .describe(
          "URL to GeoJSON FeatureCollection for micro-region polygons. " +
            "For instance, https://regions.avalanches.org/micro-regions/latest/AT-07_micro-regions.geojson.json",
        ),
    })
    .partial()
    .optional(),
  depth: z
    .object({
      chartAxisRange: z
        .number()
        .array()
        .min(2)
        .max(2)
        .optional()
        .describe("Min and max value for chart range when plotting values on a parametric chart"),
    })
    .optional(),
});
export type AwsomeConfig = z.infer<typeof AwsomeConfigSchema>;
