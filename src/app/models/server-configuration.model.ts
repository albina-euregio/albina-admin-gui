import { z } from "zod/v4";

export const LocalServerConfigurationSchema = z.object({
  publishAt5PM: z.boolean(),
  publishAt8AM: z.boolean(),
  pdfDirectory: z.string().nullish(),
  htmlDirectory: z.string().nullish(),
  mapsPath: z.string().nullish(),
  mediaPath: z.string().nullish(),
  mapProductionUrl: z.string().nullish(),
  serverImagesUrl: z.string().nullish(),
});
export type LocalServerConfiguration = z.infer<typeof LocalServerConfigurationSchema>;

export const ServerConfigurationSchema = z.object({
  id: z.any().nullish(),
  name: z.string(),
  apiUrl: z.url().nullish(),
  userName: z.string().nullish(),
  password: z.string().nullish(),
  externalServer: z.boolean().default(true),
});
export type ServerConfiguration = z.infer<typeof ServerConfigurationSchema>;

export const ServerVersionInfoSchema = z.object({
  version: z.string(),
});
export type ServerVersionInfo = z.infer<typeof ServerVersionInfoSchema>;
