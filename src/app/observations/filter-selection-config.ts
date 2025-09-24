import * as z from "zod/v4";

export const FilterSelectionValueSchema = z.object({
  borderColor: z.string().optional().describe("Stroke color"),
  color: z.string().describe("Fill color"),
  label: z.string().describe("Label string shown inside the marker"),
  labelColor: z.string().default("#000").optional().describe("Label color"),
  labelFontSize: z.number().default(12).optional().describe("Label font size, in pt"),
  legend: z.string().describe("Legend string shown in the chart"),
  numericRange: z
    .array(z.number())
    .min(2)
    .max(2)
    .optional()
    .describe(
      "An interval given as array of [lower bound, upper bound] where the lower bound is inclusive and the upper bound is exclusive",
    ),
  opacity: z.number().default(1).optional().describe("Marker opacity"),
  fillOpacity: z.number().default(0.8).optional().describe("Polygon fill opacity"),
  radius: z.number().default(40).optional().describe("Radius of the circle marker, in pixels"),
  radiusByZoom: z
    .array(z.number())
    .min(19)
    .max(19)
    .optional()
    .describe("Radius of the circle marker, as array indexed by the map zoom level"),
  value: z.string(),
  weight: z.number().default(0).optional().describe("Stroke width, in pixels"),
  zIndexOffset: z.number().default(0).optional().describe("The explicit zIndex of this marker"),
});
export type FilterSelectionValue = z.infer<typeof FilterSelectionValueSchema>;

export const FilterSelectionSpecSchema = z.object({
  chartRichLabel: z.enum(["grainShape", "highlight", "label", "symbol"]),
  chartType: z.enum(["bar", "rose"]),
  chartAxisRange: z
    .number()
    .array()
    .min(2)
    .max(2)
    .optional()
    .describe("Min and max value for chart range when plotting values on a parametric chart"),
  default: z.enum(["classify", "label"]).optional(),
  key: z
    .string()
    .describe(
      "Key name defining how to obtain the value from a GeoJSON Feature representing this filter, such as `path.to.variable.in.json`, evaluated relative to the `properties` of a GeoJSON Feature.",
    ),
  label: z.string().describe("Label text shown in the chart"),
  selectedValues: z
    .array(z.string())
    .optional()
    .describe("Initially selected values, use 'nan' for features w/o specification"),
  type: z.string().describe("Identifier for this filter"),
  url: z
    .url()
    .optional()
    .describe("URL to GeoJSON FeatureCollection. Timestamps in the format 2023-11-12_06-00-00 are evaluated."),
  values: z.array(FilterSelectionValueSchema),
});
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const FilterSelectionSpecSchemaNoKey = FilterSelectionSpecSchema.omit({ key: true });
export type FilterSelectionSpec<T> = z.infer<typeof FilterSelectionSpecSchemaNoKey> & {
  key: keyof T; // how to extract data
};
