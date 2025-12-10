import { z } from "zod/v4";

export const StatusInformationSchema = z.object({
  ok: z.boolean(),
  message: z.string().nullish(),
});

export type StatusInformationModel = z.infer<typeof StatusInformationSchema>;
