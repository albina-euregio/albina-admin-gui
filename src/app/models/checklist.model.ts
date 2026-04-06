import { z } from "zod/v4";

export const ChecklistItemSchema = z.object({
  title: z.string(),
  link: z.string().optional(),
  description: z.string(),
  ok: z.boolean(),
  problem: z.boolean(),
  problemDescription: z.string(),
});

export type ChecklistItemModel = z.infer<typeof ChecklistItemSchema>;
