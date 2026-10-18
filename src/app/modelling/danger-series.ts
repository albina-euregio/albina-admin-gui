import * as z from "zod/v4";

const IndexSchema = z.object({
  depth: z.number().nullish().array(),
  size_estimate: z.number().nullish().array(),
  lower: z.number().nullish().array(),
  lower2: z.number().nullish().array().optional(),
  mean: z.number().nullish().array(),
  upper: z.number().nullish().array(),
  upper2: z.number().nullish().array().optional(),
});
export const TimeseriesSchema = z.object({
  indexes: z.record(z.string(), IndexSchema),
  timestamps: z.coerce.date().array(),
});
export type Timeseries = z.infer<typeof TimeseriesSchema>;
const ClassesSchema = z.object({
  bounds: z.number().array(),
  cuts: z.number().array(),
  bands: z
    .object({
      count: z.number().array().array(),
      size: z.number().nullable().array().array(),
    })
    .array(),
});
const DangerSeriesAnswerSchema = TimeseriesSchema.extend({
  indexes: z.record(z.string(), IndexSchema.extend({ classes: ClassesSchema.optional() })),
  applied: z.string().array().optional(),
});
export type DangerSeries = z.infer<typeof ClassesSchema> &
  Pick<z.infer<typeof DangerSeriesAnswerSchema>, "timestamps" | "applied">;

/** The danger level series in an API answer, none when the answer carries no classes of the reading index. */
export function dangerSeriesOf(body: unknown, index: string): DangerSeries | "none" {
  const parsed = DangerSeriesAnswerSchema.safeParse(body);
  if (!parsed.success) console.warn("Failed to parse the danger level series", parsed.error);
  const classes = parsed.data?.indexes[index]?.classes;
  if (!classes) return "none";
  const { bounds, cuts, bands } = classes;
  return { timestamps: parsed.data.timestamps, bounds, cuts, bands, applied: parsed.data.applied };
}
