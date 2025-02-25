import * as z from "zod";
import { FilterSelectionSpecSchema } from "../observations/filter-selection-config";

export const AwsomeSourceSchema = z.object({
  name: z.string().optional().describe("Identifier shown in source multiselect"),
  url: z
    .string()
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
});
export type AwsomeSource = z.infer<typeof AwsomeSourceSchema>;

export const AwsomeConfigSchema = z.object({
  date: z.string().describe("Initial date/time when opening the dashboard"),
  dateMax: z.string().optional(),
  dateMin: z.string().optional(),
  dateStepSeconds: z.number().describe("Seconds between two models runs"),
  filters: z.array(FilterSelectionSpecSchema),
  sources: z.array(AwsomeSourceSchema),
});
export type AwsomeConfig = z.infer<typeof AwsomeConfigSchema>;
