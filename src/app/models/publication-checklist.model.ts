import { z } from "zod/v4";

import { BulletinStatus, PublicationChannel } from "../enums/enums";
import { DateSchema } from "./bulletin.model";

export const ChecklistItemSchema = z.object({
  publicationChannel: z.enum(PublicationChannel),
  title: z.string(),
  ok: z.boolean().optional(),
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
  isBeingPublished: z.boolean().optional(),
});

export type PublicationStatusModel = z.infer<typeof PublicationStatusSchema>;
