import { z } from "zod/v4";

import { BulletinStatus } from "../enums/enums";
import { DateSchema } from "./bulletin.model";

export const ChecklistItemSchema = z.object({
  title: z.string(),
  link: z.string().optional(),
  description: z.string(),
  ok: z.boolean(),
  problem: z.boolean(),
  problemDescription: z.string(),
});

export type ChecklistItemModel = z.infer<typeof ChecklistItemSchema>;

const PublicationBulletinStatusSchema = z.preprocess((value) => {
  if (typeof value === "string") {
    return BulletinStatus[value as keyof typeof BulletinStatus];
  }
  return value;
}, z.enum(BulletinStatus));

// public record Status(Instant date, Instant timestamp, BulletinStatus status, Boolean isBeingPublished) {
export const PublicationStatusSchema = z.object({
  date: DateSchema.nullish(),
  timestamp: DateSchema.nullish(),
  status: PublicationBulletinStatusSchema,
  isBeingPublished: z.boolean(),
});

export type PublicationStatusModel = z.infer<typeof PublicationStatusSchema>;
