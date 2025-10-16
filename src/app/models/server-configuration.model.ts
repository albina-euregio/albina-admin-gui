import { z } from "zod/v4";

export const ServerConfigurationSchema = z
  .object({
    id: z.any(),
    name: z.string(),
    apiUrl: z.url().nullish(),
    userName: z.string().nullish(),
    password: z.string().nullish(),
    externalServer: z.boolean(),
    publishAt5PM: z.boolean(),
    publishAt8AM: z.boolean(),
    pdfDirectory: z.string().nullish(),
    htmlDirectory: z.string().nullish(),
    mapsPath: z.string().nullish(),
    mediaPath: z.string().nullish(),
    mapProductionUrl: z.string().nullish(),
    serverImagesUrl: z.string().nullish(),
    dangerLevelElevationDependency: z.boolean(),
    $isNew: z.boolean().nullish(),
  })
  .partial();
export const ServerConfigurationVersionSchema = ServerConfigurationSchema.extend({ version: z.string() });

export type ServerConfiguration = z.infer<typeof ServerConfigurationSchema>;
export type ServerConfigurationVersion = z.infer<typeof ServerConfigurationVersionSchema>;
