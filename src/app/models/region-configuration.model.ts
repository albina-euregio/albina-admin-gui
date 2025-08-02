import { ServerConfigurationSchema } from "./server-configuration.model";
import { z } from "zod/v4";

export const RegionConfigurationSchema = z.object({
  id: z.string().nullish(),
  microRegions: z.number().nullish(),
  subRegions: z.array(z.string()).nullish(),
  superRegions: z.array(z.string()).nullish(),
  neighborRegions: z.array(z.string()).nullish(),
  publishBulletins: z.boolean().nullish(),
  publishBlogs: z.boolean().nullish(),
  createCaamlV5: z.boolean().nullish(),
  createCaamlV6: z.boolean().nullish(),
  createJson: z.boolean().nullish(),
  createMaps: z.boolean().nullish(),
  createPdf: z.boolean().nullish(),
  sendEmails: z.boolean().nullish(),
  createSimpleHtml: z.boolean().nullish(),
  sendTelegramMessages: z.boolean().nullish(),
  sendWhatsAppMessages: z.boolean().nullish(),
  sendPushNotifications: z.boolean().nullish(),
  enableMediaFile: z.boolean().nullish(),
  enableAvalancheProblemCornices: z.boolean().nullish(),
  enableAvalancheProblemNoDistinctAvalancheProblem: z.boolean().nullish(),
  enableDangerSources: z.boolean().nullish(),
  enableObservations: z.boolean().nullish(),
  enableModelling: z.boolean().nullish(),
  enableWeatherbox: z.boolean().nullish(),
  enableStrategicMindset: z.boolean().nullish(),
  enableStressLevel: z.boolean().nullish(),
  enableEditableFields: z.boolean().nullish(),
  enableGeneralHeadline: z.boolean().nullish(),
  showMatrix: z.boolean().nullish(),
  serverInstance: ServerConfigurationSchema.nullish(),
  pdfColor: z.string().nullish(),
  emailColor: z.string().nullish(),
  pdfMapYAmPm: z.number().nullish(),
  pdfMapYFd: z.number().nullish(),
  pdfMapWidthAmPm: z.number().nullish(),
  pdfMapWidthFd: z.number().nullish(),
  pdfMapHeight: z.number().nullish(),
  pdfFooterLogo: z.boolean().nullish(),
  pdfFooterLogoColorPath: z.string().nullish(),
  pdfFooterLogoBwPath: z.string().nullish(),
  mapXmax: z.number().nullish(),
  mapXmin: z.number().nullish(),
  mapYmax: z.number().nullish(),
  mapYmin: z.number().nullish(),
  simpleHtmlTemplateName: z.string().nullish(),
  geoDataDirectory: z.string().nullish(),
  mapLogoColorPath: z.string().nullish(),
  mapLogoBwPath: z.string().nullish(),
  mapLogoPosition: z.string().nullish(),
  mapCenterLat: z.number().nullish(),
  mapCenterLng: z.number().nullish(),
  imageColorbarColorPath: z.string().nullish(),
  imageColorbarBwPath: z.string().nullish(),
  isNew: z.boolean().nullish(),
});

export type RegionConfiguration = z.infer<typeof RegionConfigurationSchema>;

export function getRegionCoatOfArms(region: RegionConfiguration): string | undefined {
  switch (region.id) {
    case "AT-02":
      return "https://upload.wikimedia.org/wikipedia/commons/2/25/Carinthia_Arms.svg";
    case "AT-07":
      return "https://upload.wikimedia.org/wikipedia/commons/c/c3/AUT_Tirol_COA.svg";
    case "IT-32-BZ":
      return "https://upload.wikimedia.org/wikipedia/commons/5/59/Suedtirol_CoA.svg";
    case "IT-32-TN":
      return "https://upload.wikimedia.org/wikipedia/commons/2/24/Trentino_CoA.svg";
    case "ES-CT-L":
      return "https://upload.wikimedia.org/wikipedia/commons/8/88/Coat_of_Arms_of_the_Val_d%27Aran.svg";
    default:
      return;
  }
}
