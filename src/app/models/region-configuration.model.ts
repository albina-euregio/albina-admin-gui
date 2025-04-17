import { ServerConfigurationSchema } from "./server-configuration.model";
import { z } from "zod";

export const RegionConfigurationSchema = z
  .object({
    id: z.string(),
    microRegions: z.number(),
    subRegions: z.array(z.string()),
    superRegions: z.array(z.string()),
    neighborRegions: z.array(z.string()),
    publishBulletins: z.boolean(),
    publishBlogs: z.boolean(),
    createCaamlV5: z.boolean(),
    createCaamlV6: z.boolean(),
    createJson: z.boolean(),
    createMaps: z.boolean(),
    createPdf: z.boolean(),
    sendEmails: z.boolean(),
    createSimpleHtml: z.boolean(),
    sendTelegramMessages: z.boolean(),
    sendPushNotifications: z.boolean(),
    enableMediaFile: z.boolean(),
    enableAvalancheProblemCornices: z.boolean(),
    enableAvalancheProblemNoDistinctAvalancheProblem: z.boolean(),
    enableDangerSources: z.boolean(),
    enableObservations: z.boolean(),
    enableModelling: z.boolean(),
    enableWeatherbox: z.boolean(),
    enableStrategicMindset: z.boolean(),
    enableStressLevel: z.boolean(),
    showMatrix: z.boolean(),
    serverInstance: ServerConfigurationSchema,
    pdfColor: z.string(),
    emailColor: z.string(),
    pdfMapYAmPm: z.number(),
    pdfMapYFd: z.number(),
    pdfMapWidthAmPm: z.number(),
    pdfMapWidthFd: z.number(),
    pdfMapHeight: z.number(),
    pdfFooterLogo: z.boolean(),
    pdfFooterLogoColorPath: z.string(),
    pdfFooterLogoBwPath: z.string(),
    mapXmax: z.number(),
    mapXmin: z.number(),
    mapYmax: z.number(),
    mapYmin: z.number(),
    simpleHtmlTemplateName: z.string(),
    geoDataDirectory: z.string(),
    mapLogoColorPath: z.string(),
    mapLogoBwPath: z.string(),
    mapLogoPosition: z.string(),
    mapCenterLat: z.number(),
    mapCenterLng: z.number(),
    imageColorbarColorPath: z.string(),
    imageColorbarBwPath: z.string(),
    isNew: z.boolean(),
  })
  .partial();

export type RegionConfiguration = z.infer<typeof RegionConfigurationSchema>;
