import * as z from "zod/v4";

export const UrlSchema = z.union([z.url().describe("Absolute URL"), z.string().describe("Relative URL")]);

export const FilterSelectionValueSchema = z.object({
  borderColor: z.string().optional().describe("Border stroke color"),
  borderWidth: z.number().default(2).optional().describe("Border stroke width"),
  borderDashArray: z
    .string()
    .default("")
    .optional()
    .describe("Border stroke dash-array, see https://developer.mozilla.org/en-US/docs/Web/CSS/stroke-dasharray"),
  color: z.string().describe("Fill color"),
  label: z.string().describe("Label string shown inside the marker"),
  labelI18nKey: z
    .string()
    .optional()
    .describe(
      "Key in https://gitlab.com/albina-euregio/albina-admin-gui/-/blob/master/src/assets/i18n/en.json used for i18n (internationalization)",
    ),
  labelColor: z.string().default("#000").optional().describe("Label color"),
  labelFontSize: z.number().default(12).optional().describe("Label font size, in pt"),
  legend: z.string().optional().describe("Legend string shown in the chart, defaults to label"),
  numericRange: z
    .number()
    .array()
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
    .number()
    .array()
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
  labelI18nKey: z
    .string()
    .optional()
    .describe(
      "Key in https://gitlab.com/albina-euregio/albina-admin-gui/-/blob/master/src/assets/i18n/en.json used for i18n (internationalization)",
    ),
  selectedValues: z
    .string()
    .array()
    .optional()
    .describe("Initially selected values, use 'nan' for features w/o specification"),
  stabilityIndex: z.boolean().optional().describe("Whether this filter represents a snowpack stability index"),
  type: z.string().describe("Identifier for this filter"),
  url: UrlSchema.optional().describe(
    "URL to GeoJSON FeatureCollection. Timestamps in the format 2023-11-12_06-00-00 are evaluated.",
  ),
  values: FilterSelectionValueSchema.array(),
});
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const FilterSelectionSpecSchemaNoKey = FilterSelectionSpecSchema.omit({ key: true });
export type FilterSelectionSpec<T> = z.infer<typeof FilterSelectionSpecSchemaNoKey> & {
  key: keyof T; // how to extract data
};
