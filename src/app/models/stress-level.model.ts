import { z } from "zod";

const DateIsoString = z.iso.date();

export const StressLevelSchema = z.object({
  stressLevel: z.number(),
  date: DateIsoString.optional(),
});

export const TeamStressLevelsSchema = z.record(z.string().brand("user"), StressLevelSchema.array());

export type StressLevel = z.infer<typeof StressLevelSchema>;
export type TeamStressLevels = z.infer<typeof TeamStressLevelsSchema>;
