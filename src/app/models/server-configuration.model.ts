import { z } from "zod/v4";

export const ServerConfigurationSchema = z
  .object({
    id: z.any(),
    name: z.string(),
    apiUrl: z.string(),
    userName: z.string(),
    password: z.string(),
    externalServer: z.boolean(),
    publishAt5PM: z.boolean(),
    publishAt8AM: z.boolean(),
    pdfDirectory: z.string().optional(),
    htmlDirectory: z.string().optional(),
    mapsPath: z.string().optional(),
    mediaPath: z.string().optional(),
    mapProductionUrl: z.string().optional(),
    serverImagesUrl: z.string().optional(),
    dangerLevelElevationDependency: z.boolean(),
    $isNew: z.boolean().optional(),
  })
  .partial();
export const ServerConfigurationVersionSchema = ServerConfigurationSchema.extend({ version: z.string() });

export type ServerConfiguration = z.infer<typeof ServerConfigurationSchema>;
export type ServerConfigurationVersion = z.infer<typeof ServerConfigurationVersionSchema>;
