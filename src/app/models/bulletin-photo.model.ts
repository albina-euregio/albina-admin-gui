import { z } from "zod/v4";

const DateIsoString = z.iso.date();

export const BulletinPhotoSchema = z.object({
  id: z.string().nullish(),
  url: z.string(),
  copyright: z.string().nullish(),
  date: DateIsoString.nullish(),
  microregionId: z.string().nullish(),
  locationName: z.string().nullish(),
  latitude: z.number().nullish(),
  longitude: z.number().nullish(),
});

export type BulletinPhotoModel = z.infer<typeof BulletinPhotoSchema>;
